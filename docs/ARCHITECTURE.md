# ARCHITECTURE.md — AnvilML-TestUI

**Repository:** `AnvilML-TestUI`
**Version:** Rev 2 — 2026-06-09

---

## 1. Overview

AnvilML-TestUI is a three-file static web application. There is no build step, no module
bundler, and no framework. `npm serve` hosts the repository root directly on port 8848.

```
AnvilML-TestUI (port 8848)          AnvilML backend (port 8488)
─────────────────────────           ────────────────────────────
index.html                          REST  /health
app.js          ─── fetch() ──────► REST  /v1/*
styles.css      ─── WebSocket ────► WS    /v1/events
                ◄── JSON ──────────
                ◄── PNG bytes ─────
```

The UI is served by the user's browser from `http://localhost:8848`. It reaches AnvilML
at a configurable base URL (default `http://localhost:8488`). CORS is not a concern when
both are on `localhost`; if AnvilML is on a remote host, the browser same-origin policy
applies and may require AnvilML to emit the appropriate `Access-Control-Allow-Origin`
header (out of scope for this project).

---

## 2. File Responsibilities

### `index.html`

- Declares the full DOM structure: navbar, seven panel sections (Connection, System,
  Models, Workers, Jobs, Artifacts, Events).
- Each panel contains form elements (inputs, selects, textareas, buttons) and a `<pre>`
  or `<div>` response display area.
- Links `styles.css` (in `<head>`) and `app.js` (as `<script defer src="app.js">`).
- No inline scripts. No inline styles.
- All interactive element IDs are stable and referenced by `app.js` via
  `document.getElementById`.

### `app.js`

Single non-module script. Contains all application logic grouped into named sections
separated by banner comments:

```
// ── CONFIG ──────────────────────────────────────────────────────────────────
// ── STATE ───────────────────────────────────────────────────────────────────
// ── TEMPLATES ───────────────────────────────────────────────────────────────
// ── UTILITIES ───────────────────────────────────────────────────────────────
// ── API CLIENT ──────────────────────────────────────────────────────────────
// ── WEBSOCKET ───────────────────────────────────────────────────────────────
// ── PANEL: CONNECTION ───────────────────────────────────────────────────────
// ── PANEL: SYSTEM ───────────────────────────────────────────────────────────
// ── PANEL: MODELS ───────────────────────────────────────────────────────────
// ── PANEL: WORKERS ──────────────────────────────────────────────────────────
// ── PANEL: JOBS ─────────────────────────────────────────────────────────────
// ── PANEL: ARTIFACTS ────────────────────────────────────────────────────────
// ── PANEL: EVENTS ───────────────────────────────────────────────────────────
// ── INIT ────────────────────────────────────────────────────────────────────
```

**TEMPLATES section** — two constant strings and one helper:
- `TEMPLATE_ZIT` — string containing the canonical ZiT `SubmitJobRequest` JSON
  (graph + settings), formatted with 2-space indentation, as defined in
  `ANVILML_TESTUI_DESIGN.md §6.1`.
- `TEMPLATE_SDXL` — string containing the canonical SDXL `SubmitJobRequest` JSON,
  as defined in `ANVILML_TESTUI_DESIGN.md §6.2`.
- `getTemplate(pipeline)` — returns `TEMPLATE_ZIT` when `pipeline === 'zit'`,
  `TEMPLATE_SDXL` when `pipeline === 'sdxl'`.

**API Client section** — `async function apiFetch(path, options)`:
- Prepends the configured base URL.
- Returns `{ ok: boolean, status: number, data: any }`.
- Handles: 204 No Content (returns `{ ok: true, status: 204, data: { status: "deleted" } }`
  without calling `resp.json()`), empty-body 2xx (returns a synthetic `{ status: "ok" }`
  object if `resp.json()` throws on an empty body), network errors (`{ ok: false, status: 0,
  data: { error: "network_error", message: e.message } }`).
- Callers display `data` in their response area; they never call `fetch()` directly.

**WebSocket section** — manages a single `WebSocket` instance:
- `wsConnect()`: constructs the URL from the base URL (replacing `http(s)://` with
  `ws(s)://`), attaches `onopen`, `onmessage`, `onerror`, `onclose` handlers.
- `wsDisconnect()`: calls `ws.close()` if open and not already closing.
- `onmessage` handler: parses JSON, checks the `event` field against the active filter
  set, appends to the log if not filtered, increments the per-type counter.

**INIT section** — runs after DOM is ready:
- Reads `localStorage.getItem("anvilml_base_url")` and populates the base URL input.
- Populates `#jobs-body` with `TEMPLATE_ZIT` (default pipeline).
- Attaches all event listeners (button clicks, input changes, select changes).

### `styles.css`

CSS custom properties at `:root` define the colour palette, font stack, and spacing scale.
No CSS preprocessor. No external font CDN (system font fallback only).

---

## 3. State Model

All application state lives in plain JavaScript variables (no framework reactivity):

| Variable | Type | Description |
|---|---|---|
| `baseUrl` | `string` | Current AnvilML base URL |
| `ws` | `WebSocket \| null` | Active WebSocket connection |
| `wsFilterSet` | `Set<string>` | Active event type filters |
| `wsCounters` | `Record<string, number>` | Per-type event counters |
| `wsAutoScroll` | `boolean` | Whether the event log auto-scrolls |
| `lastArtifactUrl` | `string \| null` | Last blob object URL (for revocation) |

