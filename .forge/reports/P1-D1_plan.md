# Plan Report: P1-D1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P1-D1                                             |
| Phase       | 001 — Static Shell & Connection                   |
| Description | app.js scaffold with apiFetch and Connection panel |
| Depends on  | P1-A1, P1-B1, P1-C1                               |
| Project     | anvilml-testui                                    |
| Planned at  | 2026-06-09T19:30:00Z                              |
| Attempt     | 1                                                 |

## Objective

Create `app.js` — the single non-module JavaScript file for AnvilML-TestUI — with the
complete section banner structure defined in ARCHITECTURE.md §2, implementing only the
CONFIG, STATE, TEMPLATES (stub), UTILITIES, API CLIENT (`apiFetch`), WEBSOCKET (stub),
all panel sections (Connection fully implemented, others as empty stubs), and INIT. The
Connection panel handler wires the base URL input, localStorage persistence, and a
`/health` probe button. `node --check app.js` must exit 0.

## Scope

### In Scope
- Create `app.js` as a new file at the repository root.
- Section banners in exact order: CONFIG, STATE, TEMPLATES, UTILITIES, API CLIENT,
  WEBSOCKET, PANEL: CONNECTION, PANEL: SYSTEM, PANEL: MODELS, PANEL: WORKERS,
  PANEL: JOBS, PANEL: ARTIFACTS, PANEL: EVENTS, INIT.
- STATE variables: `baseUrl` (string), `ws = null`, `wsFilterSet = new Set()`,
  `wsCounters = {}`, `wsAutoScroll = true`, `lastArtifactUrl = null`.
- `apiFetch(path, options)`: prepends baseUrl, handles 204 (returns `{ok:true,status:204,data:{status:'deleted'}}`),
  empty-body 2xx (returns `{status:'ok'}`), network errors (`{ok:false,status:0,data:{error:'network_error',message:e.message}}`).
- `showResponse(elementId, data, ok)`: writes `JSON.stringify(data, null, 2)` to element's
  `textContent`; toggles `.status-ok` / `.status-error` classes.
- `handleConnect()`: calls `apiFetch("/health")`, sets `#conn-status` text+class,
  displays full response in `#conn-response`.
- INIT: reads `localStorage.getItem("anvilml_base_url")`, populates `#base-url` input,
  wires `change` listener on `#base-url` (updates `baseUrl`, writes localStorage),
  wires `click` listener on `#connect-btn` (calls `handleConnect`).
- TEMPLATES, WEBSOCKET, and non-Connection panel sections: banner comment stubs only.

### Out of Scope
- Any panel logic beyond Connection (System, Models, Workers, Jobs, Artifacts, Events).
- WebSocket connection/disconnection handlers (`wsConnect`, `wsDisconnect`).
- Template constants (`TEMPLATE_ZIT`, `TEMPLATE_SDXL`) — added in Phase 003.
- Any CSS, HTML, or package.json changes.
- Tests (no automated test framework; manual verification via `node --check` and browser).

## Approach

1. **Write `app.js`** in a single heredoc to `.forge/reports/P1-D1_plan.md` (plan only;
   the ACT agent writes the actual file). The file will be a plain non-module script with
   `let`-declared module-scope state variables and `async function` handlers.

