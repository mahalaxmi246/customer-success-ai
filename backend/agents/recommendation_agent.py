"""
recommendation_agent.py - Recommendation Agent

Fourth and final agent in the LangGraph pipeline.
Uses all previous agent outputs to generate Top 1-3 Next Best Actions.

Two LLM calls:
  Call 1 — Generate ranked NBAs with reasoning + evidence
  Call 2 — Generate execution plan (email draft or meeting brief) per NBA
  
Then stores everything to the recommendations table in SQLite.
"""

import json
from agents.base_agent import BaseAgent, AgentState


# ── Call 1: NBA Generation ────────────────────────────────

NBA_SYSTEM_PROMPT = """You are the Recommendation Agent for an AI-powered Customer Success platform.

You have access to a customer's full interaction history, risk assessment, and company playbooks.
Your job is to generate the Top 1-3 Next Best Actions (NBAs) for the Customer Success Manager.

You must respond ONLY with a valid JSON array. No explanation, no markdown, just JSON.

Output schema — array of 1 to 3 objects:
[
  {
    "rank": 1,
    "action_type": "<one of the valid types>",
    "action_title": "<short human-readable title>",
    "confidence": <float 0-100>,
    "reasoning": "<2-3 sentences explaining why this action is recommended>",
    "evidence": ["<evidence point 1>", "<evidence point 2>", "<evidence point 3>"],
    "execution_plan_type": "email" | "meeting" | "none",
    "playbook_reference": "<rule or section from playbook if applicable, else null>"
  }
]

Valid action_type values:
  reply_email       — send a written response to the customer
  schedule_meeting  — schedule a call or in-person meeting
  escalate          — escalate to senior CSM, VP, or engineering
  send_resources    — send documentation, guides, or resource pack

Rules:
  - Always generate at least 1 and at most 3 NBAs
  - Rank 1 must be the single most impactful action given the risk level
  - confidence must reflect how strongly the evidence supports this action (0-100)
  - evidence must contain specific facts from the interaction, history, and playbooks
  - execution_plan_type = "email" if action_type is reply_email or send_resources
  - execution_plan_type = "meeting" if action_type is schedule_meeting or escalate (meeting-based)
  - execution_plan_type = "none" only if no document or meeting is needed
  - playbook_reference must cite the specific rule (e.g. "Retention Playbook CS-15") if relevant

Priority rules based on risk:
  CRITICAL priority → rank 1 must be escalate or schedule_meeting (EBR)
  HIGH priority     → rank 1 must be direct outreach (reply_email or schedule_meeting)
  MEDIUM priority   → rank 1 can be any action type
  LOW priority      → rank 1 is typically send_resources or reply_email
"""


def build_nba_user_prompt(state: AgentState) -> str:
    parts = []

    parts.append("=== CURRENT INTERACTION ===")
    parts.append(f"Type    : {state.get('interaction_type', '')}")
    parts.append(f"Title   : {state.get('interaction_title', '')}")
    parts.append(f"Category: {state.get('interaction_category', '')}")
    parts.append(f"Content :\n{state.get('interaction_content', '')}")

    parts.append("\n=== RISK ASSESSMENT ===")
    parts.append(f"Churn Risk     : {state.get('churn_risk', 'medium').upper()}")
    parts.append(f"Urgency        : {state.get('urgency', 3)}/5")
    parts.append(f"Sentiment      : {state.get('sentiment', 'neutral')}")
    parts.append(f"Priority       : {state.get('priority', 'medium').upper()}")
    parts.append(f"Risk Reasoning : {state.get('risk_reasoning', '')}")
    factors = state.get("risk_factors", [])
    if factors:
        parts.append("Risk Factors   :")
        for f in factors:
            parts.append(f"  - {f}")

    unified = state.get("unified_context", "")
    if unified:
        parts.append(f"\n{unified}")

    return "\n".join(parts)


# ── Call 2: Execution Plan ────────────────────────────────

EMAIL_PLAN_PROMPT = """You are drafting a professional customer success email on behalf of a Customer Success Manager.

Write a complete, ready-to-send email. Be empathetic, professional, and action-oriented.
Reference specific details from the customer's history and the recommended action.

You must respond ONLY with a valid JSON object. No explanation, no markdown, just JSON.

Output schema:
{
  "subject": "<email subject line>",
  "body": "<complete email body — use \\n for line breaks>"
}

Guidelines:
- Open with acknowledgement of the customer's situation
- Be specific — reference their company name, issue, and history
- Include a clear next step or call to action
- Close professionally
- Do NOT use placeholder text like [Name] — use the actual customer name
- Length: 150-300 words
"""

MEETING_PLAN_PROMPT = """You are preparing a meeting brief for a Customer Success Manager.

Create a complete, actionable meeting brief that the CSM can use to conduct an effective call.

You must respond ONLY with a valid JSON object. No explanation, no markdown, just JSON.

Output schema:
{
  "meeting_title": "<title for the meeting>",
  "objectives": ["<objective 1>", "<objective 2>", "<objective 3>"],
  "discussion_points": ["<point 1>", "<point 2>", "<point 3>", "<point 4>"],
  "suggested_questions": ["<question 1>", "<question 2>", "<question 3>"],
  "important_context": "<key things the CSM must know before the call>",
  "desired_outcome": "<what a successful call looks like>"
}

Guidelines:
- objectives must be specific and measurable
- suggested_questions should be open-ended to draw out customer concerns
- important_context must reference specific history and issues
- desired_outcome must be concrete (e.g. "Customer commits to renewal" not "good call")
"""


