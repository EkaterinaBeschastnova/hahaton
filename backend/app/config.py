from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "MyDom"
    database_url: str = "sqlite+aiosqlite:///./mydom.db"
    max_api_url: str = "https://platform-api2.max.ru"
    max_bot_token: str = ""
    webhook_secret: str = "change-me-please"
    jwt_secret: str = "change-this-in-production"
    mini_app_url: str = "https://moi-dom-max-katerina3255345.amvera.io"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
