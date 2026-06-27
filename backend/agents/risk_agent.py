"""
risk_agent.py - Risk Agent

Third agent in the LangGraph pipeline.
Reads the interaction + unified context from previous agents and
produces a structured risk assessment.

Output:
  churn_risk   : high | medium | low
  urgency      : 1 (low) to 5 (critical)
  sentiment    : positive | neutral | negative
  priority     : critical | high | medium | low
  risk_reasoning    : explanation of the assessment
  missing_info : list of info gaps that would improve recommendations
"""

from agents.base_agent import BaseAgent, AgentState


SYSTEM_PROMPT = """You are the Risk Assessment Agent for an AI-powered Customer Success platform.

Your job is to analyze a customer interaction along with their full history and context,
and produce a precise risk assessment that will guide the Recommendation Agent.

You must respond ONLY with a valid JSON object. No explanation, no markdown, just JSON.

Output schema:
{
  "churn_risk": "high" | "medium" | "low",
  "urgency": 1 | 2 | 3 | 4 | 5,
  "sentiment": "positive" | "neutral" | "negative",
  "priority": "critical" | "high" | "medium" | "low",
  "risk_reasoning": "<2-3 sentences explaining your assessment with specific evidence>",
  "risk_factors": ["<factor1>", "<factor2>", "<factor3>"],
  "missing_info": ["<info gap1>", "<info gap2>"]
}

Urgency scale:
  1 = Low       — no immediate action needed, routine follow-up
  2 = Moderate  — respond within 5 business days
  3 = High      — respond within 48 hours
  4 = Urgent    — respond within 24 hours
  5 = Critical  — respond immediately, same day

Churn risk rules (apply strictly):
  HIGH   — any of: competitor evaluation, explicit cancellation threat, renewal non-commitment
           with health score < 50, 3+ unresolved complaints, key contact departure + renewal < 30 days
  MEDIUM — health score 40-65, 1-2 unresolved complaints, usage concerns, pricing pushback
  LOW    — health score > 65, positive engagement, expansion signals, routine request

Priority rules:
  CRITICAL — churn_risk=high AND urgency >= 4
  HIGH     — churn_risk=high OR urgency >= 3
  MEDIUM   — churn_risk=medium OR urgency = 2
  LOW      — churn_risk=low AND urgency <= 2

Missing info: list specific data points that would sharpen recommendations
  (e.g. "Current product usage percentage", "Number of active users on the account")

Be evidence-based. Reference specific details from the interaction and history in risk_reasoning.
"""


def build_user_prompt(state: AgentState) -> str:
    parts = []

    # Current interaction
    parts.append("=== CURRENT INTERACTION ===")
    parts.append(f"Type     : {state.get('interaction_type', 'Unknown')}")
    parts.append(f"Title    : {state.get('interaction_title', '')}")
    parts.append(f"Category : {state.get('interaction_category', '')}")
    parts.append(f"Secondary: {', '.join(state.get('secondary_categories', []))}")
    parts.append(f"Urgency Signals: {', '.join(state.get('urgency_signals', []))}")
    parts.append(f"Requires Escalation: {state.get('requires_escalation', False)}")
    parts.append(f"\nContent:\n{state.get('interaction_content', '')}")

    if state.get("planner_notes"):
        parts.append(f"\nPlanner Notes: {state['planner_notes']}")

    # Full unified context (customer profile + history + playbooks)
    unified = state.get("unified_context", "")
    if unified:
        parts.append(f"\n{unified}")

    return "\n".join(parts)


class RiskAgent(BaseAgent):

    def __init__(self):
        super().__init__(name="RiskAgent")

    def run(self, state: AgentState) -> AgentState:
        """
        Produces a structured risk assessment based on
        interaction content + all context from previous agents.
        """
        user_prompt = build_user_prompt(state)
        raw_output  = self._invoke_llm(SYSTEM_PROMPT, user_prompt)
        parsed      = self._safe_json_parse(raw_output)

        # Validate and normalise values
        churn_risk = parsed.get("churn_risk", "medium").lower()
        if churn_risk not in ("high", "medium", "low"):
            churn_risk = "medium"

        urgency = int(parsed.get("urgency", 3))
        urgency = max(1, min(5, urgency))   # clamp to 1-5

        sentiment = parsed.get("sentiment", "neutral").lower()
        if sentiment not in ("positive", "neutral", "negative"):
            sentiment = "neutral"

        priority = parsed.get("priority", "medium").lower()
        if priority not in ("critical", "high", "medium", "low"):
            priority = "medium"

        state["churn_risk"]     = churn_risk
        state["urgency"]        = urgency
        state["sentiment"]      = sentiment
        state["priority"]       = priority
        state["risk_reasoning"] = parsed.get("risk_reasoning", "")
        state["risk_factors"]   = parsed.get("risk_factors", [])
        state["missing_info"]   = parsed.get("missing_info", [])

        print(f"    Churn Risk  : {churn_risk.upper()}")
        print(f"    Urgency     : {urgency}/5")
        print(f"    Sentiment   : {sentiment}")
        print(f"    Priority    : {priority.upper()}")

        return state