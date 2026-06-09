# Plan Report: P5-C1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P5-C1                                             |
| Phase       | 005 — WebSocket Events Panel                      |
| Description | Events panel — counters, clear, auto-scroll, CSS polish |
| Depends on  | P5-A1, P5-B1                                      |
| Project     | anvilml-testui                                    |
| Planned at  | 2026-06-09T22:00:00Z                              |
| Attempt     | 1                                                   |

## Objective

Complete the Events panel by implementing `renderWsCounters()` and `handleWsClear()` in
`app.js`, wiring all Events panel buttons in the INIT section, adding the auto-scroll
toggle handler, and adding CSS polish for event entries and counters in `styles.css`.

## Scope

### In Scope
- `app.js` — add `renderWsCounters()` function (clears `#ws-counters`, creates
  `<span class="ws-counter">` for each of 10 event types showing `event.type: N`)
- `app.js` — add `handleWsClear()` function (empties `#ws-log`, resets `wsCounters={}`,
  calls `renderWsCounters()`)
- `app.js` — add auto-scroll toggle handler for `#ws-auto-scroll` (updates `wsAutoScroll`
  boolean on `change` event)
- `app.js` — wire Events panel buttons in INIT section: `#ws-connect-btn` → `wsConnect`,
  `#ws-disconnect-btn` → `wsDisconnect`, `#ws-clear-btn` → `handleWsClear`,
  `#ws-auto-scroll` → auto-scroll toggle
- `app.js` — replace the PANEL: EVENTS stub comment with the new function definitions
- `styles.css` — add `.ws-entry` styling (border-bottom, padding, font-size, white-space)
- `styles.css` — add `.ws-entry-system-stats` (muted colour)
- `styles.css` — add `.ws-entry-job-completed` (green colour)
- `styles.css` — add `.ws-entry-job-failed` (red colour)
- `styles.css` — add `.ws-counter` styling (monospace, small, muted)
- Verification: `node --check app.js` exits 0

### Out of Scope
- Events panel HTML structure (handled by P5-A1)
- WebSocket engine: `wsConnect`, `wsDisconnect`, `onmessage`, `handleWsMessage`,
  `appendWsLogEntry` (handled by P5-B1)
- Any changes to `index.html`
- Any dependency additions or version changes
- Any CI/CD changes (none exist per ENVIRONMENT.md §9)

## Approach

1. **Add `renderWsCounters()` to app.js** in the PANEL: EVENTS section. The function
   clears `#ws-counters.innerHTML`, then iterates the 10 known event types
   (`job.queued`, `job.started`, `job.progress`, `job.image_ready`, `job.completed`,
   `job.failed`, `job.cancelled`, `worker.status`, `system.stats`,
   `provisioning.progress`). For each, creates a `<span class="ws-counter">` with
   textContent `"<event_type>: <count>"` where count is `wsCounters[event] || 0`.
   Separates spans with a space. This function is already called by
   `handleWsMessage()` (line 221) via `typeof renderWsCounters === "function"` guard,
   so no change needed there.

2. **Add `handleWsClear()` to app.js** in the PANEL: EVENTS section. Sets
   `document.getElementById("ws-log").textContent = ""`, resets `wsCounters = {}`,
   calls `renderWsCounters()`.

3. **Add auto-scroll toggle handler** in the INIT section. Adds a `change` event listener
   to `#ws-auto-scroll` that sets `wsAutoScroll = this.checked`.

4. **Wire Events panel buttons in INIT section.** Add event listeners for:
   - `#ws-connect-btn` → `wsConnect`
   - `#ws-disconnect-btn` → `wsDisconnect`
   - `#ws-clear-btn` → `handleWsClear`

5. **Add CSS to styles.css.** Append the following rules after the existing utility section:
   - `.ws-entry { border-bottom: 1px solid var(--border); padding: 4px 0; font-size: 11px; white-space: pre-wrap; }`
   - `.ws-entry-system-stats { color: var(--text-muted); }`
   - `.ws-entry-job-completed { color: var(--green); }`
   - `.ws-entry-job-failed { color: var(--red); }`
   - `.ws-counter { font-family: monospace; font-size: 11px; color: var(--text-muted); margin-right: 8px; }`

6. **Verify** with `node --check app.js`.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `app.js` | Add `renderWsCounters()`, `handleWsClear()` to PANEL: EVENTS section; wire Events buttons + auto-scroll in INIT |
| Modify | `styles.css` | Add `.ws-entry`, `.ws-entry-system-stats`, `.ws-entry-job-completed`, `.ws-entry-job-failed`, `.ws-counter` CSS rules |

## Tests

| Test File | Test Name | What It Verifies |
|-----------|-----------|------------------|
| (none — manual) | `node --check app.js` | JavaScript syntax is valid (exits 0) |
| (none — manual) | Manual: counters | Connect to AnvilML; confirm per-type counters increment in `#ws-counters` |
| (none — manual) | Manual: clear | Click Clear; confirm `#ws-log` is empty and all counters show 0 |
| (none — manual) | Manual: auto-scroll | Toggle auto-scroll checkbox; confirm log stops scrolling when unchecked |
| (none — manual) | Manual: filter | Uncheck a filter checkbox; confirm that event type no longer appears in log |
| (none — manual) | Manual: CSS polish | Confirm `.ws-entry` has border/padding, system stats are muted, completed=green, failed=red |

## CI Impact

No CI changes required. Per `docs/ENVIRONMENT.md §9`, this project has no CI, no GitHub
Actions, and no workflow files. The only verification gate is `node --check app.js`
exiting 0, which is a manual check documented in the TASKS_PHASE005.md acceptance criteria.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| P5-A1 or P5-B1 not yet committed — DOM IDs or functions missing | Low (assumed sequential) | High | Task depends on P5-A1 and P5-B1; if they are not present, the plan must be re-evaluated. The plan assumes both groups are complete. |
| `renderWsCounters()` called before `#ws-counters` exists in DOM | Low | Medium | Function is called from INIT (after DOM ready) and from `handleWsMessage` (after connect). Both are post-DOM-ready contexts. |
| CSS specificity conflict with existing `.ws-log` rules | Low | Low | New rules target child elements (`.ws-entry`, `.ws-counter`) not the container; no specificity conflict expected. |
| `node --check` fails due to syntax error in new code | Low | Medium | Write carefully, verify with `node --check` before completing the task. |

## Acceptance Criteria

- [ ] `node --check app.js` exits 0
- [ ] `renderWsCounters()` exists as a named function and renders all 10 event type counters
- [ ] `handleWsClear()` empties the log, resets counters to `{}`, re-renders counters
- [ ] `#ws-auto-scroll` change listener updates `wsAutoScroll` boolean
- [ ] `#ws-connect-btn` wired to `wsConnect` in INIT
- [ ] `#ws-disconnect-btn` wired to `wsDisconnect` in INIT
- [ ] `#ws-clear-btn` wired to `handleWsClear` in INIT
- [ ] CSS rules `.ws-entry`, `.ws-entry-system-stats`, `.ws-entry-job-completed`,
      `.ws-entry-job-failed`, `.ws-counter` present in `styles.css`
- [ ] All handler functions present: `renderWsCounters`, `handleWsClear` (verified by
      `grep -q "function renderWsCounters" app.js && grep -q "function handleWsClear" app.js`)
