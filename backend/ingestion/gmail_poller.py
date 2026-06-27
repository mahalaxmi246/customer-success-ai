"""
gmail_poller.py - Polls Gmail inbox every 30 seconds for new emails
in the 'customer-support' label and stores them in the interactions table.

First run: opens browser for OAuth consent.
Subsequent runs: uses saved token.json automatically.
"""

import os
import sys
import base64
import json
from datetime import datetime, timezone
from email import message_from_bytes
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from database import SessionLocal, Customer, Interaction
from ingestion.normalizer import normalize_email
from config.settings import settings

# Scopes needed — read-only is enough
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

# We store last fetched time in a small JSON file to avoid re-processing
LAST_FETCHED_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    ".last_fetched.json"
)


# ── Auth ──────────────────────────────────────────────────

def get_gmail_service():
    """
    Handles OAuth flow. First run opens browser.
    token.json is saved for all future runs — no browser needed again.
    """
    creds = None
    token_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        settings.GMAIL_TOKEN_PATH
    )
    creds_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        settings.GMAIL_CREDENTIALS_PATH
    )

    # Load saved token if exists
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    # Refresh or re-authenticate
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(creds_path):
                raise FileNotFoundError(
                    f"credentials.json not found at {creds_path}. "
                    "Download it from Google Cloud Console."
                )
            flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
            creds = flow.run_local_server(port=0)

        # Save token for next run
        with open(token_path, "w") as f:
            f.write(creds.to_json())
        print("  token.json saved for future runs.")

    return build("gmail", "v1", credentials=creds)


# ── Timestamp tracking ────────────────────────────────────

def get_last_fetched_timestamp() -> Optional[int]:
    """Returns last fetched Unix timestamp in seconds, or None if first run."""
    if os.path.exists(LAST_FETCHED_FILE):
        with open(LAST_FETCHED_FILE, "r") as f:
            data = json.load(f)
            return data.get("last_fetched")
    return None


def save_last_fetched_timestamp(ts: int):
    """Save the current fetch timestamp so next run only gets newer emails."""
    with open(LAST_FETCHED_FILE, "w") as f:
        json.dump({"last_fetched": ts}, f)


# ── Email parsing ─────────────────────────────────────────

def get_email_body(msg_payload) -> str:
    """Recursively extract plain text body from Gmail message payload."""
    body = ""

    if msg_payload.get("mimeType") == "text/plain":
        data = msg_payload.get("body", {}).get("data", "")
        if data:
            body = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")

    elif msg_payload.get("mimeType", "").startswith("multipart"):
        for part in msg_payload.get("parts", []):
            body = get_email_body(part)
            if body:
                break

    return body


def parse_gmail_message(message: dict) -> dict:
    """Parse a raw Gmail API message into a clean dict."""
    payload  = message.get("payload", {})
    headers  = {h["name"].lower(): h["value"] for h in payload.get("headers", [])}

    subject     = headers.get("subject", "(No Subject)")
    from_header = headers.get("from", "")
    date_str    = headers.get("date", "")

    body = get_email_body(payload)

    # Gmail internalDate is milliseconds since epoch
    internal_date = int(message.get("internalDate", 0)) // 1000
    timestamp = datetime.fromtimestamp(internal_date, tz=timezone.utc).replace(tzinfo=None)

    return {
        "subject":     subject,
        "from_header": from_header,
        "body":        body,
        "timestamp":   timestamp,
        "internal_ts": internal_date,
    }


# ── Customer resolution ───────────────────────────────────

def resolve_or_create_customer(db, sender_name: str, sender_email: str) -> Customer:
    """
    Look up customer by email.
    If not found, auto-create a new customer record.
    This handles emails from unknown senders gracefully.
    """
    if not sender_email:
        sender_email = "unknown@unknown.com"

    customer = db.query(Customer).filter(
        Customer.email == sender_email
    ).first()

    if not customer:
        print(f"    New customer detected: {sender_email} — creating record.")
        customer = Customer(
            name=sender_name or sender_email.split("@")[0].title(),
            company=f"{sender_email.split('@')[1].split('.')[0].title()} (Auto-created)",
            email=sender_email,
            health_score=100.0,
            renewal_date=None,
        )
        db.add(customer)
        db.flush()

    return customer


