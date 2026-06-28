# 🤖 AI Customer Success Platform

> **Intelligent Next Best Action Decision Intelligence Platform**  
> Built for XLVentures.AI Hackathon 2026

An AI-powered platform that proactively monitors customer interactions, analyzes them through a multi-agent pipeline, and surfaces ranked Next Best Actions — so your Customer Success team spends 2 minutes approving decisions instead of 45 minutes researching them.

---

## ✨ The Problem It Solves

Customer Success Managers drown in information — emails, CRM updates, meeting notes, support tickets. At-risk customers go unnoticed until it's too late. Junior CSMs miss signals that senior ones catch. The same situation gets handled inconsistently across the team.

**This platform changes that.** It watches your inbox, pulls in all relevant context automatically, reasons over it using a multi-agent AI pipeline, and tells your CSM exactly what to do next — with full reasoning, evidence, and a ready-to-send execution plan.

| Scenario | Without Platform | With Platform |
|---|---|---|
| Customer complaint arrives | 45 min: read, research, decide | 2 min: review & approve 3 ranked actions |
| Same customer complains again | CSM may not remember history | Memory system surfaces full pattern |
| New CSM joins the team | Weeks of shadowing | Same expert-quality recommendations from day one |
| Customer mentions a competitor | May be missed | Always triggers Cancellation Risk + EBR playbook |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     INGESTION LAYER                         │
│         Gmail API (every 30s)  ←→  Manual Form UI          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  ORCHESTRATION LAYER                        │
│              LangGraph StateGraph Pipeline                  │
│                                                             │
│  load_interaction → planner → execute_workflow → memory    │
│                                     │                       │
│                              ┌──────┴──────┐               │
│                         [parallel agents]                   │
│                         Context │ Risk                      │
│                              └──────┬──────┘               │
│                               Recommendation                │
└────────────────────────┬────────────────────────────────────┘
                         │ interrupt() — human review
┌────────────────────────▼────────────────────────────────────┐
│                    KNOWLEDGE LAYER                          │
│         Qdrant (vector / playbooks)  +  SQLite (memory)    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  PRESENTATION LAYER                         │
│        React Dashboard — Review, Approve, Edit, Reject      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

- **Automated Gmail monitoring** — polls every 30 seconds; no manual input required
- **Multi-agent LangGraph pipeline** — Planner, Context, Risk, and Recommendation agents with dynamic routing
- **True Human-in-the-Loop** — LangGraph `interrupt()` genuinely pauses execution until CSM approves
- **Semantic knowledge retrieval** — Qdrant vector database over 5 CS playbooks; only the most relevant chunks reach the LLM
- **Persistent memory** — every approved decision updates the customer's memory; future recommendations are personalized
- **Circuit breaker** — automatic Groq → Gemini fallback with exponential backoff
- **Prompt injection protection** — 17 known injection patterns scrubbed before any text reaches the LLM
- **Token-efficient** — duplicate caching, dynamic agent routing, and context truncation minimize LLM calls
- **Dark glass-morphism UI** — React + Vite dashboard with live polling and one-click approval

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind | Fast dev, hot reload, component architecture |
| Backend | FastAPI (Python) | Async-first, auto OpenAPI docs, native background tasks |
| Agent Orchestration | LangGraph 0.2 | Only framework with true `interrupt()` for HITL |
| LLM | Groq (Llama3-70b) + Gemini fallback | Free tier, 500 tok/s, circuit breaker for reliability |
| Vector DB | Qdrant (Docker) | Dashboard, metadata filtering, production-ready |
| Relational DB | SQLite | Zero setup; LangGraph native checkpointer |
| Embeddings | sentence-transformers `all-MiniLM-L6-v2` | Free, local, 384-dim, no API calls |
| Email | Gmail API + APScheduler | Real emails, 30-min OAuth setup |
| Auth | python-jose + bcrypt | JWT sessions, no external auth service |

---

## 🤖 Agent Design

Each agent inherits from `BaseAgent`, which handles timing, logging, retry logic, prompt injection sanitization, and circuit breaking automatically.

```
Planner Agent
  └─ Classifies interaction, generates a dynamic workflow JSON
     (determines which agents to run and which can run in parallel)

Context Agent  [parallel]
  ├─ Qdrant: top-5 semantically similar playbook chunks
  ├─ SQLite: last 10 interactions + 5 approved decisions
  └─ Memory table: historical customer context summary

Risk Agent  [parallel]
  └─ Returns: churn_risk, urgency (1-5), sentiment, priority, risk_factors

Recommendation Agent
  ├─ LLM call 1: 1-3 ranked Next Best Actions with reasoning & evidence
  └─ LLM call 2 (per NBA): full execution plan (email draft or meeting brief)
```

**Example dynamic workflows:**

```json
// High churn risk complaint → parallel risk + context, then recommendation
{ "stages": [["context", "risk"], ["recommendation"]] }

// Simple pricing inquiry → skip risk agent entirely
{ "stages": [["context"], ["recommendation"]] }
```

---

## 📚 Knowledge Base

Five CS playbooks are embedded and indexed in Qdrant at startup:

| File | Covers |
|---|---|
| `retention_playbook.pdf` | Health score scale, churn signal tiers, EBR protocol, competitor response (CS-03–CS-15) |
| `pricing_playbook.pdf` | Plan tiers, seat pricing, billing disputes, renewal policy, overdue escalation |
| `onboarding_playbook.pdf` | 5 onboarding stages, SLA commitments, adoption targets by Day 30/60/90 |
| `faq.pdf` | Product, billing, technical, and support SLA FAQs |
| `escalation_playbook.pdf` | P1–P4 incident SLAs, HEAR framework, escalation path, SLA credits |

