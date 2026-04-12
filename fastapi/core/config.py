from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    CORS_ORIGIN: str = "http://localhost:3000"
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""
    LIVEKIT_URL: str = "ws://localhost:7880"

    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")


settings = Settings()
