const DATA_PATH = "./data/films.json";

const elements = {
  search: document.querySelector("#searchInput"),
  searchForm: document.querySelector("#searchForm"),
  resetButton: document.querySelector("#resetButton"),
  searchHint: document.querySelector("#searchHint"),
  sort: document.querySelector("#sortSelect"),
  country: document.querySelector("#countryFilter"),
  decade: document.querySelector("#decadeFilter"),
  cardsView: document.querySelector("#cardsView"),
  tableView: document.querySelector("#tableView"),
  tableBody: document.querySelector("#filmsTableBody"),
  featuredGrid: document.querySelector("#featuredGrid"),
  featuredSummary: document.querySelector("#featuredSummary"),
  filmCount: document.querySelector("#filmCount"),
  countryCount: document.querySelector("#countryCount"),
  topGross: document.querySelector("#topGross"),
  averageYear: document.querySelector("#averageYear"),
  heroFilmCount: document.querySelector("#heroFilmCount"),
  heroCountryCount: document.querySelector("#heroCountryCount"),
  heroTopGross: document.querySelector("#heroTopGross"),
  resultsSummary: document.querySelector("#resultsSummary"),
  activeFilters: document.querySelector("#activeFilters"),
  emptyState: document.querySelector("#emptyState"),
  spotlightTitle: document.querySelector("#spotlightTitle"),
  spotlightDescription: document.querySelector("#spotlightDescription"),
  spotlightDirector: document.querySelector("#spotlightDirector"),
  spotlightYear: document.querySelector("#spotlightYear"),
  spotlightCountry: document.querySelector("#spotlightCountry"),
  spotlightGross: document.querySelector("#spotlightGross"),
  cardTemplate: document.querySelector("#filmCardTemplate"),
  featuredTemplate: document.querySelector("#featuredCardTemplate"),
  viewButtons: [...document.querySelectorAll(".view-button")],
};

const DEFAULT_SPOTLIGHT = {
  title: "Choose a way to explore",
  description:
    "Search for a title or activate filters like country and decade. The strongest match from the current selection will appear here.",
  director: "Waiting for selection",
  year: "—",
  country: "—",
  gross: "—",
};

let films = [];
let viewMode = "cards";
let submittedSearch = "";

function forceScrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

window.addEventListener("DOMContentLoaded", forceScrollToTop);
window.addEventListener("load", forceScrollToTop);
window.addEventListener("pageshow", forceScrollToTop);
window.setTimeout(forceScrollToTop, 0);
window.setTimeout(forceScrollToTop, 120);

function normalizeFilm(film) {
  const title = String(film.title ?? "Untitled").trim();
  const director = normalizeDirector(String(film.director ?? "Unknown director"));
  const country = String(film.country ?? "Unknown").trim();
  const countries = splitCountries(country);
  const releaseYear = Number(film.release_year) || null;
  const rank = Number(film.source_rank ?? film.rank) || null;

  const grossFromText = parseCurrencyNumber(
    film.box_office_text ?? film.box_office_display ?? film.box_office
  );
  const rawGrossValue = Number(film.box_office_value) || 0;
  const grossValue = chooseGrossValue(rawGrossValue, grossFromText);
  const grossText =
    film.box_office_text ??
    film.box_office_display ??
    (grossValue ? formatCurrency(grossValue) : "Unknown");

  const url = String(film.wikipedia_url ?? "").trim();
  const searchText = normalizeSearchText(`${title} ${director}`);

  return {
    ...film,
    title,
    director,
    country,
    countries,
    releaseYear,
    rank,
    grossValue,
    grossText,
    url,
    searchText,
    searchTokens: tokenizeSearchText(searchText),
    decade: releaseYear ? `${Math.floor(releaseYear / 10) * 10}s` : "Unknown",
  };
}

function normalizeDirector(value) {
  const cleaned = value.replace(/\s{2,}/g, " ").trim();
  const parts = cleaned
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) {
    return "Unknown director";
  }

  const uniqueParts = [...new Set(parts)];
  return uniqueParts.join(", ");
}

