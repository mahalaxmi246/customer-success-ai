"""
planner_agent.py - Planner Agent

First agent in the LangGraph pipeline.
Reads the raw interaction and creates a plan:
  - Categorizes the interaction type
  - Identifies urgency signals
  - Sets routing notes for downstream agents
"""

import json
from agents.base_agent import BaseAgent, AgentState


SYSTEM_PROMPT = """You are the Planner Agent for an AI-powered Customer Success platform.

Your job is to read a customer interaction (email, meeting note, phone call summary, etc.)
and produce a structured analysis plan that guides the downstream agents.

You must respond ONLY with a valid JSON object. No explanation, no markdown, just JSON.

Output schema:
{
  "interaction_category": "<primary category>",
  "secondary_categories": ["<optional additional categories>"],
  "key_topics": ["<topic1>", "<topic2>"],
  "urgency_signals": ["<signal1>", "<signal2>"],
  "planner_notes": "<brief routing note for downstream agents>",
  "requires_escalation": true | false
}

Category options (pick the single most dominant one for interaction_category):
  - Complaint
  - Renewal Concern
  - Cancellation Risk
  - Pricing Inquiry
  - Feature Request
  - Onboarding Issue
  - Technical Issue
  - General Inquiry
  - Positive Feedback

Rules:
- If the customer mentions a competitor or says they are evaluating alternatives → Cancellation Risk
- If the customer mentions renewal, contract, or subscription expiry → Renewal Concern
- If the customer mentions an outage, bug, or broken feature affecting their work → Technical Issue
- If urgency_signals is not empty → set requires_escalation to true
- Be concise in planner_notes — downstream agents will read this
"""


def build_user_prompt(state: AgentState) -> str:
    parts = []

    parts.append(f"Interaction Type: {state.get('interaction_type', 'Unknown')}")
    parts.append(f"Source: {state.get('source', 'Unknown')}")

    if state.get("interaction_title"):
        parts.append(f"Title/Subject: {state['interaction_title']}")

    if state.get("sentiment"):
        parts.append(f"Reported Sentiment: {state['sentiment']}")

    if state.get("intent"):
        parts.append(f"Reported Intent: {state['intent']}")

    if state.get("requested_outcome"):
        parts.append(f"Requested Outcome: {state['requested_outcome']}")

    # Customer profile context
    profile = state.get("customer_profile", {})
    if profile:
        parts.append(f"\nCustomer: {profile.get('name')} from {profile.get('company')}")
        parts.append(f"Health Score: {profile.get('health_score')}/100")
        if profile.get("renewal_date"):
            parts.append(f"Renewal Date: {profile.get('renewal_date')}")

    parts.append(f"\n--- Interaction Content ---\n{state.get('interaction_content', '')}")

    return "\n".join(parts)


class PlannerAgent(BaseAgent):

    def __init__(self):
        super().__init__(name="PlannerAgent")

    def run(self, state: AgentState) -> AgentState:
        """
        Categorizes the interaction and sets routing context
        for the Context, Risk, and Recommendation agents.
        """
        user_prompt = build_user_prompt(state)

        raw_output = self._invoke_llm(SYSTEM_PROMPT, user_prompt)

        parsed = self._safe_json_parse(raw_output)

        state["interaction_category"]  = parsed.get("interaction_category", "General Inquiry")
        state["secondary_categories"]  = parsed.get("secondary_categories", [])
        state["key_topics"]            = parsed.get("key_topics", [])
        state["urgency_signals"]       = parsed.get("urgency_signals", [])
        state["planner_notes"]         = parsed.get("planner_notes", "")
        state["requires_escalation"]   = parsed.get("requires_escalation", False)

        print(f"    Category    : {state['interaction_category']}")
        print(f"    Urgency     : {state['urgency_signals']}")
        print(f"    Escalation  : {state['requires_escalation']}")

        return state