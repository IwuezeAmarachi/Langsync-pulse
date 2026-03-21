# LangSync Pulse, System Architecture

## 1. Purpose
LangSync Pulse is a Chrome extension plus web platform that helps brands and agencies understand how visible they are inside AI search experiences such as ChatGPT, Perplexity, and Gemini. The system captures prompts and answers, detects brand and competitor mentions, extracts visible citations, computes visibility scores, stores historical snapshots, and presents insights in a dashboard.

This architecture is designed for:
- fast MVP delivery
- low operational complexity in v1
- clear separation between browser capture, analysis, storage, and reporting
- easy expansion into a larger AEO intelligence platform later

---

## 2. Product Architecture Summary
The system consists of six core layers:

1. **Browser Capture Layer**
   - Chrome extension
   - site-specific DOM extractors
   - popup UI and injected side panel

2. **Application Layer**
   - auth
   - workspace management
   - prompt management
   - competitor management
   - dashboard APIs

3. **Ingestion and Processing Layer**
   - result capture endpoint
   - validation and normalisation
   - asynchronous analysis pipeline

4. **Analysis Layer**
   - mention detection engine
   - citation extraction and classification
   - visibility scoring engine
   - recommendations engine

5. **Data Layer**
   - transactional database
   - cache layer where needed
   - event / job queue
   - analytics store if later required

6. **Presentation and Reporting Layer**
   - dashboard frontend
   - extension overlay
   - exports and internal reporting

---

## 3. High-Level System Design

```text
[User on ChatGPT / Perplexity / Gemini]
        |
        v
[Chrome Extension]
  - DOM extraction
  - local UI
  - auth token
  - capture trigger
        |
        v
[API Gateway / App Backend]
  - auth
  - workspace APIs
  - prompt APIs
  - ingestion API
        |
        +-------------------+
        |                   |
        v                   v
[Primary Database]     [Job Queue]
                            |
                            v
                    [Analysis Workers]
                      - text normalisation
                      - mention detection
                      - citation parsing
                      - scoring
                      - recommendations
                            |
                            v
                     [Analysis Results DB]
                            |
                            v
                    [Dashboard Frontend]
                      - trends
                      - prompt history
                      - competitor view
                      - source view
```

---

## 4. System Goals

### Functional goals
- capture prompts and responses from supported AI interfaces
- detect tracked brand presence and competitor presence
- extract visible citations and domains
- score visibility at prompt, brand, and workspace level
- present results in extension and dashboard
- allow historical tracking of prompt outcomes

### Non-functional goals
- fast response times in the extension
- resilient ingestion even if analysis fails temporarily
- low data loss risk
- modular extractor design so platform support can expand easily
- auditable and privacy-aware data handling

---

## 5. Core Systems

## 5.1 Browser Extension System
The extension is the client-side capture mechanism and the first system users interact with.

### Responsibilities
- authenticate user session
- detect supported sites
- observe DOM changes for new answers
- extract structured answer data
- render local UI for analysis results
- allow user-driven actions, save prompt, analyse answer, open dashboard
- send captured payloads to backend

### Internal modules
#### A. Site Detector
Determines whether the active tab is on a supported domain.

#### B. Extractor Registry
Maps current domain to a site-specific extractor.

Example registry:
- `chatgptExtractor`
- `perplexityExtractor`
- `geminiExtractor`

#### C. DOM Observer Engine
Uses mutation observers to detect when an answer has completed rendering.

#### D. Payload Builder
Transforms raw extracted data into canonical structured payload.

#### E. Extension UI
- popup summary
- floating widget or side panel
- settings page

#### F. Sync Client
Sends data to backend using secure API calls with retries.

### Recommended structure
```text
/extension
  /src
    /content
      observer.ts
      inject-ui.tsx
    /extractors
      chatgpt.ts
      perplexity.ts
      gemini.ts
      types.ts
    /popup
    /options
    /lib
      auth.ts
      api.ts
      storage.ts
      normalise.ts
```

### Browser-side storage
Use Chrome storage for:
- auth token metadata if needed
- temporary queue of unsent captures
- user preferences
- supported platform toggles

Do not use browser storage for long-term analytics or large answer histories.

---

