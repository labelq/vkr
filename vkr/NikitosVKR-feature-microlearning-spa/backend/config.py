from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/puc_learning"
    secret_key: str = "change-me-in-production-super-secret-key-32chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    pass_threshold: int = 75
    cookie_secure: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
