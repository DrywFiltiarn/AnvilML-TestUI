# Tasks: Phase 001 — Static Shell & Connection

| Field | Value |
|---|---|
| Phase | 001 |
| Status | Draft |
| Project | anvilml-testui |
| Depends on phases | None |
| Authored | 2026-06-09 |

---

## Overview

Phase 001 establishes the complete static file skeleton for AnvilML-TestUI: the three source
files (`index.html`, `app.js`, `styles.css`) plus `package.json` and `.gitignore`. It also
implements the Connection panel — the first functional piece — which lets the operator set the
AnvilML base URL and issue a `GET /health` request to confirm connectivity.

This phase must come first because every subsequent phase adds sections to the DOM structure
established here and calls the `apiFetch` utility defined in `app.js`. Building on a committed,
working shell avoids merge conflicts and ensures the Forge agents always have a compilable
(servable) application to run their manual verification against.

At the end of this phase the operator can run `npm install && npm run serve`, open
`http://localhost:8848`, configure the AnvilML URL, and see the health response. All other
panels are present in the DOM as empty placeholder sections (with the correct IDs defined in
`ARCHITECTURE.md §4`) ready for Phase 002 onward.

---

## Group Reference

| Group | Subsystem | Tasks | Summary |
|---|---|---|---|
| A | Project scaffold | P1-A1 | `package.json`, `.gitignore`, `README.md` |
| B | HTML skeleton | P1-B1 | `index.html` with all panel sections (stubs for phases 002–005) |
| C | CSS | P1-C1 | `styles.css` — dark theme, layout, component classes |
| D | App logic & Connection panel | P1-D1 | `app.js` — apiFetch, state, Connection panel handler |

---

## Prerequisites

None. This is the first phase.

---

## Interfaces and Contracts

| Contract document | Relevant to tasks | What must match |
|---|---|---|
| `docs/ARCHITECTURE.md §4` | P1-B1, P1-D1 | All DOM element IDs listed in §4 must be present in `index.html` |
| `docs/ARCHITECTURE.md §2` | P1-D1 | `app.js` section banner comments match §2 exactly |
| `docs/ARCHITECTURE.md §5` | P1-A1 | `package.json` `devDependencies` contains only `serve`; `dependencies` is empty |
| `ANVILML_TESTUI_DESIGN.md §3` | P1-A1, P1-D1 | `npm run serve` command maps to `npx serve -l 8848 .` |
| `ANVILML_TESTUI_DESIGN.md §9` | P1-C1 | Visual design constraints: dark background, monospace font, Unicode symbols only |

---

## Task Descriptions

### Group A — Project Scaffold

#### P1-A1: project scaffold: package.json, .gitignore, README.md

**Goal:** Create the three non-source repository files that The Forge and `npm` require
before any other work can proceed.

**Files to create or modify:**
- `package.json` — `name: "anvilml-testui"`, `version: "0.1.0"`, `scripts: { "serve": "npx serve -l 8848 ." }`, `devDependencies: { "serve": "^14.2.0" }`, empty `dependencies: {}`.
- `.gitignore` — `node_modules/`, `.DS_Store`, `*.log`
- `README.md` — one-paragraph description; `npm install` + `npm run serve` quick start; note that AnvilML must be running on port 8488.

**Key implementation notes:**
- `dependencies` must be an empty object `{}`, not absent. The Forge version-bump step
  reads `package.json` version; confirm the field parses as valid semver.
- `serve` version `^14.2.0` is the minimum. The agent must verify the current latest via
  the npm MCP before writing this value and use the result if newer.
- Do not create `node_modules/` (the agent must not run `npm install`; the user does this).

**Acceptance criterion:** `cat package.json | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['scripts']['serve'] == 'npx serve -l 8848 .'"`  exits 0.

---

### Group B — HTML Skeleton

#### P1-B1: index.html: full DOM skeleton with all panel stubs

**Goal:** Create `index.html` with the complete structural DOM. All seven panels
(Connection, System, Models, Workers, Jobs, Artifacts, Events) are present with their
correct IDs from `ARCHITECTURE.md §4`. Panels for phases 002–005 are empty stubs
(heading + placeholder text "Coming in Phase X"); the Connection panel is fully populated
with its form elements.

**Files to create or modify:**
- `index.html` — complete DOM as described.

**Key implementation notes:**
- The `<head>` must include: `<meta charset="UTF-8">`, `<meta name="viewport" …>`,
  `<title>AnvilML TestUI</title>`, `<link rel="stylesheet" href="styles.css">`.
- The `<body>` ends with `<script defer src="app.js"></script>`. No inline scripts.
- Every element ID listed in `ARCHITECTURE.md §4` must appear exactly once. Duplicate IDs
  are a silent bug.
