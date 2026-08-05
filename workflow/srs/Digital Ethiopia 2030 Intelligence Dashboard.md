# **Digital Ethiopia 2030 Intelligence Dashboard**

Notes

- Frequency should be adjusted for each KPI estimated frequency (see **Fetch interval** below).
- **Observation history**: Each new value is stored as a new row in `kpi_observations` with `created_at`. Old values are never overwritten; the dashboard can show latest vs. time series.

## **Fetch interval (per-KPI)**

Each KPI has a **fetch_interval_hours** in `kpi_definitions` (default 24). The pipeline only enqueues URLs for a KPI if either:

- The KPI has no observations yet, or  
- The **latest** observation (`max(created_at)` for that `kpi_id`) is older than **now − fetch_interval_hours**.

Examples: `1` = hourly, `24` = daily, `168` = weekly, `720` ≈ monthly. Set per KPI so high-frequency KPIs (e.g. Fayda) can be hourly and others weekly or monthly.

-

## **MVP Data Pipeline Architecture Document**

# **1\. Purpose of This Document**

This document explains the MVP (Minimum Viable Product) architecture of the Digital Ethiopia 2030 Intelligence Dashboard data pipeline.

The objective of the pipeline is to automatically collect, process, validate, and store KPI-related data from web sources and make it available for dashboard visualization.

This architecture prioritizes:

* Simplicity  
* Practical implementation  
* Controlled AI usage  
* Low operational cost  
* Expandability over time

# **2\. Architectural Philosophy**

This is NOT a large-scale data engineering platform.  
It is an intelligent ingestion pipeline built with:

* n8n as orchestration layer  
* PostgreSQL (or MySQL) as database  
* OpenAI API for reasoning and extraction  
* Basic web scraping via HTTP requests

No vector database.  
No complex distributed systems.  
No paid data subscriptions (except LLM API).

The architecture follows a linear vertical flow with gated decision points.

# **3\. Layer-by-Layer Architecture Explanation**

