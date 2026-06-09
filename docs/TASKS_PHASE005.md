# Tasks: Phase 005 — WebSocket Events Panel

| Field | Value |
|---|---|
| Phase | 005 |
| Status | Draft |
| Project | anvilml-testui |
| Depends on phases | 1, 2, 3, 4 |
| Authored | 2026-06-09 |

---

## Overview

Phase 005 implements the Events panel: a live WebSocket connection to AnvilML's `/v1/events`
stream. It is the final panel in the application. The operator can connect, see all event types
as they arrive in a scrolling log, filter by event type, track per-type counters, and disconnect.

The Events panel is last for two reasons. First, observing a complete job lifecycle in the log
(`job.queued` → `job.started` → `job.progress` → `job.image_ready` → `job.completed`) requires
all upstream panels (submit job, fetch artifact) to be working. Second, the `job.image_ready`
event carries an `artifact_hash` which can be fed directly into the Artifacts panel — a cross-panel
workflow that only makes sense once Phase 004 is in place.

This phase also polishes the existing Events panel stub HTML added in Phase 001 (which contained
minimal IDs as placeholders) into the fully functional panel. The WebSocket section of `app.js`,
which has been an empty stub since Phase 001, is fully implemented here.

At phase end the operator can observe the full AnvilML event stream in real time, filter noise,
and correlate events with the job IDs produced in Phase 003.

---

## Group Reference

| Group | Subsystem | Tasks | Summary |
|---|---|---|---|
| A | Events panel HTML | P5-A1 | Complete Events panel in `index.html` (replaces Phase 001 stub) |
| B | WebSocket engine | P5-B1 | `wsConnect`, `wsDisconnect`, `onmessage` handler, counter logic |
| C | Filter UI & counters | P5-C1 | Filter checkboxes, counter display, clear log, auto-scroll |

---

## Prerequisites

Phase 004 is complete and committed. Specifically:
- Phase 001 placed stub IDs `#ws-log`, `#ws-status`, `#ws-connect-btn`, `#ws-disconnect-btn`
  in `index.html`. This phase replaces the stub section entirely with the full panel.
- `// ── WEBSOCKET ──` and `// ── PANEL: EVENTS ──` banner sections exist in `app.js` as stubs.

---

## Interfaces and Contracts

| Contract document | Relevant to tasks | What must match |
|---|---|---|
| AnvilML `ANVILML_DESIGN.md §4.6` | P5-B1 | All 10 WsEvent types and their `event` field string values |
| AnvilML `ARCHITECTURE.md §7` | P5-B1 | WebSocket endpoint: `GET (WS) /v1/events` |
| `ARCHITECTURE.md §4` | P5-A1 | All Events panel DOM IDs including per-type filter IDs `ws-filter-<event_type>` |

---

## Task Descriptions

### Group A — Events Panel HTML

#### P5-A1: index.html: full Events panel (replace Phase 001 stub)

**Goal:** Replace the minimal Phase 001 Events panel stub with the complete Events panel
structure, including filter checkboxes for all 10 event types and the counter display area.

**Files to create or modify:**
- `index.html` — replace the Events panel stub with the full panel.

**Key implementation notes:**
- Panel structure (top to bottom):
  1. Controls row: `#ws-connect-btn` (button "Connect"), `#ws-disconnect-btn` (button
     "Disconnect", initially disabled), `#ws-status` (span, initially "● Disconnected" with
     `.status-error` class), `#ws-clear-btn` (button "Clear"), `#ws-auto-scroll` (checkbox,
     label "Auto-scroll", checked by default).
  2. Filter row: label "Filter:" followed by one checkbox per event type. Each checkbox:
     `id="ws-filter-<event_type>"` where `<event_type>` is the exact `event` field value
     with `.` replaced by `-` (e.g. `ws-filter-job-queued`, `ws-filter-system-stats`).
     All checkboxes checked by default. Label text is the raw event type string
     (e.g. "job.queued", "system.stats").
  3. Counters row: `#ws-counters` (div) — populated by `app.js`; initially shows all
     counters at 0.
  4. Log area: `#ws-log` (div with class `ws-log`) — the scrolling event log.
