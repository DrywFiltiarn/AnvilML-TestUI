# Plan Report: P1-B1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P1-B1                                              |
| Phase       | 001 — Static Shell & Connection                   |
| Description | index.html full DOM skeleton with all panel stubs  |
| Depends on  | P1-A1                                              |
| Project     | anvilml-testui                                     |
| Planned at  | 2026-06-09T19:00:00Z                              |
| Attempt     | 1                                                  |

## Objective

Create `index.html` with the complete structural DOM for AnvilML-TestUI: a `<head>` section
with charset, viewport, title, and stylesheet link; a `<body>` with seven collapsible
`<details>` sections (Connection, System, Models, Workers, Jobs, Artifacts, Events) each
containing all interactive element IDs defined in `ARCHITECTURE.md §4`; the Connection panel
fully populated with its form elements; and all other panels as stubs with heading and
"Phase X" placeholder text. The file links `styles.css` and `app.js` (deferred, no inline
scripts).

## Scope

### In Scope
- Create `index.html` at repository root
- `<head>`: `<meta charset="UTF-8">`, `<meta name="viewport">`, `<title>AnvilML TestUI</title>`, `<link rel="stylesheet" href="styles.css">`
- `<body>`: `<script defer src="app.js"></script>` — no inline scripts
- Seven `<details>` sections, each with `<summary>`:
  - Connection (`open`): `#base-url`, `#connect-btn`, `#conn-status`, `#conn-response`
  - System (closed): heading + "Coming in Phase 002" stub
  - Models (closed): heading + "Coming in Phase 002" stub
  - Workers (closed): heading + "Coming in Phase 003" stub
  - Jobs (closed): heading + "Coming in Phase 003" stub
  - Artifacts (closed): heading + "Coming in Phase 004" stub
  - Events (closed): heading + "Coming in Phase 005" stub, plus `#ws-log`, `#ws-status`, `#ws-connect-btn`, `#ws-disconnect-btn` stubs
- All 53 element IDs from `ARCHITECTURE.md §4` present exactly once
- Kebab-case IDs with panel prefix convention
- No duplicate IDs
- Well-formed HTML (parseable by browser HTML parser)

### Out of Scope
- CSS styling (`styles.css` — task P1-C1)
- JavaScript logic (`app.js` — task P1-D1)
- Any interactive behavior or event listeners
- API calls or data fetching
- Content beyond stubs for non-Connection panels
- `package.json`, `.gitignore`, or `README.md` (task P1-A1)

## Approach

1. **Create `index.html`** at the repository root (`/home/dryw/AnvilML-TestUI/index.html`).

2. **Write the `<head>` section** containing:
   - `<!DOCTYPE html>` declaration
   - `<html lang="en">` with `<head>` block
   - `<meta charset="UTF-8">`
   - `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
   - `<title>AnvilML TestUI</title>`
   - `<link rel="stylesheet" href="styles.css">`

3. **Write the `<body>` section** with a `<main>` wrapper containing seven `<details>` elements:

   **Connection panel** (`<details open id="connection-panel">`):
   - `<summary>Connection</summary>`
   - `<label for="base-url">Base URL</label>`
   - `<input type="text" id="base-url" value="http://localhost:8488" placeholder="http://localhost:8488">`
   - `<button id="connect-btn">Connect</button>`
   - `<span id="conn-status"></span>`
   - `<pre id="conn-response"></pre>`

   **System panel** (`<details id="system-panel">`):
   - `<summary>System</summary>`
   - `<h3>Coming in Phase 002</h3>`
   - Stub elements for `#sys-info-btn`, `#sys-env-btn`, `#sys-versions-btn`, `#sys-response`

   **Models panel** (`<details id="models-panel">`):
   - `<summary>Models</summary>`
   - `<h3>Coming in Phase 002</h3>`
   - Stub elements for `#models-kind`, `#models-list-btn`, `#models-id`, `#models-get-btn`, `#models-rescan-btn`, `#models-response`

   **Workers panel** (`<details id="workers-panel">`):
   - `<summary>Workers</summary>`
   - `<h3>Coming in Phase 003</h3>`
   - Stub elements for `#workers-list-btn`, `#workers-id`, `#workers-restart-btn`, `#workers-response`

   **Jobs panel** (`<details id="jobs-panel">`):
   - `<summary>Jobs</summary>`
   - `<h3>Coming in Phase 003</h3>`
   - Stub elements for `#jobs-pipeline`, `#jobs-reset-btn`, `#jobs-body`, `#jobs-submit-btn`, `#jobs-status-filter`, `#jobs-list-btn`, `#jobs-job-id`, `#jobs-get-btn`, `#jobs-cancel-btn`, `#jobs-delete-btn`, `#jobs-bulk-status`, `#jobs-bulk-clear-btn`, `#jobs-response`

   **Artifacts panel** (`<details id="artifacts-panel">`):
   - `<summary>Artifacts</summary>`
   - `<h3>Coming in Phase 004</h3>`
   - Stub elements for `#artifacts-job-id`, `#artifacts-list-btn`, `#artifacts-hash`, `#artifacts-fetch-btn`, `#artifacts-response`

   **Events panel** (`<details id="events-panel">`):
   - `<summary>Events</summary>`
   - `<h3>Coming in Phase 005</h3>`
   - Stub elements for `#ws-connect-btn`, `#ws-disconnect-btn`, `#ws-status`, `#ws-auto-scroll`, `#ws-clear-btn`, `#ws-log`, `#ws-counters`
   - Filter checkboxes: `#ws-filter-job-queued`, `#ws-filter-job-started`, `#ws-filter-job-progress`, `#ws-filter-job-image-ready`, `#ws-filter-job-completed`, `#ws-filter-job-failed`, `#ws-filter-job-cancelled`, `#ws-filter-worker-status`, `#ws-filter-system-stats`, `#ws-filter-provisioning-progress`

