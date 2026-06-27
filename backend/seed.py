"""
seed.py — populates the database with realistic dummy data.
Run once: python seed.py
Safe to re-run — checks if data already exists before inserting.
"""

import sys
import os
import json
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, create_tables, Customer, Interaction, Recommendation, Decision, Memory


# ── Helpers ───────────────────────────────────────────────

def days_ago(n):
    return datetime.utcnow() - timedelta(days=n)

def days_from_now(n):
    return datetime.utcnow() + timedelta(days=n)


# ── 1. Customers ──────────────────────────────────────────

CUSTOMERS = [
    # --- Original 5 fictional customers ---
    {
        "name": "Sarah Mitchell",
        "company": "Nexora Technologies",
        "email": "sarah.mitchell@nexora.com",
        "health_score": 32.0,
        "renewal_date": days_from_now(18),
    },
    {
        "name": "James Patel",
        "company": "BrightWave Solutions",
        "email": "james.patel@brightwave.io",
        "health_score": 67.0,
        "renewal_date": days_from_now(45),
    },
    {
        "name": "Priya Nair",
        "company": "Cloudify Inc.",
        "email": "priya.nair@cloudify.com",
        "health_score": 85.0,
        "renewal_date": days_from_now(90),
    },
    {
        "name": "Marcus Chen",
        "company": "Vortex Analytics",
        "email": "marcus.chen@vortexanalytics.com",
        "health_score": 48.0,
        "renewal_date": days_from_now(30),
    },
    {
        "name": "Leila Hassan",
        "company": "PeakFlow Systems",
        "email": "leila.hassan@peakflow.com",
        "health_score": 91.0,
        "renewal_date": days_from_now(120),
    },

    # --- Demo customers (real Gmail accounts for live demo) ---
    {
        "name": "Mahalaxmi",
        "company": "Mahalaxmi Enterprises",
        "email": "mahalaxmi1246@gmail.com",
        "health_score": 41.0,
        "renewal_date": days_from_now(22),   # renewal soon — churn risk for demo
    },
    {
        "name": "Lasya",
        "company": "Lasya Digital Studio",
        "email": "lasya1626@gmail.com",
        "health_score": 78.0,
        "renewal_date": days_from_now(60),   # healthy but has a feature complaint
    },
]


# ── 2. Interactions ───────────────────────────────────────

