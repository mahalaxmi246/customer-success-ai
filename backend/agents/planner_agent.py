"""
planner_agent.py - Planner Agent with True Dynamic Workflow Generation

Instead of returning a fixed route name, the Planner now returns
a full workflow definition:

{
  "stages": [
    ["context", "risk"],   <- these run in parallel
    ["recommendation"]      <- this runs after stage 1 completes
  ]
}

The graph executor reads this and dynamically runs exactly
the agents the Planner decided are needed. No hardcoded pipelines.
"""

from agents.base_agent import BaseAgent, AgentState


SYSTEM_PROMPT = """You are the Planner Agent for an AI-powered Customer Success platform.

Your job is to:
1. Classify the customer interaction
2. Decide EXACTLY which agents are needed
3. Return a workflow definition that the orchestration engine will execute

You must respond ONLY with a valid JSON object. No explanation, no markdown, just JSON.

Output schema:
{
  "interaction_category": "<primary category>",
  "secondary_categories": ["<optional>"],
  "key_topics": ["<topic1>", "<topic2>"],
  "urgency_signals": ["<signal1>", "<signal2>"],
  "requires_escalation": true | false,
  "workflow": {
    "stages": [
      ["agent1", "agent2"],
      ["agent3"]
    ]
  },
  "workflow_reasoning": "<one sentence explaining why these agents were chosen>",
  "planner_notes": "<brief note for downstream agents>"
}

Available agents:
  context        — retrieves customer history + playbook knowledge (almost always needed)
  risk           — assesses churn risk, urgency, sentiment, priority
  recommendation — generates top 1-3 next best actions with execution plans

Workflow rules — apply strictly:

COMPLAINT / RENEWAL CONCERN / CANCELLATION RISK:
{
  "stages": [["context", "risk"], ["recommendation"]]
}
context and risk run in parallel, then recommendation.
Use when: customer complains, mentions renewal, competitor, or cancellation.

TECHNICAL ISSUE (API failure, bug, outage):
{
  "stages": [["context", "risk"], ["recommendation"]]
}
Same as above — technical issues always need risk assessment.

PRICING INQUIRY (pure seat expansion or pricing question, no churn signals):
{
  "stages": [["context"], ["recommendation"]]
}
Skip risk — pricing questions are not churn signals unless combined with cancellation threat.

SIMPLE FAQ / GENERAL INQUIRY / POSITIVE FEEDBACK:
{
  "stages": [["context"], ["recommendation"]]
}
Lightweight — no risk assessment needed.

OVERRIDE RULES:
- If health score < 50 (mentioned in profile) → always include risk in stages
- If urgency_signals is not empty → always include risk in stages
- If requires_escalation is true → always include both context and risk in parallel first stage
- When in doubt → use full [["context", "risk"], ["recommendation"]]

Category options:
  Complaint | Renewal Concern | Cancellation Risk | Pricing Inquiry |
  Feature Request | Onboarding Issue | Technical Issue | General Inquiry | Positive Feedback
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
        user_prompt = build_user_prompt(state)
        raw_output  = self._invoke_llm(SYSTEM_PROMPT, user_prompt)
        parsed      = self._safe_json_parse(raw_output)

        state["interaction_category"] = parsed.get("interaction_category", "General Inquiry")
        state["secondary_categories"] = parsed.get("secondary_categories", [])
        state["key_topics"]           = parsed.get("key_topics", [])
        state["urgency_signals"]      = parsed.get("urgency_signals", [])
        state["planner_notes"]        = parsed.get("planner_notes", "")
        state["requires_escalation"]  = parsed.get("requires_escalation", False)
        state["workflow_reasoning"]   = parsed.get("workflow_reasoning", "")

        # Extract and validate workflow
        workflow = parsed.get("workflow", {})
        stages   = workflow.get("stages", [])

        # Validate — every stage must be a list of known agent names
        known_agents = {"context", "risk", "recommendation"}
        validated_stages = []
        for stage in stages:
            valid_stage = [a for a in stage if a in known_agents]
            if valid_stage:
                validated_stages.append(valid_stage)

        # Safe fallback if planner returns empty or invalid workflow
        if not validated_stages:
            print(f"  [Planner] Invalid workflow — using safe fallback")
            validated_stages = [["context", "risk"], ["recommendation"]]

        # Ensure recommendation is always the final stage
        if validated_stages[-1] != ["recommendation"]:
            validated_stages.append(["recommendation"])

        state["workflow"] = {"stages": validated_stages}

        # Print workflow visually
        print(f"    Category    : {state['interaction_category']}")
        print(f"    Workflow    : {' → '.join([str(s) for s in validated_stages])}")
        print(f"    Reasoning   : {state['workflow_reasoning']}")
        print(f"    Escalation  : {state['requires_escalation']}")

        return state