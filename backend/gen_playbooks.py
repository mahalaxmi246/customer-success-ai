from fpdf import FPDF
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "playbooks")
os.makedirs(OUT, exist_ok=True)

def make_pdf(filename, title, sections):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(26, 86, 219)
    pdf.multi_cell(0, 10, title, align="C")
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, "XLVentures.AI | Customer Success Platform | Internal Use Only", align="C")
    pdf.ln(8)
    for heading, body in sections:
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(26, 86, 219)
        pdf.set_fill_color(235, 240, 255)
        pdf.cell(0, 8, f"  {heading}", fill=True, ln=True)
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(55, 65, 81)
        pdf.multi_cell(0, 6, body)
        pdf.ln(4)
    pdf.output(f"{OUT}/{filename}")
    print(f"  created: {filename}")

# ── 1. RETENTION PLAYBOOK ────────────────────────────────────────────────────
make_pdf("retention_playbook.pdf", "Customer Retention Playbook v3.2", [

("1. Purpose and Scope",
"""This playbook governs all retention actions taken by Customer Success Managers (CSMs) at XLVentures.AI. It applies to all B2B SaaS accounts regardless of plan tier. The goal is to reduce churn, improve Net Revenue Retention (NRR), and ensure every at-risk customer receives a structured, timely response.

All CSMs must follow this playbook when an interaction is classified as a Renewal Concern or Cancellation Risk. Deviations require VP of Customer Success approval."""),

("2. Health Score Definitions",
"""XLVentures.AI uses a 0-100 health score updated weekly based on product usage, support ticket volume, billing compliance, and engagement frequency.

  Score 80-100 : HEALTHY - standard quarterly check-in cadence
  Score 60-79  : WATCH   - increase touchpoints to monthly
  Score 40-59  : AT-RISK - immediate CSM outreach required within 5 business days
  Score 0-39   : CRITICAL - escalate to Senior CSM + VP within 48 hours

Health scores below 40 combined with a renewal date within 30 days automatically trigger Rule CS-15: Executive Business Review (EBR) protocol."""),

("3. Churn Signal Classification",
"""CSMs must classify every at-risk interaction into one of three churn signal tiers:

TIER 1 - LOW SIGNAL
  Signals: Single complaint resolved, feature request not yet on roadmap, minor billing question.
  Action: Reply within 24 hours. Log interaction. No escalation required.

TIER 2 - MEDIUM SIGNAL
  Signals: Two or more unresolved complaints, usage drop > 30% in 30 days, team lead departure, negative NPS response.
  Action: CSM outreach within 48 hours. Schedule a check-in call. Update health score manually.

TIER 3 - HIGH SIGNAL (Cancellation Risk)
  Signals: Explicit competitor mention, renewal non-commitment, usage drop > 50%, executive escalation request.
  Action: Initiate EBR within 48 hours. Involve VP of Customer Success. Prepare retention offer."""),

("4. Rule CS-03 - Onboarding Delay Response",
"""Trigger: Customer reports that onboarding took longer than the committed SLA (standard SLA is 7 business days).

Required actions within 24 hours:
  1. Send written apology acknowledging the delay.
  2. Identify root cause (internal delay, data migration issue, customer-side delay).
  3. If delay was caused by XLVentures.AI: offer 10-15% discount on next invoice or 1 month free.
  4. Assign dedicated CSM for 60-day monitoring period.
  5. Log in CRM with tag: ONBOARDING_DELAY.

Do not dismiss the complaint without a goodwill offer if the delay exceeded 5 business days and was caused internally."""),

("5. Rule CS-07 - Low Module Adoption",
"""Trigger: Customer using fewer than 50% of contracted modules after 60 days of onboarding.

Required actions:
  1. Schedule a Product Adoption Review call within 5 business days.
  2. Identify which modules are unused and understand barriers.
  3. Assign a training session for unused modules - minimum 2 sessions.
  4. Send post-session resource pack (guides, video walkthroughs, use case examples).
  5. Set 30-day adoption target with the customer.
  6. If adoption does not improve after 30 days: escalate to Tier 2 churn signal.

Note: Customers using fewer than 3 modules after 90 days are 3x more likely to churn at renewal."""),

("6. Rule CS-11 - Key Contact Departure",
"""Trigger: Customer notifies CSM that their primary point of contact or platform administrator has left the company.

Required actions within 48 hours:
  1. Send a Knowledge Transfer Package: admin setup guide, recorded training sessions, quick-start checklist.
  2. Offer a free 1-hour onboarding call for the new administrator.
  3. Request the name and email of the new primary contact within 5 business days.
  4. Update CRM contact records immediately.
  5. Increase check-in frequency to bi-weekly for 60 days.
  6. Flag account as TRANSITION_RISK in the health dashboard.

Rationale: Accounts that lose their primary platform champion within 6 months of onboarding have a 47% higher churn rate at next renewal (XLVentures.AI internal data, 2025)."""),

("7. Rule CS-15 - Executive Business Review (EBR) Protocol",
"""Trigger: Health score < 40 AND renewal date < 30 days AND any Tier 3 churn signal present. Also triggered when customer explicitly mentions competitor evaluation.

EBR must be scheduled within 48 hours of trigger. VP of Customer Success must attend.

EBR agenda must include:
  1. Value delivered summary: ROI achieved, modules adopted, support tickets resolved.
  2. Acknowledgement of all outstanding complaints with resolution commitments.
  3. Product roadmap preview: share upcoming features relevant to customer's stated needs.
  4. Commercial options: renewal discount (up to 20%), payment flexibility, additional seats pricing.
  5. Clear ask: request renewal commitment or specific objections to be addressed.

Post-EBR actions:
  - Send written summary within 24 hours of the call.
  - If customer commits: process renewal, send confirmation, set success milestones.
  - If customer is still undecided: schedule a 72-hour follow-up call.
  - If customer churns: initiate exit interview and churn analysis report."""),

("8. Competitor Evaluation Response",
"""When a customer mentions they are evaluating a competitor, do not minimize or ignore the concern.

Recommended response framework (ACE):
  A - Acknowledge: Thank them for being transparent. Do not be defensive.
  C - Clarify: Ask which specific gaps are driving the evaluation. Listen fully before responding.
  E - Evidence: Present specific examples of value delivered to their account. Reference usage data and resolved issues.

Do not:
  - Disparage the competitor by name.
  - Make promises that cannot be committed to in writing.
  - Pressure the customer with urgency tactics.

If the customer names a specific competitor feature as a blocker, escalate to Product team within 24 hours with the customer feedback tagged."""),

("9. Retention Offers - Approval Matrix",
"""CSMs may offer the following without additional approval:
  - 10% discount on renewal invoice
  - 1 month free credit
  - Free training sessions (up to 3)
  - Extended payment terms (net-60 instead of net-30)

Senior CSM approval required for:
  - 11-20% renewal discount
  - 2 months free credit
  - Custom SLA commitments

VP of Customer Success approval required for:
  - Discounts > 20%
  - Contract restructuring
  - Commitments on unshipped product features"""),
])

