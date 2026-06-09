# Tasks: Phase 003 — Workers & Jobs Panels

| Field | Value |
|---|---|
| Phase | 003 |
| Status | Draft |
| Project | anvilml-testui |
| Depends on phases | 1, 2 |
| Authored | 2026-06-09 |

---

## Overview

Phase 003 implements the Workers panel (2 endpoints) and the Jobs panel (6 operations).
Job submission uses a textarea pre-filled with a canonical ZiT or SDXL `SubmitJobRequest`
JSON template. The operator edits the textarea directly and submits the raw content — no
field extraction. This means the 422 path is trivially testable by corrupting the JSON or
the graph structure before clicking Submit.

The TEMPLATES section of `app.js` holds two constant JSON strings (`TEMPLATE_ZIT`,
`TEMPLATE_SDXL`) and a `getTemplate(pipeline)` selector. Switching the pipeline selector
or clicking Reset loads the appropriate template into the textarea. The submit handler
parses the textarea content locally (surfacing JSON syntax errors before any network call)
then POSTs the raw string as the request body.

At phase end the operator can exercise the complete job lifecycle: submit a ZiT or SDXL
job with a real or mock model ID, watch its status via get, cancel it, delete it, bulk
clear by status, and list with filters.

---

## Group Reference

| Group | Subsystem | Tasks | Summary |
|---|---|---|---|
| A | Workers panel | P3-A1 | Workers panel HTML + list/restart handlers |
| B | Job templates | P3-B1 | `TEMPLATE_ZIT`, `TEMPLATE_SDXL`, `getTemplate` in `app.js` |
| C | Jobs panel HTML | P3-C1 | Jobs panel form elements in `index.html` |
| D | Jobs panel handlers | P3-D1 | All six Jobs panel handlers in `app.js` |

---

## Prerequisites

Phase 002 is complete and committed:
- `apiFetch` handles empty-body 2xx responses (established in P2-B1).
- `apiFetch` handles 204 No Content (established in P1-D1 — added to the initial scaffold).
- `showResponse` utility is available.
- Workers and Jobs panel stub IDs are in `index.html` from Phase 001.
- `// ── PANEL: WORKERS ──`, `// ── PANEL: JOBS ──`, and `// ── TEMPLATES ──` banner
  sections exist in `app.js` as stubs.

---

## Interfaces and Contracts

| Contract document | Relevant to tasks | What must match |
|---|---|---|
| AnvilML `ARCHITECTURE.md §7` | P3-A1, P3-D1 | Endpoint paths and HTTP methods |
| AnvilML `ANVILML_DESIGN.md §14.6` | P3-B1 | Node types, input slot names, output slot names — ZiT and SDXL graphs |
| AnvilML `ANVILML_DESIGN.md §4.1` | P3-B1 | `JobSettings` field names and defaults |
| `ANVILML_TESTUI_DESIGN.md §6` | P3-B1, P3-C1 | Template JSON content verbatim; ZiT defaults steps=8 guidance=0.0, SDXL steps=20 guidance=7.5 |
| `ARCHITECTURE.md §4` | P3-A1, P3-C1 | DOM IDs for Workers and Jobs panels |
| `ARCHITECTURE.md §5` | P3-C1, P3-D1 | Textarea-based POST flow |

---

## Task Descriptions

### Group A — Workers Panel

#### P3-A1: app.js + index.html: Workers panel — list and restart handlers

**Goal:** Replace the Workers panel stub in `index.html` and implement `handleWorkersList`
and `handleWorkersRestart` in `app.js`.

**Files to create or modify:**
- `index.html` — replace Workers stub with: `#workers-list-btn` (button "List Workers"),
  `#workers-id` (text input, placeholder "worker ID e.g. worker-0"), `#workers-restart-btn`
  (button "Restart Worker"), `#workers-response` (pre).
- `app.js` — within `// ── PANEL: WORKERS ──`: `handleWorkersList()` calls
  `apiFetch("/v1/workers")`; `handleWorkersRestart()` reads `#workers-id`, validates
  non-empty (calls `showResponse` with local error if blank), calls
  `apiFetch("/v1/workers/" + id + "/restart", { method: "POST" })`. Both call
  `showResponse("workers-response", data, ok)`. Wire both in INIT under `// Workers panel`.

**Key implementation notes:**
- Worker IDs follow the pattern `worker-{device_index}` (e.g. `worker-0`, `worker-1`).
  Use this as the placeholder text on `#workers-id`.
