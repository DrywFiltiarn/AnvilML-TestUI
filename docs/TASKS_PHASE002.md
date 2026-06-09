# Tasks: Phase 002 — System & Models Panels

| Field | Value |
|---|---|
| Phase | 002 |
| Status | Draft |
| Project | anvilml-testui |
| Depends on phases | 1 |
| Authored | 2026-06-09 |

---

## Overview

Phase 002 implements the System and Models panels, covering six read-only GET endpoints and one
POST trigger (model rescan). These are the simplest endpoints in the AnvilML surface — they take
no request body (except rescan, which takes none either) and return structured JSON — making them
ideal for the first wave of panel implementation after the shell is in place.

This phase cannot begin until Phase 001 is complete because it relies on the `apiFetch` utility,
the `baseUrl` state variable, the `showResponse` helper, and the DOM IDs for the System and Models
panels that Phase 001 establishes.

At phase end the operator can interrogate the full hardware state, Python environment preflight,
component versions, model list, and trigger a rescan — all without touching the job or worker
surfaces.

---

## Group Reference

| Group | Subsystem | Tasks | Summary |
|---|---|---|---|
| A | System panel | P2-A1 | Three system endpoint handlers wired to the System panel stub |
| B | Models panel | P2-B1 | Three model endpoint handlers wired to the Models panel stub |

---

## Prerequisites

Phase 001 is complete and committed:
- `index.html` exists with all System panel IDs (`sys-info-btn`, `sys-env-btn`,
  `sys-versions-btn`, `sys-response`) and all Models panel IDs (`models-kind`,
  `models-list-btn`, `models-id`, `models-get-btn`, `models-rescan-btn`,
  `models-response`) as stubs.
- `app.js` exists with `apiFetch`, `showResponse`, `baseUrl` state, and empty
  `// ── PANEL: SYSTEM ──` and `// ── PANEL: MODELS ──` banner sections.
- `npm run serve` works.

---

## Interfaces and Contracts

| Contract document | Relevant to tasks | What must match |
|---|---|---|
| `ARCHITECTURE.md §4` | P2-A1, P2-B1 | DOM IDs used in handlers must match the ID table exactly |
| AnvilML `ARCHITECTURE.md §7` | P2-A1 | `GET /v1/system`, `GET /v1/system/env`, `GET /v1/system/versions` |
| AnvilML `ARCHITECTURE.md §7` | P2-B1 | `GET /v1/models`, `GET /v1/models/:id`, `POST /v1/models/rescan` |

---

## Task Descriptions

### Group A — System Panel

#### P2-A1: app.js + index.html: System panel — three endpoint handlers

**Goal:** Replace the System panel stub in `index.html` with full form elements, and
implement the three System panel handlers in `app.js`.

**Files to create or modify:**
- `index.html` — replace the System panel stub section with: `#sys-info-btn` (button "Get
  Hardware Info"), `#sys-env-btn` (button "Get Env Report"), `#sys-versions-btn` (button
  "Get Versions"), `#sys-response` (pre, shared response area for all three).
- `app.js` — within `// ── PANEL: SYSTEM ──`: implement `handleSysInfo()` calling
  `apiFetch("/v1/system")`, `handleSysEnv()` calling `apiFetch("/v1/system/env")`,
  `handleSysVersions()` calling `apiFetch("/v1/system/versions")`; each calls
  `showResponse("sys-response", data, ok)`. Wire buttons in INIT section.

**Key implementation notes:**
- All three handlers are structurally identical: `const { ok, data } = await apiFetch(path)`,
  then `showResponse(...)`. Factor if desired, but three explicit functions are also acceptable.
- `GET /v1/system/versions` may return `503` if provisioning is incomplete; the error body
  should display normally via `showResponse`.
- Add the three button wires to the INIT section immediately after the existing Connection
  panel wires, within a clearly commented block `// System panel`.

**Acceptance criterion:** Manual verification: start AnvilML, open TestUI, click each of the
three System buttons, confirm JSON responses appear in `#sys-response` without console errors.
`node --check app.js` exits 0.

