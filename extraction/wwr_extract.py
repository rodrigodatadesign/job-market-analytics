"""
wwr_extract.py

Extracts job listings from We Work Remotely's public RSS feeds.

Source: https://weworkremotely.com/remote-job-rss-feed
Coverage: Remote-only, curated listings. No auth required.

WWR splits jobs by category feed rather than offering a single search API,
so we pull the categories relevant to this analysis and tag each job
with its source category.
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import feedparser

# Category feeds relevant to BI / Data / Product Design roles.
# Full category list: https://weworkremotely.com/remote-job-rss-feed
CATEGORY_FEEDS = {
    "programming": "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    "product": "https://weworkremotely.com/categories/remote-product-jobs.rss",
    "design": "https://weworkremotely.com/categories/remote-design-jobs.rss",
    "management_finance": "https://weworkremotely.com/categories/remote-management-and-finance-jobs.rss",
    "all_other": "https://weworkremotely.com/categories/all-other-remote-jobs.rss",
}

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "raw" / "wwr"

REQUEST_DELAY_SECONDS = 1.0


def parse_feed(category: str, url: str) -> list[dict]:
    """Parse a single RSS feed into a list of normalized job dicts."""
    print(f"Fetching category: {category}")
    feed = feedparser.parse(url)

    if feed.bozo:
        print(f"  [WARN] feed parsing issue: {feed.bozo_exception}")

    jobs = []
    for entry in feed.entries:
        job = {
            "id": entry.get("id") or entry.get("link"),
            "title": entry.get("title"),
            "link": entry.get("link"),
            "published": entry.get("published"),
            "summary": entry.get("summary"),
            "_category": category,
            "_extracted_at": datetime.now(timezone.utc).isoformat(),
        }
        jobs.append(job)

    print(f"  {len(jobs)} jobs found")
    return jobs


def deduplicate_by_id(jobs: list[dict]) -> list[dict]:
    """A job can appear in more than one category feed; keep first occurrence."""
    seen = {}
    for job in jobs:
        job_id = job.get("id")
        if job_id not in seen:
            seen[job_id] = job
    return list(seen.values())


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_jobs = []
    for category, url in CATEGORY_FEEDS.items():
        jobs = parse_feed(category, url)
        all_jobs.extend(jobs)
        time.sleep(REQUEST_DELAY_SECONDS)

    unique_jobs = deduplicate_by_id(all_jobs)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_path = OUTPUT_DIR / f"wwr_jobs_{timestamp}.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(unique_jobs, f, ensure_ascii=False, indent=2)

    print(f"\nDone. {len(unique_jobs)} unique jobs saved to {output_path}")


if __name__ == "__main__":
    main()
