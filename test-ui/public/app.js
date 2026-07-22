const STORAGE_KEY = 'dataforseo-test-results';

let endpoints = [];
let results = loadResults();
let activeId = null;

const el = {
  sidebar: document.getElementById('sidebar'),
  credStatus: document.getElementById('credStatus'),
  modeSwitch: document.getElementById('modeSwitch'),
  progress: document.getElementById('progress'),
  emptyState: document.getElementById('emptyState'),
  runner: document.getElementById('runner'),
  runnerTitle: document.getElementById('runnerTitle'),
  runnerNote: document.getElementById('runnerNote'),
  methodSelect: document.getElementById('methodSelect'),
  pathInput: document.getElementById('pathInput'),
  taskIdField: document.getElementById('taskIdField'),
  taskIdInput: document.getElementById('taskIdInput'),
  bodyInput: document.getElementById('bodyInput'),
  runBtn: document.getElementById('runBtn'),
  runStatus: document.getElementById('runStatus'),
  resultPane: document.getElementById('resultPane'),
};

function loadResults() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveResults() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

async function init() {
  const [status, list] = await Promise.all([
    fetch('/api/status').then((r) => r.json()),
    fetch('/api/endpoints').then((r) => r.json()),
  ]);

  if (status.credentialsLoaded) {
    el.credStatus.textContent = `credentials loaded (${status.login})`;
    el.credStatus.classList.add('ok');
  } else {
    el.credStatus.textContent = 'no credentials found in ../.env';
    el.credStatus.classList.add('err');
  }

  endpoints = list;
  renderSidebar();
  updateProgress();
}

function renderSidebar() {
  el.sidebar.innerHTML = '';
  const tiers = [...new Set(endpoints.map((e) => e.tier))];

  for (const tier of tiers) {
    const group = document.createElement('div');
    group.className = 'tier-group';

    const label = document.createElement('div');
    label.className = 'tier-label';
    label.textContent = tier;
    group.appendChild(label);

    const sections = [...new Set(endpoints.filter((e) => e.tier === tier).map((e) => e.section))];
    for (const section of sections) {
      const sectionLabel = document.createElement('div');
      sectionLabel.className = 'section-label';
      sectionLabel.textContent = section;
      group.appendChild(sectionLabel);

      const items = endpoints.filter((e) => e.tier === tier && e.section === section);
      for (const ep of items) {
        group.appendChild(renderItem(ep));
      }
    }

    el.sidebar.appendChild(group);
  }
}

function renderItem(ep) {
  const item = document.createElement('div');
  item.className = 'endpoint-item';
  item.dataset.id = ep.id;
  if (ep.id === activeId) item.classList.add('active');

  const dot = document.createElement('span');
  dot.className = 'status-dot';
  const result = results[ep.id];
  if (result) dot.classList.add(result.ok ? 'ok' : 'err');

  const pathSpan = document.createElement('span');
  pathSpan.className = 'endpoint-path';
  pathSpan.textContent = `${ep.id} — ${ep.path}`;

  item.appendChild(dot);
  item.appendChild(pathSpan);
  item.addEventListener('click', () => selectEndpoint(ep.id));
  return item;
}

function selectEndpoint(id) {
  activeId = id;
  const ep = endpoints.find((e) => e.id === id);
  if (!ep) return;

  document.querySelectorAll('.endpoint-item').forEach((node) => {
    node.classList.toggle('active', node.dataset.id === id);
  });

  el.emptyState.hidden = true;
  el.runner.hidden = false;

  el.runnerTitle.textContent = `${ep.method} ${ep.path}`;
  el.runnerNote.textContent = ep.note || '';
  el.methodSelect.value = ep.method;
  el.pathInput.value = ep.path;
  el.taskIdField.hidden = !ep.path.includes('{id}');
  el.taskIdInput.value = '';
  el.bodyInput.value = ep.sampleBody ? JSON.stringify(ep.sampleBody, null, 2) : '';
  el.bodyInput.hidden = ep.method === 'GET';

  const prior = results[ep.id];
  el.resultPane.textContent = prior ? JSON.stringify(prior.data, null, 2) : '—';
  el.runStatus.textContent = prior ? `last run: HTTP ${prior.httpStatus}` : '';
  el.runStatus.className = `run-status ${prior ? (prior.ok ? 'ok' : 'err') : ''}`;
}

function updateProgress() {
  const total = endpoints.length;
  const tested = Object.keys(results).length;
  el.progress.textContent = `${tested} / ${total} tested`;
}

el.runBtn.addEventListener('click', async () => {
  if (!activeId) return;
  const mode = el.modeSwitch.checked ? 'live' : 'sandbox';
  const method = el.methodSelect.value;
  const path = el.pathInput.value.trim();
  const taskId = el.taskIdInput.value.trim();

  let body;
  if (method === 'POST' && el.bodyInput.value.trim()) {
    try {
      body = JSON.parse(el.bodyInput.value);
    } catch {
      el.runStatus.textContent = 'Request body is not valid JSON.';
      el.runStatus.className = 'run-status err';
      return;
    }
  }

  el.runBtn.disabled = true;
  el.runStatus.textContent = `running against ${mode}…`;
  el.runStatus.className = 'run-status';
  el.resultPane.textContent = '—';

  try {
    const resp = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, method, body, mode, taskId }),
    });
    const payload = await resp.json();
    const ok = resp.ok && payload.httpStatus && payload.httpStatus < 400;

    results[activeId] = { ok, httpStatus: payload.httpStatus || resp.status, data: payload, mode };
    saveResults();

    el.resultPane.textContent = JSON.stringify(payload, null, 2);
    el.runStatus.textContent = `HTTP ${payload.httpStatus || resp.status} · ${payload.elapsedMs || 0}ms · ${mode}`;
    el.runStatus.className = `run-status ${ok ? 'ok' : 'err'}`;

    renderSidebar();
    selectEndpointHighlightOnly(activeId);
    updateProgress();
  } catch (err) {
    el.runStatus.textContent = `Request failed: ${err.message}`;
    el.runStatus.className = 'run-status err';
  } finally {
    el.runBtn.disabled = false;
  }
});

function selectEndpointHighlightOnly(id) {
  document.querySelectorAll('.endpoint-item').forEach((node) => {
    node.classList.toggle('active', node.dataset.id === id);
  });
}

init();