2. **Section-by-section implementation plan:**

   **CONFIG** — No configuration constants needed beyond the default URL string used in
   INIT. Leave a banner comment with an empty block.

   **STATE** — Declare six `let` variables at module scope:
   ```js
   let baseUrl = "http://localhost:8488";
   let ws = null;
   let wsFilterSet = new Set();
   let wsCounters = {};
   let wsAutoScroll = true;
   let lastArtifactUrl = null;
   ```

   **TEMPLATES** — Empty stub banner only. Template constants will be added in Phase 003.

   **UTILITIES** — Implement `showResponse(elementId, data, ok)`:
   - Get element via `document.getElementById(elementId)`.
   - Remove both `.status-ok` and `.status-error` classes.
   - Add `.status-ok` if `ok` is truthy, `.status-error` otherwise.
   - Set `element.textContent = JSON.stringify(data, null, 2)`.

   **API CLIENT** — Implement `async function apiFetch(path, options = {})`:
   - Construct URL: `const url = baseUrl.replace(/\/+$/, "") + path;`
   - Call `fetch(url, options)`.
   - On 204: return `{ ok: true, status: 204, data: { status: "deleted" } }` (no `resp.json()`).
   - On 2xx: try `await resp.json()`; if it throws (empty body), return
     `{ ok: true, status: resp.status, data: { status: "ok" } }`.
   - On non-2xx: attempt `await resp.json()`; fall back to `{ error: "non_2xx", status: resp.status }`
     on parse failure; return `{ ok: false, status: resp.status, data: parsedBody }`.
   - On network error (try/catch): return `{ ok: false, status: 0, data: { error: "network_error", message: e.message } }`.

   **WEBSOCKET** — Empty stub banner only. Full implementation in Phase 005.

   **PANEL: CONNECTION** — Implement `handleConnect()`:
   - Call `apiFetch("/health")`.
   - If `ok`: set `#conn-status` text to `"● Connected — AnvilML v" + data.data?.version ?? "unknown"`,
     class `.status-ok`.
   - If `!ok`: set `#conn-status` text to `"✗ " + (data.data?.message ?? "unreachable")`,
     class `.status-error`.
   - Call `showResponse("conn-response", data, ok)`.

   **PANEL: SYSTEM / MODELS / WORKERS / JOBS / ARTIFACTS / EVENTS** — Empty stub banners.

   **INIT** — `document.addEventListener("DOMContentLoaded", () => { ... })`:
   - Read `localStorage.getItem("anvilml_base_url")`; if present, set `baseUrl` and
     `document.getElementById("base-url").value`.
   - Wire `change` event on `#base-url`: update `baseUrl`, write to localStorage.
   - Wire `click` event on `#connect-btn`: call `handleConnect()`.

3. **Verify syntax** with `node --check app.js` (to be executed by the ACT agent).

## Files Affected

| Action | Path              | Description                                      |
|--------|-------------------|--------------------------------------------------|
| Create | `app.js`          | New file: app.js scaffold, apiFetch, Connection panel |

No other files are modified. `index.html`, `styles.css`, `package.json`, and `.gitignore`
already exist from P1-A1, P1-B1, P1-C1 and are not touched.

## Tests

| Test File | Test Name | What It Verifies |
|-----------|-----------|------------------|
| (manual)  | `node --check app.js` | app.js is syntactically valid JavaScript (Node 18+) |
| (manual)  | Browser: open served page, enter URL, click Connect | `apiFetch("/health")` returns response in `#conn-response` and status indicator updates |

No automated test files are created (per ENVIRONMENT.md §8: no automated tests for this project).

## CI Impact

No CI changes required. This project has no CI pipeline (ENVIRONMENT.md §9). The only
verification gate is `node --check app.js` exiting 0, confirmed manually by the ACT agent.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `node --check` fails due to syntax error in apiFetch error handling | Low | High | Write carefully; ACT agent runs `node --check` immediately after writing; fix any errors before marking complete |
| DOM element IDs mismatch between app.js and index.html (already created by P1-B1) | Low | High | Cross-reference all `getElementById` calls against the ID list in ARCHITECTURE.md §4 before writing |
| `localStorage` unavailable in non-browser environment (Node.js `--check` runs in Node) | None | None | `localStorage` is only accessed inside the `DOMContentLoaded` callback which only fires in a browser; Node `--check` only parses syntax and never executes code |
| Fetch API not available in Node `--check` | None | None | `fetch` is only called at runtime inside async functions; `node --check` does not execute code |

## Acceptance Criteria

- [ ] `node --check app.js` exits 0
- [ ] `grep -q 'async function apiFetch' app.js` matches
- [ ] `grep -q '204' app.js` matches (204 handling present)
- [ ] `grep -q 'TEMPLATES' app.js` matches (TEMPLATES banner present)
- [ ] All 14 section banners from ARCHITECTURE.md §2 are present in order
- [ ] STATE variables `baseUrl`, `ws`, `wsFilterSet`, `wsCounters`, `wsAutoScroll`, `lastArtifactUrl` are declared
- [ ] INIT section reads `localStorage.getItem("anvilml_base_url")` and wires `#base-url` change + `#connect-btn` click
- [ ] `handleConnect()` calls `apiFetch("/health")` and updates `#conn-status` and `#conn-response`
