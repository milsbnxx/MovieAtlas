from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_HTML_PATH = PROJECT_ROOT / "data" / "raw_wikipedia.html"
SITE_JSON_PATH = PROJECT_ROOT / "docs" / "data" / "films.json"


@dataclass(frozen=True)
class Settings:
    postgres_host: str = os.getenv("POSTGRES_HOST", "localhost")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", "5432"))
    postgres_db: str = os.getenv("POSTGRES_DB", "highest_grossing_films")
    postgres_user: str = os.getenv("POSTGRES_USER", "postgres")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    wikipedia_source_url: str = os.getenv(
        "WIKIPEDIA_SOURCE_URL",
        "https://en.wikipedia.org/wiki/List_of_highest-grossing_films",
    )
    request_timeout: int = int(os.getenv("REQUEST_TIMEOUT", "30"))
    user_agent: str = os.getenv(
        "REQUEST_USER_AGENT",
        "DWV-HighestGrossingFilms/1.0 (educational project)",
    )
    raw_html_path: Path = RAW_HTML_PATH
    site_json_path: Path = SITE_JSON_PATH

    @property
    def postgres_dsn(self) -> str:
        return (
            f"host={self.postgres_host} "
            f"port={self.postgres_port} "
            f"dbname={self.postgres_db} "
            f"user={self.postgres_user} "
            f"password={self.postgres_password}"
        )


settings = Settings()
