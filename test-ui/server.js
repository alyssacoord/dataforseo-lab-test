const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const endpoints = require('./endpoints.json');

const LOGIN = process.env.DATAFORSEO_LOGIN;
const PASSWORD = process.env.DATAFORSEO_PASSWORD;

const HOSTS = {
  sandbox: 'https://sandbox.dataforseo.com',
  live: 'https://api.dataforseo.com',
};

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/endpoints', (req, res) => {
  res.json(endpoints);
});

app.get('/api/status', (req, res) => {
  res.json({ credentialsLoaded: Boolean(LOGIN && PASSWORD), login: LOGIN || null });
});

app.post('/api/run', async (req, res) => {
  if (!LOGIN || !PASSWORD) {
    return res.status(500).json({ error: 'DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD missing from ../.env' });
  }

  const { path: apiPath, method, body, mode, taskId } = req.body || {};
  if (!apiPath || !method) {
    return res.status(400).json({ error: 'Request must include path and method.' });
  }

  const host = HOSTS[mode] || HOSTS.sandbox;
  let resolvedPath = apiPath;
  if (resolvedPath.includes('{id}')) {
    if (!taskId) {
      return res.status(400).json({ error: 'This endpoint takes a task id — run the matching task_post first, then paste its id into the Task ID field.' });
    }
    resolvedPath = resolvedPath.replace('{id}', encodeURIComponent(taskId));
  }

  const url = `${host}/v3/${resolvedPath}`;
  const auth = Buffer.from(`${LOGIN}:${PASSWORD}`).toString('base64');

  const fetchOpts = {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  };
  if (method === 'POST' && body !== undefined && body !== null) {
    fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const startedAt = Date.now();
  try {
    const response = await fetch(url, fetchOpts);
    const elapsedMs = Date.now() - startedAt;
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    res.status(200).json({ requestUrl: url, httpStatus: response.status, elapsedMs, data });
  } catch (err) {
    res.status(502).json({ error: `Request failed: ${err.message}`, requestUrl: url });
  }
});

const PORT = process.env.PORT || 5177;
app.listen(PORT, () => {
  console.log(`DataForSEO test UI running at http://localhost:${PORT}`);
  if (!LOGIN || !PASSWORD) {
    console.warn('WARNING: no credentials found in ../.env — requests will fail until DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD are set.');
  }
});
