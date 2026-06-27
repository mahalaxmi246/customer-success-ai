"""
main.py - FastAPI application entry point.
Wires together all routes, scheduler, and startup events.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

from database import create_tables
from config.settings import settings
from routes.customers import router as customers_router
from routes.interactions import router as interactions_router
from routes.approvals import router as approvals_router


# ── Scheduler ─────────────────────────────────────────────

scheduler = BackgroundScheduler()

def start_gmail_polling():
    """Poll Gmail every 30 seconds for new customer emails."""
    try:
        from ingestion.gmail_poller import poll_gmail
        poll_gmail()
    except Exception as e:
        print(f"[Scheduler] Gmail poll error: {e}")

def process_new_interactions():
    """Auto-trigger analysis for any interactions with status=new."""
    try:
        from database import SessionLocal, Interaction
        from graph import run_graph

        db = SessionLocal()
        try:
            new_interactions = db.query(Interaction).filter(
                Interaction.status == "new"
            ).all()

            for interaction in new_interactions:
                print(f"[Scheduler] Auto-analyzing interaction {interaction.id}: {interaction.title[:50]}")
                interaction.status = "processing"
                db.commit()
                # Run in same thread (scheduler handles concurrency)
                run_graph(interaction.id)
        finally:
            db.close()
    except Exception as e:
        print(f"[Scheduler] Auto-analysis error: {e}")


# ── Lifespan ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Customer Success AI Platform...")

    # Create DB tables
    create_tables()
    print("Database tables ready.")

    # Start Gmail polling every 30 seconds
    scheduler.add_job(
        start_gmail_polling,
        "interval",
        seconds=settings.GMAIL_POLL_INTERVAL,
        id="gmail_poller",
        replace_existing=True,
    )

    # Process new interactions every 35 seconds
    # (offset by 5s so Gmail poll completes first)
    scheduler.add_job(
        process_new_interactions,
        "interval",
        seconds=35,
        id="interaction_processor",
        replace_existing=True,
    )

    scheduler.start()
    print(f"Scheduler started. Gmail polling every {settings.GMAIL_POLL_INTERVAL}s.")

    yield

    # Shutdown
    scheduler.shutdown()
    print("Scheduler stopped.")


# ── App ───────────────────────────────────────────────────

app = FastAPI(
    title="Customer Success AI Platform",
    description="Intelligent Next Best Action platform for Customer Success Managers.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGINS, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(customers_router)
app.include_router(interactions_router)
app.include_router(approvals_router)


# ── Health check ──────────────────────────────────────────

@app.get("/api/health")
def health():
    return {
        "status":  "ok",
        "service": "Customer Success AI Platform",
        "version": "1.0.0",
    }


@app.get("/")
def root():
    return {"message": "Customer Success AI Platform is running. Visit /docs for API reference."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)