## 5.2 Web Application System
The web application is the persistent control centre for account management and reporting.

### Responsibilities
- authentication and session handling
- workspace creation and switching
- brand setup and alias management
- competitor management
- prompt library management
- reporting views and exports

### Frontend modules
- onboarding
- workspace settings
- prompt library
- results list
- prompt detail view
- competitor comparison view
- source domains view
- trend charts
- account and billing later

### Backend modules
- auth controller
- workspace controller
- brand controller
- competitor controller
- prompt controller
- result controller
- dashboard aggregation controller

---

## 5.3 Ingestion System
The ingestion system receives captured payloads from the extension and makes them durable before deeper processing.

### Responsibilities
- validate payload structure
- authenticate workspace association
- deduplicate repeated submissions
- store raw snapshot safely
- enqueue analysis job

### Why separate ingestion from analysis
This ensures the extension gets a quick response and the heavy work can happen asynchronously.

### Flow
1. extension submits payload
2. API validates token and workspace
3. system computes response hash
4. system stores raw snapshot
5. job added to analysis queue
6. API returns success to extension

### Raw payload example
```json
{
  "workspaceId": "ws_123",
  "platform": "chatgpt",
  "promptText": "best email verification tools",
  "responseText": "...",
  "citations": [
    {"url": "https://example.com/a", "label": "Example"}
  ],
  "capturedAt": "2026-03-21T10:30:00Z",
  "pageUrl": "https://chatgpt.com/...",
  "captureMode": "manual"
}
```

---

## 5.4 Analysis System
The analysis layer is the core intelligence engine.

It should begin as a deterministic rules-based service, then later gain optional LLM-assisted enrichment.

### Responsibilities
- clean and normalise text
- detect mentions of tracked brand and competitors
- calculate mention positions and counts
- parse and classify citation domains
- compute visibility score
- generate recommendations

### Internal components
#### A. Text Normaliser
- lowercases where relevant
- strips special formatting
- normalises whitespace
- preserves a raw copy for audit

#### B. Entity Matcher
- exact match engine
- alias matcher
- domain-aware matcher
- confidence scoring

#### C. Citation Parser
- extracts root domain
- canonicalises URLs
- classifies domain type

#### D. Visibility Scoring Engine
- score calculation based on configurable rules
- score explanation object so UI can explain why a score exists

#### E. Recommendation Rules Engine
- maps detected conditions to prewritten actions

### Analysis sequence
```text
Raw snapshot
   -> validation
   -> text normalisation
   -> brand detection
   -> competitor detection
   -> mention ordering
   -> citation domain parsing
   -> source classification
   -> score calculation
   -> recommendation generation
   -> persist analysis output
```

---

## 5.5 Prompt Tracking System
The prompt system stores prompts the user wants to monitor and links ad hoc captures back to those strategic prompts.

### Responsibilities
- create and categorise prompts
- associate captures to prompts
- calculate trends by prompt
- compare results by platform

### Prompt attributes
- prompt text
- tag or category
- priority
- platform scope
- geography or market flag, optional
- business intent flag, optional

### Matching rules
When a capture is submitted:
- exact prompt match first
- normalised match second
- if no match, store as uncategorised capture

Later the user can attach uncategorised captures to a tracked prompt.

---

## 5.6 Competitor Intelligence System
This system stores competitor identities and compares visibility outcomes.

### Responsibilities
- maintain structured competitor list
- detect competitor appearance in responses and citations
- compare competitor frequency and position
- generate loss or win summaries

### Competitor object includes
- brand name
- primary domain
- aliases
- optional category tag
- optional priority ranking

---

## 5.7 Citation and Source Intelligence System
The source intelligence system turns visible answer citations into structured insight.

### Responsibilities
- extract domains
- identify owned versus competitor versus third-party
- compute citation frequency
- identify top source patterns by prompt cluster

### Domain classification groups
- owned
- competitor
- marketplace / directory
- editorial / press
- community forum
- social platform
- unknown

In v1, only owned, competitor, third-party, and unknown are required.

---

## 5.8 Reporting and Dashboard Aggregation System
This system prepares low-latency aggregates for UI queries.

