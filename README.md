# Movie Atlas

Course project for **Data Wrangling, Visualization, and Web Presentation**.

The project parses the Wikipedia page for highest-grossing films, enriches the dataset with extra details from individual film pages, stores the cleaned result in PostgreSQL, exports it to JSON, and presents it through an interactive static website hosted with GitHub Pages.

## What this project does

This repository combines three parts of the assignment into one workflow:

1. **Data extraction**
   - Parse the Wikipedia page for highest-grossing films.
   - Extract the core fields from the main table.
   - Visit each film page to enrich the dataset with director and country information.

2. **Database creation**
   - Store the cleaned dataset in a relational database.
   - Use PostgreSQL with a single `films` table.
   - Support reruns through an upsert strategy keyed by `(title, release_year)`.

3. **Web presentation**
   - Export the cleaned dataset to `docs/data/films.json`.
   - Load that JSON in the frontend with JavaScript.
   - Provide search, filtering, sorting, cards/table view switching, and summary metrics.

## Assignment mapping

This repository directly addresses the assignment requirements:

- **Wikipedia parsing**: implemented in [`src/wikipedia_parser.py`](/Users/sabinaamilova/Documents/movie/MovieAtlas/src/wikipedia_parser.py)
- **Relational database design**: implemented in [`db/schema.sql`](/Users/sabinaamilova/Documents/movie/MovieAtlas/db/schema.sql) and [`src/database.py`](/Users/sabinaamilova/Documents/movie/MovieAtlas/src/database.py)
- **Jupyter Notebook documentation**: implemented in [`notebook/data_wrangling.ipynb`](/Users/sabinaamilova/Documents/movie/MovieAtlas/notebook/data_wrangling.ipynb)
- **Static web page with interactivity**: implemented in [`docs/index.html`](/Users/sabinaamilova/Documents/movie/MovieAtlas/docs/index.html), [`docs/style.css`](/Users/sabinaamilova/Documents/movie/MovieAtlas/docs/style.css), and [`docs/script.js`](/Users/sabinaamilova/Documents/movie/MovieAtlas/docs/script.js)
- **GitHub Pages deployment**: the `docs/` directory is structured to be published directly

## Dataset

Primary source:

