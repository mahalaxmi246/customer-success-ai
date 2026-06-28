"""
graph.py - LangGraph with True Dynamic Workflow Execution

Architecture:
  START → load_interaction → planner → execute_workflow → human_review → memory → END

The planner returns a workflow definition:
  {
    "stages": [
      ["context", "risk"],   <- parallel execution
      ["recommendation"]      <- sequential after stage 1
    ]
  }

execute_workflow reads the stages and runs agents dynamically.
Agents within the same stage run in parallel via ThreadPoolExecutor.
New agents = register in AGENT_REGISTRY. No graph changes needed.
"""

import os
import sys
import json
from typing import TypedDict, List, Optional
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver

from agents.planner_agent        import PlannerAgent
from agents.context_agent        import ContextAgent
from agents.risk_agent           import RiskAgent
from agents.recommendation_agent import RecommendationAgent


# ── Agent Registry ────────────────────────────────────────
# To add a new agent:
#   1. Create agents/your_agent.py subclassing BaseAgent
#   2. Add one line here: "your_agent": YourAgent()
# No graph changes needed. Planner can include it in workflows.

AGENT_REGISTRY = {
    "context":        ContextAgent(),
    "risk":           RiskAgent(),
    "recommendation": RecommendationAgent(),
}


# ── Typed State ───────────────────────────────────────────

class GraphState(TypedDict, total=False):
    # Input
    interaction_id      : int
    customer_id         : int
    interaction_content : str
    interaction_title   : str
    interaction_type    : str
    source              : str
    sentiment           : Optional[str]
    intent              : Optional[str]
    requested_outcome   : Optional[str]
    customer_profile    : dict

    # Planner output
    interaction_category : str
    secondary_categories : List[str]
    key_topics           : List[str]
    urgency_signals      : List[str]
    planner_notes        : str
    requires_escalation  : bool
    workflow             : dict   # {"stages": [["context","risk"],["recommendation"]]}
    workflow_reasoning   : str

    # Context output
    playbook_chunks  : List[dict]
    customer_history : dict
    customer_memory  : dict
    unified_context  : str

    # Risk output
    churn_risk     : str
    urgency        : int
    priority       : str
    risk_reasoning : str
    risk_factors   : List[str]
    missing_info   : List[str]

    # Recommendation output
    recommendations : List[dict]

    # Execution tracking
    executed_agents  : List[str]
    stage_timings    : List[dict]
    completed_agents : List[str]
    error            : Optional[str]
    human_decision   : Optional[dict]


# ── Dynamic Workflow Executor ─────────────────────────────

def execute_workflow_node(state: GraphState) -> GraphState:
    """
    Core orchestration node. Reads the workflow from state
    and executes each stage dynamically.

    Agents within the same stage run in parallel.
    Stages execute sequentially.
    """
    workflow = state.get("workflow", {})
    stages   = workflow.get("stages", [["context", "risk"], ["recommendation"]])

    state["executed_agents"] = []
    state["stage_timings"]   = []

    print(f"  [Orchestrator] Executing {len(stages)} stage(s)...")

    for stage_idx, stage_agents in enumerate(stages):
        stage_start = datetime.utcnow()

        # Filter to only registered agents
        runnable = [a for a in stage_agents if a in AGENT_REGISTRY]
        if not runnable:
            print(f"  [Orchestrator] Stage {stage_idx+1}: no valid agents — skipping")
            continue

        print(f"  [Orchestrator] Stage {stage_idx+1}: {runnable} {'(parallel)' if len(runnable) > 1 else ''}")

        if len(runnable) == 1:
            # Single agent — run directly
            agent_name = runnable[0]
            agent      = AGENT_REGISTRY[agent_name]
            state      = agent(state)
            state["executed_agents"].append(agent_name)
        else:
            # Multiple agents — run in parallel
            results = {}

            def run_agent(name):
                import copy
                # Each parallel agent gets a snapshot of current state
                agent      = AGENT_REGISTRY[name]
                agent_state = dict(state)
                updated     = agent(agent_state)
                return name, updated

            with ThreadPoolExecutor(max_workers=len(runnable)) as executor:
                futures = {executor.submit(run_agent, name): name for name in runnable}
                for future in as_completed(futures):
                    try:
                        name, result = future.result()
                        results[name] = result
                        state["executed_agents"].append(name)
                    except Exception as e:
                        print(f"  [Orchestrator] Agent {futures[future]} failed: {e}")

            # Merge parallel results back into state
            # Later agents' outputs take precedence for shared keys
            for name in runnable:
                if name in results:
                    agent_result = results[name]
                    for key, value in agent_result.items():
                        if value is not None:
                            state[key] = value

        # Record stage timing
        elapsed = (datetime.utcnow() - stage_start).total_seconds()
        state["stage_timings"].append({
            "stage":   stage_idx + 1,
            "agents":  runnable,
            "elapsed": round(elapsed, 2)
        })
        print(f"  [Orchestrator] Stage {stage_idx+1} complete in {elapsed:.2f}s")

    # Print execution summary
    print(f"  [Orchestrator] Workflow complete.")
    print(f"  [Orchestrator] Agents executed: {state.get('executed_agents', [])}")
    for t in state.get("stage_timings", []):
        print(f"  [Orchestrator] Stage {t['stage']} {t['agents']}: {t['elapsed']}s")

    return state


