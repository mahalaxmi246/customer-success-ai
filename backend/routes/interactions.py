"""
routes/interactions.py - Interaction related endpoints
GET  /api/interactions
GET  /api/interactions/{id}
POST /api/interactions/manual
POST /api/interactions/{id}/analyze
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json

from database import get_db, Customer, Interaction, Recommendation

router = APIRouter(prefix="/api/interactions", tags=["interactions"])


# ── Request schemas ───────────────────────────────────────

class ManualInteractionRequest(BaseModel):
    customer_id:       int
    interaction_type:  str                  # Email | Meeting | Phone Call | Support Ticket | Slack Message
    title:             Optional[str] = None
    content:           str                  # The interaction summary / notes
    sentiment:         Optional[str] = None # Positive | Neutral | Negative
    intent:            Optional[str] = None # comma-separated
    requested_outcome: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────

def format_interaction_summary(i: Interaction) -> dict:
    """Lightweight format for list views."""
    return {
        "id":               i.id,
        "customer_id":      i.customer_id,
        "customer_name":    i.customer.name if i.customer else None,
        "customer_company": i.customer.company if i.customer else None,
        "source":           i.source,
        "created_by":       i.created_by,
        "interaction_type": i.interaction_type,
        "title":            i.title,
        "sentiment":        i.sentiment,
        "intent":           i.intent,
        "status":           i.status,
        "timestamp":        i.timestamp.isoformat() if i.timestamp else None,
    }


def format_interaction_detail(i: Interaction) -> dict:
    """Full format including recommendations for detail view."""
    recs = []
    for r in sorted(i.recommendations, key=lambda x: x.rank):
        evidence = r.evidence
        if evidence:
            try:
                evidence = json.loads(evidence)
            except Exception:
                pass

        execution_plan = r.execution_plan_content
        if execution_plan:
            try:
                execution_plan = json.loads(execution_plan)
            except Exception:
                pass

        decisions = []
        for d in r.decisions:
            decisions.append({
                "id":             d.id,
                "decision":       d.decision,
                "edited_content": d.edited_content,
                "reason":         d.reason,
                "timestamp":      d.timestamp.isoformat() if d.timestamp else None,
            })

        recs.append({
            "id":                     r.id,
            "rank":                   r.rank,
            "action_type":            r.action_type,
            "confidence":             r.confidence,
            "reasoning":              r.reasoning,
            "evidence":               evidence,
            "execution_plan_type":    r.execution_plan_type,
            "execution_plan_content": execution_plan,
            "decisions":              decisions,
        })

    return {
        "id":               i.id,
        "customer_id":      i.customer_id,
        "customer_name":    i.customer.name if i.customer else None,
        "customer_company": i.customer.company if i.customer else None,
        "customer_email":   i.customer.email if i.customer else None,
        "health_score":     i.customer.health_score if i.customer else None,
        "source":           i.source,
        "created_by":       i.created_by,
        "interaction_type": i.interaction_type,
        "title":            i.title,
        "content":          i.content,
        "sentiment":        i.sentiment,
        "intent":           i.intent,
        "requested_outcome":i.requested_outcome,
        "status":           i.status,
        "timestamp":        i.timestamp.isoformat() if i.timestamp else None,
        "updated_at":       i.updated_at.isoformat() if i.updated_at else None,
        "recommendations":  recs,
    }


# ── Endpoints ─────────────────────────────────────────────

@router.get("")
def list_interactions(
    status: Optional[str] = None,
    source: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    List all interactions with optional filters.
    ?status=new|processing|awaiting_approval|completed
    ?source=gmail|manual
    ?customer_id=1
    """
    query = db.query(Interaction).order_by(Interaction.timestamp.desc())

    if status:
        query = query.filter(Interaction.status == status)
    if source:
        query = query.filter(Interaction.source == source)
    if customer_id:
        query = query.filter(Interaction.customer_id == customer_id)

    interactions = query.all()

    return {
        "interactions": [format_interaction_summary(i) for i in interactions],
        "total":        len(interactions),
    }


@router.get("/{interaction_id}")
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Full interaction detail including recommendations and decisions."""
    interaction = db.query(Interaction).filter(
        Interaction.id == interaction_id
    ).first()

    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    return format_interaction_detail(interaction)


@router.post("/manual")
def create_manual_interaction(
    body: ManualInteractionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Accept a manual interaction submission from the UI form.
    Creates the interaction and triggers the LangGraph analysis in background.
    """
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == body.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    interaction = Interaction(
        customer_id       = body.customer_id,
        source            = "manual",
        created_by        = "manager",
        interaction_type  = body.interaction_type,
        title             = body.title or f"{body.interaction_type} - {datetime.utcnow().strftime('%Y-%m-%d')}",
        content           = body.content,
        sentiment         = body.sentiment,
        intent            = body.intent,
        requested_outcome = body.requested_outcome,
        status            = "new",
        timestamp         = datetime.utcnow(),
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    # Trigger LangGraph analysis in background
    background_tasks.add_task(trigger_analysis, interaction.id)

    return {
        "message":        "Interaction created and analysis started.",
        "interaction_id": interaction.id,
        "status":         "new",
    }


@router.post("/{interaction_id}/analyze")
def analyze_interaction(
    interaction_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Manually trigger LangGraph analysis for an existing interaction.
    Used for re-analysis or triggering Gmail-ingested interactions.
    """
    interaction = db.query(Interaction).filter(
        Interaction.id == interaction_id
    ).first()

    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    if interaction.status == "processing":
        return {"message": "Analysis already in progress.", "interaction_id": interaction_id}

    if interaction.status == "awaiting_approval":
        return {"message": "Awaiting human approval.", "interaction_id": interaction_id}

    # Update status
    interaction.status = "processing"
    db.commit()

    # Trigger in background
    background_tasks.add_task(trigger_analysis, interaction_id)

    return {
        "message":        "Analysis started.",
        "interaction_id": interaction_id,
        "status":         "processing",
    }


# ── Background task ───────────────────────────────────────

def trigger_analysis(interaction_id: int):
    """
    Background task that runs the LangGraph workflow.
    Imported here to avoid circular imports — graph.py imports from database.py
    """
    try:
        from graph import run_graph
        run_graph(interaction_id)
    except Exception as e:
        # Update status back to new so it can be retried
        db = SessionLocal()
        try:
            interaction = db.query(Interaction).filter(
                Interaction.id == interaction_id
            ).first()
            if interaction:
                interaction.status = "new"
                db.commit()
        finally:
            db.close()
        print(f"[ERROR] Analysis failed for interaction {interaction_id}: {e}")


# Fix missing import
from database import SessionLocal