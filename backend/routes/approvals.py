"""
routes/approvals.py - Human approval endpoint
POST /api/interactions/{id}/approve
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json

from database import get_db, Interaction, Recommendation, Decision, Memory, SessionLocal

router = APIRouter(prefix="/api/interactions", tags=["approvals"])


# ── Request schema ────────────────────────────────────────

class ApprovalItem(BaseModel):
    recommendation_id: int
    decision:          str             # approved | edited | rejected
    edited_content:    Optional[str] = None
    reason:            Optional[str] = None


class ApprovalRequest(BaseModel):
    approvals: List[ApprovalItem]


# ── Endpoint ──────────────────────────────────────────────

@router.post("/{interaction_id}/approve")
def approve_interaction(
    interaction_id: int,
    body: ApprovalRequest,
    db: Session = Depends(get_db)
):
    """
    Receives the manager's decisions on recommendations.
    - Stores each decision in the decisions table.
    - Updates interaction status to 'completed'.
    - Updates customer memory with approved actions.
    """
    interaction = db.query(Interaction).filter(
        Interaction.id == interaction_id
    ).first()

    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    if interaction.status not in ["awaiting_approval", "processing", "completed"]:
      raise HTTPException(
          status_code=400,
          detail=f"Interaction status is '{interaction.status}'. Cannot accept decisions."
      )

    approved_actions  = []
    rejected_actions  = []
    edited_actions    = []

    for item in body.approvals:
        # Verify recommendation belongs to this interaction
        rec = db.query(Recommendation).filter(
            Recommendation.id             == item.recommendation_id,
            Recommendation.interaction_id == interaction_id
        ).first()

        if not rec:
            raise HTTPException(
                status_code=404,
                detail=f"Recommendation {item.recommendation_id} not found for this interaction"
            )

        # Validate decision value
        if item.decision not in ["approved", "edited", "rejected"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid decision '{item.decision}'. Must be approved | edited | rejected"
            )

        # Store decision
        decision = Decision(
            recommendation_id = item.recommendation_id,
            decision          = item.decision,
            edited_content    = item.edited_content if item.decision == "edited" else None,
            reason            = item.reason,
            timestamp         = datetime.utcnow(),
        )
        db.add(decision)

        # Track for memory update
        action_summary = {
            "action_type":   rec.action_type,
            "reasoning":     rec.reasoning,
            "decision":      item.decision,
            "edited_content":item.edited_content,
            "timestamp":     datetime.utcnow().isoformat(),
        }

        if item.decision == "approved":
            approved_actions.append(action_summary)
        elif item.decision == "edited":
            edited_actions.append(action_summary)
        else:
            rejected_actions.append(action_summary)

    # Mark interaction as completed regardless of how many decisions submitted
    # Partial approval is valid — even 1 decision out of 3 is enough
    interaction.status     = "completed"
    interaction.updated_at = datetime.utcnow()

    db.commit()
    print(f"  [Approvals] Interaction #{interaction_id} marked completed. Decisions: {len(body.approvals)}")
    print(f"  [Approvals] Decision details: {[a.decision for a in body.approvals]}")
    # Resume LangGraph graph after human decision
    try:
        from graph import resume_graph
        resume_graph(
            interaction_id=interaction_id,
            human_decision={
                "approvals": [a.dict() for a in body.approvals]
            }
        )
    except Exception as e:
        print(f"[Approvals] Graph resume error (non-critical): {e}")


    # Update customer memory
    _update_customer_memory(
        db,
        customer_id      = interaction.customer_id,
        interaction      = interaction,
        approved_actions = approved_actions,
        edited_actions   = edited_actions,
        rejected_actions = rejected_actions,
    )

    return {
        "message":        "Decisions saved successfully.",
        "interaction_id": interaction_id,
        "status":         "completed",
        "summary": {
            "approved": len(approved_actions),
            "edited":   len(edited_actions),
            "rejected": len(rejected_actions),
        }
    }


# ── Memory update ─────────────────────────────────────────

def _update_customer_memory(
    db: Session,
    customer_id: int,
    interaction: Interaction,
    approved_actions: list,
    edited_actions: list,
    rejected_actions: list,
):
    """
    Updates or creates the memory record for this customer
    after a human approval decision is made.
    """
    memory = db.query(Memory).filter(
        Memory.customer_id == customer_id
    ).order_by(Memory.timestamp.desc()).first()

    # Parse existing historical context
    existing_context = {}
    if memory and memory.historical_context:
        try:
            existing_context = json.loads(memory.historical_context)
        except Exception:
            existing_context = {}

    # Append new decisions to history
    existing_approved = existing_context.get("approved_actions", [])
    existing_rejected = existing_context.get("rejected_actions", [])

    for a in approved_actions:
        existing_approved.append({
            "action_type": a["action_type"],
            "reasoning":   a["reasoning"],
            "timestamp":   a["timestamp"],
            "source":      f"Interaction #{interaction.id}: {interaction.title}",
        })

    for r in rejected_actions:
        existing_rejected.append({
            "action_type": r["action_type"],
            "reason":      r.get("reason"),
            "timestamp":   r["timestamp"],
        })

    # Update key issues if this was a complaint
    existing_issues = existing_context.get("key_issues", [])
    if interaction.intent and "Complaint" in interaction.intent:
        existing_issues.append(
            f"{interaction.title} ({interaction.timestamp.strftime('%b %Y') if interaction.timestamp else 'recent'})"
        )

    updated_context = {
        **existing_context,
        "approved_actions": existing_approved[-20:],  # keep last 20
        "rejected_actions": existing_rejected[-10:],  # keep last 10
        "key_issues":       existing_issues[-15:],
        "last_updated":     datetime.utcnow().isoformat(),
    }

    if memory:
        memory.historical_context = json.dumps(updated_context)
        memory.timestamp          = datetime.utcnow()
    else:
        memory = Memory(
            customer_id        = customer_id,
            summary            = f"Memory created from interaction: {interaction.title}",
            historical_context = json.dumps(updated_context),
            timestamp          = datetime.utcnow(),
        )
        db.add(memory)

    db.commit()