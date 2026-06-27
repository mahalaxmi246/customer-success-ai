"""
routes/customers.py - Customer related endpoints
GET /api/customers
GET /api/customers/{id}/history
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from database import get_db, Customer, Interaction, Recommendation, Decision, Memory

router = APIRouter(prefix="/api/customers", tags=["customers"])


# ── Helpers ───────────────────────────────────────────────

def format_customer(c: Customer) -> dict:
    return {
        "id":           c.id,
        "name":         c.name,
        "company":      c.company,
        "email":        c.email,
        "health_score": c.health_score,
        "renewal_date": c.renewal_date.isoformat() if c.renewal_date else None,
    }


def format_interaction(i: Interaction) -> dict:
    return {
        "id":               i.id,
        "customer_id":      i.customer_id,
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
    }


def format_recommendation(r: Recommendation) -> dict:
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

    return {
        "id":                     r.id,
        "interaction_id":         r.interaction_id,
        "rank":                   r.rank,
        "action_type":            r.action_type,
        "confidence":             r.confidence,
        "reasoning":              r.reasoning,
        "evidence":               evidence,
        "execution_plan_type":    r.execution_plan_type,
        "execution_plan_content": execution_plan,
        "decisions":              decisions,
    }


# ── Endpoints ─────────────────────────────────────────────

@router.get("")
def list_customers(db: Session = Depends(get_db)):
    """List all customers with basic info."""
    customers = db.query(Customer).order_by(Customer.health_score.asc()).all()
    return {
        "customers": [format_customer(c) for c in customers],
        "total":     len(customers)
    }


@router.get("/{customer_id}/history")
def get_customer_history(customer_id: int, db: Session = Depends(get_db)):
    """
    Full history for a customer:
    - Customer profile
    - All interactions (with recommendations + decisions)
    - Memory / historical context
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # All interactions ordered by newest first
    interactions = (
        db.query(Interaction)
        .filter(Interaction.customer_id == customer_id)
        .order_by(Interaction.timestamp.desc())
        .all()
    )

    interactions_data = []
    for interaction in interactions:
        recs = [format_recommendation(r) for r in interaction.recommendations]
        interaction_dict = format_interaction(interaction)
        interaction_dict["recommendations"] = recs
        interactions_data.append(interaction_dict)

    # Memory
    memory = (
        db.query(Memory)
        .filter(Memory.customer_id == customer_id)
        .order_by(Memory.timestamp.desc())
        .first()
    )

    memory_data = None
    if memory:
        historical_context = memory.historical_context
        if historical_context:
            try:
                historical_context = json.loads(historical_context)
            except Exception:
                pass
        memory_data = {
            "id":                 memory.id,
            "summary":            memory.summary,
            "historical_context": historical_context,
            "timestamp":          memory.timestamp.isoformat() if memory.timestamp else None,
        }

    return {
        "customer":     format_customer(customer),
        "interactions": interactions_data,
        "memory":       memory_data,
        "total_interactions": len(interactions_data),
    }