4. **Close `</body>` and `</html>`**, then append `<script defer src="app.js"></script>` before `</body>`.

5. **Verify** with `grep -c 'id="' index.html` returns >= 40 (expecting 53).

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Create | `index.html` | Full DOM skeleton with all 7 panel sections, 53 element IDs, Connection panel populated, other panels as stubs |

## Tests

None. This task creates no test files. Per `ENVIRONMENT.md §8`, there are no automated tests for this project. Acceptance is verified manually via:
- `grep -c 'id="' index.html` returns >= 40
- HTML well-formedness check via browser parser or `python3 -c "import html.parser, sys; html.parser.HTMLParser().feed(open('index.html').read())"` exits 0

## CI Impact

No CI changes required. Per `ENVIRONMENT.md §9`, there is no CI for this project. GitHub Actions is not used.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing one or more IDs from ARCHITECTURE.md §4 | Low | High — acceptance criterion fails (count < 40) | Systematically enumerate all 53 IDs from §4 before writing; cross-check after writing |
| Duplicate IDs introduced by copy-paste | Low | High — silent DOM bug | Use unique `id` attributes per element; verify with `grep -oP 'id="[^"]*"' index.html | sort | uniq -d` for duplicates |
| HTML parse error from unclosed tags | Low | Medium — browser renders incorrectly | Write self-closing tags properly (`<input>`, `<br>`, etc.); close all `<details>`, `<section>`, `<label>` blocks |
| Events panel missing required stub IDs | Low | High — app.js INIT in Phase 005 will fail | Explicitly list all 17 events-panel IDs from §4 in the Events panel stub |

## Acceptance Criteria

- [ ] `grep -c 'id="' index.html` returns a count >= 40 (actual expected: 53)
- [ ] No duplicate `id` attributes in `index.html`
- [ ] `<meta charset="UTF-8">` is present
- [ ] `<meta name="viewport"` is present
- [ ] `<title>AnvilML TestUI</title>` is present
- [ ] `<link rel="stylesheet" href="styles.css">` is present
- [ ] `<script defer src="app.js"></script>` is present before `</body>`
- [ ] No inline `<script>` blocks in the document
- [ ] Connection `<details>` has `open` attribute; all others are closed
- [ ] Connection panel contains: `#base-url` (input with default `http://localhost:8488`), `#connect-btn`, `#conn-status`, `#conn-response`
- [ ] Events panel stub contains: `#ws-log`, `#ws-status`, `#ws-connect-btn`, `#ws-disconnect-btn`
- [ ] All 53 IDs from `ARCHITECTURE.md §4` are present exactly once
- [ ] HTML is well-formed (parseable by standard HTML parser)