- The 10 event types and their filter IDs:
  - `job.queued` → `ws-filter-job-queued`
  - `job.started` → `ws-filter-job-started`
  - `job.progress` → `ws-filter-job-progress`
  - `job.image_ready` → `ws-filter-job-image-ready`
  - `job.completed` → `ws-filter-job-completed`
  - `job.failed` → `ws-filter-job-failed`
  - `job.cancelled` → `ws-filter-job-cancelled`
  - `worker.status` → `ws-filter-worker-status`
  - `system.stats` → `ws-filter-system-stats`
  - `provisioning.progress` → `ws-filter-provisioning-progress`

**Acceptance criterion:**
```bash
python3 -c "
import re
html = open('index.html').read()
ids = re.findall(r'id=\"([^\"]+)\"', html)
required = [
    'ws-connect-btn','ws-disconnect-btn','ws-status','ws-clear-btn','ws-auto-scroll',
    'ws-counters','ws-log',
    'ws-filter-job-queued','ws-filter-job-started','ws-filter-job-progress',
    'ws-filter-job-image-ready','ws-filter-job-completed','ws-filter-job-failed',
    'ws-filter-job-cancelled','ws-filter-worker-status','ws-filter-system-stats',
    'ws-filter-provisioning-progress',
]
missing = [r for r in required if r not in ids]
assert not missing, f'Missing: {missing}'
print(f'PASS: {len(required)} Events panel IDs present')
"
```

---

### Group B — WebSocket Engine

#### P5-B1: app.js: wsConnect, wsDisconnect, onmessage handler

**Goal:** Implement the `// ── WEBSOCKET ──` section of `app.js` with the three core
functions: `wsConnect`, `wsDisconnect`, and the `onmessage` dispatch.

**Files to create or modify:**
- `app.js` — implement the WEBSOCKET section.

**Key implementation notes:**
- `wsConnect()`:
  - Reads `baseUrl` from module state.
  - Constructs the WebSocket URL by replacing `http://` with `ws://` and `https://` with
    `wss://`, then appending `/v1/events`.
  - Creates `ws = new WebSocket(wsUrl)`.
  - `ws.onopen`: sets `#ws-status` to `"● Connected"` with class `.status-ok`; enables
    `#ws-disconnect-btn`; disables `#ws-connect-btn`.
  - `ws.onclose`: sets `#ws-status` to `"● Disconnected"` with class `.status-error`;
    enables `#ws-connect-btn`; disables `#ws-disconnect-btn`; sets `ws = null`.
  - `ws.onerror`: appends `[ERROR] WebSocket error` entry to `#ws-log`.
  - `ws.onmessage(event)`: calls `handleWsMessage(event.data)`.
- `wsDisconnect()`: calls `ws.close()` if `ws !== null && ws.readyState !== WebSocket.CLOSED`.
- `handleWsMessage(raw)`:
  - Parses `JSON.parse(raw)`. On parse failure appends `[PARSE ERROR] <raw>` to log.
  - Reads `msg.event` (string).
  - Converts event type to filter ID: replace `.` with `-`, prepend `ws-filter-`; checks
    `document.getElementById(filterId)?.checked`. If unchecked, returns without appending.
  - Increments `wsCounters[msg.event]` (initialise to 0 if absent).
  - Calls `renderWsCounters()`.
  - Calls `appendWsLogEntry(msg)`.
- `appendWsLogEntry(msg)`:
  - Creates a `<div class="ws-entry ws-entry-<event_type_safe>">` where `<event_type_safe>`
    is the event type with `.` replaced by `-`.
  - Sets `textContent` to `JSON.stringify(msg, null, 2)`.
  - Appends to `#ws-log`.
  - If `wsAutoScroll` is true, scrolls `#ws-log` to bottom: `el.scrollTop = el.scrollHeight`.