### Responsibilities
- compute workspace overview stats
- compute trend lines by day or week
- aggregate scores by platform and prompt
- aggregate competitor counts
- aggregate source domain frequency

### Recommended approach
For MVP:
- compute most aggregates on demand with indexed queries

For scale:
- introduce materialised views or precomputed summary tables

---

## 5.9 Authentication and Identity System
The identity system must support both the web dashboard and extension.

### Recommended approach
Use Clerk or Supabase Auth with:
- Google login
- email login fallback
- JWT-based API auth
- workspace-aware access control

### Responsibilities
- issue sessions
- manage user identity
- map user to workspaces
- support extension authentication flow

### Access model
- user belongs to one or more workspaces
- workspace owns brands, competitors, prompts, results
- all records must be scoped by workspace id

---

## 5.10 Queue and Background Job System
Background processing is required once ingestion is separated from analysis.

### Responsibilities
- receive analysis jobs
- retry failed jobs
- support dead-letter or failure visibility
- enable future scheduled recrawls

### Recommended tools
- BullMQ with Redis
- or hosted queue equivalent

### Job types in v1
- `analyse_capture`
- `recompute_workspace_metrics`, optional

### Job types later
- `scheduled_prompt_run`
- `refresh_domain_classification`
- `generate_export`

---

## 5.11 Observability and Monitoring System
This product will rely on extractor reliability, so visibility into failures is critical.

### Responsibilities
- error capture
- extractor failure alerts
- API latency monitoring
- queue backlog monitoring
- frontend performance tracking

### Recommended tools
- Sentry for error monitoring
- PostHog for product analytics
- platform logs from hosting provider
- uptime monitoring for core APIs

### Key metrics
- extraction success rate by platform
- ingestion success rate
- analysis job failure rate
- average analysis latency
- dashboard query latency
- weekly active users

---

## 6. Data Architecture

## 6.1 Data Domains
The system manages these core data domains:
- identity data
- workspace data
- brand configuration
- competitor configuration
- prompt library
- capture snapshots
- mentions
- citations
- scores and recommendations
- product analytics events

---

## 6.2 Logical Data Model

### Users
Represents authenticated human accounts.

### Workspaces
Represents an organisation, client, or brand environment.

### Brands
Represents the primary tracked entity for a workspace.

### Competitors
Represents rival entities to monitor.

### Prompts
Represents tracked strategic queries.

### Captures
Represents raw response snapshots from AI platforms.

### Analyses
Represents processed capture outcomes.

### Mentions
Represents entity mentions found inside a capture.

### Citations
Represents source links extracted from a capture.

### Recommendations
Represents generated actions tied to analysis outcomes.

---

## 6.3 Suggested Physical Schema

### `users`
- id
- email
- full_name
- auth_provider
- created_at
- updated_at

### `workspaces`
- id
- name
- created_by_user_id
- plan_type
- created_at
- updated_at

### `workspace_members`
- id
- workspace_id
- user_id
- role
- created_at

### `brands`
- id
- workspace_id
- name
- primary_domain
- aliases_json
- product_names_json
- founder_names_json
- created_at
- updated_at

### `competitors`
- id
- workspace_id
- name
- primary_domain
- aliases_json
- active
- created_at
- updated_at

### `prompts`
- id
- workspace_id
- prompt_text
- category
- priority
- geography
- platform_scope_json
- notes
- created_at
- updated_at

### `captures`
- id
- workspace_id
- prompt_id nullable
- platform
- prompt_text
- response_text
- response_hash
- citations_raw_json
- capture_mode
- page_url
- captured_at
- ingestion_status
- created_at

### `analyses`
- id
- capture_id
- workspace_id
- brand_mentioned
- brand_mention_count
- brand_first_position
- competitor_count_mentioned
- score
- score_breakdown_json
- recommendation_summary
- processed_at

### `mentions`
- id
- analysis_id
- entity_name
- entity_type
- matched_alias
- mention_count
- first_position
- confidence

### `citations`
- id
- analysis_id
- url
- canonical_url
- root_domain
- source_type
- title nullable

### `recommendations`
- id
- analysis_id
- rule_key
- priority
- message
- created_at

### `jobs_audit`
- id
- job_type
- target_id
- status
- error_message
- created_at
- updated_at

