# Plan Report: P5-B1

| Field       | Value                                       |
|-------------|---------------------------------------------|
| Task ID     | P5-B1                                       |
| Phase       | 005 — WebSocket Events Panel                |
| Description | WebSocket engine — wsConnect, wsDisconnect, onmessage |
| Depends on  | P5-A1                                       |
| Project     | anvilml-testui                              |
| Planned at  | 2026-06-09T22:10:00Z                        |
| Attempt     | 1                                           |

## Objective

Implement the `// ── WEBSOCKET ──` section of `app.js` with the three core functions required for WebSocket event streaming: `wsConnect()` (builds URL, creates WebSocket, wires onopen/onclose/onerror/onmessage), `wsDisconnect()` (safe close), and `handleWsMessage(raw)` (JSON parse, filter check, counter update, log append). Also implement the helper `appendWsLogEntry(msg)`.

## Scope

### In Scope
- Replace the WEBSOCKET stub comment in `app.js` with full implementation of:
  - `wsConnect()`: URL construction from `baseUrl` (http→ws, https→wss, append `/v1/events`), `new WebSocket(wsUrl)`, onopen/onclose/onerror/onmessage handler wiring.
  - `wsDisconnect()`: `ws.close()` guard on `ws !== null && ws.readyState !== WebSocket.CLOSED`.
  - `handleWsMessage(raw)`: JSON.parse with parse error fallback, filter checkbox check via `ws-filter-<event_type_dashes>`, `wsCounters[msg.event]` increment, `renderWsCounters()` call, `appendWsLogEntry(msg)` call.
  - `appendWsLogEntry(msg)`: create `<div class="ws-entry ws-entry-<event_type_safe>">`, set `textContent` to `JSON.stringify(msg, null, 2)`, append to `#ws-log`, conditional auto-scroll via `wsAutoScroll`.
- Wire `wsConnect` as the `onmessage` handler for the WebSocket instance inside `wsConnect()`.
- Verify `node --check app.js` exits 0.

### Out of Scope
- Filter checkbox change listeners (P5-C1: filters are read at message time, no listener needed).
- `renderWsCounters()` implementation (P5-C1).
- `handleWsClear()` implementation (P5-C1).
- Auto-scroll toggle listener (P5-C1).
- INIT section wiring for Events panel buttons (P5-C1).
- CSS additions for `.ws-entry` / `.ws-counter` (P5-C1).
- Any changes to `index.html` or `styles.css`.

## Approach

1. **Locate the stub**: Find the `// ── WEBSOCKET ──` banner in `app.js` (line 129–132). It currently contains only a single comment: `// WebSocket connection and event handling will be added in Phase 005.`

2. **Implement `wsConnect()`**:
   - Read `baseUrl` from module-level state.
   - Build `wsUrl`: replace `http://` with `ws://` and `https://` with `wss://`, then append `/v1/events`.
     - Use regex: `wsUrl = baseUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/v1/events'`.
   - Create `ws = new WebSocket(wsUrl)`.
   - Set `ws.onopen`:
     - `document.getElementById("ws-status").textContent = "● Connected"`.
     - `document.getElementById("ws-status").className = "status-ok"`.
     - Enable `#ws-disconnect-btn`, disable `#ws-connect-btn`.
   - Set `ws.onclose`:
     - `document.getElementById("ws-status").textContent = "● Disconnected"`.
     - `document.getElementById("ws-status").className = "status-error"`.
     - Enable `#ws-connect-btn`, disable `#ws-disconnect-btn`.
     - Set `ws = null`.
   - Set `ws.onerror`:
     - Append `[ERROR] WebSocket error` entry to `#ws-log` via `appendWsLogEntry`-style DOM manipulation (create a div with `[ERROR]` text, not full JSON).
   - Set `ws.onmessage = (event) => { handleWsMessage(event.data); }`.

