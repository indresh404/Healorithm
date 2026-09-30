# backend/app/core/config.py
import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Healorithm Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "healorithm-dev-secret-key-12345")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./healorithm.db")

settings = Settings()
