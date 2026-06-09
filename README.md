# AnvilML-TestUI

A minimalist developer UI for testing the [AnvilML](https://github.com/DrywFiltiarn/AnvilML) backend over its REST and WebSocket APIs.

AnvilML-TestUI is a static HTML/JS/CSS application — no framework, no build step. `npm serve` hosts the repository root directly. It is a developer tool, not an end-user product.

---

## Requirements

| Requirement | Value |
|---|---|
| Node.js | ≥ 18.x (LTS) |
| npm | ≥ 9.x (bundled with Node 18+) |
| AnvilML | Running on port 8488 |

---

## Quick start

```bash
git clone https://github.com/DrywFiltiarn/AnvilML-TestUI.git
cd AnvilML-TestUI
npm install
npm run serve
```

Open `http://localhost:8848` in Chrome or Firefox.

In the **Connection** panel, confirm the base URL is `http://localhost:8488` (or adjust to wherever AnvilML is running), then click **Connect**.

---

## What it covers

Every endpoint exposed by the AnvilML REST API and the `/v1/events` WebSocket stream:

| Panel | Endpoints |
|---|---|
| Connection | `GET /health` |
| System | `GET /v1/system`, `/v1/system/env`, `/v1/system/versions` |
| Models | `GET /v1/models`, `GET /v1/models/:id`, `POST /v1/models/rescan` |
| Workers | `GET /v1/workers`, `POST /v1/workers/:id/restart` |
| Jobs | `POST /v1/jobs`, `GET /v1/jobs`, `GET /v1/jobs/:id`, `POST /v1/jobs/:id/cancel`, `DELETE /v1/jobs/:id`, `DELETE /v1/jobs?status=` |
| Artifacts | `GET /v1/artifacts`, `GET /v1/artifacts/:hash` (renders PNG inline) |
| Events | `WS /v1/events` — live stream with per-type filters and counters |

Job submission uses a pre-filled JSON textarea loaded with the canonical ZiT or SDXL `SubmitJobRequest` template. Switch between pipelines with the selector; edit the textarea directly before submitting. Intentionally corrupting the JSON or the graph structure is the intended way to exercise the 422 validation path.

---

## Repository layout

```
AnvilML-TestUI/
├── index.html       # all panels; no inline scripts
├── app.js           # all application logic; vanilla ES2022
├── styles.css       # dark theme; no external dependencies
├── package.json
├── .gitignore
└── docs/
    ├── ANVILML_TESTUI_DESIGN.md   functional & technical design
    ├── ARCHITECTURE.md            file responsibilities, DOM ID reference, state model
    ├── ENVIRONMENT.md             serve commands, Node requirements, no-build-step rules
    ├── PHASES.md                  phase registry
    └── TASKS_PHASE*.md            per-phase task narrative and acceptance criteria
```

---

## Development

No build step. Edit `index.html`, `app.js`, or `styles.css` and refresh the browser.

```bash
npm run serve   # serves . on port 8848 via npx serve
```

AnvilML can be run in mock mode (no GPU required) for UI development:

```bash
# In the AnvilML repo:
ANVILML_WORKER_MOCK=1 cargo run --features mock-hardware
```

---

## Relationship to AnvilML

AnvilML-TestUI communicates with AnvilML over the network exactly as BloomeryUI does — it is an independent process, not hosted or managed by AnvilML. AnvilML runs headless by default; this UI provides browser-based access to its API during development.

```
AnvilML backend (port 8488)  ←──── AnvilML-TestUI (port 8848)
  REST /v1/*                          served by: npm serve
  WS   /v1/events                     vanilla HTML/JS; no framework
```

For the full API surface, see [`ARCHITECTURE.md §7`](https://github.com/DrywFiltiarn/AnvilML/blob/main/docs/ARCHITECTURE.md) in the AnvilML repo.

---

## License

MIT — see [LICENSE](LICENSE).
