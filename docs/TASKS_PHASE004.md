# Tasks: Phase 004 — Artifacts Panel & Image Rendering

| Field | Value |
|---|---|
| Phase | 004 |
| Status | Draft |
| Project | anvilml-testui |
| Depends on phases | 1, 2, 3 |
| Authored | 2026-06-09 |

---

## Overview

Phase 004 implements the Artifacts panel. It covers listing artifacts (optionally filtered by
`job_id`) and fetching a specific artifact by its content-addressable hash. Unlike all other
endpoints, `GET /v1/artifacts/:hash` returns raw PNG bytes rather than JSON. This requires a
separate fetch path (`apiFetchBlob`) that uses `URL.createObjectURL` to render the image inline
as an `<img>` element.

This phase depends on Phase 003 because the primary use case is: submit a job, wait for
completion (visible via Phase 005 Events panel, or by polling `GET /v1/jobs/:id`), then fetch
the produced artifact. The artifact hash appears in the job's response (via the Events panel
`job.image_ready` event which carries `artifact_hash`).

At phase end the operator can list all artifacts, filter by job, and view generated images
inline in the browser without leaving the TestUI.

---

## Group Reference

| Group | Subsystem | Tasks | Summary |
|---|---|---|---|
| A | Artifacts panel | P4-A1 | Artifacts panel HTML form elements |
| B | Blob fetch & image render | P4-B1 | `apiFetchBlob`, Artifacts panel handlers, inline image render |

---

## Prerequisites

Phase 003 is complete and committed:
- `apiFetch` handles 204 No Content.
- Jobs panel functional (needed to produce artifacts for testing).
- Artifacts panel stub IDs in `index.html`.
- `// ── PANEL: ARTIFACTS ──` banner section in `app.js`.

---

## Interfaces and Contracts

| Contract document | Relevant to tasks | What must match |
|---|---|---|
| AnvilML `ARCHITECTURE.md §7` | P4-B1 | `GET /v1/artifacts` returns JSON array; `GET /v1/artifacts/:hash` returns PNG bytes |
| AnvilML `ANVILML_DESIGN.md §4.2` | P4-B1 | `ArtifactMeta` fields: `hash`, `job_id`, `width`, `height`, `format`, `seed`, `steps`, `prompt`, `created_at` |
| `ARCHITECTURE.md §4` | P4-A1 | DOM IDs: `artifacts-job-id`, `artifacts-list-btn`, `artifacts-hash`, `artifacts-fetch-btn`, `artifacts-response` |

---

## Task Descriptions

### Group A — Artifacts Panel HTML

#### P4-A1: index.html: Artifacts panel form elements

**Goal:** Replace the Artifacts panel stub in `index.html` with the three form elements and
the combined response/image display area.

**Files to create or modify:**
- `index.html` — replace Artifacts stub with: `#artifacts-job-id` (text input, placeholder
  "job UUID — blank for all"), `#artifacts-list-btn` (button "List Artifacts"), `#artifacts-hash`
  (text input, placeholder "artifact hash (SHA256 hex)"), `#artifacts-fetch-btn` (button "Fetch
  Image"), `#artifacts-response` (`<div>` — not `<pre>`, because it will contain both JSON text
  and `<img>` elements).

**Key implementation notes:**
- `#artifacts-response` must be a `<div>`, not a `<pre>`, because Phase 004 injects `<img>`
  elements into it dynamically. Apply the same `.response` CSS class as the `<pre>` elements
  elsewhere so styling is consistent.
- The panel does not need a separate image display area; the response div serves both JSON
  display (for list results) and image display (for fetch results). The handler clears and
  repopulates it on each action.

**Acceptance criterion:** `python3 -c "import re; ids=re.findall(r'id=\"([^\"]+)\"', open('index.html').read()); [print(id) for id in ['artifacts-job-id','artifacts-list-btn','artifacts-hash','artifacts-fetch-btn','artifacts-response'] if id not in ids]"` prints nothing.

---

### Group B — Blob Fetch & Image Rendering

#### P4-B1: app.js: apiFetchBlob, artifact list and fetch handlers

**Goal:** Add `apiFetchBlob` to the API CLIENT section and implement both Artifacts panel
handlers in `app.js`.

**Files to create or modify:**
- `app.js` — add `apiFetchBlob(path)` in API CLIENT section; implement
  `handleArtifactsList()` and `handleArtifactsFetch()` in PANEL: ARTIFACTS section;
  wire buttons in INIT.