function splitCountries(value) {
  const parts = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.length ? [...new Set(parts)] : ["Unknown"];
}

function parseCurrencyNumber(value) {
  if (!value) {
    return 0;
  }

  const digitsOnly = String(value).replace(/[^\d]/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
}

function chooseGrossValue(rawValue, valueFromText) {
  if (!rawValue && valueFromText) {
    return valueFromText;
  }
  if (!valueFromText) {
    return rawValue;
  }

  const rawLooksBroken = rawValue > valueFromText * 5 || rawValue < valueFromText * 0.2;
  return rawLooksBroken ? valueFromText : rawValue;
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenizeSearchText(value) {
  const normalized = normalizeSearchText(value);
  return normalized ? [...new Set(normalized.split(/\s+/).filter(Boolean))] : [];
}

function matchesFullText(film, query) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  if (film.searchText.includes(normalizedQuery)) {
    return true;
  }

  const queryTokens = tokenizeSearchText(normalizedQuery);
  return queryTokens.every((token) =>
    film.searchTokens.some((candidate) => candidate.includes(token))
  );
}

async function loadFilms() {
  const response = await fetch(DATA_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${response.status}`);
  }

  const records = await response.json();
  films = Array.isArray(records) ? records.map(normalizeFilm) : [];

  populateCountryFilter(films);
  populateDecadeFilter(films);
  updateDatasetMeta(films);
  render();
}

function populateCountryFilter(records) {
  const countries = [...new Set(records.flatMap((film) => film.countries).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right)
  );

  for (const country of countries) {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    elements.country.appendChild(option);
  }
}

function populateDecadeFilter(records) {
  const decades = [
    ...new Set(records.map((film) => film.decade).filter((value) => value !== "Unknown")),
  ].sort((left, right) => Number(left.slice(0, 4)) - Number(right.slice(0, 4)));

  for (const decade of decades) {
    const option = document.createElement("option");
    option.value = decade;
    option.textContent = decade;
    elements.decade.appendChild(option);
  }
}

function updateDatasetMeta(records) {
  const count = records.length;
  const countries = new Set(records.flatMap((film) => film.countries).filter(Boolean)).size;
  const topValue = records.reduce((maxValue, film) => Math.max(maxValue, film.grossValue), 0);

  elements.heroFilmCount.textContent = `${count} films`;
  elements.heroCountryCount.textContent = String(countries);
  elements.heroTopGross.textContent = topValue ? formatCurrency(topValue) : "$0";
}

function getFilteredFilms() {
  const searchValue = submittedSearch;
  const countryValue = elements.country.value;
  const decadeValue = elements.decade.value;
  const sortValue = elements.sort.value;

  const filtered = films.filter((film) => {
    const matchesSearch = matchesFullText(film, searchValue);
    const matchesCountry = countryValue === "all" || film.countries.includes(countryValue);
    const matchesDecade = decadeValue === "all" || film.decade === decadeValue;

    return matchesSearch && matchesCountry && matchesDecade;
  });

  filtered.sort((left, right) => {
    switch (sortValue) {
      case "gross-desc":
        return right.grossValue - left.grossValue;
      case "year-desc":
        return (right.releaseYear || 0) - (left.releaseYear || 0);
      case "year-asc":
        return (left.releaseYear || 0) - (right.releaseYear || 0);
      case "title-asc":
        return left.title.localeCompare(right.title);
      case "rank-asc":
      default:
        return (left.rank || Number.POSITIVE_INFINITY) - (right.rank || Number.POSITIVE_INFINITY);
    }
  });

  return filtered;
}

function render() {
  const filtered = getFilteredFilms();
  const hasUserSelection = hasUserSelectionState();
  const hasResults = filtered.length > 0;

  renderCards(filtered);
  renderTable(filtered);
  renderFeatured(filtered);
  updateStats(filtered);
  updateSpotlight(filtered, hasUserSelection);
  updateResultsMeta(filtered, hasUserSelection);
  updateSearchHint(hasUserSelection, hasResults);
  syncView(hasResults);
}

function renderCards(records) {
  elements.cardsView.innerHTML = "";

  for (const film of records) {
    const fragment = elements.cardTemplate.content.cloneNode(true);

    fragment.querySelector(".rank-badge").textContent = film.rank ? `#${film.rank}` : "—";
    fragment.querySelector(".year-pill").textContent = film.releaseYear ?? "Unknown year";
    fragment.querySelector(".film-title").textContent = film.title;
    fragment.querySelector(".film-director").textContent = `Directed by ${film.director}`;
    fragment.querySelector(".film-country").textContent = film.country;
    fragment.querySelector(".film-gross").textContent = film.grossText;

    const link = fragment.querySelector(".film-link");
    if (film.url) {
      link.href = film.url;
    } else {
      link.removeAttribute("href");
      link.textContent = "Wikipedia link unavailable";
      link.style.opacity = "0.7";
      link.style.pointerEvents = "none";
    }

    elements.cardsView.appendChild(fragment);
  }
}

function renderTable(records) {
  elements.tableBody.innerHTML = "";

  for (const film of records) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${film.rank ?? ""}</td>
      <td>
        ${
          film.url
            ? `<a class="table-title-link" href="${film.url}" target="_blank" rel="noreferrer">${escapeHtml(film.title)}</a>`
            : escapeHtml(film.title)
        }
      </td>
      <td>${film.releaseYear ?? ""}</td>
      <td>${escapeHtml(film.director)}</td>
      <td>${escapeHtml(film.country)}</td>
      <td>${escapeHtml(film.grossText)}</td>
    `;

    elements.tableBody.appendChild(row);
  }
}

function renderFeatured(records) {
  elements.featuredGrid.innerHTML = "";

  if (!records.length) {
    elements.featuredSummary.textContent =
      "No featured titles yet because the current search and filters returned no matches.";
    elements.featuredGrid.innerHTML = `
      <article class="placeholder-card glass-card">
        <p class="placeholder-label">No matches</p>
        <h3>Try another title</h3>
        <p>Reset the filters or search for a different film to bring the featured cards back.</p>
      </article>
    `;
    return;
  }

  elements.featuredSummary.textContent = hasUserSelectionState()
    ? "These highlight cards follow the latest submitted search and active filters."
    : "These are the strongest titles from the full collection.";

  const featured = [...records]
    .sort((left, right) => right.grossValue - left.grossValue)
    .slice(0, 3);

  for (const [index, film] of featured.entries()) {
    const fragment = elements.featuredTemplate.content.cloneNode(true);

    fragment.querySelector(".featured-rank").textContent = `0${index + 1}`;
    fragment.querySelector(".featured-title").textContent = film.title;
    fragment.querySelector(
      ".featured-subtitle"
    ).textContent = `${film.releaseYear ?? "Unknown year"} • Directed by ${film.director}`;
    fragment.querySelector(".featured-country").textContent = film.country;
    fragment.querySelector(".featured-gross").textContent = film.grossText;

    elements.featuredGrid.appendChild(fragment);
  }
}

function updateStats(records) {
  const count = records.length;
  const countries = new Set(records.flatMap((film) => film.countries).filter(Boolean)).size;
  const topValue = records.reduce((maxValue, film) => Math.max(maxValue, film.grossValue), 0);
  const years = records.map((film) => film.releaseYear).filter(Boolean);

  const averageYear = years.length
    ? Math.round(years.reduce((sum, year) => sum + year, 0) / years.length)
    : null;

  elements.filmCount.textContent = String(count);
  elements.countryCount.textContent = String(countries);
  elements.topGross.textContent = topValue ? formatCurrency(topValue) : "—";
  elements.averageYear.textContent = averageYear ?? "—";
  elements.emptyState.classList.toggle("hidden", count > 0);
}

function updateSpotlight(records, hasActiveState) {
  if (!hasActiveState) {
    setSpotlight(DEFAULT_SPOTLIGHT);
    return;
  }

  if (!records.length) {
    setSpotlight({
      title: "No film found",
      description:
        "The current search did not return a matching title. Try another film name or clear the extra filters.",
      director: "No match",
      year: "—",
      country: "—",
      gross: "—",
    });
    return;
  }

  const topFilm = [...records].sort((left, right) => right.grossValue - left.grossValue)[0];

  setSpotlight({
    title: topFilm.title,
    description:
      "The spotlight reflects the strongest match inside the latest submitted search and updates when you switch filters or sort order.",
    director: topFilm.director,
    year: topFilm.releaseYear ?? "—",
    country: topFilm.country,
    gross: topFilm.grossText,
  });
}

function setSpotlight({ title, description, director, year, country, gross }) {
  elements.spotlightTitle.textContent = title;
  elements.spotlightDescription.textContent = description;
  elements.spotlightDirector.textContent = director;
  elements.spotlightYear.textContent = year;
  elements.spotlightCountry.textContent = country;
  elements.spotlightGross.textContent = gross;
}

function updateResultsMeta(records, hasUserSelection) {
  const filters = [];

  if (submittedSearch) {
    filters.push(`Search: ${submittedSearch}`);
  }

  if (elements.country.value !== "all") {
    filters.push(`Country: ${elements.country.value}`);
  }

  if (elements.decade.value !== "all") {
    filters.push(`Decade: ${elements.decade.value}`);
  }

  filters.push(`View: ${viewMode === "cards" ? "Cards" : "Table"}`);

  elements.resultsSummary.textContent = hasUserSelection
    ? `${records.length} result${records.length === 1 ? "" : "s"} visible`
    : `${records.length} films in the full collection`;

  elements.activeFilters.innerHTML = filters
    .map((filter) => `<span class="active-filter">${escapeHtml(filter)}</span>`)
    .join("");
}

function updateSearchHint(hasUserSelection, hasResults) {
  if (!hasUserSelection) {
    elements.searchHint.textContent =
      "The full collection is already visible. Search for a title or use filters to narrow it down.";
    return;
  }

  if (hasResults) {
    elements.searchHint.textContent =
      "Collection loaded. You can switch between cards and table or refine the filters.";
    return;
  }

  elements.searchHint.textContent =
    "No matches yet. Try another title, change the filters, or reset and start again.";
}

function submitSearch() {
  submittedSearch = elements.search.value.trim();
  render();
}

function resetSearch() {
  submittedSearch = "";
  viewMode = "cards";
  elements.search.value = "";
  elements.country.value = "all";
  elements.decade.value = "all";
  elements.sort.value = "rank-asc";
  render();
}

function attachEvents() {
  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitSearch();
  });

  elements.resetButton.addEventListener("click", resetSearch);
  elements.sort.addEventListener("change", render);
  elements.country.addEventListener("change", render);
  elements.decade.addEventListener("change", render);

  for (const button of elements.viewButtons) {
    button.addEventListener("click", () => {
      viewMode = button.dataset.view;
      syncView(getFilteredFilms().length > 0);
      updateResultsMeta(getFilteredFilms(), hasUserSelectionState());
    });
  }
}

function hasUserSelectionState() {
  return (
    Boolean(submittedSearch) ||
    elements.country.value !== "all" ||
    elements.decade.value !== "all"
  );
}

function syncView(hasResults = getFilteredFilms().length > 0) {
  elements.viewButtons.forEach((button) => {
    const isActive = button.dataset.view === viewMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  elements.cardsView.classList.toggle("hidden", viewMode !== "cards" || !hasResults);
  elements.tableView.classList.toggle("hidden", viewMode !== "table" || !hasResults);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadFilms()
  .then(attachEvents)
  .catch((error) => {
    console.error(error);

    const message = `Failed to load the dataset from ${DATA_PATH}. Add your exported JSON file and try again.`;

    setSpotlight({
      title: "Dataset not loaded",
      description: message,
      director: "Unavailable",
      year: "—",
      country: "—",
      gross: "—",
    });
    elements.resultsSummary.textContent = message;
    elements.featuredSummary.textContent = message;
    elements.featuredGrid.innerHTML = "";
    elements.cardsView.innerHTML = "";
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="6">${escapeHtml(message)}</td>
      </tr>
    `;
    elements.emptyState.classList.add("hidden");
    syncView(false);
  });
