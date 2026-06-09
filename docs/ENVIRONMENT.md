# ENVIRONMENT.md — AnvilML-TestUI Configuration & Environment Reference

**Document:** `docs/ENVIRONMENT.md`
**Location in repo:** `AnvilML-TestUI/docs/ENVIRONMENT.md`
**Read by:** OpenCode forge-plan and forge-act agents at the start of every session.

---

## 1. Repository Layout

```
AnvilML-TestUI/
├── index.html
├── app.js
├── styles.css
├── package.json
├── .gitignore
├── README.md
└── docs/
    ├── ANVILML_TESTUI_DESIGN.md
    ├── ARCHITECTURE.md
    ├── ENVIRONMENT.md         ← this file
    ├── PHASES.md
    └── TASKS_PHASE*.md
```

No `src/`, no `dist/`, no `build/`. The repository root is the served directory.

---

## 2. Runtime Configuration

There are no environment variables for this project. The only runtime configuration
is the AnvilML base URL, entered by the user in the Connection panel UI and persisted
to `localStorage` under the key `"anvilml_base_url"`.

**Default:** `http://localhost:8488`

---

## 3. Node.js & npm

| Requirement | Value |
|---|---|
| Node.js | ≥ 18.x (LTS) |
| npm | ≥ 9.x (bundled with Node 18+) |
| Package manager | npm only — no pnpm, no yarn |

No `.nvmrc` or `.node-version` file is required. The project makes no use of Node.js
at runtime (only `serve` is invoked via npm scripts).

---

## 4. Installation

```bash
npm install
```

This installs `serve` into `node_modules/`. Run once after cloning. No other dependencies.

---

## 5. Development Serve Command

```bash
npm run serve
```

Equivalent to:

```bash
npx serve -l 8848 .
```

This starts the `serve` static file server on port **8848**, rooted at the repository
directory. Open `http://localhost:8848` in a browser. AnvilML must be running on port
**8488** (or the URL adjusted in the Connection panel).

There is no watch mode, no hot reload, no build step. Refresh the browser to pick up
changes.

---

## 6. No Build Step

There is no build step. The agent must never:
- Create a `webpack.config.js`, `vite.config.js`, or any other bundler configuration.
- Create a `tsconfig.json` or TypeScript source files.
- Create a `src/` directory.
- Add any `dependencies` entry to `package.json`.
- Run `npm run build` (this script does not exist and must not be added).
- Add any `babel`, `esbuild`, `rollup`, or `postcss` configuration.

The three source files (`index.html`, `app.js`, `styles.css`) are served directly.

---

## 7. Linting & Formatting Gates

There is no automated linter or formatter for this project. The agent verifies
correctness by:

1. Confirming `npm install` exits 0.
2. Confirming `npm run serve` starts without error (exits only on Ctrl-C; the agent
   verifies it binds port 8848 by checking stdout for `Serving!` or equivalent).
3. Confirming the HTML is well-formed (no unclosed tags, no duplicate IDs) by visual
   review of the file.
4. Confirming all `getElementById` calls in `app.js` reference IDs that exist in
   `index.html` (manual cross-reference check).

No `eslint`, `prettier`, or `stylelint` is required. If they are added in a future phase,
this document will be updated before that phase's tasks are authored.

---

## 8. Testing Gates

There are no automated tests for this project. Acceptance criteria for each phase are
verified manually against a running AnvilML instance. The agent documents the manual
verification steps in the `## Runnable Proof` section of each `TASKS_PHASE` document.

---

## 9. CI

There is no CI for this project. GitHub Actions is not used. The agent does not create
`.github/` directory or workflow files.

---

## 10. Package Manifest Location

```
AnvilML-TestUI/package.json
```

The agent increments the `version` patch digit in this file for every commit that
modifies `index.html`, `app.js`, or `styles.css`.

---

## 11. .gitignore

```
node_modules/
.DS_Store
*.log
```

The agent must not commit `node_modules/`. No build artifacts exist to gitignore.

---

## 12. Cross-Check (Secondary Platform)

There is no secondary platform cross-check. The application is browser-native and
platform-agnostic. The agent documents "Not applicable" in the Platform Cross-Check
section of implementation reports.

---

## 13. AnvilML Compatibility

AnvilML-TestUI targets the AnvilML API surface as documented in:

- `https://github.com/DrywFiltiarn/AnvilML` → `docs/ARCHITECTURE.md §7` (HTTP API surface)
- `https://github.com/DrywFiltiarn/AnvilML` → `ANVILML_DESIGN.md §4.6` (WebSocket events)
- `https://github.com/DrywFiltiarn/AnvilML` → `ANVILML_DESIGN.md §14.6` (node set)

The agent must not invent endpoints or event types. If the API surface changes, the
AnvilML project docs are authoritative.