**Key implementation notes:**
- `apiFetchBlob(path)`: constructs URL as `baseUrl + path`; calls `fetch(url)`; on non-2xx
  returns `{ ok: false, status: resp.status, blob: null }`; on 2xx calls `resp.blob()` and
  returns `{ ok: true, status: resp.status, blob }`. On network error returns
  `{ ok: false, status: 0, blob: null, error: e.message }`.
- `handleArtifactsList()`: reads `#artifacts-job-id`; calls
  `apiFetch("/v1/artifacts" + (jobId ? "?job_id=" + jobId : ""))`; on success, clears
  `#artifacts-response` and sets `textContent` to `JSON.stringify(data, null, 2)`;
  on error, sets inner HTML to an error-styled `<pre>`.
- `handleArtifactsFetch()`: reads `#artifacts-hash`; validates non-empty; calls
  `apiFetchBlob("/v1/artifacts/" + hash)`; on success, creates `URL.createObjectURL(blob)`,
  creates an `<img>` element with that URL as `src`, sets `img.style.maxWidth = "100%"`, sets
  `img.alt = hash`; clears `#artifacts-response` and appends the `<img>`; on error, shows
  error text. The `objectURL` must be revoked on the next successful fetch (store as a module
  variable `let lastArtifactUrl = null`; call `URL.revokeObjectURL(lastArtifactUrl)` before
  creating the new one).
- When `#artifacts-hash` is empty, show an inline error in `#artifacts-response`, do not fetch.
- The list handler displays JSON text. The fetch handler displays an image. Both write to
  the same `#artifacts-response` div; each handler clears the div before writing.
  Use `element.textContent = ...` for JSON (safe against XSS) and `element.appendChild(img)`
  for the image.

**Acceptance criterion:** `node --check app.js` exits 0. Manual: run a mock job to completion
in AnvilML; list artifacts → JSON array with at least one entry; copy the hash from the array;
paste into `#artifacts-hash`; click Fetch Image → the mock black PNG renders inline.

---

## Phase Acceptance Criteria

```bash
# Syntax check
node --check app.js

# Verify artifacts IDs and that artifacts-response is a div (not pre)
python3 -c "
import re
html = open('index.html').read()
ids = re.findall(r'id=\"([^\"]+)\"', html)
for rid in ['artifacts-job-id','artifacts-list-btn','artifacts-hash','artifacts-fetch-btn','artifacts-response']:
    assert rid in ids, f'Missing: {rid}'
# Verify artifacts-response is on a div element
assert re.search(r'<div[^>]+id=\"artifacts-response\"', html), 'artifacts-response must be a div'
print('PASS')
"

# Verify apiFetchBlob and handler functions exist
for fn in apiFetchBlob handleArtifactsList handleArtifactsFetch; do
  grep -q "function $fn" app.js && echo "PASS: $fn" || echo "FAIL: $fn missing"
done

# Verify URL.revokeObjectURL cleanup is present
grep -q "revokeObjectURL" app.js && echo "PASS: object URL cleanup present" || echo "FAIL: missing revokeObjectURL"

# Manual runnable proof
# Start AnvilML with ANVILML_WORKER_MOCK=1
# Submit a ZiT job and wait for Completed status (use GET /v1/jobs/:id)
# Artifacts panel: click List Artifacts → JSON array with artifact entry
# Note the hash value from the array
# Artifacts panel: paste hash into #artifacts-hash, click Fetch Image
# Confirm a black 1024x1024 PNG renders inline (mock mode produces a black image)
# Click Fetch Image again → previous objectURL revoked, new image rendered
```

---

## Known Constraints and Gotchas

- `GET /v1/artifacts/:hash` returns **raw PNG bytes**, not JSON. Using `apiFetch` (which
  calls `resp.json()`) on this endpoint will throw a parse error. `apiFetchBlob` is the
  separate code path for binary responses.
- In mock mode (`ANVILML_WORKER_MOCK=1`), artifact images are black 1024×1024 PNGs. This
  is the correct mock output — do not consider it a bug.
- `URL.createObjectURL` creates a blob URL that remains valid until explicitly revoked or
  the document is unloaded. Without `URL.revokeObjectURL`, each image fetch leaks a browser
  object URL. The `lastArtifactUrl` variable handles this for single-image display. If the
  list panel eventually renders artifact thumbnails, a separate revocation strategy will be
  needed — defer to a future retrofit phase.
- `element.textContent = JSON.stringify(...)` is safe against XSS for the list panel.
  Do not use `innerHTML` for JSON text display.
- `#artifacts-response` is a `<div>` in this phase even though other response areas are
  `<pre>`. The CSS `.response` class must apply to both `div.response` and `pre.response`
  selectors in `styles.css`. If this is not already the case from Phase 001, update
  `styles.css` in this phase.
