from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    CORS_ORIGIN: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")


settings = Settings()
