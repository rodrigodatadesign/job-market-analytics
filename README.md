# Job Market Analytics — Brazil Tech Jobs (BI / Data / Product Design)

End-to-end data pipeline for the tech job market: job listing extraction from three sources (Adzuna, RemoteOK, We Work Remotely), analytical modeling in Snowflake + dbt, a custom FastAPI backend, and an interactive dashboard — for comparative analysis of skills, salaries, and trends in the BI/Data/Product Design market, Brazil local vs. global remote.

## Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up credentials
cp .env.example .env
# edit .env and paste your ADZUNA_APP_ID and ADZUNA_APP_KEY
# (free at https://developer.adzuna.com/signup)
```

## Running the extraction

```bash
# RemoteOK — no credentials required
python extraction/remoteok_extract.py

# We Work Remotely — no credentials required
python extraction/wwr_extract.py

# Adzuna — requires .env configured
python extraction/adzuna_extract.py
```

Each script saves a timestamped JSON file in `data/raw/<source>/`, preserving the original payload for each job listing.

## Modeling (dbt)

Raw data is loaded into Snowflake and transformed via dbt across three layers:

- **staging** — per-source normalization (`stg_adzuna`, `stg_remoteok`, `stg_wwr`)
- **intermediate** — cross-source unification (`int_jobs_unified`)
- **marts** — final analytical tables consumed by the dashboard (`fct_jobs`, `fct_jobs_skills`)

```bash
cd job_market_dbt
dbt run
```

## Dashboard

Three-page interface (Overview, Skills, Salaries), with filters connected directly to a custom FastAPI backend, updated automatically. Deployed to production via Docker Swarm + Traefik.

## Sources

| Source | Type | Auth | Coverage |
|---|---|---|---|
| [Adzuna](https://developer.adzuna.com) | REST JSON | app_id + app_key (free) | Brazil, local market |
| [RemoteOK](https://remoteok.com/api) | REST JSON | None | Remote, global, tech |
| [We Work Remotely](https://weworkremotely.com/remote-job-rss-feed) | RSS/XML | None | Remote, global, curated |

**Details:**
- RemoteOK requires attribution as the source and a direct (non-redirect) link to the original job listing.
- We Work Remotely: public feeds, free to use per their own documentation.
- Adzuna: free tier with a request limit (25/min); redirect URLs already include attribution (`utm_source`).

## Pipeline

1. ✅ Extraction (Python) — `extraction/`
2. ✅ Load into Snowflake (`raw` layer)
3. ✅ Transformation via dbt (`staging` → `intermediate` → `marts`) — `job_market_dbt/`
4. ✅ Custom FastAPI backend, serving data in real time
5. ✅ Interactive dashboard (Overview, Skills, Salaries) — `dashboard/`

## Project structure
```
job_market_project/
├── extraction/
│   ├── adzuna_extract.py
│   ├── remoteok_extract.py
│   └── wwr_extract.py
├── job_market_dbt/
│   └── models/
│       ├── staging/
│       ├── intermediate/
│       └── marts/
├── dashboard/
│   └── novo/            # front-end (index, skills, salarios, assets, js)
├── data/raw/             # generated when running the scripts (git-ignored)
├── requirements.txt
├── .env.example
└── .gitignore
```