Chunking: ~500-token chunks with 50-token overlap, boundary-aware splitting. Retrieval: top-5 cosine similarity via rich multi-field query. Total playbook tokens in any prompt: ≤ 2,500 regardless of knowledge base size.

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Desktop
- [Groq API key](https://console.groq.com) (free)
- [Gemini API key](https://aistudio.google.com) (free, optional fallback)
- Google account for Gmail API

### Step 1 — Clone & Install

```bash
git clone https://github.com/mahalaxmi246/customer-success-ai.git
cd customer-success-ai

# Backend
cd backend
python -m venv venv
source venv/bin/activate       # Mac/Linux
# venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Step 2 — Environment Variables

Create `backend/.env` (copy from `backend/.env.example`):

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION=playbooks
GMAIL_CREDENTIALS_PATH=credentials.json
GMAIL_TOKEN_PATH=token.json
GMAIL_LABEL=customer-support
GMAIL_POLL_INTERVAL=30
DATABASE_URL=sqlite:///./nba_platform.db
CORS_ORIGINS=http://localhost:5173
SECRET_KEY=your-random-secret-key-here
```

### Step 3 — Gmail API

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a new project
2. Enable the **Gmail API** under APIs & Services → Library
3. OAuth consent screen → External → fill in app name + support email → add test users
4. Credentials → Create OAuth client ID → **Desktop app** → Download JSON
5. Rename the downloaded file to `credentials.json` and place in `backend/`
6. In Gmail, create a label called `customer-support` on the inbox you want to monitor

### Step 4 — Start Qdrant

```bash
docker run -p 6333:6333 qdrant/qdrant
# Dashboard available at: http://localhost:6333/dashboard
```

### Step 5 — Generate Playbooks & Index

```bash
cd backend
python gen_playbooks.py   # generates 5 PDFs in backend/playbooks/
python ingest.py          # embeds and indexes in Qdrant (~120 chunks expected)
```

### Step 6 — Seed & Start Backend

```bash
python seed.py    # seeds 7 customers + 100+ interactions + memory
python main.py    # FastAPI on port 8000

# First run: browser opens for Gmail OAuth
# Subsequent runs: token.json is reused automatically
# API docs: http://localhost:8000/docs
```

### Step 7 — Start Frontend

```bash
cd frontend
npm run dev
# Open: http://localhost:5173
# Sign up with any email and password to get started
```

---

## 🎬 Demo Scenarios

**Demo 1 — Live Gmail Email**
Send an email to the monitored inbox with the `customer-support` label. Within 30 seconds it appears in the Email Monitor. Within 2 minutes, status changes to *Awaiting Approval* with 3 NBAs, full reasoning, and a ready-to-send email draft.

**Demo 2 — Manual Interaction**
Open *Analyze Interaction*, select a customer, paste a meeting summary mentioning pricing concerns. Click Analyze and watch agents run. The recommendation view returns a full meeting brief with objectives, discussion points, and suggested questions.

**Demo 3 — Memory in Action**
Send a second email from the same customer on a different issue. The recommendations will reference the previous interaction and decisions — demonstrating persistent, personalized memory.

**Demo 4 — Duplicate Detection**
Submit the same manual interaction twice. The second submission shows: *"Already analyzed — redirecting to cached recommendations."* No agents run, no tokens consumed.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register — returns JWT token |
| POST | `/auth/login` | Authenticate — returns JWT token |
| GET | `/auth/me` | Current user profile |
| GET | `/api/customers` | List customers sorted by health score (most at-risk first) |
| GET | `/api/customers/{id}/history` | Full customer profile, interactions, memory summary |
| GET | `/api/interactions` | List interactions — filterable by `?status=`, `?source=`, `?customer_id=` |
| GET | `/api/interactions/{id}` | Full interaction detail with recommendations and decisions |
| POST | `/api/interactions/manual` | Submit manual interaction (includes duplicate detection) |
| POST | `/api/interactions/{id}/analyze` | Trigger or re-trigger analysis |
| POST | `/api/interactions/{id}/approve` | Submit CSM decisions — resumes LangGraph, updates memory |
| GET | `/api/health` | Status of DB, Qdrant, Gmail token, LLM provider, scheduler |

All endpoints except `/auth/signup` and `/auth/login` require `Authorization: Bearer <token>`.

---

## 🔒 Security

- **Prompt injection protection** — 17 regex patterns scanned and redacted before LLM invocation (e.g., "ignore previous instructions", "bypass safety", "jailbreak")
- **JWT authentication** — HS256-signed tokens, 24-hour expiry, bcrypt password hashing
- **Circuit breaker** — Groq (attempt 1 & 2) → Gemini (attempt 3 & 4) with exponential backoff; failed interactions reset to `new` for automatic retry
- **Stuck interaction recovery** — on startup, any `status=processing` interaction is reset and re-queued automatically

---

## 🗺️ Roadmap

- [ ] **Execution actions** — wire approved NBAs directly to Gmail send, Google Calendar create, Slack notify
- [ ] **Production data layer** — PostgreSQL, Qdrant Cloud, Redis cache, Celery job queue
- [ ] **Observability dashboard** — per-agent latency, approval rates, failure traces
- [ ] **Advanced agents** — Sentiment Trend, Upsell Intelligence, Competitive Intelligence
- [ ] **CRM integrations** — Salesforce, HubSpot, Zendesk (ingestion layer is plug-and-play)
- [ ] **Multi-tenant** — org-level data isolation, RBAC, per-org playbook management

---

## 👥 Team

Built by a team of 3 for the **XLVentures.AI Hackathon 2026** · Submission: 29 June 2026

📧 [talent@xlventures.ai](mailto:talent@xlventures.ai)

---

*This platform is proactive, not reactive — the fundamental difference between a chatbot and an intelligent decision intelligence system.*