---

## 6.4 Storage Strategy
### Primary database
Postgres is the source of truth for:
- workspaces
- brands
- prompts
- captures
- analyses

### Cache
Redis can be used for:
- job queue
- short-lived dashboard caches
- rate limiting

### Blob storage, optional later
Store exports or large raw artifacts in object storage if needed.

---

## 7. Request and Processing Flows

## 7.1 Capture and Analyse Flow
```text
1. User opens ChatGPT
2. User runs prompt
3. Extension detects completed answer
4. Extension extracts prompt, response, citations
5. Extension sends payload to ingestion API
6. Ingestion API stores raw capture
7. Ingestion API enqueues analysis job
8. Worker processes job
9. Worker stores analysis, mentions, citations, recommendations
10. Dashboard surfaces new result
```

## 7.2 Prompt-Centric Dashboard Flow
```text
1. User opens dashboard
2. Frontend requests prompt history
3. Backend queries prompts + latest analyses
4. Backend returns structured trend data
5. Frontend renders score trend, mentions, source domains
```

## 7.3 Extension Reconnect Flow
```text
1. Extension cannot reach API
2. Payload stored in local pending queue
3. Retry with backoff
4. On success, pending item is removed
```

---

## 8. Detailed Component Design

## 8.1 Extractor Design Pattern
Each supported AI platform should follow the same interface.

### Extractor interface
```ts
interface PlatformExtractor {
  platform: 'chatgpt' | 'perplexity' | 'gemini';
  canHandle(url: string): boolean;
  isResponseReady(doc: Document): boolean;
  extract(doc: Document): ExtractedPayload | null;
}
```

### Extracted payload interface
```ts
interface ExtractedPayload {
  platform: string;
  promptText: string;
  responseText: string;
  citations: Array<{ url: string; label?: string }>;
  capturedAt: string;
  pageUrl: string;
}
```

### Benefits
- extractor logic is modular
- one broken platform does not affect others
- testing is easier
- future support for Claude, Copilot, and others becomes easier

---

## 8.2 Mention Detection Engine Design
The first version should be deterministic and transparent.

### Inputs
- raw answer text
- tracked brand aliases
- competitor aliases
- tracked domains

### Matching stages
1. exact brand name match
2. alias match
3. exact domain match in citations
4. fuzzy fallback only for approved aliases

### Output
```json
{
  "brandMentioned": true,
  "brandMentionCount": 2,
  "brandFirstPosition": 41,
  "competitors": [
    {"name": "Competitor A", "count": 1, "firstPosition": 12}
  ]
}
```

### Anti-false-positive controls
- stoplist for generic words
- minimum alias length
- optional regex word boundaries
- special handling for punctuation and plural forms

---

## 8.3 Visibility Scoring Engine Design
The scoring engine should produce both a score and an explanation.

### Inputs
- brand mention status
- brand mention position
- competitor presence
- owned domain citation presence
- number of competitor mentions before brand

### Output
```json
{
  "score": 68,
  "breakdown": {
    "brandMentioned": 50,
    "mentionedEarly": 10,
    "ownedCitation": 15,
    "competitorPenalty": -7
  }
}
```

### Why explanation matters
- supports trust
- supports debugging
- supports future client reports

---

## 8.4 Recommendations Engine Design
Start with static rule mapping.

### Example rules
- if brand absent and competitor present, suggest content expansion
- if brand present but no owned citation, suggest strengthening citation-eligible pages
- if third-party domains dominate, suggest PR and listicle strategy
- if performance differs by platform, recommend platform-specific testing

### Output model
- priority
- message
- rule key
- optional supporting evidence

---

## 8.5 Dashboard Aggregation Design
For each workspace, expose these views:

### Overview
- average score
- score trend over time
- total analysed prompts
- brand mention rate
- competitor win rate

### Prompt view
- latest score per prompt
- score trend per prompt
- platform breakdown per prompt

### Competitor view
- top mentioned competitors
- competitor ahead-of-brand rate

### Sources view
- top third-party citation domains
- owned domain citation frequency

---

## 9. API Architecture

## 9.1 API Style
Use REST for v1. Keep endpoints predictable and workspace-scoped.

