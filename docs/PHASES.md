# PHASES.md — AnvilML-TestUI Phase Registry

**Repository:** `AnvilML-TestUI`
**Version:** Rev 1 — 2026-06-09

---

## Conventions

- Phase numbers are zero-padded three digits: `001`, `002`, …
- Task IDs: short phase number, no leading zero: `P1-A1`, `P2-B3`.
- File names: `tasks_phase001.json`, `TASKS_PHASE001.md`.
- Phases 900–999 are reserved for retrofit, correction, and adjustment.
- Each phase ends with a Runnable Proof: a manual verification sequence that confirms
  the phase deliverable works against a real AnvilML instance.

---

## Phase Map

| Phase | Name | Vertical slice delivered | Runnable proof (summary) |
|------:|------|--------------------------|--------------------------|
| 001 | Static Shell & Connection | `index.html` / `app.js` / `styles.css` skeleton; Connection panel; `GET /health` | `npm run serve` binds 8848; Connection panel shows AnvilML health response |
| 002 | System & Models Panels | System panel (3 endpoints); Models panel (3 endpoints) | All six buttons return correct JSON from a running AnvilML |
| 003 | Workers & Jobs Panels | Workers panel (2 endpoints); Jobs panel (8 endpoints incl. submit with graph templates) | Submit ZiT job; list jobs; cancel; delete all work end-to-end |
| 004 | Artifacts Panel & Image Rendering | Artifacts panel; image fetch and inline render | After a completed job, artifact hash fetches and renders as `<img>` |
| 005 | WebSocket Events Panel | Full WS panel: connect, log, filter, counters, auto-scroll | Connect to `/v1/events`; submit job; observe all lifecycle events in log |

---

## Milestone Groupings

| Group | Phases | Theme |
|-------|--------|-------|
| Foundation | 001 | Serve infrastructure, connection, health check |
| Read-only surface | 002 | System info, model registry, env preflight |
| Write surface | 003 | Worker control, job lifecycle, graph submission |
| Artifact surface | 004 | Artifact listing, binary fetch, image rendering |
| Live events | 005 | WebSocket connection, event log, filtering |

---

## Retrofit Phases (900–999)

Phase numbers 900–999 are reserved exclusively for retrofit, correction, and adjustment
work inserted between already-executed primary phases. They follow the same authoring
rules as primary phases. Execution order is determined entirely by `prereqs`.

No retrofit phases are defined at initial authoring.

---

## Notes on Phase Sequencing

Phase 001 must be complete before any subsequent phase, as it establishes the file
layout, DOM structure, `apiFetch` utility, and `baseUrl` state that all later phases
depend on.

Phases 002 through 005 can be developed sequentially. Each adds new panel sections to
`index.html` and corresponding handler sections to `app.js` without modifying previously
committed panel code.

Phase 005 (WebSocket) is last because:
1. It depends on having job submission (Phase 003) working to generate events.
2. The `image_ready` event references artifact hashes, which are only meaningful once
   Phase 004 (artifact rendering) is working.
