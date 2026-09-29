import os
from pydantic_settings import BaseSettings, SettingsConfigDict

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
root_env = os.path.join(project_root, ".env")

class Settings(BaseSettings):
    database_url: str = "sqlite:///./socialpulse.db"
    hindsight_base_url: str = "https://api.hindsight.vectorize.io"
    hindsight_api_key: str = ""
    model_config = SettingsConfigDict(env_file=(".env", root_env), extra="ignore")

settings = Settings()