# ── 2. PRICING PLAYBOOK ──────────────────────────────────────────────────────
make_pdf("pricing_playbook.pdf", "Pricing & Billing Policies v2.1", [

("1. Plan Overview",
"""XLVentures.AI Customer Success Platform is offered in three tiers:

STARTER PLAN
  - Up to 5 seats
  - Core modules: Project Management, Email Integration, Basic Reporting
  - Support: Email only (response within 48 hours)
  - Price: Rs. 2,999/month or Rs. 29,990/year (2 months free)

GROWTH PLAN
  - Up to 20 seats
  - All Starter modules + Advanced Analytics, Client Portal, Time Tracking
  - Support: Email + Chat (response within 24 hours)
  - Dedicated CSM assigned at 10+ seats
  - Price: Rs. 6,999/month or Rs. 69,990/year

ENTERPRISE PLAN
  - Unlimited seats
  - All modules including API Access, Custom Integrations, White-labeling
  - Support: Priority (response within 4 hours) + Dedicated CSM + Quarterly EBR
  - Custom SLA agreement
  - Price: Custom quote (starting Rs. 15,000/month)"""),

("2. Additional Seats Pricing",
"""Additional seats can be purchased mid-contract and are prorated to the remaining contract term.

Starter Plan: Rs. 599/seat/month per additional seat
Growth Plan: Rs. 399/seat/month per additional seat (volume discount built in)
Enterprise Plan: Negotiated - CSM must involve Account Executive for pricing

Bulk seat discounts:
  - 5-9 additional seats: 5% discount
  - 10-19 additional seats: 10% discount
  - 20+ additional seats: 15% discount + must involve AE

All seat expansion requests must be quoted within 4 hours of receipt (Rule P-05). Delays in quoting seat expansions are associated with a 23% reduction in upsell conversion."""),

("3. Rule P-02 - Billing Dispute Resolution",
"""Trigger: Customer reports an incorrect charge, duplicate charge, or missing discount on invoice.

Required actions:
  1. Acknowledge the dispute within 4 hours of receipt.
  2. Verify the claim against billing records within 24 hours.
  3. If dispute is valid: issue revised invoice and confirm refund timeline (standard: 5-7 business days).
  4. If refund is delayed beyond 7 business days: proactively notify customer and apply a 1-month credit as compensation.
  5. Log dispute in billing system with root cause tag.

Refund escalation:
  - Refunds up to Rs. 10,000: CSM can approve and process.
  - Refunds Rs. 10,001-50,000: Finance Manager approval required within 24 hours.
  - Refunds above Rs. 50,000: VP Finance approval required.

Do not ask customers to wait more than 7 business days for a refund without proactive communication and compensation."""),

("4. Rule P-05 - Seat Expansion Response SLA",
"""All seat expansion or plan upgrade requests must receive a formal quote within 4 hours during business hours (9 AM-6 PM IST, Monday-Friday).

If the request arrives outside business hours, the quote must be sent by 10 AM the next business day.

The quote email must include:
  - Itemized pricing for requested seats
  - Available bundle or upgrade options
  - Any applicable loyalty or volume discounts
  - A clear call to action (reply to confirm, or book a call)

A delayed response to seat expansion requests is one of the highest-value revenue leakage points identified in XLVentures.AI's 2025 revenue audit."""),

("5. Renewal Pricing Policy",
"""Standard renewal is at the same price as the previous contract term unless:
  - A discount was applied to the original contract (discount does not automatically renew)
  - The customer requests renegotiation
  - The account health score is below 60 (retention pricing may be offered)

Renewal discounts available without approval: up to 10%
Renewal discounts requiring Senior CSM approval: 11-20%
Renewal discounts requiring VP approval: above 20%

Early renewal incentive: Customers who renew more than 30 days before expiry receive an additional 5% discount.

Annual renewals are preferred over monthly. CSMs should actively convert monthly plan customers to annual during renewal discussions."""),

("6. Payment Terms",
"""Standard payment terms: Net-30 from invoice date.

Extended terms available:
  - Net-45: Available on request, no approval needed for Growth/Enterprise plans.
  - Net-60: Senior CSM approval required.
  - Net-90 or quarterly billing: VP Finance approval required.

Overdue invoices:
  - 15 days overdue: Automated reminder sent.
  - 30 days overdue: CSM must make direct contact.
  - 45 days overdue: Platform access may be suspended (warning must be given 7 days in advance).
  - 60 days overdue: Escalate to Collections. CSM to maintain relationship contact independently."""),
])

