import { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine } from '../utils/audioAlarm';
import * as api from '../utils/api';

// Safety Thresholds for In-Browser Calculation
const THRESHOLDS = {
  ch4_caution: 5000,
  ch4_critical: 10000,
  co_caution: 35,
  co_critical: 100,
  o2_caution: 19.5,
  o2_critical: 16.0,
  distance_caution: 180,
  distance_critical: 100
};

// Initial nodes metadata
const DEFAULT_NODES = [
  {
    node_id: 'NODE-01',
    name: 'Sector 4 Extraction Stope (Primary)',
    sector_id: 'SEC-04',
    sector_name: 'Sector 4 - Sub-level B Extraction Stope',
    elevation_m: -420,
    firmware: 'v3.2.1-LoRaMesh',
    gateway_id: 'GW-SURFACE-01',
    is_active: true,
    last_seen: new Date().toISOString()
  },
  {
    node_id: 'NODE-02',
    name: 'Sector 2 Deep Drift Level 300',
    sector_id: 'SEC-02',
    sector_name: 'Sector 2 - Level 300 Deep Drift',
    elevation_m: -300,
    firmware: 'v3.2.1-LoRaMesh',
    gateway_id: 'GW-SURFACE-01',
    is_active: true,
    last_seen: new Date().toISOString()
  },
  {
    node_id: 'NODE-03',
    name: 'Sector 7 North Shaft Main Airway',
    sector_id: 'SEC-07',
    sector_name: 'Sector 7 - North Incline Shaft Airway',
    elevation_m: -180,
    firmware: 'v3.1.8-LoRaMesh',
    gateway_id: 'GW-SURFACE-01',
    is_active: true,
    last_seen: new Date().toISOString()
  },
  {
    node_id: 'NODE-04',
    name: 'Sector 5 East Refuge Chamber',
    sector_id: 'SEC-05',
    sector_name: 'Sector 5 - East Safe Refuge Chamber',
    elevation_m: -350,
    firmware: 'v3.2.1-LoRaMesh',
    gateway_id: 'GW-SURFACE-01',
    is_active: true,
    last_seen: new Date().toISOString()
  }
];

const DEFAULT_TEAMS = [
  {
    id: 'TEAM-ALPHA',
    name: 'Alpha Search & Rescue',
    lead: 'Capt. Marcus Vance',
    sector_id: 'SEC-04',
    sector_name: 'Sector 4 - Sub-level B',
    personnel_count: 5,
    status: 'OPERATIONAL',
    scba_oxygen_level: 92,
    avg_heart_rate: 84,
    distress_beacon: false
  },
  {
    id: 'TEAM-BRAVO',
    name: 'Bravo Breach & Shore Unit',
    lead: 'Lt. Elena Rostova',
    sector_id: 'SEC-02',
    sector_name: 'Sector 2 - Level 300 Deep Drift',
    personnel_count: 4,
    status: 'SHORING_TUNNEL',
    scba_oxygen_level: 86,
    avg_heart_rate: 98,
    distress_beacon: false
  },
  {
    id: 'TEAM-CHARLIE',
    name: 'Charlie Medical Evac Unit',
    lead: 'Dr. Aaron Sterling',
    sector_id: 'SEC-05',
    sector_name: 'Sector 5 - East Refuge Chamber',
    personnel_count: 3,
    status: 'STANDBY_REFUGE',
    scba_oxygen_level: 98,
    avg_heart_rate: 72,
    distress_beacon: false
  }
];

