# Plan Report: P3-A1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P3-A1                                             |
| Phase       | 003 — Workers & Jobs Panels                       |
| Description | Workers panel — list and restart handlers          |
| Depends on  | P1-D1, P2-B1 (Phase 001 & 002 complete)           |
| Project     | anvilml-testui                                    |
| Planned at  | 2026-06-09T21:30:00Z                              |
| Attempt     | 1                                                 |

## Objective

Replace the Workers panel stub in `index.html` with functional UI elements and implement `handleWorkersList` and `handleWorkersRestart` handler functions in `app.js`, wiring them in the INIT section. The two endpoints exercised are `GET /v1/workers` (list all workers) and `POST /v1/workers/:id/restart` (restart a specific worker by ID).

## Scope

### In Scope
- `index.html`: Replace Workers panel `<h3>Coming in Phase 003</h3>` stub with proper labels and elements — `#workers-list-btn` (button "List Workers"), `#workers-id` (text input, placeholder "worker-0"), `#workers-restart-btn` (button "Restart Worker"), `#workers-response` (pre).
- `app.js`: Implement `handleWorkersList()` in the `// ── PANEL: WORKERS ──` section — calls `apiFetch("/v1/workers")`, then `showResponse("workers-response", data, ok)`.
- `app.js`: Implement `handleWorkersRestart()` in the `// ── PANEL: WORKERS ──` section — reads `#workers-id`, validates non-empty (calls `showResponse` with local error if blank), calls `apiFetch("/v1/workers/" + id + "/restart", { method: "POST" })`, then `showResponse("workers-response", data, ok)`.
- `app.js`: Wire both button click listeners in the INIT section under `// Workers panel`.
- `node --check app.js` must exit 0.

### Out of Scope
- Jobs panel implementation (handled by P3-B1, P3-C1, P3-D1).
- Template constants (`TEMPLATE_ZIT`, `TEMPLATE_SDXL`, `getTemplate`) — handled by P3-B1.
- WebSocket events panel — Phase 005.
- Artifacts panel — Phase 004.
- Any CSS changes — existing response area styling in `styles.css` covers `pre#workers-response`.
- No new files created.
- No dependency additions.

## Approach

1. **Modify `index.html` Workers panel** (lines 51–59):
   - Remove `<h3>Coming in Phase 003</h3>`.
   - Add `<label for="workers-list-btn">Workers</label>` above the list button for visual grouping.
   - Change `#workers-list-btn` text from "List" to "List Workers".
   - Update `#workers-id` placeholder from "Worker ID" to "worker-0" (following the `worker-{device_index}` convention from the task description).
   - Change `#workers-restart-btn` text from "Restart" to "Restart Worker".
   - Keep `#workers-response` as `<pre>` — already correct.

2. **Implement `handleWorkersList()` in `app.js`** (within `// ── PANEL: WORKERS ──` section, replacing the stub comment at line 146):
   ```javascript
   async function handleWorkersList() {
     const { ok, data } = await apiFetch("/v1/workers");
     showResponse("workers-response", data, ok);
   }
   ```

3. **Implement `handleWorkersRestart()` in `app.js`** (following `handleWorkersList`):
   ```javascript
   async function handleWorkersRestart() {
     const id = document.getElementById("workers-id").value;
     if (!id) {
       showResponse("workers-response", { error: "id_required", message: "Enter a worker ID" }, false);
       return;
     }
     const { ok, data } = await apiFetch("/v1/workers/" + id + "/restart", { method: "POST" });
     showResponse("workers-response", data, ok);
   }
   ```

4. **Wire handlers in INIT** (append after the Models panel wiring block, before the closing `});` of `DOMContentLoaded`):
   ```javascript
   // Workers panel
   const workersListBtn = document.getElementById("workers-list-btn");
   if (workersListBtn) workersListBtn.addEventListener("click", handleWorkersList);

   const workersRestartBtn = document.getElementById("workers-restart-btn");
   if (workersRestartBtn) workersRestartBtn.addEventListener("click", handleWorkersRestart);
   ```

5. **Verify** by running `node --check app.js` — must exit 0.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `index.html` | Replace Workers panel stub with functional elements; update button text and placeholder |
| Modify | `app.js` | Implement `handleWorkersList()`, `handleWorkersRestart()`; wire click listeners in INIT |

No changes to `styles.css` — the existing `pre.response` and `pre#ws-log` CSS rules apply to `#workers-response` via the generic `pre` selector.

## Tests

| Test File | Test Name | What It Verifies |
|-----------|-----------|------------------|
| N/A (manual) | `node --check app.js` | Syntax correctness — exits 0 |
| N/A (manual) | DOM ID cross-check | All four Workers IDs (`workers-list-btn`, `workers-id`, `workers-restart-btn`, `workers-response`) present in `index.html` |
| N/A (manual) | Handler existence check | `grep -q "function handleWorkersList" app.js` and `grep -q "function handleWorkersRestart" app.js` both succeed |
| N/A (manual) | List Workers action | Running AnvilML → `GET /v1/workers` returns JSON array in `#workers-response` |
| N/A (manual) | Restart Worker action | Running AnvilML → enter `worker-0` in `#workers-id`, click Restart → 202 response displayed |
| N/A (manual) | Empty ID validation | Leave `#workers-id` blank, click Restart → local error shown, no fetch issued |

Phase 003 full acceptance criteria (from `TASKS_PHASE003.md`) will be verified in the phase-end gate, not in this individual task.

## CI Impact

No CI changes required. This project has no CI pipeline (per `docs/ENVIRONMENT.md` §9). The only verification gate is `node --check app.js`.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `apiFetch` 202 handling for restart endpoint returns generic message instead of actual response body | Low | Medium | `apiFetch` already has a 202 case returning `{ ok: true, status: 202, data: { status: "rescan triggered" } }` — this is a hardcoded response. The restart endpoint may return a different body. **Mitigation:** The plan uses `apiFetch` as-is; if the 202 handler needs to return actual body data, that would be a scope expansion. The current 202 handler returns a synthetic object which is acceptable for display — the operator sees `ok: true` and status 202. |
| `handleWorkersRestart` with empty ID calls `apiFetch` anyway | Low | High | The plan explicitly validates `id` before calling `apiFetch` and returns early with `showResponse` error. |
| DOM element not found if `index.html` IDs are mismatched | Low | Medium | Pre-implementation cross-reference: verify all four IDs exist in `index.html` before writing. Post-implementation verify with `node --check`. |
| Existing stub `<h3>Coming in Phase 003</h3>` removed, breaking visual structure | Low | Low | The stub is explicitly replaced per task spec. No other panel has a similar `<h3>` in its body. |

## Acceptance Criteria

- [ ] `node --check app.js` exits 0
- [ ] `index.html` Workers panel contains: `#workers-list-btn` (text "List Workers"), `#workers-id` (placeholder "worker-0"), `#workers-restart-btn` (text "Restart Worker"), `#workers-response` (`<pre>`)
- [ ] No `<h3>Coming in Phase 003</h3>` remains in Workers panel section of `index.html`
- [ ] `app.js` contains `function handleWorkersList` and `function handleWorkersRestart`
- [ ] Both handlers call `showResponse("workers-response", data, ok)`
- [ ] `handleWorkersRestart` validates non-empty `#workers-id` before fetching
- [ ] Both buttons wired with `addEventListener("click", ...)` in INIT section
- [ ] Manual: List Workers returns JSON array from running AnvilML instance
- [ ] Manual: Restart Worker with valid ID returns 202 response
- [ ] Manual: Restart Worker with empty ID shows local error, no fetch issued
