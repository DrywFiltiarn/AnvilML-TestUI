# ANVILML_TESTUI_DESIGN.md — Functional & Technical Design

**Repository:** `AnvilML-TestUI` (`https://github.com/DrywFiltiarn/AnvilML-TestUI.git`)
**Project key (repos.json):** `anvilml-testui`
**Version:** Rev 2 — 2026-06-09
**Status:** Draft

---

## 1. Purpose

AnvilML-TestUI is a minimalist, dependency-free web UI for exercising every capability
exposed by the AnvilML backend over its REST and WebSocket APIs. It is a developer tool,
not an end-user product.

It exists because:

- AnvilML runs headless by default. Verifying endpoints during development requires either
  `curl` pipelines or a browser UI.
- The formal reference frontend (BloomeryUI) is a separate project with its own development
  cycle. A lightweight alternative is needed to test backend behaviour without depending on
  BloomeryUI being operational.
- The Forge ACT agents need a known-good client to verify end-to-end behaviour of phases
  that involve the REST/WS surface.

---

## 2. Relationship to Other Components

```
SindriStudio (not involved here)

AnvilML backend  ←──────── AnvilML-TestUI
  port 8488                   port 8848
  REST /v1/*                  served by: npm serve
  WS   /v1/events             vanilla HTML/JS — no build step
```

AnvilML-TestUI is an independent static application. It communicates with AnvilML over
the network exactly as BloomeryUI does. AnvilML does not start or serve AnvilML-TestUI.

---

## 3. Constraints

| Constraint | Value |
|---|---|
| Tech stack | Vanilla HTML5 / CSS3 / ES2022 JavaScript — **no framework, no bundler, no build step** |
| Serve command | `npx serve -l 8848` (or `npm run serve` alias in `package.json`) |
| AnvilML target | `http://localhost:8488` (configurable in the UI at runtime) |
| Browser support | Latest Chrome and Firefox only |
| Authentication | None (AnvilML exposes no auth in scope phases) |
| State persistence | `localStorage` for the configured AnvilML base URL only |
| External CDN | None — fully self-contained; no remote script dependencies |
| File structure | `index.html` + `app.js` + `styles.css` — three files, flat layout |

---

## 4. Functional Scope

Every endpoint listed in `ANVILML_DESIGN.md §7 / ARCHITECTURE.md §7` must be exercisable.
Coverage is organised into panels matching the AnvilML domain model.

### 4.1 Connection Panel

- Editable base URL field (default `http://localhost:8488`, persisted in `localStorage`).
- "Connect" button: issues `GET /health`, displays the response or an error.
- Connection status indicator (connected / disconnected / error).

### 4.2 System Panel

| Action | Endpoint |
|---|---|
| Get hardware info | `GET /v1/system` |
| Get env preflight report | `GET /v1/system/env` |
| Get component versions | `GET /v1/system/versions` |

Each action has a "Send" button and a JSON response display area.

### 4.3 Models Panel

| Action | Endpoint |
|---|---|
| List models (optional `?kind=` filter) | `GET /v1/models` |
| Get single model by ID | `GET /v1/models/:id` |
| Trigger rescan | `POST /v1/models/rescan` |

### 4.4 Workers Panel

| Action | Endpoint |
|---|---|
| List workers | `GET /v1/workers` |
| Restart worker (by ID) | `POST /v1/workers/:id/restart` |

### 4.5 Jobs Panel

| Action | Endpoint |
|---|---|
| Submit job | `POST /v1/jobs` |
| List jobs (optional `?status=` filter) | `GET /v1/jobs` |
| Get single job by ID | `GET /v1/jobs/:id` |
| Cancel job | `POST /v1/jobs/:id/cancel` |
| Delete single job | `DELETE /v1/jobs/:id` |
| Bulk clear jobs | `DELETE /v1/jobs?status=<status>` |