# ── 3. ONBOARDING PLAYBOOK ───────────────────────────────────────────────────
make_pdf("onboarding_playbook.pdf", "Customer Onboarding Guide v4.0", [

("1. Onboarding Philosophy",
"""At XLVentures.AI, we define onboarding success as the moment a customer achieves their first meaningful outcome using our platform - not the moment they complete account setup.

Our onboarding SLA commitment to customers:
  - Account setup and access: within 24 hours of contract signing
  - Initial onboarding call: within 3 business days
  - Full onboarding completion (all contracted modules configured): within 7 business days
  - First value milestone (customer reports measurable outcome): within 30 days

Any onboarding that exceeds 7 business days due to XLVentures.AI delays must be escalated to the Customer Success Lead and compensated per Rule CS-03."""),

("2. Onboarding Stages",
"""STAGE 1 - ACCOUNT ACTIVATION (Day 0-1)
  - Customer receives login credentials via automated email within 2 hours of contract signing.
  - CSM sends welcome email introducing themselves and attaching the Getting Started Guide.
  - Admin account configured with correct permissions.

STAGE 2 - KICKOFF CALL (Day 1-3)
  - 45-minute video call with customer's primary contact and technical lead.
  - Agenda: introductions, understanding primary use case, walking through the platform UI, setting 30-day goals.
  - CSM documents customer's top 3 success metrics.

STAGE 3 - CONFIGURATION (Day 3-7)
  - CSM assists with: data import, team member invitations, module configuration, integration setup.
  - Customer completes the Onboarding Checklist (shared via platform).
  - Any integration failures or data migration issues must be resolved within 24 hours with engineering support.

STAGE 4 - TRAINING (Day 7-14)
  - Minimum 2 live training sessions for each contracted module.
  - Sessions must be recorded and shared within 24 hours.
  - Customer's team must achieve > 70% training completion before Stage 4 is marked complete.

STAGE 5 - FIRST VALUE MILESTONE (Day 14-30)
  - CSM schedules a 30-day check-in to review adoption and confirm first outcome achieved.
  - If no milestone achieved by Day 30: flag as LOW_ADOPTION and initiate CS-07 protocol."""),

("3. Common Onboarding Issues and Resolutions",
"""ISSUE: Data migration taking longer than expected
  Resolution: Assign a dedicated data engineer within 24 hours. Provide daily status updates to customer. Offer temporary manual workaround if delay exceeds 3 days.

ISSUE: Team members not completing training
  Resolution: Send direct reminders to team members (not just the admin). Offer short 15-minute module-specific sessions. Provide self-paced video alternatives.

ISSUE: Integration with customer's existing tools failing
  Resolution: Escalate to engineering within 4 hours. CSM must be present on the resolution call. Document the integration requirement for the product roadmap.

ISSUE: Customer not responsive during onboarding
  Resolution: Attempt contact via email, phone, and Slack (if applicable). After 3 attempts in 5 days with no response, flag as AT_RISK_ONBOARDING and involve their executive sponsor."""),

("4. Module Adoption Targets",
"""The following adoption benchmarks should be achieved by the end of onboarding:

By Day 30:
  - At least 3 core modules actively used by > 50% of the team
  - Admin has configured all integrations
  - At least 1 report or dashboard created

By Day 60:
  - At least 5 modules in active use
  - Team training completion > 70%
  - Customer has achieved at least 1 stated success metric

By Day 90:
  - All contracted modules in use
  - Customer can operate the platform independently
  - NPS survey completed (target score > 7)"""),

("5. Onboarding Handoff to CSM",
"""Once onboarding is complete (all 5 stages marked done), the Implementation Manager hands off the account to the assigned CSM.

Handoff package must include:
  - Customer's top 3 success metrics
  - Modules configured and adoption status
  - Any outstanding issues or concerns raised during onboarding
  - Integration status
  - Suggested cadence for ongoing check-ins
  - Any goodwill gestures or discounts offered during onboarding

The CSM schedules a 60-day check-in within 1 week of handoff receipt."""),
])

