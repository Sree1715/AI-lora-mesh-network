/**
 * API Client for Mine Rescue & Safety Monitoring System
 */

const API_BASE = '/api';

export async function fetchLiveSnapshot(nodeId = 'NODE-01') {
  const res = await fetch(`${API_BASE}/telemetry/live?node_id=${nodeId}`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function fetchTelemetryHistory(nodeId = 'NODE-01', window = '15m') {
  const res = await fetch(`${API_BASE}/telemetry/history?node_id=${nodeId}&window=${window}`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function postLoRaTelemetry(packet) {
  const res = await fetch(`${API_BASE}/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(packet)
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function acknowledgeAlertApi(alertId, operatorName = 'Surface Controller', notes = '') {
  const res = await fetch(`${API_BASE}/alerts/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_id: alertId, operator_name: operatorName, notes })
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function resolveAlertApi(alertId) {
  const res = await fetch(`${API_BASE}/alerts/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_id: alertId })
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function triggerEvacuationApi(sectorIds, initiatedBy, reason) {
  const res = await fetch(`${API_BASE}/evacuation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sector_ids: sectorIds, initiated_by: initiatedBy, reason })
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function cancelEvacuationApi(cancelledBy) {
  const res = await fetch(`${API_BASE}/evacuation/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancelled_by: cancelledBy })
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function updateEvacuationHeadcountApi(evacuated, inTransit, unaccounted) {
  const res = await fetch(`${API_BASE}/evacuation/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evacuated, in_transit: inTransit, unaccounted })
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function toggleSimulatorApi() {
  const res = await fetch(`${API_BASE}/simulation/toggle`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function setSimulatorScenarioApi(scenario) {
  const res = await fetch(`${API_BASE}/simulation/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario })
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function overrideSensorApi(overrides) {
  const res = await fetch(`${API_BASE}/simulation/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrides)
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

export async function fetchSystemStatusApi() {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
}