**Job submission uses a pre-filled JSON textarea.** A pipeline selector (`zit` / `sdxl`)
controls which canonical template is loaded into the textarea. A "Reset" button restores
the textarea to the default template for the selected pipeline. The textarea content is
submitted verbatim as the POST body — no field extraction, no client-side graph assembly.
This makes it trivial to test the 422 path by intentionally corrupting the JSON or the
graph structure.

The pre-filled ZiT template is a complete, valid `SubmitJobRequest` JSON object with
canonical node graph and default `JobSettings`. The pre-filled SDXL template likewise.
Both templates use `"<model_id>"` and `"<prompt>"` as placeholder strings that the
operator replaces before submitting.

### 4.6 Artifacts Panel

| Action | Endpoint |
|---|---|
| List artifacts (optional `?job_id=` filter) | `GET /v1/artifacts` |
| Fetch artifact as image | `GET /v1/artifacts/:hash` |

Fetched artifacts are rendered as `<img>` elements inline in the panel.

### 4.7 Events Panel (WebSocket)

- Connect / Disconnect buttons targeting `ws://[base-host]/v1/events`.
- Scrolling event log: each event displayed as a formatted JSON block with timestamp.
- Event type filter checkboxes: one per `WsEvent` variant
  (`job.queued`, `job.started`, `job.progress`, `job.image_ready`, `job.completed`,
  `job.failed`, `job.cancelled`, `worker.status`, `system.stats`, `provisioning.progress`).
- Message counter per event type.
- "Clear log" button.
- Auto-scroll toggle.
- Connection status indicator (open / closed / error).

---

## 5. UI Layout

Single-page application. No routing. Layout: fixed top navbar + scrollable main content area
with collapsible sections, one per panel (§4.1–§4.7).

Navigation bar contains:
- Project name "AnvilML TestUI"
- Connection status pill
- AnvilML version string (from last `/health` response)

Each section has:
- Header with section title and a collapse/expand toggle.
- Body containing forms and response display.

Response display areas show raw JSON, syntax-highlighted via a minimal inline
`JSON.stringify(…, null, 2)` with `<pre>` formatting. No third-party syntax highlighter.

---

## 6. Job Request Templates

Both templates are JavaScript constant strings (not assembled from form inputs). They are
pre-populated into `#jobs-body` when the pipeline selector changes or the Reset button is
clicked. The operator edits them freely before submitting.

### 6.1 ZiT template (`TEMPLATE_ZIT`)

```json
{
  "graph": {
    "nodes": [
      { "id": "n0", "type": "ZitLoadPipeline",  "inputs": { "model_id": "<model_id>" } },
      { "id": "n1", "type": "ZitTextEncode",    "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "prompt": "<prompt>" } },
      { "id": "n2", "type": "ZitSampler",       "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "conditioning": { "node_id": "n1", "output_slot": "conditioning" }, "steps": 8, "seed": -1 } },
      { "id": "n3", "type": "ZitDecode",        "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "latents": { "node_id": "n2", "output_slot": "latents" } } },
      { "id": "n4", "type": "SaveImage",        "inputs": { "image": { "node_id": "n3", "output_slot": "image" }, "prompt": "<prompt>", "seed": { "node_id": "n2", "output_slot": "seed" }, "steps": 8 } }
    ]
  },
  "settings": {
    "seed": -1,
    "steps": 8,
    "guidance_scale": 0.0,
    "width": 1024,
    "height": 1024
  }
}
```

### 6.2 SDXL template (`TEMPLATE_SDXL`)

