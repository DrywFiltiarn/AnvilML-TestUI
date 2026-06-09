# Plan Report: P1-A1

| Field       | Value                                           |
|-------------|-------------------------------------------------|
| Task ID     | P1-A1                                           |
| Phase       | 001 — Static Shell & Connection                 |
| Description | package.json, .gitignore, README.md scaffold    |
| Depends on  | none                                            |
| Project     | anvilml-testui                                  |
| Planned at  | 2026-06-09T18:30:00Z                            |
| Attempt     | 1                                               |

## Objective

Create the three non-source repository files required before any other Phase 001 work can proceed: `package.json` (project metadata, serve script, devDependencies), `.gitignore` (node_modules, OS artefacts, logs), and `README.md` (project description, quick start, AnvilML port note).

## Scope

### In Scope
- Create `package.json` with name `anvilml-testui`, version `0.1.0`, scripts `{ "serve": "npx serve -l 8848 ." }`, `devDependencies: { "serve": "^14.2.0" }`, and `dependencies: {}`.
- Create `.gitignore` with three entries: `node_modules/`, `.DS_Store`, `*.log`.
- Verify `README.md` exists and contains: one-paragraph description, quick start (`npm install` + `npm run serve`), and note that AnvilML runs on port 8488.
- Acceptance: `python3 -c "import json; d=json.load(open('package.json')); assert d['scripts']['serve']=='npx serve -l 8848 .'"` exits 0.

### Out of Scope
- Running `npm install` (user performs this step).
- Creating source files (`index.html`, `app.js`, `styles.css`) — handled by P1-B1, P1-C1, P1-D1.
- Any CI configuration — not used for this project.
- Version bumping — the Forge handles patch version increments on commits that modify source files (§12 of FORGE_AGENT_RULES).

## Approach

1. **Create `package.json`** at repository root with the following structure:
   ```json
   {
     "name": "anvilml-testui",
     "version": "0.1.0",
     "description": "",
     "scripts": {
       "serve": "npx serve -l 8848 ."
     },
     "devDependencies": {
       "serve": "^14.2.0"
     },
     "dependencies": {}
   }
   ```
   - `dependencies` is explicitly an empty object `{}`, not absent (per task key implementation note).
   - `serve` version `^14.2.0` matches ARCHITECTURE.md §6 and TASKS_PHASE001.md. No npm MCP is configured in `opencode.json` (only `rust-docs` and `pypi-query` are available); the version falls back to the documented value per FORGE_AGENT_RULES §6.4.

2. **Create `.gitignore`** at repository root with exactly three lines:
   ```
   node_modules/
   .DS_Store
   *.log
   ```
   - Matches ENVIRONMENT.md §11 exactly.

3. **Verify `README.md`** — the file already exists at repository root with a one-paragraph description, quick start section (`npm install` + `npm run serve`), and a note that AnvilML runs on port 8488. No modification needed. Confirm compliance by reading the file (already done).

4. **Acceptance verification** — run:
   ```bash
   python3 -c "import json; d=json.load(open('package.json')); assert d['scripts']['serve']=='npx serve -l 8848 .'"
   ```
   Expected: exits 0.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Create | `package.json` | Project manifest with name, version, serve script, serve devDependency, empty dependencies |
| Create | `.gitignore` | Three entries: node_modules/, .DS_Store, *.log |
| Verify | `README.md` | Already exists; confirmed to contain required description, quick start, and AnvilML port note |

## Tests

None. This task creates only configuration and documentation files. ENVIRONMENT.md §8 states there are no automated tests for this project; acceptance is verified via the python3 JSON parse assertion.

## CI Impact

No CI changes required. ENVIRONMENT.md §9 states GitHub Actions is not used for this project.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `serve` `^14.2.0` is outdated | Low | Low — serve 14.x is stable; `-l PORT` syntax confirmed for 14.x (TASKS_PHASE001.md known constraints) | Version pin noted in plan; can be bumped in a future task if needed |
| No npm MCP available to verify latest version | Certain | None — documented fallback per FORGE_AGENT_RULES §6.4; ARCHITECTURE.md §6 specifies `^14.2.0` as authoritative | Record gap in Risks table; use documented version |
| README.md already exists with different content | Certain | Low — existing README is more comprehensive but fully compliant with task requirements | Keep existing file; no modification needed |
| `dependencies` field accidentally omitted | Low | Medium — task key note requires empty object `{}`, not absent | Explicitly write `"dependencies": {}` in heredoc |

## Acceptance Criteria

- [ ] `package.json` exists and parses as valid JSON with `name: "anvilml-testui"` and `version: "0.1.0"`
- [ ] `package.json.scripts.serve` equals exactly `"npx serve -l 8848 ."`
- [ ] `package.json.dependencies` is an empty object `{}`
- [ ] `package.json.devDependencies.serve` is `"^14.2.0"`
- [ ] `.gitignore` contains `node_modules/`, `.DS_Store`, and `*.log`
- [ ] `README.md` contains a one-paragraph description, quick start with `npm install` + `npm run serve`, and AnvilML port 8488 note
- [ ] `python3 -c "import json; d=json.load(open('package.json')); assert d['scripts']['serve']=='npx serve -l 8848 .'"` exits 0