# ── Main poll function ────────────────────────────────────

def poll_gmail():
    """
    Fetch new unread emails from the 'customer-support' Gmail label.
    Only fetches emails newer than last_fetched_timestamp.
    Stores each email as a new row in the interactions table.
    """
    print(f"[{datetime.utcnow().strftime('%H:%M:%S')}] Polling Gmail...")

    try:
        service = get_gmail_service()
    except FileNotFoundError as e:
        print(f"  ERROR: {e}")
        return
    except Exception as e:
        print(f"  Gmail auth error: {e}")
        return

    # Build query
    label    = settings.GMAIL_LABEL   # "customer-support"
    query    = f"label:{label} is:unread"
    last_ts  = get_last_fetched_timestamp()

    if last_ts:
        # Gmail query: after:<unix_timestamp>
        query += f" after:{last_ts}"
        print(f"  Fetching emails after timestamp: {last_ts}")
    else:
        print("  First run — fetching all unread emails in label.")

    # Fetch message list
    try:
        result = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=50
        ).execute()
    except Exception as e:
        print(f"  Gmail API error: {e}")
        return

    messages = result.get("messages", [])
    if not messages:
        print("  No new emails found.")
        return

    print(f"  Found {len(messages)} new email(s).")

    db = SessionLocal()
    new_count = 0
    latest_ts = last_ts or 0

    try:
        for msg_ref in messages:
            # Fetch full message
            msg = service.users().messages().get(
                userId="me",
                id=msg_ref["id"],
                format="full"
            ).execute()

            raw = parse_gmail_message(msg)
            normalized = normalize_email(raw)

            sender_email = normalized["sender_email"]
            sender_name  = normalized["sender_name"]

            # Skip if already stored (idempotency check)
            existing = db.query(Interaction).filter(
                Interaction.title   == normalized["title"],
                Interaction.source  == "gmail",
            ).first()

            # More specific: check by content prefix
            content_prefix = normalized["content"][:100]
            existing = db.query(Interaction).filter(
                Interaction.content.startswith(content_prefix),
                Interaction.source == "gmail"
            ).first()

            if existing:
                print(f"    Skipping duplicate: {normalized['title'][:50]}")
                continue

            # Resolve or create customer
            customer = resolve_or_create_customer(db, sender_name, sender_email)

            # Store interaction
            interaction = Interaction(
                customer_id      = customer.id,
                source           = normalized["source"],
                created_by       = normalized["created_by"],
                interaction_type = normalized["interaction_type"],
                title            = normalized["title"],
                content          = normalized["content"],
                sentiment        = normalized["sentiment"],
                intent           = normalized["intent"],
                requested_outcome= normalized["requested_outcome"],
                status           = normalized["status"],
                timestamp        = normalized["timestamp"],
            )
            db.add(interaction)
            new_count += 1

            print(f"    Stored: '{normalized['title'][:60]}' from {sender_email}")

            # Track latest timestamp
            if raw["internal_ts"] > latest_ts:
                latest_ts = raw["internal_ts"]

        db.commit()

        # Save updated timestamp so next poll only gets newer emails
        if latest_ts:
            save_last_fetched_timestamp(latest_ts)

        print(f"  Done. {new_count} new interaction(s) stored.")

    except Exception as e:
        db.rollback()
        print(f"  DB error: {e}")
        raise
    finally:
        db.close()


# ── Run standalone for testing ────────────────────────────

if __name__ == "__main__":
    print("Running Gmail poller in test mode...")
    print("This will open a browser for OAuth on first run.\n")
    poll_gmail()
    print("\nDone. Check your database for new interactions.")