```json
{
  "graph": {
    "nodes": [
      { "id": "n0", "type": "SdxlLoadPipeline", "inputs": { "model_id": "<model_id>" } },
      { "id": "n1", "type": "SdxlTextEncode",   "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "prompt": "<prompt>", "negative_prompt": "" } },
      { "id": "n2", "type": "SdxlSampler",      "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "conditioning": { "node_id": "n1", "output_slot": "conditioning" }, "steps": 20, "guidance_scale": 7.5, "seed": -1 } },
      { "id": "n3", "type": "SdxlDecode",       "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "latents": { "node_id": "n2", "output_slot": "latents" } } },
      { "id": "n4", "type": "SaveImage",        "inputs": { "image": { "node_id": "n3", "output_slot": "image" }, "prompt": "<prompt>", "seed": { "node_id": "n2", "output_slot": "seed" }, "steps": 20 } }
    ]
  },
  "settings": {
    "seed": -1,
    "steps": 20,
    "guidance_scale": 7.5,
    "width": 1024,
    "height": 1024
  }
}
```

Default values follow `ANVILML_DESIGN.md §14.6`: ZiT uses `steps=8, guidance_scale=0.0`
(CFG-free); SDXL uses `steps=20, guidance_scale=7.5`.

---

## 7. Error Handling

All fetch calls are wrapped in try/catch. Network errors, non-2xx responses, and
WebSocket errors are displayed inline in the relevant panel's response area in a visually
distinct error style (red border). No modal popups. No page reloads.

For job submission, if the textarea content is not valid JSON, a local parse error is shown
immediately without issuing a fetch. This is intentional — it distinguishes a client-side
JSON syntax error from a server-side 422 graph validation error.

`429` responses are shown with a "rate limited" label. `503` responses are shown with a
"service unavailable" label. All other error responses display the raw JSON body.

---

## 8. File Layout

```
AnvilML-TestUI/
├── index.html           # single HTML file; all panels defined here
├── app.js               # all application logic; vanilla ES2022, single file
├── styles.css           # all styles; dark theme, monospace-forward
├── package.json         # name, version, scripts: { "serve": "npx serve -l 8848 ." }
├── .gitignore           # node_modules/, .DS_Store
├── README.md
└── docs/
    ├── ANVILML_TESTUI_DESIGN.md   (this file)
    ├── ARCHITECTURE.md
    ├── ENVIRONMENT.md
    ├── PHASES.md
    ├── TASKS_PHASE001.md
    ├── TASKS_PHASE002.md
    ├── TASKS_PHASE003.md
    ├── TASKS_PHASE004.md
    └── TASKS_PHASE005.md
```

The `.forge/tasks/tasks_phase*.json` files live under `.forge/tasks/` in the repository root.

---

## 9. Visual Design Principles

- Dark background (`#0d1117` or similar) to match terminal aesthetics.
- Monospace font (`JetBrains Mono`, `Fira Code`, or system fallback `monospace`) for all
  response/log display and for the job body textarea.
- Minimal colour use: green for success/connected, red for error/disconnected, amber for
  in-progress/pending, white/light-grey for labels.
- No animations except a subtle blink on the WebSocket connection indicator.
- No images, no icons (Unicode symbols only: ▶ ■ ● ✓ ✗).
- Panels are collapsible; collapsed state is not persisted across reloads.

---

## 10. Conventions

- **No external dependencies at runtime.** `package.json` `dependencies` is empty.
  `devDependencies` contains only `serve` (for `npm run serve`).
- **No build step.** `npm run serve` directly serves the repository root. There is no
  `dist/` directory, no Webpack/Vite/Rollup, no transpilation.
- **No TypeScript.** Plain ES2022 JavaScript with JSDoc comments for type clarity.
- **Single source of truth for the AnvilML base URL:** the `<input id="base-url">` field,
  backed by `localStorage.getItem("anvilml_base_url")`.
- **No polling.** Live data comes exclusively from the WebSocket. REST calls are always
  user-initiated.
- **Textarea-based POST bodies.** All endpoints that accept a request body use a
  pre-filled `<textarea>` rather than individual form fields. The textarea is the
  single source of truth for what gets sent. This applies only to `POST /v1/jobs`
  (the only body-bearing endpoint in scope).
- **Version tracking:** `package.json` version is incremented on each Forge commit (patch
  digit only). There is no workspace release version concept (single-package repo).
