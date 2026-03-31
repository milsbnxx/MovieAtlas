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