- `POST /v1/workers/:id/restart` may return 202 with no body — handled by the existing
  `apiFetch` empty-body guard.
- Empty `#workers-id` must show inline error, not issue a fetch.

**Acceptance criterion:** `node --check app.js` exits 0. Manual: List Workers returns JSON
array; restart `worker-0` (if present) returns 202.

---

### Group B — Job Templates

#### P3-B1: app.js: TEMPLATE_ZIT, TEMPLATE_SDXL, getTemplate

**Goal:** Implement the TEMPLATES section of `app.js` with two constant JSON template
strings and the `getTemplate` selector function.

**Files to create or modify:**
- `app.js` — implement `TEMPLATE_ZIT`, `TEMPLATE_SDXL`, and `getTemplate(pipeline)`
  in the `// ── TEMPLATES ──` section.

**Key implementation notes:**
- `TEMPLATE_ZIT` is a JavaScript string containing the ZiT `SubmitJobRequest` JSON exactly
  as specified in `ANVILML_TESTUI_DESIGN.md §6.1`. Format with `JSON.stringify(obj, null, 2)`
  so the textarea displays human-readable JSON. The object must have exactly two top-level
  keys: `"graph"` (with `"nodes"` array of 5 nodes) and `"settings"`.
- Node types and slot names must exactly match `ANVILML_DESIGN.md §14.6`:
  `ZitLoadPipeline`, `ZitTextEncode`, `ZitSampler`, `ZitDecode`, `SaveImage`.
  Output slots: `pipeline`, `conditioning`, `latents`, `seed`, `image`.
- `TEMPLATE_SDXL` follows the same pattern with `Sdxl` prefix types; `SdxlTextEncode`
  adds `"negative_prompt": ""` input; `SdxlSampler` adds `"guidance_scale": 7.5` input.
- ZiT defaults: `steps=8`, `guidance_scale=0.0` in both the sampler node inputs and the
  `settings` object. SDXL defaults: `steps=20`, `guidance_scale=7.5`.
- `seed` is `-1` in both templates (random, resolved by worker).
- `getTemplate(pipeline)`: returns `TEMPLATE_ZIT` if `pipeline === 'zit'`,
  `TEMPLATE_SDXL` if `pipeline === 'sdxl'`, else `TEMPLATE_ZIT` as fallback.
- The template strings are defined as `const` at module scope so they are available to
  `handleJobSubmit` (for a future Reset button) and to the INIT section.

**Acceptance criterion:**
```bash
node -e "
const fs = require('fs');
eval(fs.readFileSync('app.js','utf8'));
// Verify templates parse as valid JSON
const zit = JSON.parse(TEMPLATE_ZIT);
console.assert(zit.graph.nodes.length === 5, 'ZiT must have 5 nodes');
console.assert(zit.graph.nodes[0].type === 'ZitLoadPipeline');
console.assert(zit.graph.nodes[4].type === 'SaveImage');
console.assert(zit.settings.steps === 8, 'ZiT steps must be 8');
console.assert(zit.settings.guidance_scale === 0.0, 'ZiT guidance must be 0.0');
const sdxl = JSON.parse(TEMPLATE_SDXL);
console.assert(sdxl.graph.nodes.length === 5, 'SDXL must have 5 nodes');
console.assert(sdxl.graph.nodes[0].type === 'SdxlLoadPipeline');
console.assert(sdxl.settings.steps === 20, 'SDXL steps must be 20');
console.assert(sdxl.settings.guidance_scale === 7.5, 'SDXL guidance must be 7.5');
console.assert(getTemplate('zit') === TEMPLATE_ZIT);
console.assert(getTemplate('sdxl') === TEMPLATE_SDXL);
console.log('PASS');
"
```

---

### Group C — Jobs Panel HTML

#### P3-C1: index.html: Jobs panel — full form elements

**Goal:** Replace the Jobs panel stub in `index.html` with the complete set of form
elements for all six job operations.

**Files to create or modify:**
- `index.html` — replace Jobs stub with all Jobs panel elements per `ARCHITECTURE.md §4`.

**Key implementation notes:**
- **Submission sub-section:** `#jobs-pipeline` (select: option `zit` "ZiT (distilled)",
  option `sdxl` "SDXL"; default `zit`), `#jobs-reset-btn` (button "Reset Template"),
  `#jobs-body` (textarea; rows=20; monospace font; no default value — populated by INIT
  and by pipeline change). Label above textarea: "Request body (JSON)". `#jobs-submit-btn`
  (button "Submit Job").
