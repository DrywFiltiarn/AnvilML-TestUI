# Plan Report: P4-B1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P4-B1                                             |
| Phase       | 004 — Artifacts Panel & Image Rendering           |
| Description | apiFetchBlob, artifact list and image fetch handlers |
| Depends on  | P4-A1                                             |
| Project     | anvilml-testui                                    |
| Planned at  | 2026-06-09T23:15:00Z                              |
| Attempt     | 1                                                 |

## Objective

Add a binary-response API client function (`apiFetchBlob`) and two Artifacts panel handlers
(`handleArtifactsList` and `handleArtifactsFetch`) to `app.js`, enabling the TestUI to list
artifacts as JSON and fetch individual artifacts as inline `<img>` elements from the AnvilML
backend's raw PNG endpoint.

## Scope

### In Scope
- Add `apiFetchBlob(path)` function in the API CLIENT section of `app.js`.
- Implement `handleArtifactsList()` in the PANEL: ARTIFACTS section.
- Implement `handleArtifactsFetch()` in the PANEL: ARTIFACTS section.
- Wire `#artifacts-list-btn` click to `handleArtifactsList` in the INIT section.
- Wire `#artifacts-fetch-btn` click to `handleArtifactsFetch` in the INIT section.
- Use the existing `lastArtifactUrl` state variable (already declared in STATE section) for
  `URL.revokeObjectURL` cleanup between successive image fetches.

### Out of Scope
- Any changes to `index.html` (artifacts panel HTML already present from P4-A1).
- Any changes to `styles.css` (`.response` already covers both `pre` and `div` selectors).
- WebSocket event handling for artifact-related events (Phase 005).
- Artifact thumbnail grid or batch image display.
- Dependency version changes — all APIs used are browser-native (no npm packages needed).
- Version bump in `package.json` (handled by The Forge during commit).

## Approach

1. **Add `apiFetchBlob(path)` to the API CLIENT section** (after the existing `apiFetch`
   function, around line 112):
   - Construct URL: `const url = baseUrl.replace(/\/+$/, "") + path;`
   - `try { const resp = await fetch(url); }`
   - If `resp.ok` (2xx): `const blob = await resp.blob(); return { ok: true, status: resp.status, blob };`
   - If not `resp.ok` (non-2xx): `return { ok: false, status: resp.status, blob: null };`
   - Network error catch: `return { ok: false, status: 0, blob: null, error: e.message };`

2. **Implement `handleArtifactsList()` in PANEL: ARTIFACTS section** (replace the placeholder
   comment at line 283):
   - Read `#artifacts-job-id` value.
   - Build path: `"/v1/artifacts" + (jobId ? "?job_id=" + jobId : "")`.
   - Call `apiFetch(path)`.
   - On success: clear `#artifacts-response`, set `element.textContent = JSON.stringify(data, null, 2)`.
   - On failure: clear `#artifacts-response`, set `element.innerHTML = "<pre class=\"status-error\">Error: " + escapeHtml(data?.message ?? String(data)) + "</pre>"` (or use a simpler inline error display — the task spec says "sets inner HTML to an error-styled `<pre>`").

3. **Implement `handleArtifactsFetch()` in PANEL: ARTIFACTS section** (after `handleArtifactsList`):
   - Read `#artifacts-hash` value.
   - If empty: clear `#artifacts-response`, set `element.textContent = "Error: artifact hash required"` (or similar inline error), return.
   - Build path: `"/v1/artifacts/" + hash`.
   - Call `apiFetchBlob(path)`.
   - On success: if `lastArtifactUrl` is truthy, call `URL.revokeObjectURL(lastArtifactUrl)`;
     create `const url = URL.createObjectURL(blob)`; set `lastArtifactUrl = url`;
     create `<img>` element with `src=url`, `style.maxWidth="100%"`, `alt=hash`;
     clear `#artifacts-response`, append `<img>`.
   - On failure: clear `#artifacts-response`, display error message.

4. **Wire event listeners in INIT section** (after the jobs panel listeners, before the
   closing `});` of the DOMContentLoaded handler):
   - `document.getElementById("artifacts-list-btn").addEventListener("click", handleArtifactsList);`
   - `document.getElementById("artifacts-fetch-btn").addEventListener("click", handleArtifactsFetch);`

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `app.js` | Add `apiFetchBlob`, `handleArtifactsList`, `handleArtifactsFetch`; wire buttons in INIT |

## Tests

No test files are written. Per `docs/ENVIRONMENT.md §8`, this project has no automated tests.
Acceptance is verified by:
- `node --check app.js` exits 0 (syntax validation).
- Manual verification against a running AnvilML instance (mock mode with `ANVILML_WORKER_MOCK=1`).

## CI Impact

No CI changes required. This project has no CI pipeline (`docs/ENVIRONMENT.md §9`).

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `URL.createObjectURL` / `URL.revokeObjectURL` not available in older browsers | Low | Low — target is latest Chrome/Firefox only (`docs/ARCHITECTURE.md §3`) | No mitigation needed; browser constraints already specify latest Chrome/Firefox |
| CORS error if AnvilML runs on a non-localhost host | Medium | Medium — fetch fails silently with `ok:false` | The task spec handles this via `apiFetchBlob` error return; the operator adjusts base URL or configures AnvilML CORS headers (out of scope) |
| Blob URL memory leak if `revokeObjectURL` is skipped | Low | Low — mitigated by existing `lastArtifactUrl` state variable already declared in STATE | Use the existing `lastArtifactUrl` variable; revoke before each new `createObjectURL` call |
| `apiFetchBlob` path collision with existing `apiFetch` for non-JSON endpoints | Low | Low — `apiFetchBlob` is a distinct function with a clear naming convention; callers choose explicitly | Document in code comments that `apiFetchBlob` is for binary (PNG) responses only |

## Acceptance Criteria

- [ ] `node --check app.js` exits 0
- [ ] `grep -q "function apiFetchBlob" app.js` — function exists
- [ ] `grep -q "function handleArtifactsList" app.js` — function exists
- [ ] `grep -q "function handleArtifactsFetch" app.js` — function exists
- [ ] `grep -q "revokeObjectURL" app.js` — cleanup present
- [ ] `grep -q "artifacts-list-btn.*handleArtifactsList\|handleArtifactsList.*artifacts-list-btn" app.js` — wired in INIT
- [ ] `grep -q "artifacts-fetch-btn.*handleArtifactsFetch\|handleArtifactsFetch.*artifacts-fetch-btn" app.js` — wired in INIT
- [ ] Manual: list artifacts returns JSON array; fetch image by hash renders inline PNG
