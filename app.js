// AnvilML-TestUI — app.js
// Non-module script; loaded via <script defer src="app.js"> in index.html.

// ============================================================================
// CONFIG
// ============================================================================
// Configuration constants (none yet beyond default URL in STATE).

// ============================================================================
// STATE
// ============================================================================
let baseUrl = "http://localhost:8488";
let ws = null;
let wsFilterSet = new Set();
let wsCounters = {};
let wsAutoScroll = true;
let lastArtifactUrl = null;

// ============================================================================
// TEMPLATES
// ============================================================================
// Template constants (ZiT, SDXL) will be added in Phase 003.

// ============================================================================
// UTILITIES
// ============================================================================

function showResponse(elementId, data, ok) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.classList.remove("status-ok", "status-error");
  if (ok) {
    element.classList.add("status-ok");
  } else {
    element.classList.add("status-error");
  }
  element.textContent = JSON.stringify(data, null, 2);
}

// ============================================================================
// API CLIENT
// ============================================================================

async function apiFetch(path, options = {}) {
  const url = baseUrl.replace(/\/+$/, "") + path;
  try {
    const resp = await fetch(url, options);
    if (resp.status === 204) {
      return { ok: true, status: 204, data: { status: "deleted" } };
    }
    if (resp.ok) {
      try {
        const data = await resp.json();
        return { ok: true, status: resp.status, data: data };
      } catch {
        return { ok: true, status: resp.status, data: { status: "ok" } };
      }
    }
    try {
      const parsedBody = await resp.json();
      return { ok: false, status: resp.status, data: parsedBody };
    } catch {
      return { ok: false, status: resp.status, data: { error: "non_2xx", status: resp.status } };
    }
  } catch (e) {
    return { ok: false, status: 0, data: { error: "network_error", message: e.message } };
  }
}

// ============================================================================
// WEBSOCKET
// ============================================================================
// WebSocket connection and event handling will be added in Phase 005.

// ============================================================================
// PANEL: CONNECTION
// ============================================================================

async function handleConnect() {
  const data = await apiFetch("/health");
  const statusEl = document.getElementById("conn-status");
  if (statusEl) {
    if (data.ok) {
      statusEl.textContent = "● Connected — AnvilML v" + (data.data?.version ?? "unknown");
      statusEl.className = "status-ok";
    } else {
      statusEl.textContent = "✗ " + (data.data?.message ?? "unreachable");
      statusEl.className = "status-error";
    }
  }
  showResponse("conn-response", data, data.ok);
}

// ============================================================================
// PANEL: SYSTEM
// ============================================================================

async function handleSysInfo() {
  const { ok, data } = await apiFetch("/v1/system");
  showResponse("sys-response", data, ok);
}

async function handleSysEnv() {
  const { ok, data } = await apiFetch("/v1/system/env");
  showResponse("sys-response", data, ok);
}

async function handleSysVersions() {
  const { ok, data } = await apiFetch("/v1/system/versions");
  showResponse("sys-response", data, ok);
}

// ============================================================================
// PANEL: MODELS
// ============================================================================
// Models panel handlers will be added in Phase 002.

// ============================================================================
// PANEL: WORKERS
// ============================================================================
// Workers panel handlers will be added in Phase 003.

// ============================================================================
// PANEL: JOBS
// ============================================================================
// Jobs panel handlers will be added in Phase 003.

// ============================================================================
// PANEL: ARTIFACTS
// ============================================================================
// Artifacts panel handlers will be added in Phase 004.

// ============================================================================
// PANEL: EVENTS
// ============================================================================
// Events panel handlers will be added in Phase 005.

// ============================================================================
// INIT
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("anvilml_base_url");
  if (saved) {
    baseUrl = saved;
    const baseUrlInput = document.getElementById("base-url");
    if (baseUrlInput) {
      baseUrlInput.value = saved;
    }
  }

  const baseUrlInput = document.getElementById("base-url");
  if (baseUrlInput) {
    baseUrlInput.addEventListener("change", () => {
      baseUrl = baseUrlInput.value;
      localStorage.setItem("anvilml_base_url", baseUrl);
    });
  }

  const connectBtn = document.getElementById("connect-btn");
  if (connectBtn) {
    connectBtn.addEventListener("click", () => {
      handleConnect();
    });
  }

  // System panel
  const sysInfoBtn = document.getElementById("sys-info-btn");
  if (sysInfoBtn) sysInfoBtn.addEventListener("click", handleSysInfo);

  const sysEnvBtn = document.getElementById("sys-env-btn");
  if (sysEnvBtn) sysEnvBtn.addEventListener("click", handleSysEnv);

  const sysVersionsBtn = document.getElementById("sys-versions-btn");
  if (sysVersionsBtn) sysVersionsBtn.addEventListener("click", handleSysVersions);
});
