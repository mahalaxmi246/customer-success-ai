"""
qdrant_store.py - Qdrant vector store client.
Handles embedding generation and similarity search.
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import uuid

from config.settings import settings

# Load embedding model once at module level (384-dim, fast, free)
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
VECTOR_SIZE = 384

_model = None
_client = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print("Loading embedding model...")
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT
        )
    return _client


def ensure_collection():
    """Create the Qdrant collection if it doesn't exist."""
    client = get_client()
    existing = [c.name for c in client.get_collections().collections]
    if settings.QDRANT_COLLECTION not in existing:
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )
        print(f"  Created Qdrant collection: {settings.QDRANT_COLLECTION}")
    else:
        print(f"  Collection '{settings.QDRANT_COLLECTION}' already exists.")


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts."""
    model = get_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()


def upsert_chunks(chunks: List[Dict[str, Any]]):
    """
    Upsert document chunks into Qdrant.
    Each chunk must have: text, source_file, chunk_index, doc_type
    """
    client = get_client()
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)

    points = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=embedding,
            payload={
                "text": chunk["text"],
                "source_file": chunk["source_file"],
                "chunk_index": chunk["chunk_index"],
                "doc_type": chunk["doc_type"],
            }
        ))

    # Upsert in batches of 100
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i:i + batch_size]
        client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=batch
        )

    print(f"  Upserted {len(points)} chunks into Qdrant.")


def search(query: str, top_k: int = 5, doc_type: str = None) -> List[Dict[str, Any]]:
    """
    Search for relevant chunks given a query string.
    Optionally filter by doc_type (e.g. 'retention', 'pricing').
    Returns list of {text, source_file, doc_type, score}
    """
    client = get_client()
    model = get_model()

    query_vector = model.encode([query])[0].tolist()

    search_filter = None
    if doc_type:
        search_filter = Filter(
            must=[FieldCondition(
                key="doc_type",
                match=MatchValue(value=doc_type)
            )]
        )

    results = client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=query_vector,
        limit=top_k,
        query_filter=search_filter,
        with_payload=True
    )

    return [
        {
            "text": r.payload["text"],
            "source_file": r.payload["source_file"],
            "doc_type": r.payload["doc_type"],
            "score": round(r.score, 4)
        }
        for r in results
    ]


def collection_count() -> int:
    """Return number of vectors stored in the collection."""
    client = get_client()
    info = client.get_collection(settings.QDRANT_COLLECTION)
    return info.points_count