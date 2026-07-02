"""
remoteok_extract.py

Extracts job listings from the RemoteOK public JSON API.

Source: https://remoteok.com/api
Coverage: Remote-only, global tech jobs. No auth required.

Usage note (per RemoteOK's terms): when publishing or sharing this data,
mention RemoteOK as the source and link directly to the original job URL
(no redirects).
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

API_URL = "https://remoteok.com/api"

# RemoteOK doesn't support server-side keyword search on this endpoint —
# it returns the full current feed, which we then filter client-side by tag/title.
RELEVANT_KEYWORDS = [
    "power bi", "bi", "business intelligence",
    "data analyst", "data engineer", "data",
    "product designer", "ux", "ui designer",
    "sql", "analytics",
]

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "raw" / "remoteok"

# RemoteOK asks for a descriptive User-Agent; a generic one can get blocked.
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; JobMarketResearchBot/1.0; "
                  "+https://rodrigodatadesign.com.br)"
}


def fetch_all_jobs() -> list[dict]:
    """Fetch the full current RemoteOK feed."""
    response = requests.get(API_URL, headers=HEADERS, timeout=30)
    response.raise_for_status()
    data = response.json()

    # The first element of the response is a metadata/legal notice block, not a job.
    jobs = [item for item in data if "id" in item and "position" in item]
    return jobs


def is_relevant(job: dict) -> bool:
    """Check whether a job matches any of our keywords (title or tags)."""
    title = (job.get("position") or "").lower()
    tags = [t.lower() for t in job.get("tags", [])]
    haystack = title + " " + " ".join(tags)
    return any(keyword in haystack for keyword in RELEVANT_KEYWORDS)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Fetching RemoteOK feed...")
    all_jobs = fetch_all_jobs()
    print(f"  total jobs in feed: {len(all_jobs)}")

    relevant_jobs = [job for job in all_jobs if is_relevant(job)]
    print(f"  relevant jobs (matched keywords): {len(relevant_jobs)}")

    for job in relevant_jobs:
        job["_extracted_at"] = datetime.now(timezone.utc).isoformat()

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_path = OUTPUT_DIR / f"remoteok_jobs_{timestamp}.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(relevant_jobs, f, ensure_ascii=False, indent=2)

    print(f"\nDone. {len(relevant_jobs)} relevant jobs saved to {output_path}")


if __name__ == "__main__":
    main()