# ── 4. FAQ DOCUMENT ──────────────────────────────────────────────────────────
make_pdf("faq.pdf", "Customer FAQ - XLVentures.AI Platform", [

("General Questions",
"""Q: What is the XLVentures.AI Customer Success Platform?
A: It is an AI-powered B2B SaaS platform that helps businesses manage projects, track customer success, generate reports, and streamline team collaboration. The platform is built around intelligent workflows and integrates with commonly used business tools.

Q: Who is the platform designed for?
A: The platform is designed for small to mid-sized B2B businesses, agencies, and SaaS companies. It is particularly well suited for Customer Success teams, Project Managers, and Operations leads.

Q: Is there a free trial available?
A: Yes. We offer a 14-day free trial of the Growth Plan with no credit card required. After the trial, customers can choose any plan or discontinue without charge.

Q: What languages does the platform support?
A: The platform interface is currently available in English. Multi-language support is on the roadmap for Q3 2026."""),

("Billing and Payments",
"""Q: What payment methods do you accept?
A: We accept credit/debit cards (Visa, Mastercard, RuPay), UPI, NEFT/RTGS bank transfers, and invoice-based billing for annual enterprise contracts.

Q: Can I change my plan mid-contract?
A: Yes. You can upgrade at any time - the price difference is prorated for the remaining contract term. Downgrades take effect at the next renewal date.

Q: What happens if my payment fails?
A: You will receive an automated notification. We provide a 7-day grace period to update payment details before any access restrictions are applied.

Q: I was charged incorrectly. What should I do?
A: Contact your CSM or email billing@xlventures.ai immediately. Billing disputes are resolved within 24 hours and refunds are processed within 5-7 business days per our billing policy (Rule P-02).

Q: Can I get an invoice in GST format?
A: Yes. All invoices include GSTIN details. If you require a specific format for your accounts team, contact billing@xlventures.ai."""),

("Technical and Integrations",
"""Q: What integrations does the platform support?
A: Current native integrations: Gmail, Google Calendar, Slack (read-only), Zapier, and REST API access (Growth and Enterprise plans). Salesforce and HubSpot integrations are in beta for Enterprise customers.

Q: Is there a mobile app?
A: A mobile app is currently in development and is targeted for release in Q4 2026. In the meantime, the web platform is mobile-responsive and works well on smartphones.

Q: What is the platform uptime SLA?
A: We guarantee 99.9% uptime per month for Growth and Enterprise plans. In the event of downtime exceeding the SLA, affected customers receive an automatic SLA credit of 1 day per hour of excess downtime, up to 30 days per billing cycle.

Q: How is customer data protected?
A: All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We are SOC 2 Type II compliant. Customer data is stored in ISO 27001-certified data centers. We do not share or sell customer data.

Q: Can I export my data if I cancel?
A: Yes. You have 30 days after cancellation to export all your data in CSV and JSON formats. After 30 days, data is permanently deleted per our data retention policy."""),

("Features",
"""Q: What modules are included in my plan?
A: See the Pricing Policy document for a full module breakdown by plan. Your CSM can provide a detailed list of contracted modules.

Q: Can I white-label the platform for my clients?
A: White-labeling (custom branding, domain, and logo on client-facing views) is available on the Enterprise plan only. Contact your CSM for setup details.

Q: Is bulk export of reports available?
A: CSV export of individual reports is available on all plans. Bulk export (multiple reports/datasets at once) is available on Growth and Enterprise plans. API-based data export is available on Enterprise.

Q: Can I set different permission levels for team members?
A: Yes. The platform supports role-based access control (RBAC) with the following roles: Admin, Manager, Contributor, and Viewer. Custom roles are available on Enterprise plans."""),

("Support",
"""Q: How do I contact support?
A: Starter Plan: Email support at support@xlventures.ai (response within 48 hours).
   Growth Plan: Email + live chat (response within 24 hours).
   Enterprise Plan: Priority email + live chat + dedicated CSM (response within 4 hours).

Q: What are support hours?
A: Standard support: Monday-Friday, 9 AM-6 PM IST.
   Enterprise priority support: Monday-Saturday, 8 AM-8 PM IST.
   Emergency escalations (P1 incidents): 24/7 via the emergency escalation email escalation@xlventures.ai.

Q: How do I raise a P1 (critical) incident?
A: Email escalation@xlventures.ai with subject line "P1 INCIDENT - [Company Name]". Response guaranteed within 2 hours. A dedicated engineer will be assigned within 4 hours."""),
])