# ── Other Nodes ───────────────────────────────────────────

_planner_agent = PlannerAgent()

def load_interaction_node(state: GraphState) -> GraphState:
    from database import SessionLocal, Interaction, Customer

    interaction_id = state.get("interaction_id")
    if not interaction_id:
        state["error"] = "No interaction_id provided"
        return state

    db = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(
            Interaction.id == interaction_id
        ).first()

        if not interaction:
            state["error"] = f"Interaction {interaction_id} not found"
            return state

        customer = db.query(Customer).filter(
            Customer.id == interaction.customer_id
        ).first()

        state["customer_id"]         = interaction.customer_id
        state["interaction_content"] = interaction.content or ""
        state["interaction_title"]   = interaction.title or ""
        state["interaction_type"]    = interaction.interaction_type or "Email"
        state["source"]              = interaction.source or "gmail"
        state["sentiment"]           = interaction.sentiment
        state["intent"]              = interaction.intent
        state["requested_outcome"]   = interaction.requested_outcome
        state["completed_agents"]    = []

        if customer:
            state["customer_profile"] = {
                "id":           customer.id,
                "name":         customer.name,
                "company":      customer.company,
                "email":        customer.email,
                "health_score": customer.health_score,
                "renewal_date": customer.renewal_date.isoformat() if customer.renewal_date else None,
            }
        else:
            state["customer_profile"] = {}

        print(f"  [Loader] Loaded interaction #{interaction_id}: {interaction.title[:50]}")
        return state
    finally:
        db.close()


def planner_node(state: GraphState) -> GraphState:
    return _planner_agent(state)


def human_review_node(state: GraphState) -> GraphState:
    """
    Graph pauses here. Resumes when POST /api/interactions/{id}/approve is called.
    State is persisted to SQLite checkpointer automatically.
    """
    print(f"  [HumanReview] Graph paused — awaiting manager approval...")

    state["__interrupt__"] = {
        "message":         "Recommendations ready for human review",
        "interaction_id":  state.get("interaction_id"),
        "recommendations": state.get("recommendations", []),
    }
    state["human_decision"] = None
    return state


def memory_node(state: GraphState) -> GraphState:
    from database import SessionLocal, Memory, Interaction

    interaction_id = state.get("interaction_id")
    customer_id    = state.get("customer_id")

    if not customer_id:
        return state

    db = SessionLocal()
    try:
        memory = db.query(Memory).filter(
            Memory.customer_id == customer_id
        ).order_by(Memory.timestamp.desc()).first()

        existing_context = {}
        if memory and memory.historical_context:
            try:
                existing_context = json.loads(memory.historical_context)
            except Exception:
                existing_context = {}

        approved = existing_context.get("approved_actions", [])
        approved.append({
            "interaction_id":    interaction_id,
            "interaction_title": state.get("interaction_title", ""),
            "workflow":          state.get("workflow", {}),
            "executed_agents":   state.get("executed_agents", []),
            "churn_risk":        state.get("churn_risk", ""),
            "priority":          state.get("priority", ""),
            "timestamp":         datetime.utcnow().isoformat(),
        })

        updated_context = {
            **existing_context,
            "approved_actions": approved[-20:],
            "last_churn_risk":  state.get("churn_risk", ""),
            "last_priority":    state.get("priority", ""),
            "last_workflow":    state.get("workflow", {}),
            "last_updated":     datetime.utcnow().isoformat(),
        }

        profile     = state.get("customer_profile", {})
        new_summary = (
            f"{profile.get('name', 'Customer')} from {profile.get('company', 'unknown')}. "
            f"Health: {profile.get('health_score', 'N/A')}/100. "
            f"Last interaction: {state.get('interaction_title', '')}. "
            f"Risk: {state.get('churn_risk', 'unknown')}. "
            f"Agents run: {state.get('executed_agents', [])}."
        )

        if memory:
            memory.historical_context = json.dumps(updated_context)
            memory.summary            = new_summary
            memory.timestamp          = datetime.utcnow()
        else:
            memory = Memory(
                customer_id        = customer_id,
                summary            = new_summary,
                historical_context = json.dumps(updated_context),
                timestamp          = datetime.utcnow(),
            )
            db.add(memory)

        interaction = db.query(Interaction).filter(
            Interaction.id == interaction_id
        ).first()
        if interaction:
            interaction.status = "completed"

        db.commit()
        print(f"  [Memory] Updated for customer #{customer_id}")
        return state

    except Exception as e:
        db.rollback()
        print(f"  [Memory] Error: {e}")
        state["error"] = f"Memory update failed: {str(e)}"
        return state
    finally:
        db.close()


