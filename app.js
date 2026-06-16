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
const TEMPLATE_ZIT = JSON.stringify({
  "graph": {
    "nodes": [
      { "id": "n0", "type": "ZitLoadPipeline",  "inputs": { "model_id": "<model_id>" } },
      { "id": "n1", "type": "ZitTextEncode",    "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "prompt": "<prompt>" } },
      { "id": "n2", "type": "ZitSampler",       "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "conditioning": { "node_id": "n1", "output_slot": "conditioning" }, "steps": 8, "seed": -1 } },
      { "id": "n3", "type": "ZitDecode",        "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "latents": { "node_id": "n2", "output_slot": "latents" } } },
      { "id": "n4", "type": "SaveImage",        "inputs": { "image": { "node_id": "n3", "output_slot": "image" }, "prompt": "<prompt>", "seed": { "node_id": "n2", "output_slot": "seed" }, "steps": 8 } }
    ]
  },
  "settings": {
    "seed": -1,
    "steps": 8,
    "guidance_scale": 0.0,
    "width": 1024,
    "height": 1024
  }
}, null, 2);

const TEMPLATE_SDXL = JSON.stringify({
  "graph": {
    "nodes": [
      { "id": "n0", "type": "SdxlLoadPipeline", "inputs": { "model_id": "<model_id>" } },
      { "id": "n1", "type": "SdxlTextEncode",   "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "prompt": "<prompt>", "negative_prompt": "" } },
      { "id": "n2", "type": "SdxlSampler",      "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "conditioning": { "node_id": "n1", "output_slot": "conditioning" }, "steps": 20, "guidance_scale": 7.5, "seed": -1 } },
      { "id": "n3", "type": "SdxlDecode",       "inputs": { "pipeline": { "node_id": "n0", "output_slot": "pipeline" }, "latents": { "node_id": "n2", "output_slot": "latents" } } },
      { "id": "n4", "type": "SaveImage",        "inputs": { "image": { "node_id": "n3", "output_slot": "image" }, "prompt": "<prompt>", "seed": { "node_id": "n2", "output_slot": "seed" }, "steps": 20 } }
    ]
  },
  "settings": {
    "seed": -1,
    "steps": 20,
    "guidance_scale": 7.5,
    "width": 1024,
    "height": 1024
  }
}, null, 2);

function getTemplate(pipeline) {
  if (pipeline === "sdxl") return TEMPLATE_SDXL;
  return TEMPLATE_ZIT;
}

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
    if (resp.status === 202) {
      return { ok: true, status: 202, data: { status: "rescan triggered" } };
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

async function apiFetchBlob(path) {
  const url = baseUrl.replace(/\/+$/, "") + path;
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const blob = await resp.blob();
      return { ok: true, status: resp.status, blob };
    }
    return { ok: false, status: resp.status, blob: null };
  } catch (e) {
    return { ok: false, status: 0, blob: null, error: e.message };
  }
}

// ============================================================================
// WEBSOCKET
// ============================================================================

function wsConnect() {
  var wsUrl = baseUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/v1/events";
  ws = new WebSocket(wsUrl);

  ws.onopen = function () {
    var statusEl = document.getElementById("ws-status");
    if (statusEl) {
      statusEl.textContent = "\u25cf Connected";
      statusEl.className = "status-ok";
    }
    var disconnectBtn = document.getElementById("ws-disconnect-btn");
    if (disconnectBtn) disconnectBtn.disabled = false;
    var connectBtn = document.getElementById("ws-connect-btn");
    if (connectBtn) connectBtn.disabled = true;
  };

  ws.onclose = function () {
    var statusEl = document.getElementById("ws-status");
    if (statusEl) {
      statusEl.textContent = "\u25cf Disconnected";
      statusEl.className = "status-error";
    }
    var connectBtn = document.getElementById("ws-connect-btn");
    if (connectBtn) connectBtn.disabled = false;
    var disconnectBtn = document.getElementById("ws-disconnect-btn");
    if (disconnectBtn) disconnectBtn.disabled = true;
    ws = null;
  };

  ws.onerror = function () {
    var logEl = document.getElementById("ws-log");
    if (!logEl) return;
    var entry = document.createElement("div");
    entry.className = "ws-entry";
    entry.textContent = "[ERROR] WebSocket error";
    logEl.appendChild(entry);
    if (wsAutoScroll) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  };

  ws.onmessage = function (event) {
    handleWsMessage(event.data);
  };
}

function wsDisconnect() {
  if (ws !== null && ws.readyState !== WebSocket.CLOSED) {
    ws.close();
  }
}

function appendWsLogEntry(msg) {
  var safeType = (msg.type || "").replace(/\./g, "-");
  var entry = document.createElement("div");
  entry.className = "ws-entry ws-entry-" + safeType;
  entry.textContent = JSON.stringify(msg, null, 2);
  var logEl = document.getElementById("ws-log");
  if (logEl) {
    logEl.appendChild(entry);
    if (wsAutoScroll) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  }
}

function handleWsMessage(raw) {
  var msg;
  try {
    msg = JSON.parse(raw);
  } catch (e) {
    var logEl = document.getElementById("ws-log");
    if (logEl) {
      var entry = document.createElement("div");
      entry.className = "ws-entry";
      entry.textContent = "[PARSE ERROR] " + raw;
      logEl.appendChild(entry);
      if (wsAutoScroll) {
        logEl.scrollTop = logEl.scrollHeight;
      }
    }
    return;
  }

  var filterId = "ws-filter-" + (msg.type || "").replace(/_/g, "-");
  var filterEl = document.getElementById(filterId);
  if (filterEl && !filterEl.checked) return;

  wsCounters[msg.type] = (wsCounters[msg.type] || 0) + 1;
  if (typeof renderWsCounters === "function") renderWsCounters();
  appendWsLogEntry(msg);
}

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

async function handleModelsList() {
  const kind = document.getElementById("models-kind").value;
  const path = "/v1/models" + (kind ? "?kind=" + kind : "");
  const { ok, data } = await apiFetch(path);
  showResponse("models-response", data, ok);
}

async function handleModelsGet() {
  const id = document.getElementById("models-id").value;
  if (!id) {
    showResponse("models-response", { error: "id_required", message: "Enter a model ID" }, false);
    return;
  }
  const { ok, data } = await apiFetch("/v1/models/" + id);
  showResponse("models-response", data, ok);
}

async function handleModelsRescan() {
  const { ok, data } = await apiFetch("/v1/models/rescan", { method: "POST" });
  showResponse("models-response", data, ok);
}

// ============================================================================
// PANEL: WORKERS
// ============================================================================

async function handleWorkersList() {
  const { ok, data } = await apiFetch("/v1/workers");
  showResponse("workers-response", data, ok);
}

async function handleWorkersRestart() {
  const id = document.getElementById("workers-id").value;
  if (!id) {
    showResponse("workers-response", { error: "id_required", message: "Enter a worker ID" }, false);
    return;
  }
  const { ok, data } = await apiFetch("/v1/workers/" + id + "/restart", { method: "POST" });
  showResponse("workers-response", data, ok);
}

// ============================================================================
// PANEL: JOBS
// ============================================================================
// Jobs panel handlers will be added in Phase 003.

async function handleJobReset() {
  const pipeline = document.getElementById("jobs-pipeline").value;
  document.getElementById("jobs-body").value = getTemplate(pipeline);
}

async function handleJobSubmit() {
  const raw = document.getElementById("jobs-body").value.trim();
  if (!raw) {
    showResponse("jobs-response", { error: "empty_body", message: "Request body is empty" }, false);
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    showResponse("jobs-response", { error: "json_parse_error", message: e.message }, false);
    return;
  }
  const data = await apiFetch("/v1/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw,
  });
  showResponse("jobs-response", data.data, data.ok);
  if (data.ok && data.data && data.data.job_id) {
    document.getElementById("jobs-job-id").value = data.data.job_id;
  }
}

async function handleJobsList() {
  const status = document.getElementById("jobs-status-filter").value;
  const path = "/v1/jobs" + (status ? "?status=" + status : "");
  const { ok, data } = await apiFetch(path);
  showResponse("jobs-response", data, ok);
}

async function handleJobsGet() {
  const id = document.getElementById("jobs-job-id").value;
  if (!id) {
    showResponse("jobs-response", { error: "id_required", message: "Enter a job ID" }, false);
    return;
  }
  const { ok, data } = await apiFetch("/v1/jobs/" + id);
  showResponse("jobs-response", data, ok);
}

async function handleJobsCancel() {
  const id = document.getElementById("jobs-job-id").value;
  if (!id) {
    showResponse("jobs-response", { error: "id_required", message: "Enter a job ID" }, false);
    return;
  }
  const { ok, data } = await apiFetch("/v1/jobs/" + id + "/cancel", { method: "POST" });
  showResponse("jobs-response", data, ok);
}

async function handleJobsDelete() {
  const id = document.getElementById("jobs-job-id").value;
  if (!id) {
    showResponse("jobs-response", { error: "id_required", message: "Enter a job ID" }, false);
    return;
  }
  const { ok, data } = await apiFetch("/v1/jobs/" + id, { method: "DELETE" });
  showResponse("jobs-response", data, ok);
}

async function handleJobsBulkClear() {
  const status = document.getElementById("jobs-bulk-status").value;
  const { ok, data } = await apiFetch("/v1/jobs?status=" + status, { method: "DELETE" });
  showResponse("jobs-response", data, ok);
}

// ============================================================================
// PANEL: ARTIFACTS
// ============================================================================

async function handleArtifactsList() {
  const jobId = document.getElementById("artifacts-job-id").value;
  const path = "/v1/artifacts" + (jobId ? "?job_id=" + jobId : "");
  const { ok, data } = await apiFetch(path);
  const element = document.getElementById("artifacts-response");
  if (!element) return;
  if (ok) {
    element.textContent = JSON.stringify(data, null, 2);
  } else {
    element.innerHTML = '<pre class="status-error">Error: ' + (data?.message ?? String(data)) + "</pre>";
  }
}

async function handleArtifactsFetch() {
  const hash = document.getElementById("artifacts-hash").value;
  if (!hash) {
    const element = document.getElementById("artifacts-response");
    if (element) element.textContent = "Error: artifact hash required";
    return;
  }
  const path = "/v1/artifacts/" + hash;
  const result = await apiFetchBlob(path);
  const element = document.getElementById("artifacts-response");
  if (!element) return;
  if (result.ok && result.blob) {
    if (lastArtifactUrl) {
      URL.revokeObjectURL(lastArtifactUrl);
    }
    const url = URL.createObjectURL(result.blob);
    lastArtifactUrl = url;
    const img = document.createElement("img");
    img.src = url;
    img.style.maxWidth = "100%";
    img.alt = hash;
    element.textContent = "";
    element.appendChild(img);
  } else {
    element.textContent = "Error: " + (result.error ?? "status " + result.status);
  }
}

// ============================================================================
// PANEL: EVENTS
// ============================================================================

const WsEventTypes = [
  "job_queued",
  "job_started",
  "job_progress",
  "job_image_ready",
  "job_completed",
  "job_failed",
  "job_cancelled",
  "worker_status",
  "system_stats",
  "provisioning_progress",
];

function renderWsCounters() {
  const countersEl = document.getElementById("ws-counters");
  if (!countersEl) return;
  countersEl.innerHTML = "";
  WsEventTypes.forEach(function (type) {
    var count = wsCounters[type] || 0;
    var span = document.createElement("span");
    span.className = "ws-counter";
    span.textContent = type + ": " + count;
    countersEl.appendChild(span);
    countersEl.appendChild(document.createTextNode(" "));
  });
}

function handleWsClear() {
  var logEl = document.getElementById("ws-log");
  if (logEl) logEl.textContent = "";
  wsCounters = {};
  renderWsCounters();
}

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

  // Models panel
  const modelsListBtn = document.getElementById("models-list-btn");
  if (modelsListBtn) modelsListBtn.addEventListener("click", handleModelsList);

  const modelsGetBtn = document.getElementById("models-get-btn");
  if (modelsGetBtn) modelsGetBtn.addEventListener("click", handleModelsGet);

  const modelsRescanBtn = document.getElementById("models-rescan-btn");
  if (modelsRescanBtn) modelsRescanBtn.addEventListener("click", handleModelsRescan);

  // Workers panel
  const workersListBtn = document.getElementById("workers-list-btn");
  if (workersListBtn) workersListBtn.addEventListener("click", handleWorkersList);

  const workersRestartBtn = document.getElementById("workers-restart-btn");
  if (workersRestartBtn) workersRestartBtn.addEventListener("click", handleWorkersRestart);

  // Jobs panel
  document.getElementById("jobs-body").value = getTemplate("zit");

  const jobsPipelineEl = document.getElementById("jobs-pipeline");
  if (jobsPipelineEl) jobsPipelineEl.addEventListener("change", handleJobReset);

  const jobsResetBtn = document.getElementById("jobs-reset-btn");
  if (jobsResetBtn) jobsResetBtn.addEventListener("click", handleJobReset);

  const jobsSubmitBtn = document.getElementById("jobs-submit-btn");
  if (jobsSubmitBtn) jobsSubmitBtn.addEventListener("click", handleJobSubmit);

  const jobsListBtn = document.getElementById("jobs-list-btn");
  if (jobsListBtn) jobsListBtn.addEventListener("click", handleJobsList);

  const jobsGetBtn = document.getElementById("jobs-get-btn");
  if (jobsGetBtn) jobsGetBtn.addEventListener("click", handleJobsGet);

  const jobsCancelBtn = document.getElementById("jobs-cancel-btn");
  if (jobsCancelBtn) jobsCancelBtn.addEventListener("click", handleJobsCancel);

  const jobsDeleteBtn = document.getElementById("jobs-delete-btn");
  if (jobsDeleteBtn) jobsDeleteBtn.addEventListener("click", handleJobsDelete);

  const jobsBulkClearBtn = document.getElementById("jobs-bulk-clear-btn");
  if (jobsBulkClearBtn) jobsBulkClearBtn.addEventListener("click", handleJobsBulkClear);

  // Artifacts panel
  const artifactsListBtn = document.getElementById("artifacts-list-btn");
  if (artifactsListBtn) artifactsListBtn.addEventListener("click", handleArtifactsList);

  const artifactsFetchBtn = document.getElementById("artifacts-fetch-btn");
  if (artifactsFetchBtn) artifactsFetchBtn.addEventListener("click", handleArtifactsFetch);

  // Events panel
  const wsConnectBtn = document.getElementById("ws-connect-btn");
  if (wsConnectBtn) wsConnectBtn.addEventListener("click", wsConnect);

  const wsDisconnectBtn = document.getElementById("ws-disconnect-btn");
  if (wsDisconnectBtn) wsDisconnectBtn.addEventListener("click", wsDisconnect);

  const wsClearBtn = document.getElementById("ws-clear-btn");
  if (wsClearBtn) wsClearBtn.addEventListener("click", handleWsClear);

  const wsAutoScrollEl = document.getElementById("ws-auto-scroll");
  if (wsAutoScrollEl) {
    wsAutoScrollEl.addEventListener("change", function () {
      wsAutoScroll = this.checked;
    });
  }
});