- **List sub-section:** `#jobs-status-filter` (select: option `""` "all statuses",
  `queued`, `running`, `completed`, `failed`, `cancelled`), `#jobs-list-btn` (button
  "List Jobs").
- **Single job sub-section:** `#jobs-job-id` (text input, placeholder "job UUID"),
  `#jobs-get-btn` (button "Get Job"), `#jobs-cancel-btn` (button "Cancel Job"),
  `#jobs-delete-btn` (button "Delete Job").
- **Bulk clear sub-section:** `#jobs-bulk-status` (select: `completed`, `failed`,
  `cancelled`, `all`), `#jobs-bulk-clear-btn` (button "Bulk Clear").
- `#jobs-response` (pre) at the bottom of the panel, shared by all job operations.
- Use `<hr>` or a `.panel-section` CSS class to visually separate the four sub-sections.

**Acceptance criterion:**
```bash
python3 -c "
import re
html = open('index.html').read()
ids = re.findall(r'id=\"([^\"]+)\"', html)
required = ['jobs-pipeline','jobs-reset-btn','jobs-body','jobs-submit-btn',
            'jobs-status-filter','jobs-list-btn','jobs-job-id','jobs-get-btn',
            'jobs-cancel-btn','jobs-delete-btn','jobs-bulk-status',
            'jobs-bulk-clear-btn','jobs-response']
missing = [r for r in required if r not in ids]
assert not missing, f'Missing: {missing}'
# Verify jobs-body is a textarea
assert re.search(r'<textarea[^>]+id=\"jobs-body\"', html) or \
       re.search(r'id=\"jobs-body\"[^>]*>', html) and '<textarea' in html, \
       'jobs-body must be a textarea'
print('PASS')
"
```

---

### Group D — Jobs Panel Handlers

#### P3-D1: app.js: all six Jobs panel handlers

**Goal:** Implement all six Jobs panel handler functions in `app.js` within the
`// ── PANEL: JOBS ──` section. Wire all buttons and the pipeline selector in INIT.

**Files to create or modify:**
- `app.js` — six handler functions plus INIT wiring.

**Key implementation notes:**
- `handleJobSubmit()`:
  1. Read `raw = document.getElementById('jobs-body').value.trim()`.
  2. Try `JSON.parse(raw)` — on `SyntaxError` call
     `showResponse('jobs-response', { error: 'json_parse_error', message: e.message }, false)`
     and return. Do NOT issue a fetch for malformed JSON.
  3. Call `apiFetch('/v1/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw })`.
     Send `raw` (the original string), not `JSON.stringify(parsed)`.
  4. On `ok && data.job_id`: set `document.getElementById('jobs-job-id').value = data.job_id`.
  5. Call `showResponse('jobs-response', data, ok)`.
- `handleJobReset()`: reads `#jobs-pipeline` value, calls `getTemplate(pipeline)`, sets
  `#jobs-body.value` to the result.
- `handleJobsList()`: reads `#jobs-status-filter`; calls
  `apiFetch('/v1/jobs' + (status ? '?status=' + status : ''))`.
- `handleJobsGet()`: validates `#jobs-job-id` non-empty; calls `apiFetch('/v1/jobs/' + id)`.
- `handleJobsCancel()`: validates `#jobs-job-id` non-empty; calls
  `apiFetch('/v1/jobs/' + id + '/cancel', { method: 'POST' })`.
- `handleJobsDelete()`: validates `#jobs-job-id` non-empty; calls
  `apiFetch('/v1/jobs/' + id, { method: 'DELETE' })`.
- `handleJobsBulkClear()`: reads `#jobs-bulk-status`; calls
  `apiFetch('/v1/jobs?status=' + status, { method: 'DELETE' })`.
- All handlers except `handleJobSubmit` write to `#jobs-response` via `showResponse`.
- INIT wiring:
  - `#jobs-body.value = getTemplate('zit')` on load.
  - `#jobs-pipeline` `change` event → `handleJobReset()`.
  - `#jobs-reset-btn` `click` → `handleJobReset()`.
  - `#jobs-submit-btn` `click` → `handleJobSubmit()`.
  - `#jobs-list-btn` `click` → `handleJobsList()`.
  - `#jobs-get-btn` `click` → `handleJobsGet()`.
  - `#jobs-cancel-btn` `click` → `handleJobsCancel()`.
  - `#jobs-delete-btn` `click` → `handleJobsDelete()`.
  - `#jobs-bulk-clear-btn` `click` → `handleJobsBulkClear()`.

