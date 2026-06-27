"""
context_agent.py - Context Agent

Second agent in the LangGraph pipeline.
Retrieves all relevant context from two sources in parallel:
  1. Qdrant        — top 5 playbook chunks relevant to this interaction
  2. SQLite        — last 10 interactions + last 5 approved decisions for this customer
  3. Memory table  — customer's historical context summary

Merges everything into a unified context object in state.
"""

import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

from agents.base_agent import BaseAgent, AgentState


class ContextAgent(BaseAgent):

    def __init__(self):
        super().__init__(name="ContextAgent")

    def run(self, state: AgentState) -> AgentState:
        """
        Retrieves and merges all context needed by Risk and Recommendation agents.
        Runs Qdrant and SQLite queries in parallel for speed.
        """
        interaction_content  = state.get("interaction_content", "")
        interaction_category = state.get("interaction_category", "")
        customer_id          = state.get("customer_id")
        key_topics           = state.get("key_topics", [])

        # Build a rich search query for Qdrant
        # Combine content + category + key topics for better retrieval
        search_query = self._build_search_query(
            interaction_content, interaction_category, key_topics
        )

        # Run Qdrant and SQLite queries in parallel
        qdrant_result  = None
        history_result = None
        memory_result  = None

        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(self._fetch_playbook_chunks, search_query): "qdrant",
                executor.submit(self._fetch_customer_history, customer_id): "history",
                executor.submit(self._fetch_customer_memory,  customer_id): "memory",
            }

            for future in as_completed(futures):
                key = futures[future]
                try:
                    result = future.result()
                    if key == "qdrant":
                        qdrant_result  = result
                    elif key == "history":
                        history_result = result
                    elif key == "memory":
                        memory_result  = result
                except Exception as e:
                    print(f"    [{key}] retrieval error: {e}")

        # Store in state
        state["playbook_chunks"]   = qdrant_result  or []
        state["customer_history"]  = history_result or {"interactions": [], "decisions": []}
        state["customer_memory"]   = memory_result  or {}

        # Build unified context summary string for agents to use in prompts
        state["unified_context"]   = self._build_unified_context(state)

        print(f"    Playbook chunks  : {len(state['playbook_chunks'])}")
        print(f"    Past interactions: {len(state['customer_history'].get('interactions', []))}")
        print(f"    Past decisions   : {len(state['customer_history'].get('decisions', []))}")
        print(f"    Memory loaded    : {'yes' if state['customer_memory'] else 'no'}")

        return state

    # ── Qdrant retrieval ──────────────────────────────────

    def _build_search_query(
        self,
        content: str,
        category: str,
        key_topics: list
    ) -> str:
        """
        Build a rich query string for Qdrant semantic search.
        Combines content snippet + category + topics.
        """
        # Use first 400 chars of content to keep query focused
        content_snippet = content[:400].strip()

        topic_str = ", ".join(key_topics) if key_topics else ""

        parts = [content_snippet]
        if category:
            parts.append(f"Category: {category}")
        if topic_str:
            parts.append(f"Topics: {topic_str}")

        return " | ".join(parts)

    def _fetch_playbook_chunks(self, query: str) -> list:
        """Fetch top 5 relevant playbook chunks from Qdrant."""
        from rag.qdrant_store import search
        chunks = search(query=query, top_k=5)
        return chunks

    # ── SQLite retrieval ──────────────────────────────────

    def _fetch_customer_history(self, customer_id: int) -> dict:
        """
        Fetch from SQLite:
          - Last 10 interactions for this customer
          - Last 5 approved/edited decisions
        """
        if not customer_id:
            return {"interactions": [], "decisions": []}

        from database import SessionLocal, Interaction, Recommendation, Decision

        db = SessionLocal()
        try:
            # Last 10 interactions (excluding current one — status != new/processing)
            past_interactions = (
                db.query(Interaction)
                .filter(
                    Interaction.customer_id == customer_id,
                    Interaction.status      == "completed"
                )
                .order_by(Interaction.timestamp.desc())
                .limit(10)
                .all()
            )

            interactions_data = []
            for i in past_interactions:
                interactions_data.append({
                    "id":               i.id,
                    "interaction_type": i.interaction_type,
                    "title":            i.title,
                    "content":          i.content[:300] if i.content else "",  # truncate for context
                    "sentiment":        i.sentiment,
                    "intent":           i.intent,
                    "status":           i.status,
                    "timestamp":        i.timestamp.strftime("%Y-%m-%d") if i.timestamp else None,
                })

            # Last 5 approved or edited decisions
            approved_decisions = (
                db.query(Decision)
                .join(Recommendation, Decision.recommendation_id == Recommendation.id)
                .join(Interaction,    Recommendation.interaction_id == Interaction.id)
                .filter(
                    Interaction.customer_id == customer_id,
                    Decision.decision.in_(["approved", "edited"])
                )
                .order_by(Decision.timestamp.desc())
                .limit(5)
                .all()
            )

            decisions_data = []
            for d in approved_decisions:
                rec = d.recommendation
                decisions_data.append({
                    "decision":     d.decision,
                    "action_type":  rec.action_type if rec else None,
                    "reasoning":    rec.reasoning[:200] if rec and rec.reasoning else "",
                    "edited_content": d.edited_content,
                    "reason":       d.reason,
                    "timestamp":    d.timestamp.strftime("%Y-%m-%d") if d.timestamp else None,
                })

            return {
                "interactions": interactions_data,
                "decisions":    decisions_data,
            }

        finally:
            db.close()

    # ── Memory retrieval ──────────────────────────────────

    def _fetch_customer_memory(self, customer_id: int) -> dict:
        """Fetch the customer's historical memory summary."""
        if not customer_id:
            return {}

        from database import SessionLocal, Memory

        db = SessionLocal()
        try:
            memory = (
                db.query(Memory)
                .filter(Memory.customer_id == customer_id)
                .order_by(Memory.timestamp.desc())
                .first()
            )

            if not memory:
                return {}

            historical_context = memory.historical_context
            if historical_context:
                try:
                    historical_context = json.loads(historical_context)
                except Exception:
                    pass

            return {
                "summary":            memory.summary,
                "historical_context": historical_context,
            }

        finally:
            db.close()

    # ── Unified context builder ───────────────────────────

    def _build_unified_context(self, state: AgentState) -> str:
        """
        Builds a single formatted context string that Risk and
        Recommendation agents include directly in their prompts.
        This avoids each agent having to reassemble the context.
        """
        parts = []

        # 1. Customer profile
        profile = state.get("customer_profile", {})
        if profile:
            parts.append("=== CUSTOMER PROFILE ===")
            parts.append(f"Name        : {profile.get('name', 'Unknown')}")
            parts.append(f"Company     : {profile.get('company', 'Unknown')}")
            parts.append(f"Email       : {profile.get('email', '')}")
            parts.append(f"Health Score: {profile.get('health_score', 'N/A')}/100")
            parts.append(f"Renewal Date: {profile.get('renewal_date', 'N/A')}")

        # 2. Memory summary
        memory = state.get("customer_memory", {})
        if memory.get("summary"):
            parts.append("\n=== CUSTOMER MEMORY SUMMARY ===")
            parts.append(memory["summary"])

        hist_ctx = memory.get("historical_context", {})
        if isinstance(hist_ctx, dict):
            if hist_ctx.get("key_issues"):
                parts.append("\nKey Issues on Record:")
                for issue in hist_ctx["key_issues"][:5]:
                    parts.append(f"  - {issue}")

            if hist_ctx.get("approved_actions"):
                parts.append("\nPreviously Approved Actions:")
                for action in hist_ctx["approved_actions"][:5]:
                    if isinstance(action, dict):
                        parts.append(f"  - [{action.get('timestamp', '')}] {action.get('action_type', '')}: {action.get('reasoning', '')[:100]}")
                    else:
                        parts.append(f"  - {str(action)[:100]}")

            if hist_ctx.get("renewal_risk"):
                parts.append(f"\nRenewal Risk: {hist_ctx['renewal_risk']}")

        # 3. Recent interaction history
        history     = state.get("customer_history", {})
        interactions = history.get("interactions", [])
        if interactions:
            parts.append("\n=== RECENT INTERACTION HISTORY ===")
            for i in interactions[:5]:   # show last 5 in context string
                parts.append(
                    f"[{i.get('timestamp', '')}] {i.get('interaction_type', '')} - "
                    f"{i.get('title', '')} | Sentiment: {i.get('sentiment', 'N/A')} | "
                    f"Intent: {i.get('intent', 'N/A')}"
                )
                if i.get("content"):
                    parts.append(f"  Summary: {i['content'][:150]}...")

        # 4. Past decisions
        decisions = history.get("decisions", [])
        if decisions:
            parts.append("\n=== PAST APPROVED ACTIONS ===")
            for d in decisions:
                parts.append(
                    f"[{d.get('timestamp', '')}] {d.get('action_type', '')} "
                    f"({d.get('decision', '')}) - {d.get('reasoning', '')[:120]}"
                )

        # 5. Relevant playbook sections
        chunks = state.get("playbook_chunks", [])
        if chunks:
            parts.append("\n=== RELEVANT PLAYBOOK SECTIONS ===")
            for idx, chunk in enumerate(chunks, 1):
                parts.append(
                    f"\n[{idx}] Source: {chunk.get('source_file', 'unknown')} "
                    f"(relevance: {chunk.get('score', 0):.2f})"
                )
                parts.append(chunk.get("text", "")[:500])

        return "\n".join(parts)