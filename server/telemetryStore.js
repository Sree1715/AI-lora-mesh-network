/**
 * Telemetry Store & Alert Management
 * In-memory high-throughput ring buffers and incident state
 */

const { THRESHOLDS, forecastTrend, calculateSafetyIndex } = require('./predictionEngine');

class TelemetryStore {
  constructor(maxPointsPerNode = 1000) {
    this.maxPoints = maxPointsPerNode;
    
    // Node definitions across underground mine sectors
    this.nodes = {
      'NODE-01': {
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
      'NODE-02': {
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
      'NODE-03': {
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
      'NODE-04': {
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
    };

    // Rescue teams status
    this.rescueTeams = [
      {
        id: 'TEAM-ALPHA',
        name: 'Alpha Search & Rescue',
        lead: 'Capt. Marcus Vance',
        sector_id: 'SEC-04',
        sector_name: 'Sector 4 - Sub-level B',
        personnel_count: 5,
        status: 'OPERATIONAL', // OPERATIONAL, ADVANCING, ASSISTING, EVACUATING
        scba_oxygen_level: 92, // %
        avg_heart_rate: 84, // bpm
        distress_beacon: false,
        last_radio_check: new Date().toISOString()
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
        distress_beacon: false,
        last_radio_check: new Date().toISOString()
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
        distress_beacon: false,
        last_radio_check: new Date().toISOString()
      }
    ];

    // Evacuation protocol state
    this.evacuation = {
      is_active: false,
      initiated_at: null,
      initiated_by: null,
      reason: null,
      affected_sectors: [],
      personnel_total: 42,
      personnel_evacuated: 42,
      personnel_in_transit: 0,
      personnel_unaccounted: 0,
      siren_enabled: false
    };

    // LoRa Gateway Stats
    this.gatewayStats = {
      gateway_id: 'GW-SURFACE-01',
      frequency: '915.0 MHz (US915 Ch 0-7)',
      spreading_factor: 'SF7 BW125',
      packets_received: 0,
      packets_corrupted: 0,
      packet_reception_rate: 99.4,
      avg_snr: 8.5,
      avg_rssi: -82,
      last_packet_time: new Date().toISOString(),
      uptime_seconds: 0
    };

    // Ring buffers for telemetry history per node
    this.history = {};
    // Latest telemetry per node
    this.latest = {};
    // Alerts list
    this.alerts = [];

    // Initialize histories
    Object.keys(this.nodes).forEach(nodeId => {
      this.history[nodeId] = [];
    });
  }

  /**
   * Ingest a single LoRa telemetry packet
   */
  ingest(packet) {
    const nodeId = packet.node_id || 'NODE-01';
    const timestamp = packet.timestamp || new Date().toISOString();

    const normalized = {
      node_id: nodeId,
      timestamp,
      distance_cm: Number(Number(packet.distance_cm).toFixed(1)),
      ch4_ppm: Number(Number(packet.ch4_ppm).toFixed(1)),
      ch4_lel_percent: Number(((packet.ch4_ppm / 50000) * 100).toFixed(2)),
      co_ppm: Number(Number(packet.co_ppm).toFixed(1)),
      o2_percent: Number(Number(packet.o2_percent).toFixed(2)),
      rssi: Number(packet.rssi || -80),
      snr: Number(packet.snr || 8.5),
      battery: Number(packet.battery || 95),
      battery_volts: Number((3.2 + (packet.battery || 95) * 0.01).toFixed(2)),
      packet_id: packet.packet_id || Math.floor(Math.random() * 65535)
    };

    // Calculate dynamic safety index for this reading
    normalized.safety_index = calculateSafetyIndex(normalized);

    // Save to node latest
    this.latest[nodeId] = normalized;

    // Push into ring buffer
    if (!this.history[nodeId]) {
      this.history[nodeId] = [];
    }
    this.history[nodeId].push(normalized);
    if (this.history[nodeId].length > this.maxPoints) {
      this.history[nodeId].shift();
    }

    // Update node metadata
    if (this.nodes[nodeId]) {
      this.nodes[nodeId].last_seen = timestamp;
      this.nodes[nodeId].is_active = true;
    }

    // Update Gateway stats
    this.gatewayStats.packets_received += 1;
    this.gatewayStats.last_packet_time = timestamp;
    this.gatewayStats.avg_rssi = Number(((this.gatewayStats.avg_rssi * 0.95) + (normalized.rssi * 0.05)).toFixed(1));
    this.gatewayStats.avg_snr = Number(((this.gatewayStats.avg_snr * 0.95) + (normalized.snr * 0.05)).toFixed(1));

    // Run automated threshold checks & generate alerts
    const newAlerts = this.evaluateThresholds(normalized);

    // Run prediction engine for this node
    const predictions = {
      ch4: forecastTrend(this.history[nodeId], 'ch4_ppm', 10),
      co: forecastTrend(this.history[nodeId], 'co_ppm', 10),
      o2: forecastTrend(this.history[nodeId], 'o2_percent', 10),
      distance: forecastTrend(this.history[nodeId], 'distance_cm', 10)
    };

    return {
      telemetry: normalized,
      predictions,
      newAlerts
    };
  }

  /**
   * Check thresholds and trigger alerts
   */
  evaluateThresholds(data) {
    const nodeMeta = this.nodes[data.node_id] || { sector_name: 'Unknown Sector' };
    const generatedAlerts = [];

    // 1. Ultrasonic Clearance
    if (data.distance_cm < THRESHOLDS.distance_cm.critical) {
      generatedAlerts.push({
        type: 'CAVE_IN_HAZARD',
        severity: 'CRITICAL',
        title: 'STRUCTURAL HAZARD: Cave-in Proximity Detected',
        message: `Ceiling clearance collapsed to ${data.distance_cm} cm (Safety threshold: 100 cm). Immediate collapse or obstacle risk.`,
        node_id: data.node_id,
        sector_name: nodeMeta.sector_name,
        reading: `${data.distance_cm} cm`,
        threshold: `< ${THRESHOLDS.distance_cm.critical} cm`
      });
    } else if (data.distance_cm < THRESHOLDS.distance_cm.caution) {
      generatedAlerts.push({
        type: 'CLEARANCE_CAUTION',
        severity: 'CAUTION',
        title: 'Ceiling Convergence / Clearance Caution',
        message: `Clearance reduced to ${data.distance_cm} cm. Stope deformation warning.`,
        node_id: data.node_id,
        sector_name: nodeMeta.sector_name,
        reading: `${data.distance_cm} cm`,
        threshold: `< ${THRESHOLDS.distance_cm.caution} cm`
      });
    }

    // 2. Methane CH4
    if (data.ch4_ppm >= THRESHOLDS.ch4_ppm.critical) {
      generatedAlerts.push({
        type: 'CH4_CRITICAL',
        severity: 'CRITICAL',
        title: 'METHANE EXPLOSION RISK (LEL Breach)',
        message: `CH4 concentration reached ${data.ch4_ppm} ppm (${data.ch4_lel_percent}% LEL). Exceeds 20% LEL action ceiling. Mandatory evacuation!`,
        node_id: data.node_id,
        sector_name: nodeMeta.sector_name,
        reading: `${data.ch4_ppm} ppm (${data.ch4_lel_percent}% LEL)`,
        threshold: `≥ 10,000 ppm (20% LEL)`
      });
    } else if (data.ch4_ppm >= THRESHOLDS.ch4_ppm.caution) {
      generatedAlerts.push({
        type: 'CH4_CAUTION',
        severity: 'CAUTION',
        title: 'Methane Gas Accumulation Caution',
        message: `Elevated CH4 at ${data.ch4_ppm} ppm (${data.ch4_lel_percent}% LEL). Auxiliary ventilation required.`,
        node_id: data.node_id,
        sector_name: nodeMeta.sector_name,
        reading: `${data.ch4_ppm} ppm`,
        threshold: `≥ 5,000 ppm (10% LEL)`
      });
    }

    // 3. Carbon Monoxide CO
    if (data.co_ppm >= THRESHOLDS.co_ppm.critical) {
      generatedAlerts.push({
        type: 'CO_CRITICAL',
        severity: 'CRITICAL',
        title: 'TOXIC GAS: High Carbon Monoxide Spike',
        message: `CO spiked to ${data.co_ppm} ppm. Potential spontaneous combustion or active underground fire!`,
        node_id: data.node_id,
        sector_name: nodeMeta.sector_name,
        reading: `${data.co_ppm} ppm`,
        threshold: `≥ 100 ppm`
      });
    } else if (data.co_ppm >= THRESHOLDS.co_ppm.caution) {
      generatedAlerts.push({
        type: 'CO_CAUTION',
        severity: 'CAUTION',
        title: 'Carbon Monoxide Elevated',
        message: `CO reading at ${data.co_ppm} ppm above 8-hr OSHA limit. Inspect machinery and seals.`,
        node_id: data.node_id,
        sector_name: nodeMeta.sector_name,
        reading: `${data.co_ppm} ppm`,
        threshold: `≥ 35 ppm`
      });
    }

    // 4. Oxygen O2
    if (data.o2_percent <= THRESHOLDS.o2_percent.critical_low) {
      generatedAlerts.push({
        type: 'O2_ASPHYXIATION',
        severity: 'CRITICAL',
        title: 'ASPHYXIATION HAZARD: Severe Oxygen Depletion',
        message: `O2 levels plummeted to ${data.o2_percent}%. Immediate SCBA respirator gear required!`,
        node_id: data.node_id,
        sector_name: nodeMeta.sector_name,
        reading: `${data.o2_percent}%`,
        threshold: `≤ 16.0%`
      });
    } else if (data.o2_percent <= THRESHOLDS.o2_percent.caution_low) {
      generatedAlerts.push({
        type: 'O2_DEFICIENCY',
        severity: 'CAUTION',
        title: 'Oxygen Depletion Warning',
        message: `O2 concentration is ${data.o2_percent}% (below standard 19.5% safe limit).`,
        node_id: data.node_id,
        sector_name: nodeMeta.sector_name,
        reading: `${data.o2_percent}%`,
        threshold: `< 19.5%`
      });
    }

    // Process alerts - debounce so we don't duplicate identical active alerts every second
    const newlyCreated = [];
    for (const rawAlert of generatedAlerts) {
      const existing = this.alerts.find(a => 
        a.node_id === rawAlert.node_id &&
        a.type === rawAlert.type &&
        a.status === 'ACTIVE'
      );

      if (!existing) {
        const fullAlert = {
          id: `ALT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          timestamp: data.timestamp,
          status: 'ACTIVE', // ACTIVE, ACKNOWLEDGED, RESOLVED
          acknowledged_by: null,
          acknowledged_at: null,
          notes: '',
          ...rawAlert
        };
        this.alerts.unshift(fullAlert);
        newlyCreated.push(fullAlert);
      } else {
        // Update reading on existing active alert
        existing.reading = rawAlert.reading;
        existing.last_updated = data.timestamp;
      }
    }

    // Keep alert list manageable (last 200)
    if (this.alerts.length > 200) {
      this.alerts = this.alerts.slice(0, 200);
    }

    return newlyCreated;
  }

  acknowledgeAlert(alertId, operatorName = 'Surface Controller', notes = '') {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledged_by = operatorName;
      alert.acknowledged_at = new Date().toISOString();
      alert.notes = notes || 'Acknowledged by surface command';
      return alert;
    }
    return null;
  }

  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      alert.resolved_at = new Date().toISOString();
      return alert;
    }
    return null;
  }

  triggerEvacuation(sectorIds = [], initiatedBy = 'Chief Safety Officer', reason = 'Multi-gas & clearance hazard threshold breached') {
    this.evacuation = {
      is_active: true,
      initiated_at: new Date().toISOString(),
      initiated_by: initiatedBy,
      reason: reason,
      affected_sectors: sectorIds.length ? sectorIds : ['SEC-04', 'SEC-02', 'SEC-07', 'SEC-05'],
      personnel_total: 42,
      personnel_evacuated: 12,
      personnel_in_transit: 28,
      personnel_unaccounted: 2,
      siren_enabled: true
    };

    // Add high-priority emergency alert
    const evacAlert = {
      id: `EVAC-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'FULL_MINE_EVACUATION',
      severity: 'EMERGENCY',
      title: '🚨 GENERAL MINE EVACUATION ORDER IN EFFECT',
      message: `Emergency broadcast initiated by ${initiatedBy}. Reason: ${reason}. All subterranean personnel proceed to nearest refuge station or hoist shaft.`,
      node_id: 'ALL-NODES',
      sector_name: 'All Mine Sectors',
      reading: 'SOS ALARM',
      threshold: 'CRITICAL EVACUATION',
      status: 'ACTIVE',
      acknowledged_by: null,
      acknowledged_at: null
    };
    this.alerts.unshift(evacAlert);

    return this.evacuation;
  }

  cancelEvacuation(cancelledBy = 'Chief Safety Officer') {
    this.evacuation.is_active = false;
    this.evacuation.siren_enabled = false;
    this.evacuation.cancelled_at = new Date().toISOString();
    this.evacuation.cancelled_by = cancelledBy;
    return this.evacuation;
  }

  updatePersonnelProgress(evacuated, inTransit, unaccounted) {
    if (evacuated !== undefined) this.evacuation.personnel_evacuated = evacuated;
    if (inTransit !== undefined) this.evacuation.personnel_in_transit = inTransit;
    if (unaccounted !== undefined) this.evacuation.personnel_unaccounted = unaccounted;
    return this.evacuation;
  }

  getSnapshot(nodeId = 'NODE-01') {
    const nodeHistory = this.history[nodeId] || [];
    const latestReading = this.latest[nodeId] || nodeHistory[nodeHistory.length - 1] || null;

    const predictions = {
      ch4: forecastTrend(nodeHistory, 'ch4_ppm', 10),
      co: forecastTrend(nodeHistory, 'co_ppm', 10),
      o2: forecastTrend(nodeHistory, 'o2_percent', 10),
      distance: forecastTrend(nodeHistory, 'distance_cm', 10)
    };

    return {
      selectedNodeId: nodeId,
      nodes: Object.values(this.nodes),
      latest: this.latest,
      currentTelemetry: latestReading,
      predictions,
      historyLength: nodeHistory.length,
      gatewayStats: this.gatewayStats,
      rescueTeams: this.rescueTeams,
      evacuation: this.evacuation,
      activeAlertsCount: this.alerts.filter(a => a.status === 'ACTIVE').length,
      recentAlerts: this.alerts.slice(0, 50)
    };
  }
}

module.exports = TelemetryStore;

