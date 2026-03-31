# Highest-Grossing Films DWV Project

Course assignment for Data Wrangling and Visualization:

- parse data from the Wikipedia page for highest-grossing films,
- enrich the dataset with director and country information,
- store the cleaned result in PostgreSQL,
- export the dataset to JSON,
- present it on a static interactive site hosted with GitHub Pages.

## Project structure

```text
.
├── .env.example
├── db/
│   └── schema.sql
├── docs/
│   ├── data/
│   │   └── films.json
│   ├── index.html
│   ├── script.js
│   └── style.css
├── notebook/
│   └── data_wrangling.ipynb
├── src/
│   ├── config.py
│   ├── database.py
│   ├── export_json.py
│   ├── pipeline.py
│   └── wikipedia_parser.py
├── docker-compose.yml
└── requirements.txt
```

## Data flow

```text
Wikipedia -> Python ETL -> PostgreSQL -> JSON export -> GitHub Pages
```

## PostgreSQL setup

The project is designed to use PostgreSQL. You can connect to an existing instance or start one with Docker locally.

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. If you have Docker installed, start PostgreSQL:

   ```bash
   docker compose up -d db
   ```

3. Install Python dependencies:

   ```bash
   python3 -m pip install -r requirements.txt
   ```

## Run the ETL pipeline

Load data into PostgreSQL and export the site JSON:

```bash
python3 -m src.pipeline --load-db --export-json
```

If PostgreSQL is not available yet, you can still bootstrap the JSON used by the frontend directly from parsed records:

```bash
python3 -m src.pipeline --export-json
```

If you want a faster development run while iterating on parsing or styling, limit the number of enriched films:

```bash
python3 -m src.pipeline --export-json --limit 10
```

This command writes the frontend dataset to:

- `docs/data/films.json`

## Launch the static site locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/docs/
```

## Notebook

The notebook `notebook/data_wrangling.ipynb` documents the same workflow step by step:

- fetch and inspect Wikipedia data,
- clean and enrich records,
- load records into PostgreSQL,
- export JSON for the web page.

The notebook is set up to build the full dataset. If you want faster iteration while developing, you can temporarily change the enrichment cell to `build_dataset(limit=10)`.

## GitHub Pages

Deploy the contents of the `docs/` folder with GitHub Pages. The page reads film data from `docs/data/films.json` using JavaScript.