No state is shared between panel sections. Each panel reads DOM inputs directly at
interaction time.

---

## 4. DOM ID Conventions

All element IDs use kebab-case with a panel prefix:

```
base-url                  // connection panel: base URL input
connect-btn               // connection panel: connect button
conn-status               // connection panel: status display
conn-response             // connection panel: response area

sys-info-btn              // system panel: get hardware info button
sys-env-btn               // system panel: get env report button
sys-versions-btn          // system panel: get versions button
sys-response              // system panel: shared response area

models-kind               // models panel: kind filter select
models-list-btn           // models panel: list button
models-id                 // models panel: model ID input
models-get-btn            // models panel: get by ID button
models-rescan-btn         // models panel: rescan button
models-response           // models panel: response area

workers-list-btn          // workers panel: list button
workers-id                // workers panel: worker ID input
workers-restart-btn       // workers panel: restart button
workers-response          // workers panel: response area

jobs-pipeline             // jobs panel: pipeline selector (select: zit | sdxl)
jobs-reset-btn            // jobs panel: reset textarea to selected template
jobs-body                 // jobs panel: request body textarea (pre-filled JSON)
jobs-submit-btn           // jobs panel: submit POST /v1/jobs
jobs-status-filter        // jobs panel: status filter select for list
jobs-list-btn             // jobs panel: list jobs
jobs-job-id               // jobs panel: job ID input (shared by get/cancel/delete)
jobs-get-btn              // jobs panel: get single job
jobs-cancel-btn           // jobs panel: cancel job
jobs-delete-btn           // jobs panel: delete single job
jobs-bulk-status          // jobs panel: bulk clear status select
jobs-bulk-clear-btn       // jobs panel: bulk clear
jobs-response             // jobs panel: response area

artifacts-job-id          // artifacts panel: job_id filter input
artifacts-list-btn        // artifacts panel: list button
artifacts-hash            // artifacts panel: hash input
artifacts-fetch-btn       // artifacts panel: fetch image button
artifacts-response        // artifacts panel: response/image area (div)

ws-connect-btn            // events panel: connect button
ws-disconnect-btn         // events panel: disconnect button
ws-status                 // events panel: status indicator
ws-auto-scroll            // events panel: auto-scroll checkbox
ws-clear-btn              // events panel: clear log button
ws-log                    // events panel: event log container
ws-counters               // events panel: counters display
ws-filter-job-queued      // events panel: filter checkbox
ws-filter-job-started     // events panel: filter checkbox
ws-filter-job-progress    // events panel: filter checkbox
ws-filter-job-image-ready // events panel: filter checkbox
ws-filter-job-completed   // events panel: filter checkbox
ws-filter-job-failed      // events panel: filter checkbox
ws-filter-job-cancelled   // events panel: filter checkbox
ws-filter-worker-status   // events panel: filter checkbox
ws-filter-system-stats    // events panel: filter checkbox
ws-filter-provisioning-progress // events panel: filter checkbox
```

---

## 5. Jobs Panel — Textarea-based POST Flow

```
User selects pipeline (zit | sdxl)
  │
  ▼
#jobs-pipeline change → getTemplate(pipeline) → #jobs-body.value = template string

User edits #jobs-body textarea freely
  │
  ▼
User clicks #jobs-submit-btn
  │
  ▼
handleJobSubmit():
  1. raw = #jobs-body.value
  2. try { parsed = JSON.parse(raw) } catch → showResponse(error "json_parse_error"), STOP
  3. apiFetch("/v1/jobs", { method:"POST",
                            headers:{"Content-Type":"application/json"},
                            body: raw })          ← raw string, not re-serialised
  4. on 202: auto-populate #jobs-job-id with data.job_id
  5. showResponse("jobs-response", data, ok)
```

The raw textarea string is sent as the POST body without re-serialisation, preserving
any intentional corruption the operator may have introduced for negative testing.

---

## 6. Dependency Graph

```
index.html
  └── styles.css   (no dependencies)
  └── app.js       (no dependencies)
        └── browser fetch API  (built-in)
        └── browser WebSocket  (built-in)
        └── localStorage       (built-in)
```

`package.json` has no `dependencies`. `devDependencies` contains only:

```json
{
  "devDependencies": {
    "serve": "^14.2.0"
  }
}
```

---

## 7. Serving

```bash
npm install        # installs serve into node_modules (once)
npm run serve      # npx serve -l 8848 .
```

`npm run serve` starts the `serve` static file server on port 8848, rooted at the
repository directory. The browser loads `http://localhost:8848/index.html`.

No hot-reload, no build output, no watch mode. File changes are picked up on browser
refresh.

---

## 8. Error Propagation Contract

```
User action
  │
  ▼
Panel handler (e.g. handleJobSubmit)
  │
  ├── local validation (empty ID, JSON parse error)
  │     └── showResponse(elementId, {error, message}, false) — no fetch issued
  │
  └── apiFetch(path, options)   ← always returns {ok, status, data}; never throws
        │
        ▼
        Panel handler writes data to response <pre>
        if !ok → applies .status-error CSS class to response area
```

WebSocket errors are written to the `ws-log` container with an `[ERROR]` prefix.

---

## 9. Package Versioning

`package.json` version follows `MAJOR.MINOR.PATCH`. The Forge increments the patch
digit on every commit that modifies source files (`index.html`, `app.js`, `styles.css`).
`MAJOR` and `MINOR` are changed only by Dryw. There is no workspace release version
concept (single-package repo).