[graphviz (7).png](https://drive.google.com/file/d/1qIkfQvKvWCHkCu-C7wpa9pUHpglFQakL/view?usp=sharing)

# **Layer 1: Scheduler & Pipeline Control**

## **Purpose**

Triggers the pipeline execution periodically and prevents concurrent runs.

## **Components**

* n8n Cron Trigger  
* Database pipeline\_lock flag

## **Practical Implementation**

1. Cron triggers every 1 hour (configurable).  
2. Workflow checks pipeline\_lock flag in database.  
3. If lock \= true → stop execution.  
4. If lock \= false → set lock \= true and continue.  
5. At end of workflow → set lock \= false.

## **Why It Matters**

Prevents duplicate processing and protects system stability.

# **Layer 2: KPI Definition Loader**

## **Purpose**

Loads predefined KPIs that the system must monitor.

## **Database Table: kpi\_definitions**

Fields:

* id  
* name  
* description  
* expected\_unit  
* target\_value (optional)  
* category  
* **source\_urls** (TEXT[]): optional array of priority URLs/websites the pipeline should check for this KPI (e.g. official portals, NIDP, MInT). Empty array = use AI-generated search only.
* **target\_value** (NUMERIC, optional): goal/target for this KPI (same unit as observations). Used for dashboard progress (current vs target). From Digital Ethiopia 2030 targets (e.g. 5M Coders = 5000000, Fayda = 90000000).

## **Practical Implementation**

* PostgreSQL Node in n8n  
* SELECT \* FROM kpi\_definitions  
* Limit batch size (e.g., 10 KPIs per run)

## **Why It Matters**

Defines what intelligence the system searches for.  
The system does not guess KPIs — they are structured and controlled.

# **Priority URLs vs Web Search**

For each KPI, the pipeline **first** checks the URLs in `source_urls` (if any). Only if the required information is **not found** there does it fall back to AI-generated web search and other sources. See `docs/n8n-priority-urls-and-fallback.md` for the n8n flow and node setup.

# **Layer 3: AI Query Generator**

## **Purpose**

Generate intelligent web search queries dynamically for each KPI (used when there are no priority URLs, or when priority URLs did not yield a valid observation).

## **Tool**

OpenAI API via n8n OpenAI node

## **Input**

* KPI name  
* KPI description

## **Output**

JSON array of 3–5 search queries

## **Design Principle**

AI is used for language reasoning only — not for computation.

## **Why It Matters**

Allows dynamic discovery without hardcoding search phrases.

# **Layer 4: Web Search Layer**

## **Purpose**

Discover URLs containing potentially relevant information.

## **MVP Implementation**

* HTTP Request node  
* Search engine query  
* Extract top N URLs (max 5\)

## **Controls**

* Limit number of queries  
* Limit number of URLs  
* Avoid aggressive crawling

## **Why It Matters**

Provides external data sources without building a crawler infrastructure.

# **Layer 5: URL Filtering & Deduplication**

## **Purpose**

Reduce noise before content retrieval.

## **Implementation**

* n8n Function Node  
* Remove duplicate URLs  
* Remove invalid domains  
* Limit to top 5

## **Why It Matters**

Controls cost and prevents unnecessary LLM calls.

# **Layer 6: Content Fetching**

## **Purpose**

Retrieve raw HTML content from selected URLs.

## **Implementation**

* HTTP Request Node  
* Extract readable text  
* Store raw text

## **Storage Table: raw\_documents**

Fields:

* id  
* source\_url  
* raw\_text  
* content\_hash  
* created\_at

## **Why It Matters**

Raw storage enables traceability and auditing.

# **Layer 7: Hashing & Duplicate Detection**

## **Purpose**

Prevent reprocessing identical documents.

## **Implementation**

* SHA256 hash generation in n8n Function Node  
* Check hash existence in database  
* If exists → stop branch

## **Why It Matters**

Prevents cost duplication and redundant extraction.

# **Layer 8: Relevance Classification (AI Gate)**

## **Purpose**

Determine if document contains KPI-relevant information.

## **Tool**

OpenAI classification prompt

## **Output Format**

{  
relevant: true/false,  
confidence: number  
}

## **Decision Logic**

If relevant \= false → stop branch.

## **Why It Matters**

Avoids extracting structured data from irrelevant pages.

# **Layer 9: Structured Data Extraction (Core Intelligence Layer)**

## **Purpose**

Extract normalized KPI observation.

## **Required Output Structure**

{  
value\_numeric: number,  
unit: string,  
region: string,  
observed\_date: date,  
explanation: string,  
confidence: number  
}

## **Design Principle**

Force strict JSON output.  
Reject non-structured responses.

## **Why It Matters**

Transforms unstructured text into measurable KPI data.

# **Layer 10: Deterministic Normalization**

## **Purpose**

Standardize units and formats.

## **Implementation**

* n8n Function Node  
* Convert percentages  
* Normalize currency  
* Standardize dates (ISO format)

## **Important Rule**

No AI used here.  
This must be deterministic and rule-based.

# **Layer 11: Confidence Gate**

## **Purpose**

Control data quality before storage.

## **Decision Thresholds**

* ≥ 0.85 → auto insert  
* 0.6–0.85 → insert with review flag  
* \< 0.6 → reject

## **Why It Matters**

Protects dashboard integrity.

# **Layer 12: KPI Observation Storage**

## **Database Table: kpi\_observations**

Fields:

* id  
* kpi\_id  
* value  
* unit  
* region  
* observed\_date  
* source\_url  
* ai\_confidence  
* review\_flag  
* created\_at

Observations are **append-only**: each new value is a new row with its own `created_at`. Old values are kept for history and time-series; the dashboard typically uses the latest per KPI (e.g. `ORDER BY created_at DESC LIMIT 1`).

## **Why It Matters**

Central intelligence database for dashboard.

# **Layer 13: Dashboard & API Layer**

## **Purpose**

Expose processed data to frontend.

## **Implementation**

* Backend API or GraphQL endpoint  
* Dashboard queries latest observations  
* No heavy logic in frontend

## **Why It Matters**

Separation of ingestion and visualization responsibilities.

# **4\. Cost & Infrastructure Requirements**

Required:

* Server for n8n  
* Database server  
* OpenAI API subscription

Not Required (MVP):

* Vector database  
* Distributed processing  
* Data warehouse  
* Paid data APIs

# **5\. Operational Safeguards**

To ensure stability:

* Max 10 documents per hour  
* Max 5 URLs per KPI  
* Single pipeline execution at a time  
* Strict JSON validation from AI  
* **Retry on fail**: Fallible nodes (HTTP Request, OpenAI Relevance/Extraction, Postgres) use **Retry On Fail** (max 5 tries, 2s between tries). Retries are **per-node** only: if e.g. Extraction fails, only Extraction is retried; earlier steps (Fetch, Relevance) are not re-run, so AI tokens are not duplicated.

# **6\. MVP Scope Boundaries**

This architecture intentionally excludes:

* Historical backfilling  
* Complex ML models  
* Real-time streaming  
* Multi-language processing  
* Advanced entity resolution

These can be added after validation phase.

# **7\. Future Expansion Path**

When scaling becomes necessary:

* Introduce queue system (Redis)  
* Add monitoring dashboards  
* Add source credibility scoring  
* Add human validation interface  
* Introduce vector search if chatbot required

# **8\. Conclusion**

This architecture is:

* Cost-efficient  
* Structured  
* Scalable in phases  
* Controlled in AI usage

It is designed for an internal, in-house MVP that demonstrates automated KPI intelligence generation without overengineering.

