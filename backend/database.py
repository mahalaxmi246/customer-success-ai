from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    Text, DateTime, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
from config.settings import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Tables ────────────────────────────────────────────────

class Customer(Base):
    __tablename__ = "customers"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    company      = Column(String, nullable=False)
    email        = Column(String, unique=True, nullable=False)
    health_score = Column(Float, default=100.0)
    renewal_date = Column(DateTime, nullable=True)

    interactions = relationship("Interaction", back_populates="customer")
    memories     = relationship("Memory", back_populates="customer")


class Interaction(Base):
    __tablename__ = "interactions"

    id                 = Column(Integer, primary_key=True, index=True)
    customer_id        = Column(Integer, ForeignKey("customers.id"), nullable=False)

    source             = Column(String, nullable=False)      # gmail | manual | zoom | slack | hubspot | salesforce
    created_by         = Column(String, nullable=False, default="system")  # system | manager

    interaction_type   = Column(String, nullable=False)      # Email | Meeting | Phone Call | Support Ticket | Slack Message
    title              = Column(String, nullable=True)
    content            = Column(Text, nullable=False)
    sentiment          = Column(String, nullable=True)
    intent             = Column(String, nullable=True)
    requested_outcome  = Column(Text, nullable=True)
    status             = Column(String, default="new")

    timestamp          = Column(DateTime, default=datetime.utcnow)
    updated_at         = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer           = relationship("Customer", back_populates="interactions")
    recommendations    = relationship("Recommendation", back_populates="interaction")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id                     = Column(Integer, primary_key=True, index=True)
    interaction_id         = Column(Integer, ForeignKey("interactions.id"), nullable=False)
    rank                   = Column(Integer, nullable=False)

    action_type            = Column(String, nullable=False)   # reply_email | schedule_meeting | escalate | send_resources

    confidence             = Column(Float, nullable=False)
    reasoning              = Column(Text, nullable=True)
    evidence               = Column(Text, nullable=True)
    execution_plan_type    = Column(String, nullable=True)
    execution_plan_content = Column(Text, nullable=True)

    timestamp              = Column(DateTime, default=datetime.utcnow)
    updated_at             = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    interaction = relationship("Interaction", back_populates="recommendations")
    decisions   = relationship("Decision", back_populates="recommendation")


class Decision(Base):
    __tablename__ = "decisions"

    id                = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=False)
    decision          = Column(String, nullable=False)   # approved | edited | rejected
    edited_content    = Column(Text, nullable=True)
    reason            = Column(Text, nullable=True)

    timestamp         = Column(DateTime, default=datetime.utcnow)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recommendation    = relationship("Recommendation", back_populates="decisions")


class Memory(Base):
    __tablename__ = "memory"

    id                 = Column(Integer, primary_key=True, index=True)
    customer_id        = Column(Integer, ForeignKey("customers.id"), nullable=False)
    summary            = Column(Text, nullable=True)
    historical_context = Column(Text, nullable=True)
    timestamp          = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="memories")


# ── Helpers ───────────────────────────────────────────────

def create_tables():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()