**Acceptance criterion:** `node --check app.js` exits 0. Manual: Connect → status shows
"● Connected". Wait 5s → `system.stats` events appear in the log (AnvilML emits them every 5s).

---

### Group C — Filter UI & Counters

#### P5-C1: app.js: filter wiring, counter rendering, clear, auto-scroll

**Goal:** Implement `renderWsCounters`, the "Clear" button handler, the auto-scroll toggle
handler, and wire all Events panel buttons in the INIT section within `// ── PANEL: EVENTS ──`.

**Files to create or modify:**
- `app.js` — PANEL: EVENTS section + INIT wiring.

**Key implementation notes:**
- `renderWsCounters()`: clears `#ws-counters`; for each of the 10 known event types,
  creates a `<span class="ws-counter">` with text `<event_type>: N` where N is the counter
  value (0 if absent). Separates spans with a space. Only show event types that have been
  seen (counter > 0) OR all of them at 0 — showing all at 0 initially provides a useful
  reference. Initial state: display all 10 at 0.
- `handleWsClear()`: sets `#ws-log.textContent = ""`; resets `wsCounters = {}`; calls
  `renderWsCounters()`.
- Auto-scroll toggle: `#ws-auto-scroll` `change` listener updates `wsAutoScroll` boolean.
- Filter checkboxes: no event listener needed — the `handleWsMessage` function reads their
  state at message time. Changing a checkbox takes effect immediately on the next message.
- INIT section additions: render initial counters via `renderWsCounters()` on load; wire
  `#ws-connect-btn` → `wsConnect`, `#ws-disconnect-btn` → `wsDisconnect`,
  `#ws-clear-btn` → `handleWsClear`, `#ws-auto-scroll` → auto-scroll toggle.
- CSS addition in `styles.css`: `.ws-entry` styling — `border-bottom: 1px solid var(--border);
  padding: 4px 0; font-size: 11px; white-space: pre-wrap`. `.ws-entry-system-stats` →
  `color: var(--text-muted)` (system stats are high-frequency; muted colour reduces visual noise).
  `.ws-entry-job-completed` → `color: var(--green)`. `.ws-entry-job-failed` → `color: var(--red)`.
  `.ws-counter` → `font-family: monospace; font-size: 11px; color: var(--text-muted); margin-right: 8px`.

**Acceptance criterion:** `node --check app.js` exits 0. Manual: Connect; uncheck
`system.stats` filter; confirm system.stats events no longer appear in log while job events
still do. Click Clear; confirm log is empty and all counters reset to 0.

---

## Phase Acceptance Criteria

