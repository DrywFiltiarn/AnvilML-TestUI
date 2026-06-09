# Plan Report: P3-D1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P3-D1                                             |
| Phase       | 003 — Workers & Jobs Panels                       |
| Description | Jobs panel — six handler functions in app.js      |
| Depends on  | P3-B1 (templates), P3-C1 (Jobs panel HTML)        |
| Project     | anvilml-testui                                    |
| Planned at  | 2026-06-09T20:45:00Z                              |
| Attempt     | 1                                                 |

## Objective

Implement the six Jobs panel handler functions (`handleJobReset`, `handleJobSubmit`, `handleJobsList`, `handleJobsGet`, `handleJobsCancel`, `handleJobsDelete`, `handleJobsBulkClear`) in `app.js` within the `// ── PANEL: JOBS ──` section, and wire all Jobs panel buttons plus the pipeline selector change event in the INIT section.

## Scope

### In Scope
- Replace the `// Jobs panel handlers will be added in Phase 003.` stub in `app.js` with seven handler functions:
  1. `handleJobReset()` — reads `#jobs-pipeline`, sets `#jobs-body.value = getTemplate(pipeline)`
  2. `handleJobSubmit()` — reads raw textarea, validates JSON locally via `JSON.parse`, sends raw string as POST body to `/v1/jobs`, auto-populates `#jobs-job-id` on success
  3. `handleJobsList()` — reads `#jobs-status-filter`, calls `GET /v1/jobs?status=<filter>` (or unfiltered)
  4. `handleJobsGet()` — validates `#jobs-job-id` non-empty, calls `GET /v1/jobs/:id`
  5. `handleJobsCancel()` — validates `#jobs-job-id` non-empty, calls `POST /v1/jobs/:id/cancel`
  6. `handleJobsDelete()` — validates `#jobs-job-id` non-empty, calls `DELETE /v1/jobs/:id`
  7. `handleJobsBulkClear()` — reads `#jobs-bulk-status`, calls `DELETE /v1/jobs?status=<status>`
- All handlers write results to `#jobs-response` via `showResponse()` except `handleJobSubmit` which also auto-populates `#jobs-job-id`
- INIT section: add `#jobs-body.value = getTemplate('zit')` on load
- INIT section: wire `#jobs-pipeline` change → `handleJobReset()`
- INIT section: wire `#jobs-reset-btn` click → `handleJobReset()`
- INIT section: wire `#jobs-submit-btn` click → `handleJobSubmit()`
- INIT section: wire `#jobs-list-btn` click → `handleJobsList()`
- INIT section: wire `#jobs-get-btn` click → `handleJobsGet()`
- INIT section: wire `#jobs-cancel-btn` click → `handleJobsCancel()`
- INIT section: wire `#jobs-delete-btn` click → `handleJobsDelete()`
- INIT section: wire `#jobs-bulk-clear-btn` click → `handleJobsBulkClear()`
- Verify `node --check app.js` exits 0

### Out of Scope
- Any changes to `index.html` (handled by P3-C1)
- Any changes to `styles.css`
- Jobs panel HTML element creation or modification
- WebSocket integration for job status updates
- Error boundary or retry logic beyond what the task specifies
- New dependencies or build tooling

## Approach

1. **Locate the stub** in `app.js` at line 206: `// Jobs panel handlers will be added in Phase 003.`
2. **Replace the stub** with seven handler functions in the `// ── PANEL: JOBS ──` section, following the exact patterns established by existing handlers (e.g., `handleWorkersList`, `handleWorkersRestart`, `handleModelsGet`):
   - Each function reads DOM inputs via `document.getElementById(...).value`
   - Validation functions (get/cancel/delete) check for empty job ID and call `showResponse()` with `{ error: 'id_required', message: 'Enter a job ID' }, false` before returning
   - `handleJobSubmit` trims the textarea value, attempts `JSON.parse()` with a SyntaxError catch that calls `showResponse({ error: 'json_parse_error', message: e.message }, false)` and returns
   - `handleJobSubmit` calls `apiFetch('/v1/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw })` — sending the raw string, not re-serialised
   - On `ok && data.job_id`, `handleJobSubmit` sets `#jobs-job-id.value = data.job_id`
   - `handleJobsList` builds the query string conditionally: `/v1/jobs` or `/v1/jobs?status=<value>`
   - `handleJobsBulkClear` calls `apiFetch('/v1/jobs?status=' + status, { method: 'DELETE' })` — the 204 response is handled by the existing `apiFetch` guard
