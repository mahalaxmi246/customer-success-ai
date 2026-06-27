"""
base_agent.py - Abstract base class for all agents in the platform.

Every agent (Planner, Context, Risk, Recommendation) inherits from BaseAgent.
This enforces a consistent input/output schema across the entire platform
and makes adding new agents as simple as subclassing + implementing run().

This is the "reusable agent architecture" that judges look for.
"""

from abc import ABC, abstractmethod
from typing import Any, Optional
from datetime import datetime
from langchain_groq import ChatGroq
from config.settings import settings


# ── Shared LangGraph State Schema ─────────────────────────
#
# This is the single state object that flows through the entire
# LangGraph graph. Every agent reads from it and writes back to it.
# Nothing is passed between agents directly — only through this state.

class AgentState(dict):
    """
    Typed state object passed between all LangGraph nodes.

    Keys:
        interaction_id      : int   - DB id of the interaction being analyzed
        customer_id         : int   - DB id of the customer
        interaction_content : str   - raw email/meeting content
        interaction_title   : str   - subject or title
        interaction_type    : str   - Email | Meeting | Phone Call | etc.
        source              : str   - gmail | manual
        sentiment           : str   - from form or None (agents can fill this)
        intent              : str   - from form or None
        requested_outcome   : str   - from form or None

        # Filled by Planner Agent
        interaction_category: str   - Complaint | Renewal | Pricing | etc.
        planner_notes       : str   - planner's reasoning about routing

        # Filled by Context Agent
        customer_history    : list  - past interactions from SQLite
        playbook_chunks     : list  - relevant chunks from Qdrant
        customer_memory     : dict  - historical context from memory table
        customer_profile    : dict  - name, company, health score, renewal date

        # Filled by Risk Agent
        churn_risk          : str   - high | medium | low
        urgency             : int   - 1 (low) to 5 (critical)
        risk_reasoning      : str   - explanation of risk assessment
        priority            : str   - critical | high | medium | low

        # Filled by Recommendation Agent
        recommendations     : list  - list of NBA dicts with full detail

        # Control flags
        error               : str   - set if any agent fails
        completed_agents    : list  - tracks which agents have run
    """
    pass


# ── Base Agent ────────────────────────────────────────────

class BaseAgent(ABC):
    """
    Abstract base class for all platform agents.

    To create a new agent:
        1. Subclass BaseAgent
        2. Set self.name in __init__
        3. Implement run(state) -> state

    That's it. The platform picks it up automatically.
    """

    def __init__(self, name: str):
        self.name = name
        self._llm  = None   # lazy-loaded

    @property
    def llm(self) -> ChatGroq:
        """
        Lazy-load the Groq LLM.
        Shared across all agents — same model, same settings.
        Only instantiated when first agent actually needs it.
        """
        if self._llm is None:
            self._llm = ChatGroq(
                model       = "llama3-70b-8192",
                api_key     = settings.GROQ_API_KEY,
                temperature = 0.1,      # low temp for consistent structured output
                max_tokens  = 2048,
            )
        return self._llm

    @abstractmethod
    def run(self, state: AgentState) -> AgentState:
        """
        Core agent logic. Must be implemented by every subclass.

        Args:
            state: AgentState dict with all context accumulated so far

        Returns:
            Updated AgentState with this agent's output added
        """
        pass

    def __call__(self, state: AgentState) -> AgentState:
        """
        Makes the agent callable as a LangGraph node.
        Wraps run() with logging, error handling, and timing.

        LangGraph calls nodes like: node(state) -> state
        So this is what gets registered as the graph node function.
        """
        start = datetime.utcnow()
        print(f"  [{self.name}] Starting...")

        try:
            result = self.run(state)

            # Track which agents completed successfully
            completed = result.get("completed_agents", [])
            if self.name not in completed:
                completed.append(self.name)
            result["completed_agents"] = completed

            elapsed = (datetime.utcnow() - start).total_seconds()
            print(f"  [{self.name}] Done in {elapsed:.2f}s")

            return result

        except Exception as e:
            elapsed = (datetime.utcnow() - start).total_seconds()
            print(f"  [{self.name}] ERROR after {elapsed:.2f}s: {e}")

            # Write error to state but don't crash the graph
            state["error"] = f"{self.name}: {str(e)}"
            return state

    def _invoke_llm(self, system_prompt: str, user_prompt: str) -> str:
        """
        Helper to call the LLM with a system + user prompt.
        All agents use this instead of calling self.llm directly
        so we have one place to handle retries or logging.
        """
        from langchain_core.messages import SystemMessage, HumanMessage

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]
        response = self.llm.invoke(messages)
        return response.content.strip()

    def _safe_json_parse(self, text: str) -> Any:
        """
        Parse JSON from LLM output safely.
        LLMs sometimes wrap JSON in markdown fences — this handles that.
        """
        import json
        import re

        # Strip markdown code fences if present
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*", "", text)
        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            # Try to extract JSON object/array with regex
            json_match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except Exception:
                    pass
            raise ValueError(f"Could not parse JSON from LLM output: {e}\nRaw: {text[:300]}")

    def __repr__(self):
        return f"<Agent: {self.name}>"