"""Application configuration."""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "Astra"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # LLM
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    LLM_PRIMARY_MODEL: str = "llama-3.3-70b-versatile"
    LLM_FALLBACK_MODEL: str = "llama-3.1-8b-instant"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 2048
    LLM_TIMEOUT: int = 15

    # Alpha Vantage (optional — for data fallback)
    ALPHA_VANTAGE_KEY: str = os.getenv("ALPHA_VANTAGE_KEY", "")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./Astra.db")

    # Defaults
    DEFAULT_LOOKBACK: str = "2y"
    DEFAULT_TIMEFRAME: str = "1d"
    DEFAULT_CAPITAL_INR: float = 1_000_000
    DEFAULT_CAPITAL_USD: float = 100_000

    # Cache
    CACHE_TTL_SECONDS: int = 3600  # 1 hour


settings = Settings()
