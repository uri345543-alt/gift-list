import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/dbname"
    FRONTEND_URL: str = "http://localhost:5173"
    SECRET_KEY: str = "CHANGE_ME_SECRET_KEY_FOR_DEV"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