- [Wikipedia: List of highest-grossing films](https://en.wikipedia.org/wiki/List_of_highest-grossing_films)

Fields used in the final dataset:

- `title`
- `release_year`
- `director`
- `country`
- `box_office_text`
- `box_office_value`
- `source_rank`
- `wikipedia_url`

The current exported frontend dataset is stored in [`docs/data/films.json`](/Users/sabinaamilova/Documents/movie/MovieAtlas/docs/data/films.json).

## Key features

### ETL features

- Fetches and caches the Wikipedia source HTML locally
- Parses the main highest-grossing films table
- Extracts release year, title, box office values, and source links
- Enriches records from film infoboxes on detail pages
- Normalizes multi-value director and country fields
- Exports the cleaned records to JSON
- Loads records into PostgreSQL

### Frontend features

- Hero summary with dataset metrics
- Search by film title or director
- Full-text style matching for partial title searches such as `Fire and Ash`
- Filter by country
- Filter by decade
- Sort by rank, gross, year, or title
- Toggle between card view and table view
- Spotlight panel for the strongest visible match
- Featured cards based on the current filtered result set

## Project structure

```text
MovieAtlas/
├── db/
│   └── schema.sql
├── data/
│   └── raw_wikipedia.html
├── docs/
│   ├── data/
│   │   └── films.json
│   ├── index.html
│   ├── script.js
│   └── style.css
├── notebook/
│   └── data_wrangling.ipynb
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── database.py
│   ├── export_json.py
│   ├── pipeline.py
│   └── wikipedia_parser.py
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Architecture overview

```text
Wikipedia list page
        ↓
HTML fetch / local snapshot
        ↓
Main table parsing
        ↓
Film detail page enrichment
        ↓
Cleaned Python records
        ├── PostgreSQL load
        └── JSON export
                ↓
        GitHub Pages frontend
```

Main responsibilities by file:

- [`src/config.py`](/Users/sabinaamilova/Documents/movie/MovieAtlas/src/config.py): project settings and environment variables
- [`src/wikipedia_parser.py`](/Users/sabinaamilova/Documents/movie/MovieAtlas/src/wikipedia_parser.py): fetching, parsing, enrichment, and record serialization
- [`src/database.py`](/Users/sabinaamilova/Documents/movie/MovieAtlas/src/database.py): PostgreSQL connection, schema initialization, and upsert logic
- [`src/pipeline.py`](/Users/sabinaamilova/Documents/movie/MovieAtlas/src/pipeline.py): command-line orchestration for ETL and JSON export
- [`docs/script.js`](/Users/sabinaamilova/Documents/movie/MovieAtlas/docs/script.js): client-side data loading, search, filtering, sorting, and rendering

## Technology stack

### Backend / data pipeline

- Python 3
- `requests`
- `beautifulsoup4`
- `psycopg`
- `python-dotenv`
- `pandas`
- Jupyter Notebook

### Database

- PostgreSQL 17 via Docker Compose

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- `fetch()` for loading local JSON

### Hosting

- GitHub Pages

## Prerequisites

Before running the project locally, make sure you have:

- Python 3 installed
- `pip` available
- Docker Desktop installed if you want to run PostgreSQL through Docker
- Git, if you want to clone/push the repository
- A browser for previewing the static website

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/milsbnxx/MovieAtlas.git
cd MovieAtlas
```

### 2. Create and activate a virtual environment

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python3 -m pip install -r requirements.txt
```

## Environment configuration

The project reads database and scraper settings from environment variables. There is currently no committed `.env.example`, so create a local `.env` file manually in the repository root if you want to override defaults.

Supported variables:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=highest_grossing_films
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
WIKIPEDIA_SOURCE_URL=https://en.wikipedia.org/wiki/List_of_highest-grossing_films
REQUEST_TIMEOUT=30
REQUEST_USER_AGENT=DWV-HighestGrossingFilms/1.0 (educational project)
```

If you do not create a `.env` file, the project falls back to the defaults defined in [`src/config.py`](/Users/sabinaamilova/Documents/movie/MovieAtlas/src/config.py).

## PostgreSQL setup

The repository includes a ready-to-run Docker Compose service.

Start PostgreSQL:

```bash
docker compose up -d db
```

Stop PostgreSQL:

```bash
docker compose down
```

Inspect running containers:

```bash
docker compose ps
```

The Compose file:

- uses the `postgres:17` image,
- maps port `5432` by default,
- creates a persistent Docker volume,
- automatically applies [`db/schema.sql`](/Users/sabinaamilova/Documents/movie/MovieAtlas/db/schema.sql) on startup.

## Database schema

The relational database uses a single `films` table:

```sql
CREATE TABLE IF NOT EXISTS films (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    release_year INTEGER,
    director TEXT,
    box_office_text TEXT,
    box_office_value NUMERIC(20, 2),
    country TEXT,
    source_rank INTEGER,
    wikipedia_url TEXT,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (title, release_year)
);
```

Why this design works well for the assignment:

- It is simple and easy to explain in a course submission.
- It satisfies the required relational storage component.
- It preserves the core extracted fields in a single queryable table.
- The unique key prevents accidental duplication during reruns.
- The additional timestamps help track ETL refreshes.

## Running the ETL pipeline

The project can be run from the command line through [`src/pipeline.py`](/Users/sabinaamilova/Documents/movie/MovieAtlas/src/pipeline.py).

### Export JSON only

Use this if you want to refresh the static website dataset without loading PostgreSQL:

```bash
python3 -m src.pipeline --export-json
```

### Load PostgreSQL and export JSON

Use this for the full pipeline:

```bash
python3 -m src.pipeline --load-db --export-json
```

### Limit the number of enriched films during development

This is useful when iterating on parsing or debugging:

```bash
python3 -m src.pipeline --export-json --limit 10
```

### What the pipeline does

When you run the pipeline:

1. It loads or downloads the source HTML.
2. It parses the main Wikipedia table.
3. It visits film detail pages for enrichment.
4. It builds cleaned Python records.
5. It optionally loads them into PostgreSQL.
6. It optionally exports them to `docs/data/films.json`.

## Jupyter Notebook

The notebook version of the workflow is available at [`notebook/data_wrangling.ipynb`](/Users/sabinaamilova/Documents/movie/MovieAtlas/notebook/data_wrangling.ipynb).

The notebook includes:

- assignment coverage summary,
- import/setup section,
- source HTML loading,
- table parsing,
- initial quality checks,
- enrichment from film detail pages,
- cleaned dataframe creation,
- analytical summaries,
- optional charts,
- PostgreSQL loading,
- JSON export for the frontend,
- submission checklist.

Open Jupyter:

```bash
jupyter notebook
```

Then open:

- `notebook/data_wrangling.ipynb`

Note:

- The notebook contains a fallback path that can continue from the already exported JSON if live enrichment is unavailable.
- Database loading still requires a running PostgreSQL instance.

## Running the website locally

Because the frontend loads `docs/data/films.json` using `fetch()`, you should serve the project over HTTP instead of opening `index.html` directly from the filesystem.

From the repository root:

```bash
python3 -m http.server 8000
```

Then open:

- [http://localhost:8000/docs/](http://localhost:8000/docs/)

## Frontend behavior

The website is built as a static GitHub Pages-friendly app.

Main UI areas:

- **Hero section**: project intro and top-level dataset metrics
- **Search panel**: search input, reset button, and spotlight summary
- **Control bar**: country filter, decade filter, sort selector, view toggle
- **Stats cards**: visible record count, countries represented, highest gross, average year
- **Featured cards**: strongest titles in the current filtered result set
- **Results explorer**: card view and table view

Data flow on the frontend:

1. `docs/script.js` fetches `docs/data/films.json`
2. Records are normalized for display
3. Search and filter state are applied in memory
4. UI sections rerender based on the filtered dataset

## Search implementation

The frontend search supports flexible matching instead of only exact contiguous text.

Examples:

- `Avatar` matches `Avatar`
- `Way of Water` matches `Avatar: The Way of Water`
- `Fire and Ash` matches `Avatar: Fire and Ash`
- `fire ash` also matches `Avatar: Fire and Ash`

This is implemented in [`docs/script.js`](/Users/sabinaamilova/Documents/movie/MovieAtlas/docs/script.js) by:

- normalizing text to lowercase,
- removing punctuation,
- tokenizing the title/director search index,
- checking both direct substring matches and token-level partial matches.

## GitHub Pages deployment

The project is set up so the `docs/` directory can be published directly.

### Steps

1. Push the repository to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings`.
4. Open the `Pages` section.
5. Under source, choose:
   - branch: `main`
   - folder: `/docs`
6. Save the settings.
7. Wait for GitHub Pages to build and publish the site.

Expected published files:

- `docs/index.html`
- `docs/style.css`
- `docs/script.js`
- `docs/data/films.json`

## Suggested workflow for grading or demonstration

If you need to present the project to an instructor, this order works well:

1. Show the notebook and explain the ETL logic.
2. Show the database schema and the upsert approach.
3. Run the pipeline with `--export-json`.
4. Serve the website locally.
5. Demonstrate:
   - title search,
   - full-text partial search,
   - filtering by country,
   - filtering by decade,
   - sorting,
   - card/table view switching.
6. Open the deployed GitHub Pages site.

## Useful commands

Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Start database:

```bash
docker compose up -d db
```

Run full pipeline:

```bash
python3 -m src.pipeline --load-db --export-json
```

Run frontend locally:

```bash
python3 -m http.server 8000
```

## Troubleshooting

### The site opens but no data appears

Possible causes:

- `docs/data/films.json` is missing
- you opened `index.html` directly instead of running a local server
- the JSON file path is wrong

Fix:

- regenerate the JSON with `python3 -m src.pipeline --export-json`
- run `python3 -m http.server 8000`
- open `http://localhost:8000/docs/`

### PostgreSQL connection fails

Possible causes:

- Docker is not running
- the database container is not started
- environment variables do not match the container credentials

Fix:

- run `docker compose up -d db`
- verify `docker compose ps`
- check `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`

### Wikipedia parsing fails

Possible causes:

- no internet connection
- a temporary Wikipedia request failure
- page structure changes

Fix:

- retry the pipeline
- inspect the cached source in [`data/raw_wikipedia.html`](/Users/sabinaamilova/Documents/movie/MovieAtlas/data/raw_wikipedia.html)
- update the parsing rules in [`src/wikipedia_parser.py`](/Users/sabinaamilova/Documents/movie/MovieAtlas/src/wikipedia_parser.py)

### Notebook runs, but database load fails

This is expected if PostgreSQL is not available. The notebook is designed so the parsing and JSON export portions can still be reviewed independently.

## Future improvements

Potential next steps if this project grows beyond the assignment:

- add automated tests for parser behavior
- add a committed `.env.example`
- add more derived fields such as genre or franchise
- normalize countries/directors into separate relational tables
- add charts directly to the frontend
- cache film detail pages locally to reduce repeated network requests

## Submission checklist

For final submission, provide:

1. The GitHub Pages URL
2. The GitHub repository URL
3. The Jupyter Notebook

Recommended final verification:

- pipeline runs successfully
- `docs/data/films.json` is updated
- notebook opens correctly
- website works locally
- GitHub Pages site is live

## Repository links

Repository:

- [https://github.com/milsbnxx/MovieAtlas](https://github.com/milsbnxx/MovieAtlas)

If you want, the next improvement I can make is adding:

- a shorter recruiter-style README version,
- badges at the top,
- screenshots/GIFs of the website,
- or a dedicated section with SQL queries for demonstration.