---

### Group B — Models Panel

#### P2-B1: app.js + index.html: Models panel — list, get, rescan handlers

**Goal:** Replace the Models panel stub in `index.html` with full form elements, and
implement the three Models panel handlers in `app.js`.

**Files to create or modify:**
- `index.html` — replace the Models panel stub with: `#models-kind` (select with options
  `""` (all), `diffusion`, `vae`, `lora`, `controlnet`, `clip`, `unet`, `upscale`),
  `#models-list-btn` (button "List Models"), `#models-id` (text input, placeholder "model
  ID"), `#models-get-btn` (button "Get Model"), `#models-rescan-btn` (button "Trigger
  Rescan"), `#models-response` (pre).
- `app.js` — within `// ── PANEL: MODELS ──`: `handleModelsList()` calls
  `apiFetch("/v1/models" + (kind ? "?kind=" + kind : ""))` where `kind` is read from
  `#models-kind`; `handleModelsGet()` calls `apiFetch("/v1/models/" + id)` where `id` is
  read from `#models-id` (shows error in response area if input is empty);
  `handleModelsRescan()` calls `apiFetch("/v1/models/rescan", { method: "POST" })`.

**Key implementation notes:**
- `GET /v1/models` with no `?kind=` returns all models. Pass the query parameter only when
  the select value is non-empty.
- `GET /v1/models/:id` with an empty ID should not issue a fetch; instead call
  `showResponse("models-response", { error: "id_required", message: "Enter a model ID" }, false)`.
- `POST /v1/models/rescan` returns 202 with no body, or a JSON body. The `apiFetch` wrapper
  must handle a 202 with no body: if `resp.json()` throws (empty body), return `{ ok: true,
  status: 202, data: { status: "rescan triggered" } }`.

**Acceptance criterion:** Manual verification: drop a `.safetensors` file into AnvilML's model
directory, click Trigger Rescan, then click List Models and confirm the file appears.
`node --check app.js` exits 0.

---

## Phase Acceptance Criteria

```bash
# Syntax check
node --check app.js

# Verify all System panel IDs are in index.html
python3 -c "
import re
html = open('index.html').read()
ids = re.findall(r'id=\"([^\"]+)\"', html)
for rid in ['sys-info-btn', 'sys-env-btn', 'sys-versions-btn', 'sys-response',
            'models-kind', 'models-list-btn', 'models-id', 'models-get-btn',
            'models-rescan-btn', 'models-response']:
    assert rid in ids, f'Missing: {rid}'
print('PASS: all panel IDs present')
"

# Verify handler functions exist in app.js
for fn in handleSysInfo handleSysEnv handleSysVersions handleModelsList handleModelsGet handleModelsRescan; do
  grep -q "function $fn" app.js && echo "PASS: $fn defined" || echo "FAIL: $fn missing"
done

# Manual runnable proof
# Start AnvilML with --features mock-hardware or real instance
# Open http://localhost:8848
# System panel: click Get Hardware Info → JSON response with gpus array
# System panel: click Get Env Report → JSON response with preflight fields
# System panel: click Get Versions → JSON response with version fields
# Models panel: click List Models → JSON array (may be empty if no models)
# Models panel: select kind=diffusion, click List Models → filtered list
# Models panel: click Trigger Rescan → 202 response
```

---

## Known Constraints and Gotchas

- `GET /v1/system/versions` is added in AnvilML Phase 023. If testing against an AnvilML
  build before Phase 023, this button will return 404. This is expected and the error
  response should display correctly.
- `POST /v1/models/rescan` may return an empty 202 body. The `apiFetch` wrapper's handling
  of empty-body responses must be implemented in this phase (see P2-B1 implementation notes).
  This same pattern will be needed for other POST/DELETE endpoints in Phase 003.
- The `models-kind` select value is an empty string `""` when "all" is selected, not the
  string `"all"`. The handler must check for truthiness (`if (kind)`) not equality.