## 9.2 Suggested Endpoint Groups

### Auth
- `POST /auth/session`
- `GET /auth/me`

### Workspaces
- `GET /workspaces`
- `POST /workspaces`
- `GET /workspaces/:id`

### Brands
- `GET /workspaces/:id/brand`
- `PUT /workspaces/:id/brand`

### Competitors
- `GET /workspaces/:id/competitors`
- `POST /workspaces/:id/competitors`
- `PUT /workspaces/:id/competitors/:competitorId`
- `DELETE /workspaces/:id/competitors/:competitorId`

### Prompts
- `GET /workspaces/:id/prompts`
- `POST /workspaces/:id/prompts`
- `PUT /workspaces/:id/prompts/:promptId`
- `DELETE /workspaces/:id/prompts/:promptId`

### Captures
- `POST /captures`
- `GET /workspaces/:id/captures`
- `GET /workspaces/:id/captures/:captureId`

### Analyses
- `GET /workspaces/:id/analyses`
- `GET /workspaces/:id/analyses/:analysisId`

### Dashboard
- `GET /workspaces/:id/dashboard/overview`
- `GET /workspaces/:id/dashboard/trends`
- `GET /workspaces/:id/dashboard/prompts`
- `GET /workspaces/:id/dashboard/competitors`
- `GET /workspaces/:id/dashboard/sources`

---

## 9.3 Ingestion Endpoint Contract
`POST /captures`

### Request body
```json
{
  "workspaceId": "ws_123",
  "platform": "chatgpt",
  "promptText": "best payroll software uk",
  "responseText": "...",
  "citations": [{"url": "https://example.com", "label": "Example"}],
  "capturedAt": "2026-03-21T10:30:00Z",
  "pageUrl": "https://chatgpt.com/...",
  "captureMode": "manual"
}
```

### Response body
```json
{
  "captureId": "cap_123",
  "status": "accepted",
  "analysisQueued": true
}
```

---

## 10. Security Architecture
Because the system processes user prompts and AI responses, security must be designed in from the start.

## 10.1 Principles
- collect minimum necessary data
- scope all data by workspace
- encrypt in transit
- restrict capture to supported domains only
- make user consent explicit
- allow deletion and export

## 10.2 Access Control
- JWT validation on every API call
- workspace membership checks on all resource access
- admin role for workspace config changes later

## 10.3 Sensitive Data Risks
Potential risks include:
- users capturing confidential prompts
- accidental storage of proprietary answer content
- unsupported-site capture bugs

### Mitigations
- only run on approved domains
- visible capture controls
- privacy notice in onboarding
- retention settings later for enterprise

## 10.4 API Security
- rate limiting
- input validation with schema validation
- request logging for admin audit
- signed or short-lived tokens for extension

---

## 11. Reliability Architecture

## 11.1 Failure points
- extractor breaks after UI changes on source site
- API timeout during ingestion
- queue backlog
- analysis job errors
- dashboard query slowdown as data grows

## 11.2 Mitigations
- fallback local queue in extension
- per-platform extractor tests
- job retry with exponential backoff
- database indexes on workspace, prompt, created_at, platform
- periodic archive or partition strategy later

## 11.3 Resilience priorities for MVP
1. never lose captures silently
2. never block extension UX on analysis completion
3. keep extractor logic isolated by platform

---

## 12. Observability Architecture

## 12.1 Logs
Store structured logs for:
- capture submissions
- analysis job execution
- extractor errors
- dashboard API errors

## 12.2 Metrics
Track:
- successful captures per day
- extractor success rate by platform
- queue depth
- job processing latency
- score computation errors
- dashboard page load time

## 12.3 Alerting
Critical alerts:
- capture ingestion failure spike
- extractor failure spike on one platform
- queue stuck backlog
- auth failure spike

---

## 13. Performance Architecture

## 13.1 Extension performance
- keep DOM scraping lightweight
- debounce mutation observer triggers
- avoid large in-page render trees
- only analyse when answer is complete or user triggers analysis

## 13.2 Backend performance
- return fast from ingestion endpoint
- offload all heavy analysis to jobs
- paginate results and dashboard tables

