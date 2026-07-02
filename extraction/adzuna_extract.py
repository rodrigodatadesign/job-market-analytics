"""
adzuna_extract.py

Extracts job listings from the Adzuna API (Brazil) for a list of search terms,
paginating through results, and saves the raw JSON responses to disk.

Source: https://developer.adzuna.com
Coverage: Brazil, local job market (CLT/PJ), in Portuguese.
"""

import os
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

APP_ID = os.getenv("ADZUNA_APP_ID")
APP_KEY = os.getenv("ADZUNA_APP_KEY")
COUNTRY = "br"
BASE_URL = f"https://api.adzuna.com/v1/api/jobs/{COUNTRY}/search"

# Search terms covering the roles relevant to the analysis
SEARCH_TERMS = [
    "power bi",
    "business intelligence",
    "data analyst",
    "analista de dados",
    "engenheiro de dados",
    "data engineer",
    "product designer",
    "ux ui designer",
]

RESULTS_PER_PAGE = 50          # Adzuna's max per page
MAX_PAGES_PER_TERM = 10        # cap to respect free-tier rate limits (25 req/min)
REQUEST_DELAY_SECONDS = 1.5    # polite delay between calls

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "raw" / "adzuna"


def fetch_page(search_term: str, page: int) -> dict | None:
    """Fetch a single page of results for a given search term."""
    url = f"{BASE_URL}/{page}"
    params = {
        "app_id": APP_ID,
        "app_key": APP_KEY,
        "what": search_term,
        "results_per_page": RESULTS_PER_PAGE,
        "content-type": "application/json",
    }
    response = requests.get(url, params=params, timeout=30)

    if response.status_code != 200:
        print(f"  [WARN] {search_term} page {page}: HTTP {response.status_code}")
        return None

    return response.json()


def extract_search_term(search_term: str) -> list[dict]:
    """Paginate through all available pages for a search term."""
    print(f"Extracting: '{search_term}'")
    all_jobs = []

    for page in range(1, MAX_PAGES_PER_TERM + 1):
        data = fetch_page(search_term, page)
        if data is None:
            break

        results = data.get("results", [])
        if not results:
            print(f"  page {page}: no more results, stopping")
            break

        total_count = data.get("count", 0)
        print(f"  page {page}: {len(results)} jobs (total available: {total_count})")

        for job in results:
            job["_search_term"] = search_term
            job["_extracted_at"] = datetime.now(timezone.utc).isoformat()
            all_jobs.append(job)

        # Stop early if we've already covered everything available
        if page * RESULTS_PER_PAGE >= total_count:
            break

        time.sleep(REQUEST_DELAY_SECONDS)

    return all_jobs


def deduplicate_by_id(jobs: list[dict]) -> list[dict]:
    """Remove duplicate jobs (same listing can match multiple search terms)."""
    seen_ids = {}
    for job in jobs:
        job_id = job.get("id")
        if job_id not in seen_ids:
            seen_ids[job_id] = job
        else:
            # merge search terms so we don't lose the signal
            existing_terms = seen_ids[job_id].get("_search_term", "")
            if job["_search_term"] not in existing_terms:
                seen_ids[job_id]["_search_term"] = f"{existing_terms}|{job['_search_term']}"
    return list(seen_ids.values())


def main():
    if not APP_ID or not APP_KEY:
        raise SystemExit(
            "Missing ADZUNA_APP_ID / ADZUNA_APP_KEY.\n"
            "Copy .env.example to .env and fill in your credentials."
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_jobs = []
    for term in SEARCH_TERMS:
        jobs = extract_search_term(term)
        all_jobs.extend(jobs)
        time.sleep(REQUEST_DELAY_SECONDS)

    unique_jobs = deduplicate_by_id(all_jobs)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_path = OUTPUT_DIR / f"adzuna_jobs_{timestamp}.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(unique_jobs, f, ensure_ascii=False, indent=2)

    print(f"\nDone. {len(unique_jobs)} unique jobs saved to {output_path}")


if __name__ == "__main__":
    main()
