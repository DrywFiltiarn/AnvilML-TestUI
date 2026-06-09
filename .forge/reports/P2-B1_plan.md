# Plan Report: P2-B1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P2-B1                                             |
| Phase       | 002 — System & Models Panels                      |
| Description | Models panel — list, get, rescan handlers         |
| Depends on  | P2-A1 (System panel), Phase 001 (shell)           |
| Project     | anvilml-testui                                    |
| Planned at  | 2026-06-09T19:50:00Z                              |
| Attempt     | 1                                                 |

## Objective

Replace the Models panel stub in `index.html` with full form elements (kind filter select, list/get/rescan buttons, model ID input) and implement three handler functions (`handleModelsList`, `handleModelsGet`, `handleModelsRescan`) in `app.js` under the `// ── PANEL: MODELS ──` section, wiring them in the INIT section. Also update `apiFetch` to handle 202 empty-body responses.

## Scope

### In Scope
- `index.html`: Replace `<h3>Coming in Phase 002</h3>` in the Models panel with proper form elements: `#models-kind` select with options (""=all, diffusion, vae, lora, controlnet, clip, unet, upscale), `#models-list-btn` (label "List Models"), `#models-id` (text input, placeholder "model ID"), `#models-get-btn` (label "Get Model"), `#models-rescan-btn` (label "Trigger Rescan"), `#models-response` (pre)
- `app.js`: Implement `handleModelsList()` — reads `#models-kind` value, calls `apiFetch("/v1/models" + (kind ? "?kind=" + kind : ""))`
- `app.js`: Implement `handleModelsGet()` — validates `#models-id` non-empty (shows error if empty), calls `apiFetch("/v1/models/" + id)`
- `app.js`: Implement `handleModelsRescan()` — calls `apiFetch("/v1/models/rescan", { method: "POST" })`
- `app.js`: Update `apiFetch` to return `{ ok: true, status: 202, data: { status: "rescan triggered" } }` for 202 responses with empty body
- `app.js`: Wire all three handlers in the INIT section under a `// Models panel` comment block
- `package.json`: Bump version patch digit from 0.1.4 to 0.1.5

### Out of Scope
- System panel implementation (P2-A1)
- Workers panel (Phase 003)
- Jobs panel (Phase 003)
- Artifacts panel (Phase 004)
- Events/WebSocket panel (Phase 005)
- Any CSS changes
- Any new files

## Approach

1. **Update `index.html` Models panel** (lines 34–42): Remove `<h3>Coming in Phase 002</h3>`. Replace the Models panel body with the proper form layout matching the DOM ID convention from `ARCHITECTURE.md §4`:
   - `<select id="models-kind">` with options: `""` (All kinds), `diffusion`, `vae`, `lora`, `controlnet`, `clip`, `unet`, `upscale`
   - `<button id="models-list-btn">List Models</button>`
   - `<input type="text" id="models-id" placeholder="model ID">`
   - `<button id="models-get-btn">Get Model</button>`
   - `<button id="models-rescan-btn">Trigger Rescan</button>`
   - `<pre id="models-response"></pre>`

2. **Update `apiFetch` in `app.js`** (lines 44–68): Add a `resp.status === 202` check after the 204 check (line 48). When status is 202, return `{ ok: true, status: 202, data: { status: "rescan triggered" } }` without calling `resp.json()`. This follows the same pattern as the existing 204 handling.

3. **Implement handler functions in `app.js`** (replace line 116 comment `// Models panel handlers will be added in Phase 002.`):
   - `handleModelsList()`: read `kind` from `document.getElementById("models-kind").value`, build path as `/v1/models` + (kind ? `?kind=` + kind : `""`), call `apiFetch(path)`, call `showResponse("models-response", data, ok)`
   - `handleModelsGet()`: read `id` from `document.getElementById("models-id").value`, if empty call `showResponse("models-response", { error: "id_required", message: "Enter a model ID" }, false)` and return, otherwise call `apiFetch("/v1/models/" + id)`, call `showResponse("models-response", data, ok)`
   - `handleModelsRescan()`: call `apiFetch("/v1/models/rescan", { method: "POST" })`, call `showResponse("models-response", data, ok)`

4. **Wire handlers in INIT** (after line 175, within the existing `DOMContentLoaded` callback): Add a `// Models panel` comment block and attach click listeners for `#models-list-btn`, `#models-get-btn`, and `#models-rescan-btn`, each calling their respective handler.

5. **Bump `package.json` version**: Change `"version": "0.1.4"` to `"version": "0.1.5"` (ENVIRONMENT.md §10: increment patch digit for commits modifying `index.html` or `app.js`).

6. **Verify**: Run `node --check app.js` — must exit 0.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `index.html` | Replace Models panel stub with full form elements (lines 34–42) |
| Modify | `app.js` | Implement three handler functions, update `apiFetch` for 202, wire handlers in INIT |
| Modify | `package.json` | Bump version patch: 0.1.4 → 0.1.5 |

## Tests

| Test File | Test Name | What It Verifies |
|-----------|-----------|------------------|
| (manual) | `node --check app.js` | Syntax correctness — exits 0 |
| (manual) | HTML ID cross-check | All DOM IDs referenced in handlers exist in `index.html` |
| (manual) | List Models | `GET /v1/models` returns JSON array in `#models-response` |
| (manual) | Filter by kind | Selecting `diffusion` and clicking List Models returns `?kind=diffusion` filtered results |
| (manual) | Get Model (empty ID) | Clicking Get Model with empty ID shows `{ error: "id_required" }` error |
| (manual) | Get Model (with ID) | Entering a model ID and clicking Get Model returns model JSON |
| (manual) | Trigger Rescan | Clicking Trigger Rescan returns 202 with `{ status: "rescan triggered" }` |

## CI Impact

No CI changes required. This project has no CI pipeline (ENVIRONMENT.md §9). The only verification gate is `node --check app.js` exiting 0.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `apiFetch` 202 handling conflicts with existing empty-body 2xx handling | Low | Medium | Add explicit 202 check before the generic `resp.ok` catch block; the 204 pattern already demonstrates this approach |
| DOM IDs mismatch between `index.html` and `app.js` | Low | High | Cross-reference all `getElementById` calls against the ID table in `ARCHITECTURE.md §4` before completion |
| `handleModelsGet` fetches with empty ID if validation logic is wrong | Low | Medium | Validate emptiness (`if (!id)`) before calling `apiFetch`; the error response is shown directly without a network call |
| Handler wires placed outside `DOMContentLoaded` | Low | Medium | Wire handlers inside the existing `DOMContentLoaded` callback, after the System panel wires |

## Acceptance Criteria

- [ ] `node --check app.js` exits 0
- [ ] `#models-kind` select has options: "" (all), diffusion, vae, lora, controlnet, clip, unet, upscale
- [ ] `#models-list-btn` button text is "List Models"
- [ ] `#models-id` input placeholder is "model ID"
- [ ] `#models-get-btn` button text is "Get Model"
- [ ] `#models-rescan-btn` button text is "Trigger Rescan"
- [ ] `handleModelsList` is defined as a function in `app.js`
- [ ] `handleModelsGet` is defined as a function in `app.js`
- [ ] `handleModelsRescan` is defined as a function in `app.js`
- [ ] All three handlers are wired in the INIT `DOMContentLoaded` block
- [ ] `apiFetch` handles 202 empty-body by returning `{ ok: true, status: 202, data: { status: "rescan triggered" } }`
- [ ] `handleModelsGet` validates non-empty ID before fetching
- [ ] `package.json` version bumped to 0.1.5