## 13.3 Database performance
Indexes recommended on:
- `captures.workspace_id`
- `captures.prompt_id`
- `captures.captured_at`
- `analyses.workspace_id`
- `analyses.score`
- `mentions.analysis_id`
- `citations.analysis_id`

---

## 14. Suggested Tech Stack

## Frontend Dashboard
- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- TanStack Query

## Chrome Extension
- Plasmo
- React
- TypeScript
- Tailwind

## Backend
- Next.js API routes or NestJS
- Zod for validation
- Prisma ORM

## Database
- Postgres

## Queue
- Redis + BullMQ

## Auth
- Clerk or Supabase Auth

## Monitoring
- Sentry
- PostHog

## Hosting
- Vercel for frontend
- Railway, Render, Fly, or Supabase for backend and database

---

## 15. Deployment Architecture

## MVP deployment shape
```text
[Vercel]
  - dashboard frontend
  - API layer if using Next.js

[Managed Postgres]
  - primary data store

[Managed Redis]
  - queue and caching

[Worker Service]
  - analysis jobs
```

### Separation recommendation
Even if using Next.js, run worker processing separately so long-running analysis does not depend on request infrastructure.

---

## 16. Environment and Configuration

### Required environment variables
- auth secret
- database url
- redis url
- sentry DSN
- posthog key
- app base url
- extension app id if needed

### Feature flags
- enable_perplexity
- enable_gemini
- enable_auto_capture
- enable_score_explanations
- enable_recommendations

---

## 17. Testing Architecture

## 17.1 Extension tests
- unit tests for extractor functions
- fixture-based DOM tests
- manual smoke tests on supported platforms

## 17.2 Backend tests
- API contract tests
- analysis engine unit tests
- job processor tests

## 17.3 End-to-end tests
- onboarding flow
- capture submission flow
- dashboard rendering flow

## 17.4 Extractor fixtures
Maintain HTML fixture snapshots for each supported platform so selector changes can be detected early.

---

## 18. Roadmap Architecture Evolution

## Phase 1, MVP
- ChatGPT only
- manual capture
- prompt save
- score and recommendation basics
- dashboard history

## Phase 2
- Perplexity and Gemini support
- better source taxonomy
- team workspaces
- exports

## Phase 3
- scheduled reruns
- prompt clustering
- client reporting
- deeper AEO recommendations
- API integrations with LangSync’s broader toolset

## Phase 4
- separate analytics warehouse
- model comparison engine
- anomaly detection
- enterprise governance and retention controls

---

## 19. Recommended Build Order

### Foundation
1. auth
2. workspace model
3. brand and competitor setup
4. Postgres schema

### Capture
5. ChatGPT extractor
6. extension popup UI
7. ingestion API
8. raw capture storage

### Analysis
9. queue setup
10. mention detection engine
11. citation parser
12. scoring engine
13. recommendation rules

### Reporting
14. dashboard overview
15. prompt history view
16. competitor and source views

### Scale and resilience
17. extension retry queue
18. extractor monitoring
19. aggregation optimisation

---

## 20. Architecture Decisions to Lock
These are the key decisions to finalise before implementation starts.

1. **Extension UI approach**
   - popup only
   - popup plus in-page widget

2. **Backend pattern**
   - pure Next.js full-stack
   - Next.js frontend plus separate NestJS API

3. **Auth provider**
   - Clerk
   - Supabase Auth

4. **Prompt linking logic**
   - strict manual linking
   - auto-match uncategorised captures to prompts

5. **Score philosophy**
   - simple transparent score
   - configurable score per workspace later

---

## 21. Final Architecture Recommendation
For speed and clarity, the best architecture for LangSync Pulse right now is:

- **Chrome extension built with Plasmo + React + TypeScript**
- **dashboard built with Next.js + Tailwind**
- **Postgres + Prisma for primary data**
- **Clerk for auth**
- **Redis + BullMQ for background analysis jobs**
- **rules-based analysis engine first, no LLM dependency in v1**
- **ChatGPT as first supported platform, then Perplexity, then Gemini**

This gives you a system that is fast to ship, technically clean, credible to agencies and in-house SEO teams, and ready to evolve into a much broader AI search intelligence platform.