def get_interactions(customer_id, company, name):
    """Returns 10–13 realistic interactions for a customer over the past 3 months."""

    base = [
        # --- 3 months ago ---
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": f"Onboarding feedback from {company}",
            "content": f"Hi, this is {name} from {company}. We just completed our onboarding last week. The process took longer than expected — our team spent almost 3 weeks getting set up. We expected 1 week max based on what was promised during the sales process. Can we discuss what happened?",
            "sentiment": "Negative",
            "intent": "Complaint",
            "requested_outcome": "Explanation for onboarding delay and assurance it won't happen again.",
            "status": "completed",
            "timestamp": days_ago(88),
        },
        {
            "customer_id": customer_id,
            "source": "manual",
            "created_by": "manager",
            "interaction_type": "Phone Call",
            "title": "Follow-up call after onboarding complaint",
            "content": f"Called {name} to follow up on the onboarding complaint. Customer was frustrated but receptive. Explained that the delay was due to a data migration issue on our end. Offered a 10% discount on next invoice as goodwill. Customer seemed partially satisfied but mentioned they are watching closely.",
            "sentiment": "Neutral",
            "intent": "Complaint",
            "requested_outcome": "Customer wants written confirmation of the discount and a revised onboarding SLA.",
            "status": "completed",
            "timestamp": days_ago(85),
        },

        # --- 2.5 months ago ---
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": f"Invoice dispute — {company}",
            "content": f"Hello, I noticed our latest invoice does not reflect the 10% discount that was promised during our call last week. The amount charged is the full price. Please correct this immediately and send a revised invoice. We cannot process payment until this is resolved.",
            "sentiment": "Negative",
            "intent": "Complaint, Pricing Inquiry",
            "requested_outcome": "Revised invoice with 10% discount applied.",
            "status": "completed",
            "timestamp": days_ago(72),
        },
        {
            "customer_id": customer_id,
            "source": "manual",
            "created_by": "manager",
            "interaction_type": "Meeting",
            "title": "Quarterly check-in — Q1 review",
            "content": f"Met with {name} and their team lead for Q1 review. Product usage is below expectations — they are only using 3 out of 8 available modules. The team hasn't completed training. Main concern is that the product feels too complex. Suggested scheduling dedicated training sessions. Customer agreed but expressed concern about time commitment.",
            "sentiment": "Neutral",
            "intent": "Feature Request, Renewal Concern",
            "requested_outcome": "Simplified onboarding for remaining modules. Training sessions to be scheduled.",
            "status": "completed",
            "timestamp": days_ago(65),
        },

        # --- 2 months ago ---
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Training session request",
            "content": f"Hi, following our meeting, we'd like to schedule the training sessions we discussed. Our team is available Wednesday and Thursday afternoons. Could you send over a calendar invite with the agenda? Also, is it possible to record the sessions for team members who can't attend live?",
            "sentiment": "Positive",
            "intent": "Feature Request",
            "requested_outcome": "Training sessions scheduled with recordings available.",
            "status": "completed",
            "timestamp": days_ago(58),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Feature request — bulk export",
            "content": f"Hello, our analytics team has been using the reporting module extensively. One major gap we've identified is the lack of bulk export functionality. We need to export data in CSV format for our internal BI tools. Is this on your roadmap? If not, this could be a blocker for us at renewal.",
            "sentiment": "Neutral",
            "intent": "Feature Request, Renewal Concern",
            "requested_outcome": "Confirmation that bulk export is on the roadmap with a timeline.",
            "status": "completed",
            "timestamp": days_ago(52),
        },

        # --- 6 weeks ago ---
        {
            "customer_id": customer_id,
            "source": "manual",
            "created_by": "manager",
            "interaction_type": "Meeting",
            "title": "Training session 1 — Core modules",
            "content": f"Completed first training session with {company} team. 6 attendees. Covered modules 4, 5, and 6. Engagement was good. Team asked several advanced questions which is a positive sign. {name} was present and seemed more positive than previous interactions. Session was recorded and shared.",
            "sentiment": "Positive",
            "intent": "Feature Request",
            "requested_outcome": "Follow-up session for modules 7 and 8.",
            "status": "completed",
            "timestamp": days_ago(42),
        },

        # --- 1 month ago ---
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Escalation — API integration failure",
            "content": f"URGENT: Our integration with your API has been failing for the past 48 hours. We are unable to sync data between your platform and our internal systems. This is causing significant disruption to our operations. We have raised a support ticket (#4821) but have not received any update in 24 hours. We need this resolved today.",
            "sentiment": "Negative",
            "intent": "Complaint",
            "requested_outcome": "Immediate resolution of API failure. SLA compensation for downtime.",
            "status": "completed",
            "timestamp": days_ago(28),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Team lead departure notice",
            "content": f"Hi, I wanted to let you know that our primary point of contact for your platform has left the company. We are currently without someone who deeply understands the platform. This may impact our usage over the coming weeks while we onboard a replacement.",
            "sentiment": "Neutral",
            "intent": "Renewal Concern",
            "requested_outcome": "Support for knowledge transfer to new team lead.",
            "status": "completed",
            "timestamp": days_ago(16),
        },

        # --- 2 weeks ago ---
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Renewal concern and competitor evaluation",
            "content": f"Hello, with our renewal coming up soon, I wanted to be transparent — we are currently evaluating two competitor solutions. The API incident last month and ongoing complexity concerns have prompted us to explore alternatives. I'd like to schedule a call to discuss value received and what improvements are planned.",
            "sentiment": "Negative",
            "intent": "Cancellation Risk, Renewal Concern",
            "requested_outcome": "Executive-level call to discuss renewal and product roadmap.",
            "status": "completed",
            "timestamp": days_ago(10),
        },

        # --- Most recent ---
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Final decision needed before renewal",
            "content": f"Hi, our renewal date is coming up. We need to make a decision by end of this week. The team is split — some want to continue, others prefer switching. Main concerns: (1) API reliability, (2) product complexity for new users, (3) pricing for additional seats. If you can address these with concrete commitments, we are likely to renew.",
            "sentiment": "Negative",
            "intent": "Cancellation Risk, Renewal Concern, Pricing Inquiry",
            "requested_outcome": "Written commitments on API SLA, onboarding support, and pricing.",
            "status": "new",
            "timestamp": days_ago(2),
        },
    ]

    return base


