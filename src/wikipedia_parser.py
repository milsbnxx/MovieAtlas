from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from typing import Any

import requests
from bs4 import BeautifulSoup

from .config import settings


TITLE_CLEAN_RE = re.compile(r"\[[^\]]+\]")
YEAR_RE = re.compile(r"(19|20)\d{2}")


@dataclass
class FilmRecord:
    source_rank: int
    title: str
    release_year: int | None
    director: str
    country: str
    box_office_text: str
    box_office_value: int | None
    wikipedia_url: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def fetch_html(save_copy: bool = True) -> str:
    response = requests.get(
        settings.wikipedia_source_url,
        timeout=settings.request_timeout,
        headers={"User-Agent": "DWV assignment project bot/1.0"},
    )
    response.raise_for_status()
    html = response.text
    if save_copy:
        settings.raw_html_path.parent.mkdir(parents=True, exist_ok=True)
        settings.raw_html_path.write_text(html, encoding="utf-8")
    return html


def load_html() -> str:
    if settings.raw_html_path.exists():
        return settings.raw_html_path.read_text(encoding="utf-8")
    return fetch_html(save_copy=True)


def parse_highest_grossing_table(html: str) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", class_="wikitable")
    if table is None:
        raise ValueError("Could not find the highest-grossing films table on the page.")

    rows = table.find_all("tr")
    records: list[dict[str, Any]] = []

    for row in rows[1:]:
        cells = row.find_all(["td", "th"])
        if len(cells) < 5:
            continue

        cell_texts = [" ".join(cell.stripped_strings) for cell in cells]

        rank_cell = cells[0]
        title_cell = cells[2] if len(cells) >= 3 else None
        gross_cell = cells[3] if len(cells) >= 4 else None
        year_cell = cells[4] if len(cells) >= 5 else None

        if title_cell is None or gross_cell is None or year_cell is None:
            continue

        release_year = _parse_year(" ".join(year_cell.stripped_strings))
        gross_text = " ".join(gross_cell.stripped_strings)
        title = _extract_title(title_cell)
        source_rank = _parse_int(" ".join(rank_cell.stripped_strings))
        wikipedia_url = _extract_relative_link(title_cell)

        if not title or source_rank is None:
            continue

        records.append(
            {
                "source_rank": source_rank,
                "title": title,
                "release_year": release_year,
                "box_office_text": _clean_box_office_display(gross_text),
                "box_office_value": _parse_box_office(gross_text),
                "wikipedia_url": wikipedia_url,
            }
        )

    return records


def enrich_record(record: dict[str, Any], session: requests.Session | None = None) -> FilmRecord:
    client = session or requests.Session()
    url = record["wikipedia_url"]
    director = "Unknown"
    country = "Unknown"

    if url:
        response = client.get(
            url,
            timeout=settings.request_timeout,
            headers={"User-Agent": "DWV assignment project bot/1.0"},
        )
        response.raise_for_status()
        detail_soup = BeautifulSoup(response.text, "html.parser")
        infobox = detail_soup.find("table", class_=lambda value: value and "infobox" in value)
        if infobox is not None:
            director = _extract_infobox_value(infobox, {"Directed by", "Director", "Directed by "}) or director
            country = _extract_infobox_value(infobox, {"Country", "Countries"}) or country

    return FilmRecord(
        source_rank=record["source_rank"],
        title=record["title"],
        release_year=record["release_year"],
        director=director,
        country=country,
        box_office_text=record["box_office_text"],
        box_office_value=record["box_office_value"],
        wikipedia_url=url,
    )


def build_dataset(limit: int | None = None) -> list[FilmRecord]:
    html = load_html()
    base_records = parse_highest_grossing_table(html)
    if limit is not None:
        base_records = base_records[:limit]

    dataset: list[FilmRecord] = []
    with requests.Session() as session:
        for record in base_records:
            dataset.append(enrich_record(record, session=session))
    return dataset


def dataset_to_json(records: list[FilmRecord]) -> str:
    return json.dumps([record.to_dict() for record in records], indent=2, ensure_ascii=False)


def _parse_year(text: str) -> int | None:
    match = YEAR_RE.search(text)
    return int(match.group(0)) if match else None


def _parse_int(text: str) -> int | None:
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) if digits else None


def _parse_box_office(text: str) -> int | None:
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) if digits else None


def _clean_box_office_display(text: str) -> str:
    match = re.search(r"\$[\d,]+(?:\.\d+)?", text)
    return match.group(0) if match else text.strip()


def _extract_title(cell: Any) -> str:
    anchor = cell.find("a")
    if anchor and anchor.get_text(strip=True):
        return anchor.get_text(strip=True)
    return TITLE_CLEAN_RE.sub("", " ".join(cell.stripped_strings)).strip()


def _extract_relative_link(cell: Any) -> str:
    anchor = cell.find("a", href=True)
    if anchor is None:
        return ""
    href = anchor["href"]
    if href.startswith("http"):
        return href
    return f"https://en.wikipedia.org{href}"


def _extract_infobox_value(infobox: Any, labels: set[str]) -> str | None:
    for row in infobox.find_all("tr"):
        header = row.find("th")
        value = row.find("td")
        if header is None or value is None:
            continue
        label = " ".join(header.stripped_strings)
        if label not in labels:
            continue

        list_items = value.find_all("li")
        if list_items:
            parts = []
            for item in list_items:
                item_clone = BeautifulSoup(str(item), "html.parser")
                for sup in item_clone.find_all("sup"):
                    sup.decompose()
                cleaned_text = " ".join(item_clone.stripped_strings).strip()
                normalized = _normalize_infobox_part(cleaned_text)
                if normalized:
                    parts.append(normalized)
            if parts:
                return ", ".join(dict.fromkeys(parts))

        parts = [_normalize_infobox_part(part) for part in value.stripped_strings]
        parts = [part for part in parts if part]
        if not parts:
            return None

        return ", ".join(dict.fromkeys(parts))
    return None


def _normalize_infobox_part(part: str) -> str:
    cleaned = part.strip()
    if not cleaned:
        return ""

    if cleaned in {"[", "]"}:
        return ""

    if re.fullmatch(r"\d+", cleaned):
        return ""

    if re.fullmatch(r"\[\d+\]", cleaned):
        return ""

    return cleaned
