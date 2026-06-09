# Plan Report: P5-A1

| Field       | Value                                       |
|-------------|---------------------------------------------|
| Task ID     | P5-A1                                       |
| Phase       | 005 — WebSocket Events Panel                |
| Description | Events panel HTML — full panel replacing Phase 001 stub |
| Depends on  | none (Phase 001 stub already in place)      |
| Project     | anvilml-testui                              |
| Planned at  | 2026-06-09T21:30:00Z                        |
| Attempt     | 1                                           |

## Objective

Replace the minimal Phase 001 Events panel stub in `index.html` with the complete Events
panel structure: a controls row (connect/disconnect/status/clear/auto-scroll), a filter row
with 10 checkboxes for all WsEvent types, a counters row (`#ws-counters`), and the log area
(`#ws-log`). All 17 required DOM IDs must be present.

## Scope

### In Scope
- Replace the Events panel section in `index.html` (lines 113–137) with the full panel HTML
- Controls row: `#ws-connect-btn`, `#ws-disconnect-btn` (disabled), `#ws-status` (span with
  "● Disconnected" and `.status-error` class), `#ws-clear-btn`, `#ws-auto-scroll` checkbox
  (checked, with label "Auto-scroll")
- Filter row: label "Filter:" followed by 10 checkboxes with `id="ws-filter-<event_type>"`
  (dots replaced by dashes), all checked, label text is the raw event type string
  (e.g. "job.queued", "system.stats")
- Counters row: `#ws-counters` div (initially empty; populated by `app.js` in later tasks)
- Log area: `#ws-log` div with class `ws-log` (replaces `<pre id="ws-log">`)

### Out of Scope
- `app.js` WebSocket engine implementation (task P5-B1)
- Filter checkbox wiring, counter rendering, clear handler, auto-scroll handler (task P5-C1)
- CSS additions for `.ws-entry`, `.ws-counter` styles (task P5-C1)
- Any changes to Connection, System, Models, Workers, Jobs, or Artifacts panels
- Any changes to `styles.css` or `package.json`

## Approach

1. Open `index.html` and locate the Events panel section (lines 113–137, between the
   `<!-- Events Panel -->` comment and the closing `</details>` tag).
2. Replace the entire Events panel section with the new structure:

```html
    <!-- Events Panel -->
    <details id="events-panel">
      <summary>Events</summary>
      <div class="controls">
        <button id="ws-connect-btn">Connect</button>
        <button id="ws-disconnect-btn" disabled>Disconnect</button>
        <span id="ws-status" class="status-error">● Disconnected</span>
        <button id="ws-clear-btn">Clear</button>
        <label><input type="checkbox" id="ws-auto-scroll" checked> Auto-scroll</label>
      </div>
      <div class="filters">
        <label>Filter:</label>
        <label><input type="checkbox" id="ws-filter-job-queued" checked> job.queued</label>
        <label><input type="checkbox" id="ws-filter-job-started" checked> job.started</label>
        <label><input type="checkbox" id="ws-filter-job-progress" checked> job.progress</label>
        <label><input type="checkbox" id="ws-filter-job-image-ready" checked> job.image_ready</label>
        <label><input type="checkbox" id="ws-filter-job-completed" checked> job.completed</label>
        <label><input type="checkbox" id="ws-filter-job-failed" checked> job.failed</label>
        <label><input type="checkbox" id="ws-filter-job-cancelled" checked> job.cancelled</label>
        <label><input type="checkbox" id="ws-filter-worker-status" checked> worker.status</label>
        <label><input type="checkbox" id="ws-filter-system-stats" checked> system.stats</label>
        <label><input type="checkbox" id="ws-filter-provisioning-progress" checked> provisioning.progress</label>
      </div>
      <div id="ws-counters"></div>
      <div id="ws-log" class="ws-log"></div>
    </details>
```

3. Verify all 17 required IDs are present using the acceptance criterion command from
   TASKS_PHASE005.md:
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

4. Confirm HTML is well-formed: no unclosed tags, no duplicate IDs.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `index.html` | Replace Events panel stub (lines 113–137) with full panel structure |

## Tests

No test files created. Acceptance criterion is the Python ID presence check above.
Per ENVIRONMENT.md §8, there are no automated tests for this project; acceptance is
verified manually against the running application.

## CI Impact

No CI changes required. Per ENVIRONMENT.md §9, there is no CI for this project.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Duplicate ID conflict with pre-existing IDs from other panels | Low | High | The 17 new IDs are all `ws-*` prefixed; no other panel uses this prefix per ARCHITECTURE.md §4 |
| HTML well-formedness breakage during replacement | Low | Medium | Careful copy-paste of the exact replacement block; verify with Python acceptance check |
| Filter label text mismatch with WsEvent type strings | Low | Medium | Use exact event type strings from TASKS_PHASE005.md (e.g. "job.image_ready" not "job-image-ready") |

## Acceptance Criteria

- [ ] All 17 Events panel IDs present in `index.html` (Python check passes)
- [ ] `#ws-disconnect-btn` has `disabled` attribute
- [ ] `#ws-status` contains "● Disconnected" text with `class="status-error"`
- [ ] `#ws-auto-scroll` checkbox has `checked` attribute
- [ ] All 10 filter checkboxes have `checked` attribute
- [ ] `#ws-log` has `class="ws-log"` (not `<pre>`)
- [ ] `#ws-counters` is a `<div>` element
- [ ] No duplicate IDs introduced
- [ ] HTML is well-formed (no unclosed tags)
- [ ] Phase 001 "Coming in Phase 005" heading text removed
