# Plan Report: P4-A1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P4-A1                                             |
| Phase       | 004 — Artifacts Panel & Image Rendering           |
| Description | Artifacts panel HTML form elements                |
| Depends on  | P3-A1, P3-A2 (Phase 003 complete)                 |
| Project     | anvilml-testui                                    |
| Planned at  | 2026-06-09T20:55:00Z                              |
| Attempt     | 1                                                 |

## Objective

Replace the Artifacts panel stub in `index.html` with the five required form elements
(`#artifacts-job-id`, `#artifacts-list-btn`, `#artifacts-hash`, `#artifacts-fetch-btn`,
`#artifacts-response`) with correct placeholders and button labels, and ensure `styles.css`
`.response` selector covers both `pre.response` and `div.response` so the `<div>` response
area inherits consistent styling with the other panel response areas.

## Scope

### In Scope
- Remove the `Coming in Phase 004` heading comment from the Artifacts panel in `index.html`
- Update `#artifacts-job-id` placeholder from `"Job ID"` to `"job UUID — blank for all"`
- Update `#artifacts-list-btn` text from `"List"` to `"List Artifacts"`
- Update `#artifacts-hash` placeholder from `"Hash"` to `"artifact hash SHA256 hex"`
- Update `#artifacts-fetch-btn` text from `"Fetch"` to `"Fetch Image"`
- `#artifacts-response` is already a `<div>` — no structural change needed
- Update `styles.css` selector `pre.response` to `pre.response, div.response` (line ~103) so both element types get background, border, padding, and font properties

### Out of Scope
- `app.js` handler functions (`handleArtifactsList`, `handleArtifactsFetch`, `apiFetchBlob`) — covered by P4-B1
- WebSocket / Events panel — covered by Phase 005
- Any JavaScript logic, API calls, or image rendering code
- Package version bump (version bump is applied during ACT session per ENVIRONMENT.md §10)

## Approach

1. **Edit `index.html`** — In the Artifacts panel section (lines 103–112), remove the
   `<h3>Coming in Phase 004</h3>` heading line and update the four attribute values:
   - `<input id="artifacts-job-id">` placeholder → `"job UUID — blank for all"`
   - `<button id="artifacts-list-btn">` text → `"List Artifacts"`
   - `<input id="artifacts-hash">` placeholder → `"artifact hash SHA256 hex"`
   - `<button id="artifacts-fetch-btn">` text → `"Fetch Image"`
   - Leave `<div id="artifacts-response"></div>` as-is (already a div with correct ID).

2. **Edit `styles.css`** — On the selector at line 103, change `pre.response,` to
   `pre.response, div.response,` so the block that sets `max-height`, `overflow-y`,
   `background`, `border`, `padding`, `font-size`, `white-space`, `word-break`,
   `font-family`, and `margin` applies to both `<pre>` and `<div>` elements with
   class `response`.

3. **Verification** — Run the acceptance checks:
   - `python3 -c "import re; ids=re.findall(r'id=\"([^\"]+)\"', open('index.html').read()); [print(id) for id in ['artifacts-job-id','artifacts-list-btn','artifacts-hash','artifacts-fetch-btn','artifacts-response'] if id not in ids]"` — must print nothing.
   - `python3 -c "import re; html=open('index.html').read(); assert re.search(r'<div[^>]+id=\"artifacts-response\"', html), 'must be div'; print('PASS')"` — must print PASS.
   - `node --check app.js` — must exit 0 (no source changes to app.js, but verifying no regression).

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `index.html` | Replace Artifacts stub heading and update 4 attribute values (2 placeholders, 2 button labels) |
| Modify | `styles.css` | Extend `pre.response` selector to include `div.response` (1 line change) |

## Tests

| Test File | Test Name | What It Verifies |
|-----------|-----------|------------------|
| `index.html` (python3 check) | ID presence check | All 5 artifact IDs present in HTML |
| `index.html` (python3 check) | Element type check | `artifacts-response` is on a `<div>` element |
| `app.js` (node --check) | Syntax check | No syntax errors in app.js (unchanged) |

None of the tests write to a separate test file. Verification is via inline python3
and node --check commands as documented in TASKS_PHASE004.md.

## CI Impact

No CI for this project. GitHub Actions is not used (ENVIRONMENT.md §9). No workflow files
to create or modify.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Em-dash (—) in placeholder text causes encoding issues in HTML | Low | Low | Use UTF-8 encoding (already the repo default); HTML5 spec mandates UTF-8 via `<meta charset="UTF-8">` |
| `div.response` styling conflict with existing `.response` class rules | Low | Low | `.response` class only sets font-family and margin; the combined selector adds background, border, padding, etc. — no overlap conflict |
| Duplicate ID collision with other panels | None | High | IDs are panel-prefixed and unique per ARCHITECTURE.md §4; no existing `artifacts-*` IDs other than the stub |
| `node --check` fails due to unrelated pre-existing issue in app.js | Low | Medium | If it fails, document under Blockers; however, Phase 003 should have left app.js in clean state |

## Acceptance Criteria

- [ ] `python3 -c "import re; ids=re.findall(r'id=\"([^\"]+)\"', open('index.html').read()); [print(id) for id in ['artifacts-job-id','artifacts-list-btn','artifacts-hash','artifacts-fetch-btn','artifacts-response'] if id not in ids]"` prints nothing
- [ ] `python3 -c "import re; html=open('index.html').read(); assert re.search(r'<div[^>]+id=\"artifacts-response\"', html), 'must be div'; print('PASS')"` prints PASS
- [ ] `node --check app.js` exits 0
- [ ] `artifacts-job-id` placeholder is `"job UUID — blank for all"`
- [ ] `artifacts-list-btn` text content is `"List Artifacts"`
- [ ] `artifacts-hash` placeholder is `"artifact hash SHA256 hex"`
- [ ] `artifacts-fetch-btn` text content is `"Fetch Image"`
- [ ] `artifacts-response` is a `<div>` element (not `<pre>`)
- [ ] `styles.css` contains `div.response` in the response area selector block alongside `pre.response`