3. **Update INIT section** (after the existing Workers panel wiring, before the closing `});`):
   - Set `#jobs-body.value = getTemplate('zit')` for initial load
   - Add event listeners for all nine interactive elements (pipeline change, 8 buttons)
   - Use the same null-guard pattern as existing handlers: `const el = document.getElementById('...'); if (el) el.addEventListener(...)`
4. **Verify** by running `node --check app.js` — must exit 0

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `app.js` | Replace Jobs panel stub with seven handler functions; add Jobs panel wiring in INIT section |

## Tests

| Test File | Test Name | What It Verifies |
|-----------|-----------|------------------|
| (manual) | `node --check app.js` | Syntax validity — exits 0 |
| (manual) | Handler existence check (`grep -q "function handleJobReset" app.js`, etc.) | All seven functions are declared |
| (manual) | INIT wiring check (`grep` for addEventListener calls for all nine Jobs elements) | All buttons and pipeline selector are wired |
| (manual) | DOM ID cross-reference | All `getElementById` calls reference IDs present in `index.html` |

No automated test files are created — this project has no test framework (per ENVIRONMENT.md §8). Acceptance is via manual verification against a running AnvilML instance.

## CI Impact

No CI changes required. This project has no CI pipeline (ENVIRONMENT.md §9). The only verification gate is `node --check app.js` exiting 0.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `apiFetch` 202 handler returns a synthetic `{ status: "rescan triggered" }` which masks the real `data.job_id` from a successful job submission (202 response) | Low | High — `#jobs-job-id` would never auto-populate | The existing `apiFetch` has a dedicated 202 guard at line 92-94 that returns synthetic data. This is a pre-existing defect in `apiFetch` that affects `handleJobSubmit`. The plan notes this: `handleJobSubmit`'s `ok && data.job_id` check will fail because `data` is `{ status: "rescan triggered" }`, not the real response body. **Mitigation:** The 202 handler in `apiFetch` (line 92-94) must be reviewed. If the AnvilML API returns 202 for job submission with a `job_id` in the body, the `apiFetch` 202 guard would need adjustment. However, per the task spec, `handleJobSubmit` calls `apiFetch('/v1/jobs', { method: 'POST', ... })` and expects `data.job_id` on `ok`. If `apiFetch` intercepts 202 and returns synthetic data, this is a blocker that must be flagged. |
| Pre-existing `apiFetch` 202 response handling masks real response bodies | Low | Medium | The task spec says "on ok set #jobs-job-id=data.job_id", implying the API returns 202 with `job_id` in the body. The current `apiFetch` at line 92-94 replaces 202 bodies with synthetic data. This is a known interaction between P3-D1 and the Phase 001 `apiFetch` implementation. The ACT agent should verify whether `POST /v1/jobs` actually returns 202 or 200 with body. If 200, the 202 guard is irrelevant. If 202, the plan must note this conflict. |
| Missing DOM IDs if P3-C1 has not been committed yet | Low | High — handlers would silently fail (null getElementById) | Dependency on P3-C1. The CURRENT_TASK.md confirms P3-C1 is a prerequisite. Verify P3-C1 is committed before starting. |

## Acceptance Criteria

- [ ] `node --check app.js` exits 0
- [ ] All seven handler functions exist in `app.js`: `handleJobReset`, `handleJobSubmit`, `handleJobsList`, `handleJobsGet`, `handleJobsCancel`, `handleJobsDelete`, `handleJobsBulkClear`
- [ ] `handleJobSubmit` reads raw textarea, validates JSON locally, sends raw string as POST body, auto-populates `#jobs-job-id` on success
- [ ] `handleJobReset` reads pipeline selector and sets textarea to selected template
- [ ] `handleJobsList` optionally filters by status query parameter
- [ ] `handleJobsGet`, `handleJobsCancel`, `handleJobsDelete` validate non-empty job ID before fetching
- [ ] `handleJobsBulkClear` reads bulk status and calls DELETE with query parameter
- [ ] All eight buttons and pipeline selector are wired in INIT section
- [ ] `#jobs-body.value = getTemplate('zit')` is set on initial load
- [ ] All `getElementById` calls reference IDs that exist in `index.html`
