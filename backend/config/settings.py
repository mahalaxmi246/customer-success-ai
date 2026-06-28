from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Groq
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "playbooks"

    # Gmail
    GMAIL_CREDENTIALS_PATH: str = "credentials.json"
    GMAIL_TOKEN_PATH: str = "token.json"
    GMAIL_LABEL: str = "customer-support"
    GMAIL_POLL_INTERVAL: int = 30

    # App
    DATABASE_URL: str = "sqlite:///./nba_platform.db"
    CORS_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()