- Connection panel elements: `#base-url` (text input, default value `http://localhost:8488`),
  `#connect-btn` (button, text "Connect"), `#conn-status` (span), `#conn-response` (pre).
- Stub panels must each have a `<section>` with a `<h2>` heading and a `<p>` noting "Phase X".
  The section for the Events panel must include `#ws-log`, `#ws-status`, `#ws-connect-btn`,
  `#ws-disconnect-btn` as stubs (the events panel IDs are needed by app.js init in Phase 005).
- Each section has a `<details>` wrapper with `<summary>` for the collapse/expand behaviour.
  The Connection panel starts `open`; all others start closed.

**Acceptance criterion:** `grep -c 'id="' index.html` returns a count ≥ 40 (all IDs from
`ARCHITECTURE.md §4` are present) AND `python3 -c "import html.parser, sys; html.parser.HTMLParser().feed(open('index.html').read())"` exits 0 (well-formed HTML parse).

---

### Group C — CSS

#### P1-C1: styles.css: dark theme, layout, component classes

**Goal:** Implement all CSS required for the complete UI. Panels laid out as full-width
vertical sections. Response `<pre>` areas scrollable with a fixed max-height. Status
indicators coloured by state class.

**Files to create or modify:**
- `styles.css` — complete stylesheet as described.

**Key implementation notes:**
- CSS custom properties at `:root`: `--bg: #0d1117`, `--surface: #161b22`, `--border: #30363d`,
  `--text: #e6edf3`, `--text-muted: #8b949e`, `--green: #3fb950`, `--red: #f85149`,
  `--amber: #d29922`, `--accent: #58a6ff`. Agents must use these variables throughout;
  no hardcoded hex values elsewhere in the file.
- Font stack: `font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace` for
  `pre`, `code`, `.response`, `.ws-log` elements. Body font: system-ui fallback.
- `pre.response` and `div.ws-log`: `max-height: 400px; overflow-y: auto; background: var(--bg);
  border: 1px solid var(--border); padding: 8px; font-size: 12px; white-space: pre-wrap;
  word-break: break-all`.
- `.status-ok` → `color: var(--green)`. `.status-error` → `color: var(--red)`.
  `.status-connecting` → `color: var(--amber)`.
- `details > summary`: `cursor: pointer; user-select: none; padding: 8px 0;
  font-weight: 600; list-style: none` with a `▶` / `▼` pseudo-element toggle.
- No external fonts (no `@import` from Google Fonts or CDN). Font fallback chain is sufficient.
- Button base style: `background: var(--surface); color: var(--text); border: 1px solid
  var(--border); padding: 4px 12px; cursor: pointer; border-radius: 4px`.
- `button:hover`: `border-color: var(--accent)`.
- `input, select, textarea`: same base border and background as buttons.
- `textarea#jobs-body` (or `textarea.jobs-body`): additionally `font-family: monospace;
  font-size: 12px; white-space: pre; min-height: 320px; width: 100%; resize: vertical`.
  This is the job request body textarea added in Phase 003; the style must be present from
  Phase 001 so the element renders correctly as soon as it is added.

**Acceptance criterion:** `grep -c 'var(--' styles.css` returns ≥ 12 (custom properties are
used throughout, not bypassed) AND `wc -l styles.css` returns ≥ 60 (substantive stylesheet).

---

### Group D — App Logic & Connection Panel

#### P1-D1: app.js: scaffold, apiFetch, Connection panel

**Goal:** Create `app.js` with the complete file structure (all section banner comments per
`ARCHITECTURE.md §2`) and implement: CONFIG, STATE, UTILITIES, API CLIENT (`apiFetch`),
and PANEL: CONNECTION. All other panel sections are present as empty stubs with their banner
comments. INIT wires up the Connection panel only.

**Files to create or modify:**
- `app.js` — complete file as described.

**Key implementation notes:**
- Section banner order must exactly match `ARCHITECTURE.md §2`: CONFIG, STATE, TEMPLATES,
  UTILITIES, API CLIENT, WEBSOCKET, PANEL: CONNECTION … PANEL: EVENTS, INIT.
- STATE variables (all `let` at module scope): `baseUrl`, `ws = null`,
  `wsFilterSet = new Set()`, `wsCounters = {}`, `wsAutoScroll = true`,
  `lastArtifactUrl = null`.
- `apiFetch(path, options = {})`: constructs URL as `baseUrl + path`; calls `fetch(…)`.
  Special cases before calling `resp.json()`:
  — `resp.status === 204`: return `{ ok: true, status: 204, data: { status: "deleted" } }` immediately.
  — Any 2xx where `resp.json()` throws (empty body): return `{ ok: true, status: resp.status, data: { status: "ok" } }`.
  On non-2xx: return `{ ok: false, status: resp.status, data: body_or_fallback }`.
  On network error: return `{ ok: false, status: 0, data: { error: "network_error", message: e.message } }`.
  For artifact binary fetches (Phase 004) a separate `apiFetchBlob` will be added; do not add it here.
