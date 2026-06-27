"""
normalizer.py - Cleans and structures raw email data
into a standard format before storing in the DB.
"""

import re
from typing import Optional


def clean_email_body(body: str) -> str:
    """Remove quoted replies, signatures, and excessive whitespace."""

    # Remove quoted reply blocks (lines starting with >)
    lines = body.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('>'):
            continue
        cleaned_lines.append(line)
    body = '\n'.join(cleaned_lines)

    # Remove common signature patterns
    sig_patterns = [
        r'--\s*\n.*',                          # -- signature block
        r'Best regards.*',                      # Best regards...
        r'Thanks.*\n.*',                        # Thanks, Name
        r'Regards.*',                           # Regards
        r'Sent from my (iPhone|Android|Mail).*',
    ]
    for pattern in sig_patterns:
        body = re.sub(pattern, '', body, flags=re.IGNORECASE | re.DOTALL)

    # Remove excessive blank lines
    body = re.sub(r'\n{3,}', '\n\n', body)

    return body.strip()


def extract_sender_name(from_header: str) -> str:
    """
    Extract display name from email From header.
    e.g. 'John Doe <john@example.com>' -> 'John Doe'
         'john@example.com' -> 'john'
    """
    match = re.match(r'^"?([^"<]+)"?\s*<', from_header)
    if match:
        return match.group(1).strip()

    # Just an email address
    email_match = re.match(r'([^@]+)@', from_header)
    if email_match:
        return email_match.group(1).replace('.', ' ').title()

    return from_header.strip()


def extract_email_address(from_header: str) -> Optional[str]:
    """
    Extract email address from From header.
    e.g. 'John Doe <john@example.com>' -> 'john@example.com'
    """
    match = re.search(r'<([^>]+)>', from_header)
    if match:
        return match.group(1).strip().lower()

    # Plain email address
    plain = re.match(r'^[\w\.\+\-]+@[\w\.\-]+\.\w+$', from_header.strip())
    if plain:
        return from_header.strip().lower()

    return None


def normalize_email(raw: dict) -> dict:
    """
    Takes raw email dict with keys: subject, body, from_header, timestamp
    Returns normalized dict ready for DB insertion.
    """
    from_header  = raw.get("from_header", "")
    subject      = raw.get("subject", "(No Subject)").strip()
    body         = raw.get("body", "")
    timestamp    = raw.get("timestamp")

    sender_name  = extract_sender_name(from_header)
    sender_email = extract_email_address(from_header)
    cleaned_body = clean_email_body(body)

    # Build a readable content field combining subject + body
    content = f"Subject: {subject}\n\n{cleaned_body}"

    return {
        "sender_name":   sender_name,
        "sender_email":  sender_email,
        "title":         subject,
        "content":       content,
        "raw_body":      cleaned_body,
        "timestamp":     timestamp,
        # These are defaults — agents will refine them later
        "source":            "gmail",
        "created_by":        "system",
        "interaction_type":  "Email",
        "sentiment":         None,
        "intent":            None,
        "requested_outcome": None,
        "status":            "new",
    }