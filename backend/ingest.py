import sys
import os
import re

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pypdf import PdfReader
from rag.qdrant_store import ensure_collection, upsert_chunks, collection_count

PLAYBOOKS_DIR = os.path.join(os.path.dirname(__file__), "playbooks")

CHUNK_SIZE = 500        # tokens (approx characters / 4)
CHUNK_OVERLAP = 50      # overlap between chunks in tokens

# Map filename to doc_type tag for filtering in Qdrant
DOC_TYPE_MAP = {
    "retention_playbook.pdf": "retention",
    "pricing_playbook.pdf": "pricing",
    "onboarding_playbook.pdf": "onboarding",
    "faq.pdf": "faq",
    "escalation_playbook.pdf": "escalation",
}


def extract_text_from_pdf(filepath: str) -> str:
    """Extract all text from a PDF file."""
    reader = PdfReader(filepath)
    pages = []

    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())

    return "\n\n".join(pages)


def clean_text(text: str) -> str:
    """Remove excessive whitespace and normalize text."""
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
):
    """
    Split text into overlapping chunks by approximate token count.
    1 token ~ 4 characters (rough approximation).
    """

    char_size = chunk_size * 4
    char_overlap = overlap * 4

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + char_size

        # Try to end chunk at a sentence boundary
        if end < text_len:
            boundary = max(
                text.rfind(". ", start, end),
                text.rfind("\n", start, end),
            )

            if boundary > start + char_size // 2:
                end = boundary + 1

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start = end - char_overlap

        if start >= text_len:
            break

    return chunks


def ingest_all():
    print("=" * 50)
    print("XLVentures.AI - Playbook Ingestion")
    print("=" * 50)

    if not os.path.exists(PLAYBOOKS_DIR):
        print(f"ERROR: Playbooks directory not found: {PLAYBOOKS_DIR}")
        sys.exit(1)

    pdf_files = [
        f for f in os.listdir(PLAYBOOKS_DIR)
        if f.endswith(".pdf")
    ]

    if not pdf_files:
        print(f"ERROR: No PDF files found in {PLAYBOOKS_DIR}")
        sys.exit(1)

    print(f"\nFound {len(pdf_files)} PDF(s): {', '.join(pdf_files)}")

    print("\nEnsuring Qdrant collection exists...")
    ensure_collection()

    total_chunks = 0

    for filename in pdf_files:
        filepath = os.path.join(PLAYBOOKS_DIR, filename)
        doc_type = DOC_TYPE_MAP.get(filename, "general")

        print(f"\nProcessing: {filename} (doc_type={doc_type})")

        # Extract text
        raw_text = extract_text_from_pdf(filepath)
        cleaned = clean_text(raw_text)

        print(f"  Extracted {len(cleaned)} characters")

        # Chunk
        chunks = chunk_text(cleaned)

        print(f"  Split into {len(chunks)} chunks")

        # Build chunk objects
        chunk_objects = [
            {
                "text": chunk,
                "source_file": filename,
                "chunk_index": i,
                "doc_type": doc_type,
            }
            for i, chunk in enumerate(chunks)
        ]

        # Upsert into Qdrant
        upsert_chunks(chunk_objects)

        total_chunks += len(chunks)

    print(f"\n{'=' * 50}")
    print("Ingestion complete!")
    print(f"  PDFs processed : {len(pdf_files)}")
    print(f"  Total chunks   : {total_chunks}")
    print(f"  Qdrant count   : {collection_count()}")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    ingest_all()