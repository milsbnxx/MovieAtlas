from __future__ import annotations

import argparse
import json
from pathlib import Path

from .config import settings
from .database import get_connection, initialize_schema, upsert_films
from .wikipedia_parser import build_dataset


def export_json(records: list[dict], output_path: str = "docs/data/films.json") -> Path:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def run_pipeline(load_db: bool, export_site_json: bool, limit: int | None = None) -> list[dict]:
    records = [record.to_dict() for record in build_dataset(limit=limit)]

    if load_db:
        with get_connection(settings) as connection:
            initialize_schema(connection)
            upsert_films(connection, records)

    if export_site_json:
        export_json(records)

    return records


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Parse Wikipedia highest-grossing films data and load/export results."
    )
    parser.add_argument(
        "--load-db",
        action="store_true",
        help="Create schema and load parsed records into PostgreSQL.",
    )
    parser.add_argument(
        "--export-json",
        action="store_true",
        help="Export parsed records to docs/data/films.json for the frontend.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional limit for the number of films to enrich during development.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    records = run_pipeline(
        load_db=args.load_db,
        export_site_json=args.export_json,
        limit=args.limit,
    )
    print(f"Parsed {len(records)} films from {settings.wikipedia_source_url}")


if __name__ == "__main__":
    main()