**Acceptance criterion:** `node --check app.js` exits 0. Manual verification:
1. Open TestUI; Jobs panel textarea shows ZiT template JSON.
2. Switch pipeline to SDXL; textarea updates to SDXL template.
3. Click Reset; textarea resets to SDXL template (unchanged since already SDXL).
4. Corrupt the JSON (delete a brace); click Submit — local parse error appears, no network request.
5. Restore valid JSON with a real or mock model ID; click Submit — 202 returned, `#jobs-job-id`
   auto-populates.
6. Click Get Job — Queued or Running status returned.
7. Click Cancel Job — 200 returned.
8. Click Delete Job — 204 returned.
9. Click Bulk Clear with status=all — jobs removed.

---

## Phase Acceptance Criteria

```bash
# Syntax check
node --check app.js

# All Workers and Jobs panel IDs present
python3 -c "
import re
html = open('index.html').read()
ids = re.findall(r'id=\"([^\"]+)\"', html)
required = [
    'workers-list-btn','workers-id','workers-restart-btn','workers-response',
    'jobs-pipeline','jobs-reset-btn','jobs-body','jobs-submit-btn',
    'jobs-status-filter','jobs-list-btn','jobs-job-id','jobs-get-btn',
    'jobs-cancel-btn','jobs-delete-btn','jobs-bulk-status',
    'jobs-bulk-clear-btn','jobs-response',
]
missing = [r for r in required if r not in ids]
assert not missing, f'Missing IDs: {missing}'
print('PASS: all IDs present')
"

# Verify template correctness
node -e "
eval(require('fs').readFileSync('app.js','utf8'));
const zit = JSON.parse(TEMPLATE_ZIT);
console.assert(zit.graph.nodes.length === 5);
console.assert(zit.settings.steps === 8);
console.assert(zit.settings.guidance_scale === 0.0);
const sdxl = JSON.parse(TEMPLATE_SDXL);
console.assert(sdxl.graph.nodes.length === 5);
console.assert(sdxl.settings.steps === 20);
console.assert(sdxl.settings.guidance_scale === 7.5);
console.log('PASS: templates valid');
"

# Verify all handler functions exist
for fn in handleWorkersList handleWorkersRestart \
          handleJobReset handleJobSubmit handleJobsList handleJobsGet \
          handleJobsCancel handleJobsDelete handleJobsBulkClear; do
  grep -q "function $fn" app.js && echo "PASS: $fn" || echo "FAIL: $fn missing"
done

# Manual runnable proof
# Start AnvilML with ANVILML_WORKER_MOCK=1
# Open http://localhost:8848
# Workers: List Workers → JSON array with worker-0 Idle
# Jobs: textarea shows ZiT JSON template; switch to SDXL → template updates
# Jobs: corrupt JSON (delete '{') → click Submit → local parse error, no fetch
# Jobs: reset template → valid JSON restored
# Jobs: replace "<model_id>" with any string (mock accepts anything)
# Jobs: click Submit → 202, job_id auto-populates #jobs-job-id
# Jobs: click Get Job → Queued or Running
# Jobs: click Cancel Job → 200
# Jobs: click List Jobs status=cancelled → job appears
# Jobs: click Delete Job → 204
# Jobs: click Bulk Clear status=all → empty list
```

---

## Known Constraints and Gotchas

- `handleJobSubmit` sends the raw textarea string as the POST body. This is intentional.
  Re-serialising via `JSON.stringify(JSON.parse(raw))` would defeat the purpose of allowing
  intentional corruption for 422 testing. The local `JSON.parse` call is only for detecting
  syntax errors before hitting the network — if it passes, send `raw`.
- `DELETE /v1/jobs/:id` returns **204 No Content** — `apiFetch` must not call `resp.json()`
  on it. Implemented in Phase 001 (`P1-D1`); verify it handles this case.
- `DELETE /v1/jobs?status=<status>` also returns 204 for bulk clear; same guard applies.
- `POST /v1/jobs/:id/cancel` on an already-terminal job returns 409 Conflict. The error
  body should display normally.
- In mock mode (`ANVILML_WORKER_MOCK=1`), any non-empty string is accepted as a model ID.
  In real mode the model ID must be a known registry ID (16 hex chars of SHA256 of path).
  The UI passes it through unchanged — validation is the server's responsibility.
- `#jobs-body` textarea uses a monospace font (`.jobs-body` CSS rule pointing to the same
  font stack as `.response`). If the CSS class is not applied, it will use the body font
  which is harder to read for JSON. Confirm in `styles.css`.
