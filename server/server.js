/**
 * Mine Rescue & Safety Monitoring System - Main Server
 * Express REST API + WebSocket Server for Live LoRa Telemetry Streaming
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');

const TelemetryStore = require('./telemetryStore');
const SimulationEngine = require('./simulationEngine');

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Core Store & Simulator
const store = new TelemetryStore(1000);

// Setup WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}

// Start Simulator
const simulator = new SimulationEngine(store, broadcast);
simulator.start();

// Track Gateway Uptime
setInterval(() => {
  store.gatewayStats.uptime_seconds += 1;
}, 1000);

// WebSocket Connection Handling
wss.on('connection', (ws) => {
  // Send full initial state upon connection
  const snapshot = store.getSnapshot('NODE-01');
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    data: snapshot,
    scenario: simulator.scenario,
    isSimulatorRunning: simulator.isRunning
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      
      if (parsed.type === 'ACK_ALERT') {
        const acked = store.acknowledgeAlert(parsed.alert_id, parsed.operator_name, parsed.notes);
        if (acked) {
          broadcast({ type: 'ALERT_UPDATED', alert: acked });
        }
      } else if (parsed.type === 'RESOLVE_ALERT') {
        const resolved = store.resolveAlert(parsed.alert_id);
        if (resolved) {
          broadcast({ type: 'ALERT_UPDATED', alert: resolved });
        }
      } else if (parsed.type === 'TRIGGER_EVACUATION') {
        const evac = store.triggerEvacuation(parsed.sector_ids, parsed.initiated_by, parsed.reason);
        broadcast({ type: 'EVACUATION_STATE', evacuation: evac, alerts: store.alerts });
      } else if (parsed.type === 'CANCEL_EVACUATION') {
        const evac = store.cancelEvacuation(parsed.cancelled_by);
        broadcast({ type: 'EVACUATION_STATE', evacuation: evac });
      } else if (parsed.type === 'SET_SCENARIO') {
        simulator.setScenario(parsed.scenario);
        broadcast({ type: 'SCENARIO_CHANGED', scenario: simulator.scenario });
      } else if (parsed.type === 'TOGGLE_SIMULATOR') {
        if (simulator.isRunning) simulator.stop();
        else simulator.start();
        broadcast({ type: 'SIMULATOR_TOGGLED', isRunning: simulator.isRunning });
      }
    } catch (err) {
      console.error('WS Message parsing error:', err.message);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err.message);
  });
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Ingest External LoRa Gateway Packet
app.post('/api/telemetry', (req, res) => {
  const { node_id, distance_cm, ch4_ppm, co_ppm, o2_percent, rssi, snr, battery } = req.body;

  if (distance_cm === undefined || ch4_ppm === undefined || co_ppm === undefined || o2_percent === undefined) {
    return res.status(400).json({
      error: 'Missing required sensor telemetry fields (distance_cm, ch4_ppm, co_ppm, o2_percent)'
    });
  }

  const result = store.ingest({
    node_id: node_id || 'NODE-01',
    timestamp: req.body.timestamp || new Date().toISOString(),
    distance_cm: parseFloat(distance_cm),
    ch4_ppm: parseFloat(ch4_ppm),
    co_ppm: parseFloat(co_ppm),
    o2_percent: parseFloat(o2_percent),
    rssi: rssi ? parseInt(rssi) : -78,
    snr: snr ? parseFloat(snr) : 8.5,
    battery: battery ? parseInt(battery) : 95
  });

  // Broadcast to all active control dashboards
  broadcast({
    type: 'TELEMETRY_UPDATE',
    node_id: result.telemetry.node_id,
    telemetry: result.telemetry,
    predictions: result.predictions,
    newAlerts: result.newAlerts,
    source: 'EXTERNAL_LORA_GATEWAY'
  });

  res.status(201).json({
    status: 'INGESTED',
    telemetry: result.telemetry,
    predictions: result.predictions,
    alerts_triggered: result.newAlerts.length
  });
});

// 2. Get Live Snapshot
app.get('/api/telemetry/live', (req, res) => {
  const nodeId = req.query.node_id || 'NODE-01';
  const snapshot = store.getSnapshot(nodeId);
  res.json(snapshot);
});

// 3. Get Telemetry History with Time Interval Filtering
app.get('/api/telemetry/history', (req, res) => {
  const nodeId = req.query.node_id || 'NODE-01';
  const windowParam = req.query.window || '15m'; // 60s, 15m, 1h, 8h
  const rawHistory = store.history[nodeId] || [];

  const now = Date.now();
  let timeLimitMs = 15 * 60 * 1000; // default 15m

  if (windowParam === '60s') timeLimitMs = 60 * 1000;
  else if (windowParam === '15m') timeLimitMs = 15 * 60 * 1000;
  else if (windowParam === '1h') timeLimitMs = 60 * 60 * 1000;
  else if (windowParam === '8h' || windowParam === 'shift') timeLimitMs = 8 * 60 * 60 * 1000;

  const filtered = rawHistory.filter(item => {
    return (now - new Date(item.timestamp).getTime()) <= timeLimitMs;
  });

  res.json({
    node_id: nodeId,
    window: windowParam,
    count: filtered.length,
    history: filtered
  });
});

// 4. Get Current Incident Alerts
app.get('/api/alerts', (req, res) => {
  const statusFilter = req.query.status;
  if (statusFilter) {
    return res.json(store.alerts.filter(a => a.status === statusFilter.toUpperCase()));
  }
  res.json(store.alerts);
});

// 5. Acknowledge Alert
app.post('/api/alerts/acknowledge', (req, res) => {
  const { alert_id, operator_name, notes } = req.body;
  if (!alert_id) {
    return res.status(400).json({ error: 'alert_id is required' });
  }

  const updated = store.acknowledgeAlert(alert_id, operator_name, notes);
  if (!updated) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  broadcast({ type: 'ALERT_UPDATED', alert: updated });
  res.json(updated);
});

// 6. Resolve Alert
app.post('/api/alerts/resolve', (req, res) => {
  const { alert_id } = req.body;
  if (!alert_id) {
    return res.status(400).json({ error: 'alert_id is required' });
  }

  const updated = store.resolveAlert(alert_id);
  if (!updated) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  broadcast({ type: 'ALERT_UPDATED', alert: updated });
  res.json(updated);
});

// 7. Emergency SOS Evacuation Trigger
app.post('/api/evacuation', (req, res) => {
  const { sector_ids, initiated_by, reason } = req.body;
  const evac = store.triggerEvacuation(sector_ids, initiated_by, reason);
  broadcast({ type: 'EVACUATION_STATE', evacuation: evac, alerts: store.alerts });
  res.json({ status: 'EVACUATION_ORDER_ACTIVE', evacuation: evac });
});

// 8. Cancel Evacuation
app.post('/api/evacuation/cancel', (req, res) => {
  const { cancelled_by } = req.body;
  const evac = store.cancelEvacuation(cancelled_by);
  broadcast({ type: 'EVACUATION_STATE', evacuation: evac });
  res.json({ status: 'EVACUATION_CANCELLED', evacuation: evac });
});

// 9. Update Evacuation Headcount Progress
app.post('/api/evacuation/progress', (req, res) => {
  const { evacuated, in_transit, unaccounted } = req.body;
  const evac = store.updatePersonnelProgress(evacuated, in_transit, unaccounted);
  broadcast({ type: 'EVACUATION_STATE', evacuation: evac });
  res.json(evac);
});

// 10. Simulation Controls
app.post('/api/simulation/toggle', (req, res) => {
  if (simulator.isRunning) {
    simulator.stop();
  } else {
    simulator.start();
  }
  broadcast({ type: 'SIMULATOR_TOGGLED', isRunning: simulator.isRunning });
  res.json({ is_running: simulator.isRunning });
});

app.post('/api/simulation/scenario', (req, res) => {
  const { scenario } = req.body;
  if (!scenario) return res.status(400).json({ error: 'scenario name is required' });
  
  simulator.setScenario(scenario);
  broadcast({ type: 'SCENARIO_CHANGED', scenario: simulator.scenario });
  res.json({ scenario: simulator.scenario });
});

app.post('/api/simulation/override', (req, res) => {
  simulator.setManualOverride(req.body);
  res.json({ status: 'OVERRIDES_APPLIED', overrides: simulator.manualOverrides });
});

// 11. System Nodes & Network Status
app.get('/api/system/status', (req, res) => {
  res.json({
    gateway: store.gatewayStats,
    nodes: Object.values(store.nodes),
    rescue_teams: store.rescueTeams,
    simulator: {
      is_running: simulator.isRunning,
      scenario: simulator.scenario
    }
  });
});

// Serve frontend build if present
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return;
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) res.status(404).send('Please build client or run Vite dev server.');
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Mine Rescue & Safety Monitoring System Backend Online `);
  console.log(` HTTP & REST API: http://localhost:${PORT}`);
  console.log(` WebSocket Stream: ws://localhost:${PORT}/ws`);
  console.log(`=======================================================`);
});