def get_interactions_mahalaxmi(customer_id):
    """
    Unique history for Mahalaxmi — started enthusiastic, hit a billing problem,
    now concerned about renewal. Good for live demo: send a new email from
    mahalaxmi1246@gmail.com and the system will show the full history.
    """
    return [
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Excited to get started!",
            "content": "Hi team! We just signed up for your platform and I'm really excited. Our small marketing agency has been looking for a tool like this. Quick question — how do we set up the client reporting module first? That's our top priority.",
            "sentiment": "Positive",
            "intent": "Feature Request",
            "requested_outcome": "Guidance on setting up the client reporting module.",
            "status": "completed",
            "timestamp": days_ago(80),
        },
        {
            "customer_id": customer_id,
            "source": "manual",
            "created_by": "manager",
            "interaction_type": "Phone Call",
            "title": "Welcome call — onboarding kickoff",
            "content": "Welcome call with Mahalaxmi. Very enthusiastic customer. Small team of 4 people. Primary use case is client reporting and campaign tracking. Walked her through the reporting module setup. She picked it up quickly. Scheduled a follow-up in 2 weeks.",
            "sentiment": "Positive",
            "intent": "Feature Request",
            "requested_outcome": "Follow-up in 2 weeks to check adoption.",
            "status": "completed",
            "timestamp": days_ago(77),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Loving the platform so far!",
            "content": "Hi, just wanted to say the reporting module is exactly what we needed. We've already created 6 client dashboards. One small thing — is there a way to white-label the reports with our agency branding? Our clients see the platform name on the reports which looks unprofessional.",
            "sentiment": "Positive",
            "intent": "Feature Request",
            "requested_outcome": "White-labeling option for client reports.",
            "status": "completed",
            "timestamp": days_ago(60),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Billing issue — charged twice",
            "content": "Hello, I just checked my bank statement and I've been charged twice for this month's subscription. The amount of Rs. 4,999 was debited twice on the 1st and again on the 3rd. This is really concerning. Please refund the duplicate charge immediately and confirm when this will reflect in my account.",
            "sentiment": "Negative",
            "intent": "Complaint, Pricing Inquiry",
            "requested_outcome": "Immediate refund of duplicate charge.",
            "status": "completed",
            "timestamp": days_ago(45),
        },
        {
            "customer_id": customer_id,
            "source": "manual",
            "created_by": "manager",
            "interaction_type": "Phone Call",
            "title": "Billing dispute resolution call",
            "content": "Called Mahalaxmi regarding the duplicate charge. Confirmed the issue — a payment gateway glitch caused double billing. Raised refund request with finance team. Refund will reflect in 5–7 business days. Mahalaxmi was upset but understood once explained. Offered 1 month free as goodwill. She appreciated the gesture.",
            "sentiment": "Neutral",
            "intent": "Complaint",
            "requested_outcome": "Refund confirmed. 1 month free credit applied.",
            "status": "completed",
            "timestamp": days_ago(43),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Refund still not received",
            "content": "Hi, it has been 10 days and I still haven't received the refund for the duplicate charge. You had said 5–7 business days. This is now affecting my trust in your billing system. Can you please escalate this and give me a confirmed date?",
            "sentiment": "Negative",
            "intent": "Complaint",
            "requested_outcome": "Confirmed refund date and escalation confirmation.",
            "status": "completed",
            "timestamp": days_ago(33),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Team is growing — need more seats",
            "content": "Hi, good news — we just hired 2 new team members and would like to add them to our account. Could you let me know the pricing for 2 additional seats on our current plan? Also, has the white-labeling feature been added yet? Several clients have asked about it.",
            "sentiment": "Positive",
            "intent": "Pricing Inquiry, Feature Request",
            "requested_outcome": "Pricing for 2 additional seats. Update on white-labeling.",
            "status": "completed",
            "timestamp": days_ago(20),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Concerned about renewal — billing trust issue",
            "content": "Hello, our renewal is coming up in about 3 weeks. I want to be honest — the duplicate billing incident really shook my trust. My team loves the product itself, but I'm nervous about another billing issue. Can someone from your team reach out to reassure me before I commit to another year?",
            "sentiment": "Negative",
            "intent": "Renewal Concern, Cancellation Risk",
            "requested_outcome": "Reassurance about billing reliability before renewal decision.",
            "status": "new",
            "timestamp": days_ago(3),
        },
    ]