def build_execution_plan_prompt(
    state: AgentState,
    nba: dict,
    plan_type: str
) -> str:
    customer  = state.get("customer_profile", {})
    name      = customer.get("name", "Customer")
    company   = customer.get("company", "their company")
    health    = customer.get("health_score", "N/A")
    renewal   = customer.get("renewal_date", "N/A")

    parts = []
    parts.append(f"Customer Name   : {name}")
    parts.append(f"Company         : {company}")
    parts.append(f"Health Score    : {health}/100")
    parts.append(f"Renewal Date    : {renewal}")
    parts.append(f"\nRecommended Action : {nba.get('action_title', '')}")
    parts.append(f"Reasoning          : {nba.get('reasoning', '')}")
    parts.append(f"Evidence           : {', '.join(nba.get('evidence', []))}")

    parts.append(f"\nCurrent Interaction:\n{state.get('interaction_content', '')[:600]}")

    memory = state.get("customer_memory", {})
    if memory.get("summary"):
        parts.append(f"\nCustomer History Summary:\n{memory['summary']}")

    hist_ctx = memory.get("historical_context", {})
    if isinstance(hist_ctx, dict) and hist_ctx.get("key_issues"):
        parts.append("\nKey Issues on Record:")
        for issue in hist_ctx["key_issues"][:4]:
            parts.append(f"  - {issue}")

    if plan_type == "meeting":
        parts.append(f"\nRisk Level : {state.get('churn_risk', 'medium').upper()}")
        parts.append(f"Priority   : {state.get('priority', 'medium').upper()}")

    return "\n".join(parts)


# ── Main Agent ────────────────────────────────────────────

class RecommendationAgent(BaseAgent):

    def __init__(self):
        super().__init__(name="RecommendationAgent")

    def run(self, state: AgentState) -> AgentState:
        """
        Two-step process:
        1. Generate top 1-3 NBAs
        2. Generate execution plan for each NBA
        3. Store all recommendations to SQLite
        """

        # ── Step 1: Generate NBAs ─────────────────────────
        nba_prompt  = build_nba_user_prompt(state)
        raw_nbas    = self._invoke_llm(NBA_SYSTEM_PROMPT, nba_prompt)
        nbas        = self._safe_json_parse(raw_nbas)

        if not isinstance(nbas, list):
            nbas = [nbas]

        # Clamp to max 3
        nbas = nbas[:3]
        print(f"    Generated {len(nbas)} NBA(s)")

        # ── Step 2: Execution plans ───────────────────────
        for nba in nbas:
            plan_type = nba.get("execution_plan_type", "none")

            if plan_type == "none":
                nba["execution_plan_content"] = None
                continue

            system_prompt = (
                EMAIL_PLAN_PROMPT   if plan_type == "email"
                else MEETING_PLAN_PROMPT
            )

            user_prompt = build_execution_plan_prompt(state, nba, plan_type)

            try:
                raw_plan = self._invoke_llm(system_prompt, user_prompt)
                plan     = self._safe_json_parse(raw_plan)
                nba["execution_plan_content"] = plan
                print(f"    Execution plan ({plan_type}) generated for rank {nba.get('rank', '?')}")
            except Exception as e:
                print(f"    Execution plan failed for rank {nba.get('rank', '?')}: {e}")
                nba["execution_plan_content"] = None

        # ── Step 3: Store to DB ───────────────────────────
        interaction_id = state.get("interaction_id")
        if interaction_id:
            stored_ids = self._store_recommendations(interaction_id, nbas)
            print(f"    Stored {len(stored_ids)} recommendation(s) to DB")

        state["recommendations"] = nbas
        return state

    def _store_recommendations(
        self,
        interaction_id: int,
        nbas: list
    ) -> list:
        """Store all generated recommendations to the DB."""
        from database import SessionLocal, Recommendation, Interaction
        from datetime import datetime

        db = SessionLocal()
        stored_ids = []

        try:
            for nba in nbas:
                execution_plan = nba.get("execution_plan_content")
                if execution_plan and isinstance(execution_plan, dict):
                    execution_plan = json.dumps(execution_plan)

                evidence = nba.get("evidence", [])
                if isinstance(evidence, list):
                    evidence = json.dumps(evidence)

                rec = Recommendation(
                    interaction_id         = interaction_id,
                    rank                   = nba.get("rank", 1),
                    action_type            = nba.get("action_type", "reply_email"),
                    confidence             = float(nba.get("confidence", 75)),
                    reasoning              = nba.get("reasoning", ""),
                    evidence               = evidence,
                    execution_plan_type    = nba.get("execution_plan_type", "none"),
                    execution_plan_content = execution_plan,
                )
                db.add(rec)
                db.flush()
                stored_ids.append(rec.id)

            # Update interaction status to awaiting_approval
            interaction = db.query(Interaction).filter(
                Interaction.id == interaction_id
            ).first()
            if interaction:
                interaction.status = "awaiting_approval"

            db.commit()
            return stored_ids

        except Exception as e:
            db.rollback()
            print(f"    DB store error: {e}")
            raise
        finally:
            db.close()