# ── Build graph ───────────────────────────────────────────

def build_graph():
    builder = StateGraph(GraphState)

    builder.add_node("load_interaction",  load_interaction_node)
    builder.add_node("planner",           planner_node)
    builder.add_node("execute_workflow",  execute_workflow_node)
    builder.add_node("human_review",      human_review_node)
    builder.add_node("memory",            memory_node)

    builder.add_edge(START,               "load_interaction")
    builder.add_edge("load_interaction",  "planner")
    builder.add_edge("planner",           "execute_workflow")
    builder.add_edge("execute_workflow",  "human_review")
    builder.add_edge("human_review",      "memory")
    builder.add_edge("memory",            END)

    return builder


# ── Checkpointer ──────────────────────────────────────────

CHECKPOINTER_DB = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "checkpointer.db"
)

def get_checkpointer():
    return SqliteSaver.from_conn_string(CHECKPOINTER_DB)


# ── Public API ────────────────────────────────────────────

def run_graph(interaction_id: int) -> dict:
    print(f"\n{'='*50}")
    print(f"[Graph] Starting run for interaction #{interaction_id}")
    print(f"{'='*50}")

    config = {
        "configurable": {
            "thread_id": f"interaction_{interaction_id}"
        }
    }

    with get_checkpointer() as checkpointer:
        graph = build_graph().compile(
            checkpointer=checkpointer,
            interrupt_before=["human_review"]
        )
        try:
            result = graph.invoke({"interaction_id": interaction_id}, config=config)
            print(f"[Graph] Paused at human_review for interaction #{interaction_id}")
            return result
        except Exception as e:
            print(f"[Graph] Error: {e}")
            _mark_interaction_failed(interaction_id)
            raise


def resume_graph(interaction_id: int, human_decision: dict) -> dict:
    print(f"\n[Graph] Resuming interaction #{interaction_id}")

    config = {
        "configurable": {
            "thread_id": f"interaction_{interaction_id}"
        }
    }

    with get_checkpointer() as checkpointer:
        graph = build_graph().compile(
            checkpointer=checkpointer,
            interrupt_before=["human_review"]
        )
        try:
            result = graph.invoke(None, config=config)
            print(f"[Graph] Completed interaction #{interaction_id}")
            return result
        except Exception as e:
            print(f"[Graph] Resume error: {e}")
            raise


def get_graph_state(interaction_id: int) -> Optional[dict]:
    config = {
        "configurable": {
            "thread_id": f"interaction_{interaction_id}"
        }
    }
    with get_checkpointer() as checkpointer:
        graph = build_graph().compile(
            checkpointer=checkpointer,
            interrupt_before=["human_review"]
        )
        snapshot = graph.get_state(config)
        if snapshot:
            return dict(snapshot.values)
        return None


def _mark_interaction_failed(interaction_id: int):
    from database import SessionLocal, Interaction
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


# ── Quick test ────────────────────────────────────────────

if __name__ == "__main__":
    print("Testing true dynamic orchestration with interaction ID 1...")
    result = run_graph(interaction_id=1)

    print("\n=== GRAPH RESULT ===")
    print(f"Category      : {result.get('interaction_category')}")
    print(f"Workflow      : {result.get('workflow')}")
    print(f"Reasoning     : {result.get('workflow_reasoning')}")
    print(f"Agents run    : {result.get('executed_agents')}")
    print(f"Stage timings : {result.get('stage_timings')}")
    print(f"Churn Risk    : {result.get('churn_risk')}")
    print(f"Priority      : {result.get('priority')}")
    nbas = result.get("recommendations", [])
    print(f"NBAs          : {len(nbas)}")
    for nba in nbas:
        print(f"  Rank {nba.get('rank')}: {nba.get('action_type')} — {nba.get('confidence')}% confidence")