def get_interactions_lasya(customer_id):
    """
    Unique history for Lasya — power user who loves the platform but has
    a specific feature gap that's causing frustration. Good demo: she emails
    about the missing feature during the live demo.
    """
    return [
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Onboarding question — integrations",
            "content": "Hi! We just started using your platform for our digital studio. Love the UI so far. Quick question — do you integrate with Figma or Adobe Creative Cloud? A lot of our workflow is design-based and it would be amazing if we could connect our design tools.",
            "sentiment": "Positive",
            "intent": "Feature Request",
            "requested_outcome": "Information about Figma and Adobe Creative Cloud integrations.",
            "status": "completed",
            "timestamp": days_ago(85),
        },
        {
            "customer_id": customer_id,
            "source": "manual",
            "created_by": "manager",
            "interaction_type": "Meeting",
            "title": "Onboarding meeting — Lasya Digital Studio",
            "content": "Onboarding meeting with Lasya. Creative studio with 7 team members. Main use cases: project management, client collaboration, and time tracking. Very tech-savvy user. Mentioned Figma integration as a nice-to-have but not a blocker. Team got up to speed quickly — completed setup in 2 days.",
            "sentiment": "Positive",
            "intent": "Feature Request",
            "requested_outcome": "Figma integration roadmap update.",
            "status": "completed",
            "timestamp": days_ago(82),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Really impressed with project management features",
            "content": "Hey! Just wanted to share some positive feedback — the project management module is incredible. Our team has completely replaced Trello with your platform. The timeline view and dependency tracking have saved us so much time. One thing we'd love is a mobile app — we often work on-site with clients.",
            "sentiment": "Positive",
            "intent": "Feature Request",
            "requested_outcome": "Information on mobile app availability or roadmap.",
            "status": "completed",
            "timestamp": days_ago(65),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Client portal access issue",
            "content": "Hi, we've set up client portals for 3 of our clients so they can view project progress. However, two of them are reporting that they can't log in — they keep getting a 'session expired' error even after resetting their password. This is embarrassing as these are important clients. Please fix urgently.",
            "sentiment": "Negative",
            "intent": "Complaint",
            "requested_outcome": "Fix client portal login issue urgently.",
            "status": "completed",
            "timestamp": days_ago(50),
        },
        {
            "customer_id": customer_id,
            "source": "manual",
            "created_by": "manager",
            "interaction_type": "Phone Call",
            "title": "Client portal bug resolution",
            "content": "Called Lasya about the client portal login issue. Engineering identified a session token expiry bug introduced in the last update. Fix deployed within 6 hours. Lasya was frustrated but acknowledged the quick resolution. Mentioned she'll mention the quick fix to her clients. No goodwill offer requested.",
            "sentiment": "Neutral",
            "intent": "Complaint",
            "requested_outcome": "Bug confirmed fixed. Lasya satisfied with response time.",
            "status": "completed",
            "timestamp": days_ago(49),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Referral — sending a colleague your way",
            "content": "Hi! Quick note — I've recommended your platform to a friend who runs a UX design agency. She should be reaching out soon. We've been really happy overall. One ongoing request — any update on the mobile app? Our team keeps asking about it.",
            "sentiment": "Positive",
            "intent": "Feature Request",
            "requested_outcome": "Update on mobile app timeline.",
            "status": "completed",
            "timestamp": days_ago(35),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Time tracking export is broken",
            "content": "Hello, we rely heavily on the time tracking module for client invoicing. Since last week's update, the CSV export is generating corrupted files — the hours column shows random numbers instead of actual tracked time. We've had to manually calculate hours for 3 client invoices this week. This is costing us real time and money. Please prioritize this fix.",
            "sentiment": "Negative",
            "intent": "Complaint",
            "requested_outcome": "Immediate fix for time tracking CSV export.",
            "status": "completed",
            "timestamp": days_ago(18),
        },
        {
            "customer_id": customer_id,
            "source": "gmail",
            "created_by": "system",
            "interaction_type": "Email",
            "title": "Still no fix — time tracking export",
            "content": "Hi, it has now been 10 days since I reported the time tracking export bug. I've received no update. We are still manually calculating hours. This is unacceptable for a paid product. If this isn't fixed by end of week, I'll need to escalate and reconsider our subscription. We have 4 clients waiting on invoices.",
            "sentiment": "Negative",
            "intent": "Complaint, Cancellation Risk",
            "requested_outcome": "Immediate fix and compensation for time lost.",
            "status": "new",
            "timestamp": days_ago(1),
        },
    ]