- `showResponse(elementId, data, ok)`: writes `JSON.stringify(data, null, 2)` to the
  element's `textContent`; removes both class tokens then adds `.status-ok` or `.status-error`.
- TEMPLATES section: empty stub with banner comment only — template constants added in Phase 003.
- INIT section: reads `localStorage.getItem("anvilml_base_url")` on load; if present,
  sets `baseUrl` and populates `#base-url` input value. Attaches `change` listener on
  `#base-url` to update `baseUrl` and write to `localStorage`. Attaches `click` listener on
  `#connect-btn` to call `handleConnect()`.
- `handleConnect()`: calls `apiFetch("/health")`; on ok sets `#conn-status` text to
  `"● Connected — AnvilML v" + data.version` with class `.status-ok`; on error sets
  `#conn-status` to `"✗ " + (data.data?.message ?? 'unreachable')` with class `.status-error`.
  Displays full response in `#conn-response`.
- Stub panel sections contain banner comment and no other code.

**Acceptance criterion:** `node --check app.js` exits 0 AND manual verification:
`npm run serve`, open `http://localhost:8848`, enter AnvilML URL, click Connect → health
response appears in `#conn-response`.

---

## Phase Acceptance Criteria

```bash
# 1. Install dependencies
npm install

# 2. Verify serve starts (run in background, then kill)
npm run serve &
SERVE_PID=$!
sleep 2
curl -s http://localhost:8848/ | grep -q "AnvilML TestUI" && echo "PASS: page served" || echo "FAIL: page not served"
kill $SERVE_PID

# 3. Verify package.json structure
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
assert d['scripts']['serve'] == 'npx serve -l 8848 .', 'serve script wrong'
assert 'serve' in d.get('devDependencies', {}), 'serve missing from devDeps'
assert d.get('dependencies', {}) == {}, 'dependencies must be empty'
print('PASS: package.json valid')
"

# 4. Verify all required IDs present in index.html
python3 -c "
import re
html = open('index.html').read()
required_ids = [
    'base-url', 'connect-btn', 'conn-status', 'conn-response',
    'ws-log', 'ws-status', 'ws-connect-btn', 'ws-disconnect-btn',
]
found = re.findall(r'id=\"([^\"]+)\"', html)
for rid in required_ids:
    assert rid in found, f'Missing ID: {rid}'
print(f'PASS: {len(found)} IDs found, all required IDs present')
"

# 5. Verify apiFetch is defined in app.js and 204 handling is present
grep -q 'async function apiFetch' app.js && echo "PASS: apiFetch defined" || echo "FAIL: apiFetch missing"
grep -q '204' app.js && echo "PASS: 204 handling present" || echo "FAIL: 204 handling missing"
grep -q 'TEMPLATES' app.js && echo "PASS: TEMPLATES banner present" || echo "FAIL: TEMPLATES banner missing"

# 6. Manual runnable proof (human step — document result in phase report)
# Start AnvilML on port 8488 (or use mock-hardware mode)
# Open http://localhost:8848 in browser
# Enter http://localhost:8488 in base URL field
# Click Connect
# Confirm health response JSON appears in #conn-response
# Confirm #conn-status shows "● Connected"
```

---

## Known Constraints and Gotchas

- `npx serve -l 8848 .` serves the repository root. If the agent is working in a subdirectory,
  the path argument must be adjusted. The canonical command serves `.` (repository root).
- `serve` version 14.x uses `-l PORT` syntax. Earlier versions used `--listen PORT`. Do not
  use the older syntax.
- The `node -e "require('fs').readFileSync('app.js','utf8')"` check only confirms the file
  is readable UTF-8, not that it is syntactically valid JavaScript. Full syntax check requires
  `node --check app.js` (Node 18+). The agent should use `node --check app.js` in the
  acceptance criterion instead if Node 18+ is confirmed available.
- `index.html` uses `<details>`/`<summary>` for collapse behaviour. The `open` attribute on
  the Connection panel's `<details>` element ensures it starts expanded. Omitting `open` is
  the correct way to start other panels collapsed — do not use JavaScript to hide them.
- The `defer` attribute on the `app.js` script tag is required. Without it, `document.getElementById`
  calls in the INIT section will fail because the DOM has not yet been parsed.
- No CORS headers are set by this project. If AnvilML is running on a different host (not
  localhost), the browser will block the fetch. This is a deployment concern, not a bug in
  this project.
