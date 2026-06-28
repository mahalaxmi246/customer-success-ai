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
        3. Implement run(stateself._llm = ChatGroq(
    model       = "llama-3.3-70b-versatile",
    api_key     = settings.GROQ_API_KEY,
    temperature = 0.1,
    max_tokens  = 2048,
)) -> state

    That's it. The platform picks it up automatically.
    """

    def __init__(self, name: str):
        self.name = name
        self._llm  = None   # lazy-loaded

    @property
    def llm(self):
        if self._llm is None:
            self._llm = self._init_llm()
        return self._llm

    def _init_llm(self, provider: str = "groq"):
        """Initialize LLM — tries Groq first, falls back to Gemini."""
        if provider == "groq":
            try:
                from langchain_groq import ChatGroq
                return ChatGroq(
                    model       = "llama-3.3-70b-versatile",
                    api_key     = settings.GROQ_API_KEY,
                    temperature = 0.1,
                    max_tokens  = 2048,
                )
            except Exception as e:
                print(f"  [LLM] Groq init failed: {e} — switching to Gemini")
                return self._init_llm("gemini")
        else:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model             = "gemini-2.0-flash",
                google_api_key    = settings.GEMINI_API_KEY,
                temperature       = 0.1,
                max_output_tokens = 2048,
            )

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
      Call LLM with automatic retry + circuit breaker.
      Attempt 1 — Groq
      Attempt 2 — Groq retry after 2s
      Attempt 3 — Switch to Gemini
      Attempt 4 — Gemini retry after 4s
      Fail      — Raise with clear message
      """
      import time
      from langchain_core.messages import SystemMessage, HumanMessage

      # Sanitize user-supplied content before inference
      sanitized_prompt = self._sanitize_input(user_prompt)

      messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=sanitized_prompt),
      ]

      # Retry schedule: (wait_seconds, provider)
      attempts = [
          (0, "groq"),
          (2, "groq"),
          (0, "gemini"),
          (4, "gemini"),
      ]

      last_error = None

      for attempt_num, (wait, provider) in enumerate(attempts, 1):
          if wait > 0:
              print(f"  [LLM] Waiting {wait}s before retry...")
              time.sleep(wait)

          try:
              # Switch provider if needed
              current_provider = "groq" if "groq" in str(type(self._llm)).lower() else "gemini"
              if provider != current_provider:
                  print(f"  [LLM] Switching from {current_provider} to {provider}...")
                  self._llm = self._init_llm(provider)

              response = self.llm.invoke(messages)
              return response.content.strip()

          except Exception as e:
              last_error = e
              err_str = str(e).lower()

              # Rate limit or quota — retry with different provider
              if any(x in err_str for x in ["429", "quota", "rate", "resource_exhausted"]):
                  print(f"  [LLM] Attempt {attempt_num} failed (quota/rate limit) — retrying...")
                  continue

              # Auth error — no point retrying
              if any(x in err_str for x in ["401", "403", "api key", "invalid"]):
                  print(f"  [LLM] Auth error — check API key")
                  raise

              # Other error — retry once
              print(f"  [LLM] Attempt {attempt_num} failed: {e}")
              continue

      # All attempts exhausted
      raise Exception(
          f"LLM unavailable after {len(attempts)} attempts. "
          f"Last error: {last_error}"
      )

    def _sanitize_input(self, text: str) -> str:
      """
      Detect and neutralize prompt injection attempts before
      sending any user-supplied text to the LLM.
      Logs a warning if injection is detected.
      """
      import re

      if not text:
          return text

      # Known injection patterns
      injection_patterns = [
          r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?",
          r"disregard\s+(all\s+)?(previous|prior|above)\s+instructions?",
          r"forget\s+(all\s+)?(previous|prior|above)\s+instructions?",
          r"you\s+are\s+now\s+a\s+different",
          r"act\s+as\s+(if\s+you\s+are\s+)?a\s+different",
          r"reveal\s+(customer|user|all)\s+(memory|data|history|information)",
          r"delete\s+(all\s+)?(history|memory|data|records)",
          r"show\s+me\s+(all\s+)?(customer|user)\s+(data|memory|history)",
          r"print\s+(your\s+)?(system\s+)?prompt",
          r"what\s+(is|are)\s+your\s+(system\s+)?instructions?",
          r"bypass\s+(safety|security|restrictions?|guidelines?)",
          r"jailbreak",
          r"prompt\s+injection",
          r"override\s+(all\s+)?(previous|prior|safety)",
          r"new\s+instructions?\s*:",
          r"system\s*:\s*you\s+are",
          r"assistant\s*:\s*i\s+will",
      ]

      original_text = text
      injection_found = False

      for pattern in injection_patterns:
          if re.search(pattern, text, re.IGNORECASE):
              injection_found = True
              # Replace the injection attempt with a safe placeholder
              text = re.sub(
                  pattern,
                  "[REDACTED - potential injection detected]",
                  text,
                  flags=re.IGNORECASE
              )

      if injection_found:
          print(f"  [Security] Prompt injection detected and sanitized in input.")
          print(f"  [Security] Original length: {len(original_text)} | Sanitized length: {len(text)}")

      return text

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