# ── 3. Recommendations + Decisions ────────────────────────

def get_past_recommendations_and_decisions(interaction_id, company, name, idx):
    scenarios = [
        {
            "rec": {
                "interaction_id": interaction_id,
                "rank": 1,
                "action_type": "reply_email",
                "confidence": 88.0,
                "reasoning": "Customer complained about onboarding delay. Immediate acknowledgement with goodwill gesture is highest-priority per Retention Playbook CS-03.",
                "evidence": json.dumps([
                    "Customer email: onboarding took 3 weeks vs promised 1 week",
                    "Playbook CS-03: Onboarding delays > 5 days require apology + compensation",
                    f"Health score low — {company} already at churn risk"
                ]),
                "execution_plan_type": "email",
                "execution_plan_content": json.dumps({
                    "subject": "Re: Onboarding Feedback — Apology and Next Steps",
                    "body": f"Dear {name},\n\nThank you for your feedback. We sincerely apologize for the onboarding delay — this fell short of our 1-week commitment.\n\nWe are applying a 10% discount to your next invoice and assigning a dedicated CSM to your account.\n\nBest regards,\nCustomer Success Team"
                }),
            },
            "decision": "approved",
            "reason": "Discount approved by manager.",
        },
        {
            "rec": {
                "interaction_id": interaction_id,
                "rank": 1,
                "action_type": "schedule_meeting",
                "confidence": 82.0,
                "reasoning": "Low module adoption flagged in Q1 review. Focused training session reduces churn risk.",
                "evidence": json.dumps([
                    "Meeting notes: only 3 of 8 modules in use",
                    "Playbook CS-07: adoption < 40% triggers mandatory training outreach"
                ]),
                "execution_plan_type": "meeting",
                "execution_plan_content": json.dumps({
                    "objectives": ["Increase module adoption", "Address complexity concerns"],
                    "discussion_points": ["Walk through modules 4–8 with live examples"],
                    "suggested_questions": ["Which tasks are you doing manually that we could automate?"],
                    "important_issues": ["Only 3 modules adopted after 2 months"]
                }),
            },
            "decision": "approved",
            "reason": "Training approach approved. Calendar invite sent.",
        },
        {
            "rec": {
                "interaction_id": interaction_id,
                "rank": 1,
                "action_type": "reply_email",
                "confidence": 91.0,
                "reasoning": "Billing dispute requires immediate resolution per Pricing Playbook P-02.",
                "evidence": json.dumps([
                    "Customer email: discount not reflected on invoice",
                    "Pricing Playbook P-02: billing disputes must be resolved within 24 hours"
                ]),
                "execution_plan_type": "email",
                "execution_plan_content": json.dumps({
                    "subject": "Revised Invoice — Discount Applied",
                    "body": f"Dear {name},\n\nWe apologize for the oversight. The discount has now been applied. Please find the revised invoice in your billing portal.\n\nBest regards,\nCustomer Success Team"
                }),
            },
            "decision": "edited",
            "edited_content": "Revised invoice sent. VP of CS added a personal apology note.",
            "reason": "Manager added personal note to strengthen relationship.",
        },
        {
            "rec": {
                "interaction_id": interaction_id,
                "rank": 1,
                "action_type": "escalate",
                "confidence": 95.0,
                "reasoning": "API outage affecting live operations is a P1 incident per Escalation Playbook E-01.",
                "evidence": json.dumps([
                    "Customer email: API failing for 48 hours",
                    "Support ticket unresponded for 24 hours",
                    "Escalation Playbook E-01: P1 = engineering response within 2 hours"
                ]),
                "execution_plan_type": "email",
                "execution_plan_content": json.dumps({
                    "subject": "URGENT: API Issue Escalated to Engineering",
                    "body": f"Dear {name},\n\nWe have escalated your API issue as a Priority 1 incident. Our engineering team is actively working on a fix and will provide updates every 30 minutes. An SLA credit will be applied automatically.\n\nBest regards,\nCustomer Success Team"
                }),
            },
            "decision": "approved",
            "reason": "Escalation approved immediately.",
        },
        {
            "rec": {
                "interaction_id": interaction_id,
                "rank": 1,
                "action_type": "send_resources",
                "confidence": 79.0,
                "reasoning": "Team lead departure creates knowledge gap. Proactive resource sharing reduces adoption drop risk.",
                "evidence": json.dumps([
                    "Customer email: primary admin has left",
                    "Playbook CS-11: key contact departure triggers knowledge transfer protocol"
                ]),
                "execution_plan_type": "email",
                "execution_plan_content": json.dumps({
                    "subject": "Supporting Your Team Through This Transition",
                    "body": f"Dear {name},\n\nWe've prepared a Knowledge Transfer Package including admin setup guide, recorded training sessions, and a quick-start checklist. We'd also like to offer a free 1-hour onboarding call for your new admin.\n\nBest regards,\nCustomer Success Team"
                }),
            },
            "decision": "approved",
            "reason": "Resources sent. Onboarding call scheduled.",
        },
        {
            "rec": {
                "interaction_id": interaction_id,
                "rank": 1,
                "action_type": "schedule_meeting",
                "confidence": 93.0,
                "reasoning": "Competitor evaluation with renewal in 3 weeks. Executive retention meeting is highest-priority action.",
                "evidence": json.dumps([
                    "Customer email: evaluating 2 competitor solutions",
                    "Renewal in < 30 days",
                    "Retention Playbook CS-15: competitor evaluation + renewal < 30 days = immediate EBR"
                ]),
                "execution_plan_type": "meeting",
                "execution_plan_content": json.dumps({
                    "objectives": ["Address competitor evaluation concerns", "Present roadmap commitments", "Negotiate renewal"],
                    "discussion_points": ["API reliability improvements", "Onboarding support offering", "Pricing for seat expansion"],
                    "suggested_questions": ["What would make you confident enough to renew today?", "Which competitor features are most appealing?"],
                    "important_issues": ["3 unresolved concerns: API SLA, complexity, pricing"]
                }),
            },
            "decision": "approved",
            "reason": "EBR scheduled. VP of CS will attend.",
        },
        {
            "rec": {
                "interaction_id": interaction_id,
                "rank": 1,
                "action_type": "reply_email",
                "confidence": 85.0,
                "reasoning": "Duplicate billing complaint requires immediate refund confirmation to restore trust.",
                "evidence": json.dumps([
                    "Customer email: charged twice for subscription",
                    "Pricing Playbook P-02: billing errors must be resolved within 24 hours",
                    "Customer health score already low — trust is fragile"
                ]),
                "execution_plan_type": "email",
                "execution_plan_content": json.dumps({
                    "subject": "Re: Billing Issue — Refund Confirmed",
                    "body": f"Dear {name},\n\nWe sincerely apologize for the duplicate charge. This was caused by a payment gateway error. We have raised an immediate refund request — you will see it reflected in 3–5 business days.\n\nAs an apology, we are also applying 1 month free credit to your account.\n\nBest regards,\nCustomer Success Team"
                }),
            },
            "decision": "approved",
            "reason": "Refund raised. 1 month free credit applied.",
        },
    ]

    scenario = scenarios[idx % len(scenarios)]
    return scenario


