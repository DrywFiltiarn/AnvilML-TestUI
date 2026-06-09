# Plan Report: P2-A1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P2-A1                                             |
| Phase       | 002 — System & Models Panels                      |
| Description | System panel — three endpoint handlers wired to DOM |
| Depends on  | P1-A1 (Phase 001: shell, apiFetch, showResponse, stub panels) |
| Project     | anvilml-testui                                    |
| Planned at  | 2026-06-09T19:45:00Z                              |
| Attempt     | 1                                                 |

## Objective

Replace the System panel stub in `index.html` with proper button labels and implement the three System panel event handlers (`handleSysInfo`, `handleSysEnv`, `handleSysVersions`) in `app.js`, wiring them to DOM buttons in the INIT section. Each handler calls `apiFetch` with the appropriate AnvilML endpoint and displays the result via `showResponse('sys-response', data, ok)`.

## Scope

### In Scope
- Update `index.html` System panel: change button labels from "Info"/"Environment"/"Versions" to "Get Hardware Info"/"Get Env Report"/"Get Versions"
- Implement `handleSysInfo()` in `app.js` — calls `apiFetch('/v1/system')`, then `showResponse('sys-response', data, ok)`
- Implement `handleSysEnv()` in `app.js` — calls `apiFetch('/v1/system/env')`, then `showResponse('sys-response', data, ok)`
- Implement `handleSysVersions()` in `app.js` — calls `apiFetch('/v1/system/versions')`, then `showResponse('sys-response', data, ok)`
- Wire all three buttons in the INIT section under a `// System panel` comment block
- No changes to `styles.css` or `package.json`

### Out of Scope
- Models panel implementation (task P2-B1, Phase 002 Group B)
- Any backend changes to AnvilML
- WebSocket / Events panel work (Phase 005)
- Workers, Jobs, or Artifacts panels (Phases 003–004)
- Logging instrumentation beyond the existing `showResponse` pattern (no new log calls needed — this is a browser-side UI handler)

## Approach

1. **Modify `index.html`** — In the System panel `<details>` block (lines 23–30), update the three button `textContent` values:
   - `#sys-info-btn`: change from `"Info"` → `"Get Hardware Info"`
   - `#sys-env-btn`: change from `"Environment"` → `"Get Env Report"`
   - `#sys-versions-btn`: change from `"Versions"` → `"Get Versions"`
   - Remove the `<h3>Coming in Phase 002</h3>` line since this phase implements the panel.

2. **Modify `app.js`** — Replace the comment-only `// PANEL: SYSTEM` section (line 97) with three handler functions:
   ```javascript
   async function handleSysInfo() {
     const { ok, data } = await apiFetch("/v1/system");
     showResponse("sys-response", data, ok);
   }

   async function handleSysEnv() {
     const { ok, data } = await apiFetch("/v1/system/env");
     showResponse("sys-response", data, ok);
   }

   async function handleSysVersions() {
     const { ok, data } = await apiFetch("/v1/system/versions");
     showResponse("sys-response", data, ok);
   }
   ```
   Each function follows the identical pattern: `apiFetch(path)` → destructure `{ ok, data }` → `showResponse("sys-response", data, ok)`.

3. **Modify `app.js` INIT section** — Add three button event listeners inside the existing `DOMContentLoaded` handler, after the Connection panel wires and under a `// System panel` comment:
   ```javascript
   // System panel
   const sysInfoBtn = document.getElementById("sys-info-btn");
   if (sysInfoBtn) sysInfoBtn.addEventListener("click", handleSysInfo);

   const sysEnvBtn = document.getElementById("sys-env-btn");
   if (sysEnvBtn) sysEnvBtn.addEventListener("click", handleSysEnv);

   const sysVersionsBtn = document.getElementById("sys-versions-btn");
   if (sysVersionsBtn) sysVersionsBtn.addEventListener("click", handleSysVersions);
   ```

4. **Syntax verification** — Run `node --check app.js` to confirm exit code 0.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `index.html` | Update System panel button labels, remove "Coming in Phase 002" heading |
| Modify | `app.js` | Add three handler functions in PANEL:SYSTEM section; add three event listeners in INIT section |

## Tests

No automated tests — ENVIRONMENT.md §8 states there are no automated tests for this project. Acceptance is verified manually per TASKS_PHASE002.md Phase Acceptance Criteria:
- `node --check app.js` exits 0
- Manual: start AnvilML, open TestUI, click each of the three System buttons, confirm JSON responses appear in `#sys-response` without console errors

## CI Impact

No CI changes required. ENVIRONMENT.md §9 states there is no CI for this project.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `GET /v1/system/versions` returns 404 on older AnvilML builds (endpoint added in AnvilML Phase 023) | Medium | Low — error displays normally via `showResponse` with red styling; already documented in TASKS_PHASE002.md §Known Constraints | No code change needed; the `apiFetch` wrapper already handles non-2xx responses and returns `{ ok: false, status: 404, data: parsedBody }`, which `showResponse` displays |
| `node --check` fails after changes | Low | High — blocks task completion | Keep handlers structurally identical to existing patterns (handleConnect); no new language features beyond `async/await` which are already used |
| DOM element not found (defensive guard missing) | Very Low | Low — `document.getElementById` returns null, `addEventListener` throws | Use the same `if (el) el.addEventListener(...)` pattern already used for Connection panel buttons |

## Acceptance Criteria

- [ ] `node --check app.js` exits 0
- [ ] `index.html` contains IDs `sys-info-btn`, `sys-env-btn`, `sys-env-btn`, `sys-versions-btn`, `sys-response` with correct labels ("Get Hardware Info", "Get Env Report", "Get Versions")
- [ ] `app.js` defines `function handleSysInfo`, `function handleSysEnv`, `function handleSysVersions`
- [ ] All three handlers call `apiFetch` with the correct path and pass result to `showResponse("sys-response", data, ok)`
- [ ] INIT section wires all three buttons under a `// System panel` comment
- [ ] Manual verification: clicking each button in a browser with a running AnvilML instance produces a JSON response in `#sys-response` without console errors
