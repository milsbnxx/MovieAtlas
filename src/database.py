from __future__ import annotations

from pathlib import Path
from typing import Iterable

import psycopg

from .config import settings


SCHEMA_PATH = Path(__file__).resolve().parent.parent / "db" / "schema.sql"


def get_connection(_settings=settings) -> psycopg.Connection:
    return psycopg.connect(_settings.postgres_dsn)


def initialize_schema(connection: psycopg.Connection) -> None:
    with SCHEMA_PATH.open("r", encoding="utf-8") as schema_file:
        connection.execute(schema_file.read())
    connection.commit()


def upsert_films(connection: psycopg.Connection, films: Iterable[dict]) -> int:
    rows = [
        (
            film["title"],
            film["release_year"],
            film["director"],
            film["box_office_text"],
            film["box_office_value"],
            film["country"],
            film["source_rank"],
            film["wikipedia_url"],
        )
        for film in films
    ]

    if not rows:
        return 0

    with connection.cursor() as cursor:
        cursor.executemany(
            """
            INSERT INTO films (
                title,
                release_year,
                director,
                box_office_text,
                box_office_value,
                country,
                source_rank,
                wikipedia_url
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (title, release_year) DO UPDATE
            SET
                release_year = EXCLUDED.release_year,
                director = EXCLUDED.director,
                box_office_text = EXCLUDED.box_office_text,
                box_office_value = EXCLUDED.box_office_value,
                country = EXCLUDED.country,
                source_rank = EXCLUDED.source_rank,
                wikipedia_url = EXCLUDED.wikipedia_url,
                updated_at = NOW()
            """,
            rows,
        )
    connection.commit()
    return len(rows)