# ── 4. Memory ─────────────────────────────────────────────

MEMORY_DATA = {
    "default": lambda cid, name, company, score: {
        "customer_id": cid,
        "summary": f"{name} from {company} has been a customer for approximately 6 months. Health score: {score}/100. Multiple issues including onboarding delay, billing dispute, and API outage. Currently evaluating competitors with renewal approaching.",
        "historical_context": json.dumps({
            "key_issues": [
                "Onboarding took 3 weeks vs promised 1 week (resolved with 10% discount)",
                "Invoice did not reflect discount (resolved)",
                "API outage lasted 48 hours — SLA credit applied",
                "Primary admin left the company",
                "Currently evaluating 2 competitor solutions"
            ],
            "approved_actions": [
                "Applied 10% discount after onboarding complaint",
                "Scheduled training sessions on modules 4–8",
                "Escalated API outage as P1 — resolved in 4 hours",
                "Sent knowledge transfer package after admin departure",
                "Scheduled Executive Business Review"
            ],
            "rejected_actions": [],
            "sentiment_trend": "Negative → Neutral → Positive → Negative",
            "renewal_risk": "HIGH",
            "last_updated": datetime.utcnow().isoformat()
        }),
        "timestamp": datetime.utcnow(),
    },
    "mahalaxmi1246@gmail.com": lambda cid, name, company, score: {
        "customer_id": cid,
        "summary": f"{name} runs a small marketing agency ({company}). Health score: {score}/100. Started enthusiastically, hit a duplicate billing issue that damaged trust. Loves the product but nervous about another billing error before renewal.",
        "historical_context": json.dumps({
            "key_issues": [
                "Duplicate billing charge — Rs. 4,999 charged twice (refund issued + 1 month free)",
                "Refund took longer than promised (10+ days), causing further frustration",
                "White-labeling feature requested but not yet available",
                "Renewal concern driven by billing trust, not product dissatisfaction"
            ],
            "approved_actions": [
                "Refund raised for duplicate charge",
                "1 month free credit applied as goodwill",
                "Welcome call completed — reporting module setup done"
            ],
            "rejected_actions": [],
            "sentiment_trend": "Positive → Positive → Negative (billing) → Neutral → Positive (team expansion) → Negative (renewal concern)",
            "upsell_signals": ["Requested 2 additional seats", "Referred a colleague to the platform"],
            "renewal_risk": "MEDIUM — product satisfaction high but billing trust issue unresolved",
            "last_updated": datetime.utcnow().isoformat()
        }),
        "timestamp": datetime.utcnow(),
    },
    "lasya1626@gmail.com": lambda cid, name, company, score: {
        "customer_id": cid,
        "summary": f"{name} runs a digital creative studio ({company}). Health score: {score}/100. Power user and advocate — even referred a colleague. Currently frustrated by an unresolved time tracking export bug affecting client invoicing.",
        "historical_context": json.dumps({
            "key_issues": [
                "Client portal login bug — fixed within 6 hours (well received)",
                "Time tracking CSV export producing corrupted files since last update",
                "Bug reported 10 days ago with no fix — escalation risk",
                "Mobile app repeatedly requested — not yet on roadmap"
            ],
            "approved_actions": [
                "Client portal bug escalated and fixed within 6 hours",
                "Onboarding meeting completed — team set up in 2 days"
            ],
            "rejected_actions": [],
            "sentiment_trend": "Positive → Positive → Negative (portal bug) → Positive (referral) → Negative (export bug)",
            "upsell_signals": ["Team growing", "Referred a colleague — strong brand advocate"],
            "renewal_risk": "LOW-MEDIUM — advocate customer but unresolved bug is now a cancellation trigger",
            "last_updated": datetime.utcnow().isoformat()
        }),
        "timestamp": datetime.utcnow(),
    },
}