```bash
# Syntax check — final application state
node --check app.js

# All IDs (entire application — regression check)
python3 -c "
import re
html = open('index.html').read()
ids = re.findall(r'id=\"([^\"]+)\"', html)
required = [
    # Connection
    'base-url','connect-btn','conn-status','conn-response',
    # System
    'sys-info-btn','sys-env-btn','sys-versions-btn','sys-response',
    # Models
    'models-kind','models-list-btn','models-id','models-get-btn','models-rescan-btn','models-response',
    # Workers
    'workers-list-btn','workers-id','workers-restart-btn','workers-response',
    # Jobs
    'jobs-pipeline','jobs-model-id','jobs-prompt','jobs-negative-prompt',
    'jobs-seed','jobs-steps','jobs-guidance-scale','jobs-width','jobs-height',
    'jobs-device-pref','jobs-submit-btn','jobs-status-filter','jobs-list-btn',
    'jobs-job-id','jobs-get-btn','jobs-cancel-btn','jobs-delete-btn',
    'jobs-bulk-status','jobs-bulk-clear-btn','jobs-response',
    # Artifacts
    'artifacts-job-id','artifacts-list-btn','artifacts-hash','artifacts-fetch-btn','artifacts-response',
    # Events
    'ws-connect-btn','ws-disconnect-btn','ws-status','ws-clear-btn','ws-auto-scroll',
    'ws-counters','ws-log',
    'ws-filter-job-queued','ws-filter-job-started','ws-filter-job-progress',
    'ws-filter-job-image-ready','ws-filter-job-completed','ws-filter-job-failed',
    'ws-filter-job-cancelled','ws-filter-worker-status','ws-filter-system-stats',
    'ws-filter-provisioning-progress',
]
missing = [r for r in required if r not in ids]
assert not missing, f'Missing IDs: {missing}'
print(f'PASS: {len(required)} required IDs all present ({len(ids)} total)')
"

# All handler functions present
for fn in apiFetch apiFetchBlob showResponse wsConnect wsDisconnect handleWsMessage \
          appendWsLogEntry renderWsCounters handleWsClear handleConnect \
          handleSysInfo handleSysEnv handleSysVersions \
          handleModelsList handleModelsGet handleModelsRescan \
          handleWorkersList handleWorkersRestart \
          buildZitGraph buildSdxlGraph \
          handleJobSubmit handleJobsList handleJobsGet handleJobsCancel handleJobsDelete handleJobsBulkClear \
          handleArtifactsList handleArtifactsFetch; do
  grep -q "function $fn" app.js && echo "PASS: $fn" || echo "FAIL: $fn missing"
done

# Serve and smoke test
npm run serve &
SERVE_PID=$!
sleep 2
curl -fs http://localhost:8848/ | grep -q "AnvilML TestUI" && echo "PASS: served" || echo "FAIL"
kill $SERVE_PID

# Manual runnable proof — full end-to-end workflow
# Requires AnvilML running with ANVILML_WORKER_MOCK=1
#
# 1. Open http://localhost:8848
# 2. Connection: Connect → health response
# 3. Events: Connect → status "● Connected"
# 4. System: Get Hardware Info, Get Env Report, Get Versions → JSON responses
# 5. Models: Trigger Rescan → 202; List Models → array
# 6. Workers: List Workers → worker-0 Idle
# 7. Jobs: select ZiT, enter model ID "any-model", prompt "a test prompt"
#    click Submit Job → 202, job_id auto-populates
# 8. Events: observe job.queued → job.started → job.progress(s) → job.image_ready → job.completed
# 9. Artifacts: List Artifacts → entry with hash; copy hash; Fetch Image → black PNG renders
# 10. Events: uncheck system.stats → stats events stop appearing
# 11. Events: Clear → log empty, counters reset
# 12. Jobs: Bulk Clear status=all → all jobs deleted
```

---

## Known Constraints and Gotchas

- The WebSocket URL construction replaces `http://` with `ws://` and `https://` with `wss://`.
  If `baseUrl` does not start with `http` (e.g. the user typed a bare hostname), the
  construction will produce an invalid URL. Defensive handling: if the URL does not start
  with `ws://` or `wss://` after substitution, prepend `ws://`. Document this edge case
  as a known limitation in `README.md`.
- AnvilML emits `system.stats` every 5 seconds. With auto-scroll enabled, this will constantly
  scroll the log during normal operation. The `system.stats` filter checkbox (checked by
  default) gives the operator an immediate way to reduce log noise during job debugging.
- The `#ws-auto-scroll` checkbox state is not persisted to `localStorage`. On page refresh
  it resets to checked. This is intentional (stateless default is safer than persisting a
  state that hides new events).
- `WebSocket` `onerror` fires immediately before `onclose` when a connection is refused
  (AnvilML not running). Both handlers fire; the error entry in the log is expected.
- Filter checkboxes are read at message receipt time. There is no "replay" functionality —
  events that arrived while a filter was unchecked are gone. This is a testing tool; replay
  is not in scope.
- `ws.readyState` must be checked before calling `ws.close()` in `wsDisconnect` because
  calling `.close()` on an already-closed socket throws in some browsers.