# ── 5. ESCALATION PLAYBOOK ───────────────────────────────────────────────────
make_pdf("escalation_playbook.pdf", "Escalation & Incident Response Playbook v2.0", [

("1. Escalation Philosophy",
"""At XLVentures.AI, we treat every escalation as an opportunity to demonstrate our commitment to customer success. Fast, transparent, and accountable escalation handling is a core differentiator.

Escalation does not signal failure - ignoring a customer's escalation signal does.

Every CSM is empowered to escalate any issue to engineering, product, or leadership without requiring manager approval. The only expectation is that the customer is kept informed at every step."""),

("2. Incident Priority Classification",
"""P1 - CRITICAL (Response: 2 hours, Resolution: 4 hours)
  Definition: Platform completely unavailable, data loss occurring, API entirely non-functional, security breach.
  Action: Immediate engineering escalation. CEO and VP Engineering notified. Customer updated every 30 minutes.

P2 - HIGH (Response: 4 hours, Resolution: 8 hours)
  Definition: Core feature broken (reports not generating, login issues for multiple users, integration failure affecting operations).
  Action: Senior engineer assigned. Customer updated every 2 hours. CSM must be present on resolution call.

P3 - MEDIUM (Response: 8 hours, Resolution: 48 hours)
  Definition: Non-core feature broken, performance degradation, intermittent errors.
  Action: Engineering ticket raised with high priority. Customer updated within 8 hours.

P4 - LOW (Response: 24 hours, Resolution: 7 days)
  Definition: Minor UI bugs, feature requests, documentation errors.
  Action: Standard engineering backlog. Customer notified of expected resolution timeline."""),

("3. Rule E-01 - API Incident Response",
"""Trigger: Customer reports that the XLVentures.AI API is failing or returning errors affecting their operations.

Immediate actions (within 2 hours):
  1. Verify the issue: check API status dashboard and attempt to reproduce.
  2. Classify priority: if customer operations are impacted, classify as minimum P2.
  3. Escalate to engineering team with full details: error codes, customer ID, affected endpoints, timestamp.
  4. Send acknowledgement email to customer within 2 hours: confirm receipt, share priority classification, commit to next update.
  5. Update API status page if outage is confirmed.

Communication cadence during incident:
  - P1: Customer update every 30 minutes.
  - P2: Customer update every 2 hours.
  - Updates must include: current status, steps taken, next expected update time.

Post-resolution (within 24 hours):
  1. Send post-mortem summary to customer: root cause, fix applied, prevention measures.
  2. Apply SLA credit automatically based on downtime duration.
  3. Schedule a 15-minute debrief call if customer requests."""),

("4. SLA Credit Policy",
"""SLA credits are applied automatically when our uptime SLA is breached. Customers do not need to request credits.

Credit schedule (per billing cycle):
  - 99.5-99.9% uptime achieved: No credit (within SLA)
  - 99.0-99.49% uptime: 5% credit on monthly invoice
  - 95.0-98.99% uptime: 10% credit on monthly invoice
  - Below 95% uptime: 25% credit on monthly invoice

Maximum credit per billing cycle: 30 days of service.

Credits appear on the next invoice automatically. If a customer requests a cash refund instead of credit, Finance Manager approval is required."""),

("5. Customer Escalation Handling - Emotional Customers",
"""When a customer is upset or escalating emotionally, follow the HEAR framework:

H - Hear: Let the customer express their frustration fully without interrupting.
E - Empathize: Acknowledge their frustration explicitly. Example: 'I completely understand how disruptive this has been for your team and I take full responsibility for ensuring this gets resolved.'
A - Act: Tell them exactly what you are doing right now. Not what you will do later - what you are doing in this moment.
R - Resolve & Reconnect: After resolution, schedule a follow-up call within 48 hours to confirm the customer is satisfied and rebuild trust.

Never:
  - Put an upset customer on hold without explaining why and for how long.
  - Transfer an upset customer without a warm handoff.
  - Send a template response to a P1 incident without personalization."""),

("6. Escalation Path",
"""Standard escalation path for customer-facing issues:

CSM
  -> Senior CSM (if issue unresolved in 24 hours or customer requests escalation)
  -> Customer Success Lead (if unresolved in 48 hours or customer is Tier 1 account)
  -> VP of Customer Success (if unresolved in 72 hours, renewal at risk, or customer mentions legal action)
  -> CEO (if customer threatens public disclosure or legal action)

For technical issues:
CSM
  -> Engineering Support (Tier 1) - P3/P4 issues
  -> Senior Engineer (Tier 2) - P2 issues
  -> Engineering Lead + VP Engineering - P1 issues

CSMs must never tell customers that an issue is 'the engineering team's problem.' The CSM owns the customer relationship and is responsible for keeping the customer informed regardless of which internal team is working on the fix."""),

("7. Post-Escalation Account Recovery",
"""After any P1 or P2 incident, or any escalation involving emotional distress, the CSM must initiate an Account Recovery plan within 5 business days.

Recovery plan must include:
  1. A written apology from the VP of Customer Success (template available on internal wiki).
  2. An SLA credit or goodwill offer proportional to the impact.
  3. A revised account health assessment.
  4. A 30-day check-in schedule (weekly calls for 4 weeks).
  5. An internal root cause review to prevent recurrence.

Accounts that receive a successful Account Recovery experience have a 68% higher renewal rate than accounts that received no recovery outreach (XLVentures.AI internal data, 2025)."""),
])

print("\nAll 5 playbook PDFs created successfully.")