3. **Implement `wsDisconnect()`**:
   - Guard: `if (ws !== null && ws.readyState !== WebSocket.CLOSED) { ws.close(); }`.

4. **Implement `appendWsLogEntry(msg)`**:
   - Extract `msg.event` (string), derive safe class suffix: `msg.event.replace(/\./g, "-")`.
   - Create `const entry = document.createElement("div")`.
   - Set `entry.className = "ws-entry ws-entry-" + safeType`.
   - Set `entry.textContent = JSON.stringify(msg, null, 2)`.
   - Append to `document.getElementById("ws-log")`.
   - If `wsAutoScroll` is true, set `el.scrollTop = el.scrollHeight`.

5. **Implement `handleWsMessage(raw)`**:
   - Try `const msg = JSON.parse(raw)`. On catch: create error entry with `[PARSE ERROR] <raw>` text, return.
   - Read `msg.event` (string). Convert to filter ID: `const filterId = "ws-filter-" + msg.event.replace(/\./g, "-")`.
   - Check filter: `const filterEl = document.getElementById(filterId); if (filterEl && !filterEl.checked) return;`.
   - Increment counter: `wsCounters[msg.event] = (wsCounters[msg.event] || 0) + 1`.
   - Call `renderWsCounters()` (forward reference — function will exist after P5-C1 completes).
   - Call `appendWsLogEntry(msg)`.

6. **Verify syntax**: Run `node --check app.js` and confirm exit code 0.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `app.js` | Replace WEBSOCKET stub with `wsConnect`, `wsDisconnect`, `handleWsMessage`, `appendWsLogEntry` implementations |

## Tests

No automated tests exist for this project (per ENVIRONMENT.md §8: "There are no automated tests for this project."). Acceptance is via `node --check app.js` (syntax check) and manual browser testing against a running AnvilML instance.

## CI Impact

No CI for this project (ENVIRONMENT.md §9). No CI changes required.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `renderWsCounters()` not yet implemented (P5-C1 not complete) | High | `handleWsMessage` will throw on first message if called before P5-C1 | Guard the call: only invoke `renderWsCounters()` if it exists (`if (typeof renderWsCounters === "function") renderWsCounters();`). This is safe forward-reference handling. |
| `baseUrl` does not start with `http://` or `https://` | Low | URL construction produces invalid WebSocket URL | Defensive fallback: after replacement, if URL doesn't start with `ws://` or `wss://`, prepend `ws://`. Documented as known limitation in TASKS_PHASE005.md §Known Constraints. |
| `onerror` and `onclose` both fire on refused connection | Expected (per TASKS_PHASE005.md) | Two log entries appear for one event | This is documented and expected behavior. No mitigation needed — the error entry is informative. |
| `node --check` fails due to syntax error in new code | Medium | Task cannot be marked complete | Careful implementation following the exact spec; verify with `node --check` after writing. |

## Acceptance Criteria

- [ ] `node --check app.js` exits 0
- [ ] `wsConnect` function exists and is callable (grep for `function wsConnect`)
- [ ] `wsDisconnect` function exists and is callable (grep for `function wsDisconnect`)
- [ ] `handleWsMessage` function exists and is callable (grep for `function handleWsMessage`)
- [ ] `appendWsLogEntry` function exists and is callable (grep for `function appendWsLogEntry`)
- [ ] WebSocket URL construction uses `ws://` or `wss://` prefix with `/v1/events` suffix
- [ ] `ws.onopen` sets `#ws-status` text to "● Connected" with class `status-ok`
- [ ] `ws.onclose` sets `#ws-status` text to "● Disconnected" with class `status-error` and `ws = null`
- [ ] `ws.onerror` appends `[ERROR]` entry to `#ws-log`
- [ ] `wsDisconnect` guards `ws.readyState !== WebSocket.CLOSED` before calling `ws.close()`
- [ ] `handleWsMessage` parses JSON, checks filter checkbox, increments counter, calls `renderWsCounters` and `appendWsLogEntry`