# ── Main seeder ───────────────────────────────────────────

def seed():
    create_tables()
    db = SessionLocal()

    try:
        if db.query(Customer).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding customers...")
        created_customers = []
        for c in CUSTOMERS:
            customer = Customer(**c)
            db.add(customer)
            db.flush()
            created_customers.append(customer)
        db.commit()
        print(f"  ✓ {len(created_customers)} customers created")

        print("Seeding interactions...")
        total_interactions = 0
        all_completed_interactions = []

        for customer in created_customers:
            if customer.email == "mahalaxmi1246@gmail.com":
                interactions = get_interactions_mahalaxmi(customer.id)
            elif customer.email == "lasya1626@gmail.com":
                interactions = get_interactions_lasya(customer.id)
            else:
                interactions = get_interactions(customer.id, customer.company, customer.name)

            for interaction_data in interactions:
                interaction = Interaction(**interaction_data)
                db.add(interaction)
                db.flush()
                total_interactions += 1
                if interaction.status == "completed":
                    all_completed_interactions.append(interaction)

        db.commit()
        print(f"  ✓ {total_interactions} interactions created")

        print("Seeding recommendations and decisions...")
        decision_interactions = all_completed_interactions[:7]
        for idx, interaction in enumerate(decision_interactions):
            scenario = get_past_recommendations_and_decisions(
                interaction.id,
                interaction.customer.company,
                interaction.customer.name,
                idx
            )
            rec = Recommendation(**scenario["rec"])
            db.add(rec)
            db.flush()

            decision = Decision(
                recommendation_id=rec.id,
                decision=scenario["decision"],
                edited_content=scenario.get("edited_content"),
                reason=scenario.get("reason"),
                timestamp=interaction.timestamp + timedelta(hours=2),
            )
            db.add(decision)

        db.commit()
        print(f"  ✓ {len(decision_interactions)} decisions created")

        print("Seeding memory...")
        for customer in created_customers:
            mem_fn = MEMORY_DATA.get(customer.email, MEMORY_DATA["default"])
            mem_data = mem_fn(customer.id, customer.name, customer.company, customer.health_score)
            db.add(Memory(**mem_data))
        db.commit()
        print(f"  ✓ {len(created_customers)} memory records created")

        print("\n✅ Seeding complete!")
        print(f"   Customers     : {len(created_customers)}")
        print(f"   Interactions  : {total_interactions}")
        print(f"   Decisions     : {len(decision_interactions)}")
        print(f"   Memory records: {len(created_customers)}")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()