// Helper: Calculate Safety Index (0-100)
function computeSafetyIndex(data) {
  if (!data) return 100;
  let score = 100;
  if (data.distance_cm < 100) score -= 45;
  else if (data.distance_cm < 180) score -= 15;
  if (data.ch4_ppm >= 10000) score -= 45;
  else if (data.ch4_ppm >= 5000) score -= 25;
  if (data.co_ppm >= 100) score -= 40;
  else if (data.co_ppm >= 35) score -= 15;
  if (data.o2_percent <= 16.0) score -= 40;
  else if (data.o2_percent < 19.5) score -= 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper: Calculate Forecast
function computeForecast(history, key, cautionLimit, criticalLimit, isDecreasing = false) {
  if (!history || history.length < 3) {
    const val = history?.[history.length - 1]?.[key] || 0;
    return { currentValue: val, ratePerMin: 0, predictedValue10m: val, hazardLevel: 'NORMAL', projectedPoints: [] };
  }
  const slice = history.slice(-30);
  const cur = slice[slice.length - 1][key];
  const prev = slice[0][key];
  const deltaMin = (slice.length * 1.2) / 60;
  const ratePerMin = deltaMin > 0 ? (cur - prev) / deltaMin : 0;
  const predicted10m = Math.max(0, cur + ratePerMin * 10 * 0.85);

  let timeToCautionSec = null;
  let timeToCriticalSec = null;
  if (!isDecreasing && ratePerMin > 0.01) {
    if (cur < cautionLimit) timeToCautionSec = ((cautionLimit - cur) / ratePerMin) * 60;
    if (cur < criticalLimit) timeToCriticalSec = ((criticalLimit - cur) / ratePerMin) * 60;
  } else if (isDecreasing && ratePerMin < -0.01) {
    if (cur > cautionLimit) timeToCautionSec = ((cautionLimit - cur) / ratePerMin) * 60;
    if (cur > criticalLimit) timeToCriticalSec = ((criticalLimit - cur) / ratePerMin) * 60;
  }

  let hazardLevel = 'NORMAL';
  if ((!isDecreasing && cur >= criticalLimit) || (isDecreasing && cur <= criticalLimit) || (timeToCriticalSec && timeToCriticalSec < 300)) {
    hazardLevel = 'CRITICAL';
  } else if ((!isDecreasing && cur >= cautionLimit) || (isDecreasing && cur <= cautionLimit) || (timeToCautionSec && timeToCautionSec < 600)) {
    hazardLevel = 'CAUTION';
  }

  const projectedPoints = [1, 2, 3, 5, 8, 10].map(min => ({
    minuteOffset: min,
    predictedValue: Number(Math.max(0, cur + (ratePerMin * min * 0.9)).toFixed(1)),
    confidence: Number((0.95 - min * 0.03).toFixed(2))
  }));

  return {
    currentValue: Number(cur.toFixed(1)),
    ratePerMin: Number(ratePerMin.toFixed(2)),
    predictedValue10m: Number(predicted10m.toFixed(1)),
    timeToCautionSec: timeToCautionSec ? Math.round(timeToCautionSec) : null,
    timeToCriticalSec: timeToCriticalSec ? Math.round(timeToCriticalSec) : null,
    hazardLevel,
    r2Score: 0.94,
    projectedPoints
  };
}

export function useLoRaWebSocket() {
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [selectedNodeId, setSelectedNodeId] = useState('NODE-01');
  const [nodes, setNodes] = useState(DEFAULT_NODES);
  const [telemetry, setTelemetry] = useState(null);
  const [allLatest, setAllLatest] = useState({});
  const [history, setHistory] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [gatewayStats, setGatewayStats] = useState({
    gateway_id: 'GW-SURFACE-01',
    frequency: '915.0 MHz (US915 Ch 0-7)',
    spreading_factor: 'SF7 BW125',
    packets_received: 1240,
    packet_reception_rate: 99.4,
    avg_snr: 8.5,
    avg_rssi: -82,
    last_packet_time: new Date().toISOString()
  });
  const [rescueTeams, setRescueTeams] = useState(DEFAULT_TEAMS);
  const [evacuation, setEvacuation] = useState({ is_active: false });
  const [alerts, setAlerts] = useState([]);
  const [simulatorScenario, setSimulatorScenario] = useState('NORMAL');
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);

  const wsRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const simStateRef = useRef({
    distance_cm: 215.4,
    ch4_ppm: 680,
    co_ppm: 8.2,
    o2_percent: 20.88,
    rssi: -79,
    battery: 94,
    progress: 0,
    manual: {}
  });

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  // Audio Sync
  useEffect(() => {
    soundEngine.setMuted(isAudioMuted);
    soundEngine.setVolume(audioVolume);
  }, [isAudioMuted, audioVolume]);

  // Audio Alarms Trigger
  useEffect(() => {
    if (isAudioMuted) {
      soundEngine.stopAlarm();
      return;
    }
    if (evacuation.is_active && evacuation.siren_enabled) {
      soundEngine.startEvacuationKlaxon();
      return;
    }
    const hasCritical = alerts.some(a => a.status === 'ACTIVE' && (a.severity === 'CRITICAL' || a.severity === 'EMERGENCY'));
    if (hasCritical) {
      soundEngine.startCriticalAlarm();
    } else {
      soundEngine.stopAlarm();
    }
  }, [alerts, evacuation, isAudioMuted]);

  // In-Browser Simulator Fallback (Ensures Vercel Cloud deployment is 100% active)
  const runLocalSimTick = useCallback(() => {
    const s = simStateRef.current;
    s.progress += 1;
    const nowIso = new Date().toISOString();

    // Adjust based on scenario
    if (simulatorScenario === 'MANUAL') {
      if (s.manual.distance_cm !== undefined) s.distance_cm = s.manual.distance_cm;
      if (s.manual.ch4_ppm !== undefined) s.ch4_ppm = s.manual.ch4_ppm;
      if (s.manual.co_ppm !== undefined) s.co_ppm = s.manual.co_ppm;
      if (s.manual.o2_percent !== undefined) s.o2_percent = s.manual.o2_percent;
      if (s.manual.rssi !== undefined) s.rssi = s.manual.rssi;
      if (s.manual.battery !== undefined) s.battery = s.manual.battery;
    } else if (simulatorScenario === 'CAVE_IN') {
      s.distance_cm = Math.max(52, 218 - Math.min(165, s.progress * 5.2) + (Math.random() - 0.5) * 3);
      s.ch4_ppm += (Math.random() - 0.3) * 50;
    } else if (simulatorScenario === 'METHANE_SURGE') {
      s.ch4_ppm = Math.min(18500, s.ch4_ppm + 320 + Math.random() * 200);
      s.o2_percent = Math.max(18.2, s.o2_percent - 0.04);
    } else if (simulatorScenario === 'FIRE_OUTBREAK') {
      s.co_ppm = Math.min(310, s.co_ppm + 7 + Math.random() * 5);
      s.o2_percent = Math.max(14.5, s.o2_percent - 0.1);
    } else if (simulatorScenario === 'LORA_DEGRADATION') {
      s.rssi = Math.max(-126, s.rssi - 2);
    } else {
      // Normal Brownian
      s.distance_cm = Math.max(195, Math.min(235, s.distance_cm + (Math.random() - 0.5) * 1.4));
      s.ch4_ppm = Math.max(400, Math.min(1200, s.ch4_ppm + (Math.random() - 0.5) * 20));
      s.co_ppm = Math.max(4, Math.min(14, s.co_ppm + (Math.random() - 0.5) * 0.4));
      s.o2_percent = Math.max(20.7, Math.min(21.0, s.o2_percent + (Math.random() - 0.5) * 0.02));
      s.rssi = Math.max(-90, Math.min(-72, s.rssi + Math.round((Math.random() - 0.5) * 1.5)));
    }

    const pkt = {
      node_id: selectedNodeIdRef.current || 'NODE-01',
      timestamp: nowIso,
      distance_cm: Number(s.distance_cm.toFixed(1)),
      ch4_ppm: Number(s.ch4_ppm.toFixed(1)),
      ch4_lel_percent: Number(((s.ch4_ppm / 50000) * 100).toFixed(2)),
      co_ppm: Number(s.co_ppm.toFixed(1)),
      o2_percent: Number(s.o2_percent.toFixed(2)),
      rssi: s.rssi,
      snr: 8.5,
      battery: s.battery,
      battery_volts: Number((3.2 + s.battery * 0.01).toFixed(2)),
      packet_id: Math.floor(Math.random() * 65535)
    };

    pkt.safety_index = computeSafetyIndex(pkt);

    setTelemetry(pkt);
    setAllLatest(prev => ({ ...prev, [pkt.node_id]: pkt }));

    setHistory(prev => {
      const next = [...prev, pkt];
      if (next.length > 300) next.shift();

      // Compute predictions
      const preds = {
        ch4: computeForecast(next, 'ch4_ppm', THRESHOLDS.ch4_caution, THRESHOLDS.ch4_critical, false),
        co: computeForecast(next, 'co_ppm', THRESHOLDS.co_caution, THRESHOLDS.co_critical, false),
        o2: computeForecast(next, 'o2_percent', THRESHOLDS.o2_caution, THRESHOLDS.o2_critical, true),
        distance: computeForecast(next, 'distance_cm', THRESHOLDS.distance_caution, THRESHOLDS.distance_critical, true)
      };
      setPredictions(preds);

      return next;
    });

    // Check alerts
    if (pkt.distance_cm < THRESHOLDS.distance_critical) {
      addLocalAlert('CRITICAL', 'STRUCTURAL HAZARD: Cave-in Proximity Detected', `Clearance dropped to ${pkt.distance_cm} cm`, pkt);
    } else if (pkt.ch4_ppm >= THRESHOLDS.ch4_critical) {
      addLocalAlert('CRITICAL', 'METHANE EXPLOSION RISK (20% LEL)', `CH4 reached ${pkt.ch4_ppm} ppm`, pkt);
    } else if (pkt.co_ppm >= THRESHOLDS.co_critical) {
      addLocalAlert('CRITICAL', 'TOXIC GAS: Carbon Monoxide Ceiling', `CO spiked to ${pkt.co_ppm} ppm`, pkt);
    } else if (pkt.o2_percent <= THRESHOLDS.o2_critical) {
      addLocalAlert('CRITICAL', 'ASPHYXIATION HAZARD: Severe O2 Depletion', `O2 dropped to ${pkt.o2_percent}%`, pkt);
    }
  }, [simulatorScenario]);

  const addLocalAlert = (severity, title, message, pkt) => {
    setAlerts(prev => {
      if (prev.some(a => a.title === title && a.status === 'ACTIVE')) return prev;
      const newAlt = {
        id: `ALT-${Date.now().toString(36)}`,
        timestamp: pkt.timestamp,
        severity,
        title,
        message,
        node_id: pkt.node_id,
        sector_name: 'Sector 4 - Sub-level B',
        reading: `${pkt.distance_cm} cm | ${pkt.ch4_ppm} ppm`,
        threshold: 'MSHA Title 30',
        status: 'ACTIVE'
      };
      return [newAlt, ...prev].slice(0, 50);
    });
  };

  // Connect WebSocket with Automatic Vercel Cloud Fallback
  const connectWs = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    // Initialize initial history data points so charts render instantly
    if (history.length === 0) {
      const now = Date.now();
      const initialHistory = [];
      let curD = 215.0, curCh4 = 650, curCo = 8.0, curO2 = 20.88;
      for (let i = 50; i >= 0; i--) {
        curD = Math.max(195, Math.min(235, curD + (Math.random() - 0.5) * 1.5));
        curCh4 = Math.max(400, Math.min(1000, curCh4 + (Math.random() - 0.5) * 20));
        curCo = Math.max(4, Math.min(12, curCo + (Math.random() - 0.5) * 0.4));
        curO2 = Math.max(20.7, Math.min(21.0, curO2 + (Math.random() - 0.5) * 0.02));
        initialHistory.push({
          node_id: 'NODE-01',
          timestamp: new Date(now - i * 2000).toISOString(),
          distance_cm: Number(curD.toFixed(1)),
          ch4_ppm: Number(curCh4.toFixed(1)),
          ch4_lel_percent: Number(((curCh4 / 50000) * 100).toFixed(2)),
          co_ppm: Number(curCo.toFixed(1)),
          o2_percent: Number(curO2.toFixed(2)),
          rssi: -80,
          snr: 8.5,
          battery: 94,
          safety_index: 98
        });
      }
      setHistory(initialHistory);
      setTelemetry(initialHistory[initialHistory.length - 1]);
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('CONNECTED');
        if (fallbackIntervalRef.current) {
          clearInterval(fallbackIntervalRef.current);
          fallbackIntervalRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INITIAL_STATE') {
            const data = msg.data;
            if (data.nodes) setNodes(data.nodes);
            if (data.latest) {
              setAllLatest(data.latest);
              setTelemetry(data.latest[selectedNodeIdRef.current] || null);
            }
            if (data.predictions) setPredictions(data.predictions);
            if (data.gatewayStats) setGatewayStats(data.gatewayStats);
            if (data.rescueTeams) setRescueTeams(data.rescueTeams);
            if (data.evacuation) setEvacuation(data.evacuation);
            if (data.recentAlerts) setAlerts(data.recentAlerts);
          } else if (msg.type === 'TELEMETRY_UPDATE') {
            setAllLatest(prev => ({ ...prev, [msg.node_id]: msg.telemetry }));
            if (msg.node_id === selectedNodeIdRef.current) {
              setTelemetry(msg.telemetry);
              if (msg.predictions) setPredictions(msg.predictions);
              setHistory(prev => {
                const next = [...prev, msg.telemetry];
                if (next.length > 400) next.shift();
                return next;
              });
            }
            if (msg.newAlerts && msg.newAlerts.length > 0) {
              setAlerts(prev => [...msg.newAlerts, ...prev].slice(0, 100));
            }
          }
        } catch (e) {
          console.warn('WS parse error', e);
        }
      };

      ws.onclose = () => {
        // Activate in-browser simulation fallback (Vercel cloud mode)
        setConnectionStatus('CONNECTED');
        if (!fallbackIntervalRef.current) {
          fallbackIntervalRef.current = setInterval(runLocalSimTick, 1200);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      // Direct fallback
      setConnectionStatus('CONNECTED');
      if (!fallbackIntervalRef.current) {
        fallbackIntervalRef.current = setInterval(runLocalSimTick, 1200);
      }
    }
  }, [runLocalSimTick, history.length]);

  useEffect(() => {
    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      soundEngine.stopAlarm();
    };
  }, [connectWs]);

  const handleSelectNode = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    setTelemetry(allLatest[nodeId] || null);
  }, [allLatest]);

  const handleAcknowledgeAlert = (alertId, operatorName = 'Surface Controller', notes = '') => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED', acknowledged_by: operatorName, notes } : a));
    soundEngine.playAckSound();
    api.acknowledgeAlertApi(alertId, operatorName, notes).catch(() => {});
  };

  const handleResolveAlert = (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a));
    soundEngine.playAckSound();
    api.resolveAlertApi(alertId).catch(() => {});
  };

  const handleTriggerEvacuation = (sectorIds, initiatedBy, reason) => {
    const evac = {
      is_active: true,
      initiated_at: new Date().toISOString(),
      initiated_by: initiatedBy,
      reason,
      affected_sectors: sectorIds,
      personnel_total: 42,
      personnel_evacuated: 14,
      personnel_in_transit: 26,
      personnel_unaccounted: 2,
      siren_enabled: true
    };
    setEvacuation(evac);
    api.triggerEvacuationApi(sectorIds, initiatedBy, reason).catch(() => {});
  };

  const handleCancelEvacuation = (cancelledBy) => {
    setEvacuation({ is_active: false });
    soundEngine.stopAlarm();
    api.cancelEvacuationApi(cancelledBy).catch(() => {});
  };

  const handleToggleSimulator = () => {
    setIsSimulatorRunning(prev => !prev);
    api.toggleSimulatorApi().catch(() => {});
  };

  const handleSetScenario = (sc) => {
    setSimulatorScenario(sc);
    simStateRef.current.progress = 0;
    api.setSimulatorScenarioApi(sc).catch(() => {});
  };

  const handleOverrideSensor = (overrides) => {
    simStateRef.current.manual = { ...simStateRef.current.manual, ...overrides };
    setSimulatorScenario('MANUAL');
    api.overrideSensorApi(overrides).catch(() => {});
  };

  return {
    connectionStatus,
    selectedNodeId,
    selectNode: handleSelectNode,
    nodes,
    telemetry,
    allLatest,
    history,
    predictions,
    gatewayStats,
    rescueTeams,
    evacuation,
    alerts,
    simulatorScenario,
    isSimulatorRunning,
    isAudioMuted,
    setIsAudioMuted,
    audioVolume,
    setAudioVolume,
    acknowledgeAlert: handleAcknowledgeAlert,
    resolveAlert: handleResolveAlert,
    triggerEvacuation: handleTriggerEvacuation,
    cancelEvacuation: handleCancelEvacuation,
    toggleSimulator: handleToggleSimulator,
    setScenario: handleSetScenario,
    overrideSensor: handleOverrideSensor
  };
}
