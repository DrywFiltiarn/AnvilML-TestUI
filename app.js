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
});
