/**
 * Realistic Multi-Sensor Simulator for Underground LoRa Nodes
 * Simulates physical underground telemetry with brownian motion and preset hazard scenarios.
 */

class SimulationEngine {
  constructor(store, broadcastFn) {
    this.store = store;
    this.broadcastFn = broadcastFn;
    this.intervalId = null;
    this.isRunning = true;
    this.tickRateMs = 1200; // 1.2s per LoRa telemetry broadcast
    this.scenario = 'NORMAL'; // NORMAL, CAVE_IN, METHANE_SURGE, FIRE_OUTBREAK, LORA_DEGRADATION, MANUAL
    this.scenarioProgress = 0; // Steps into scenario

    // Baseline sensor states for each node
    this.nodeStates = {
      'NODE-01': {
        distance_cm: 218.4,
        ch4_ppm: 680,
        co_ppm: 8.2,
        o2_percent: 20.88,
        rssi: -79,
        snr: 8.4,
        battery: 94
      },
      'NODE-02': {
        distance_cm: 242.0,
        ch4_ppm: 420,
        co_ppm: 5.5,
        o2_percent: 20.91,
        rssi: -86,
        snr: 7.1,
        battery: 88
      },
      'NODE-03': {
        distance_cm: 205.5,
        ch4_ppm: 510,
        co_ppm: 9.0,
        o2_percent: 20.85,
        rssi: -74,
        snr: 9.8,
        battery: 97
      },
      'NODE-04': {
        distance_cm: 260.0,
        ch4_ppm: 180,
        co_ppm: 2.1,
        o2_percent: 20.95,
        rssi: -82,
        snr: 8.0,
        battery: 99
      }
    };

    // Manual overrides
    this.manualOverrides = {};

    // Seed initial history so charts are immediately populated
    this.seedInitialHistory();
  }

  seedInitialHistory() {
    const now = Date.now();
    const count = 60; // 60 past data points (1 per 2 seconds = 2 minutes of history)
    
    Object.keys(this.nodeStates).forEach(nodeId => {
      let state = { ...this.nodeStates[nodeId] };

      for (let i = count; i >= 0; i--) {
        const timestamp = new Date(now - i * 2000).toISOString();
        
        // Slight Brownian walk
        state.distance_cm = Math.max(190, Math.min(240, state.distance_cm + (Math.random() - 0.5) * 1.5));
        state.ch4_ppm = Math.max(300, Math.min(1200, state.ch4_ppm + (Math.random() - 0.49) * 20));
        state.co_ppm = Math.max(3, Math.min(15, state.co_ppm + (Math.random() - 0.49) * 0.4));
        state.o2_percent = Math.max(20.7, Math.min(21.0, state.o2_percent + (Math.random() - 0.5) * 0.02));
        state.rssi = Math.max(-95, Math.min(-68, state.rssi + Math.round((Math.random() - 0.5) * 2)));
        state.snr = Math.max(5, Math.min(11, state.snr + (Math.random() - 0.5) * 0.3));

        this.store.ingest({
          node_id: nodeId,
          timestamp,
          distance_cm: state.distance_cm,
          ch4_ppm: state.ch4_ppm,
          co_ppm: state.co_ppm,
          o2_percent: state.o2_percent,
          rssi: state.rssi,
          snr: state.snr,
          battery: state.battery
        });
      }
    });
  }

  setScenario(scenarioName) {
    this.scenario = scenarioName;
    this.scenarioProgress = 0;
  }

  setManualOverride(overrides) {
    this.scenario = 'MANUAL';
    this.manualOverrides = { ...this.manualOverrides, ...overrides };
  }

  start() {
    if (this.intervalId) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => this.tick(), this.tickRateMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  tick() {
    this.scenarioProgress += 1;
    const nowIso = new Date().toISOString();

    // Loop through each node and evolve its telemetry
    Object.keys(this.nodeStates).forEach(nodeId => {
      const state = this.nodeStates[nodeId];

      if (this.scenario === 'MANUAL' && nodeId === 'NODE-01') {
        // Apply user manual injection to primary node
        if (this.manualOverrides.distance_cm !== undefined) state.distance_cm = this.manualOverrides.distance_cm;
        if (this.manualOverrides.ch4_ppm !== undefined) state.ch4_ppm = this.manualOverrides.ch4_ppm;
        if (this.manualOverrides.co_ppm !== undefined) state.co_ppm = this.manualOverrides.co_ppm;
        if (this.manualOverrides.o2_percent !== undefined) state.o2_percent = this.manualOverrides.o2_percent;
        if (this.manualOverrides.rssi !== undefined) state.rssi = this.manualOverrides.rssi;
        if (this.manualOverrides.battery !== undefined) state.battery = this.manualOverrides.battery;
      } else if (this.scenario === 'CAVE_IN' && nodeId === 'NODE-01') {
        // Dramatic tunnel squeeze / cave-in on primary node
        // Collapse clearance from 218cm down to 55cm
        const decayStep = Math.min(180, this.scenarioProgress * 5.5);
        state.distance_cm = Math.max(45, 218 - decayStep + (Math.random() - 0.5) * 4);
        state.ch4_ppm += (Math.random() - 0.3) * 60; // rock fracturing releasing pocket gas
        state.co_ppm += (Math.random() - 0.4) * 0.8;
      } else if (this.scenario === 'METHANE_SURGE' && nodeId === 'NODE-01') {
        // Rapid methane buildup (drilling hit pressurized methane vein)
        // Climb rapidly towards 14,000 ppm
        const surgeRate = 350 + Math.random() * 250;
        state.ch4_ppm = Math.min(18000, state.ch4_ppm + surgeRate);
        state.o2_percent = Math.max(18.2, state.o2_percent - 0.05); // gas displaces oxygen
        state.distance_cm += (Math.random() - 0.5) * 1.2;
      } else if (this.scenario === 'FIRE_OUTBREAK' && nodeId === 'NODE-01') {
        // Belt drive friction fire or battery runaway
        // CO spikes, O2 drops steeply
        state.co_ppm = Math.min(320, state.co_ppm + 8 + Math.random() * 6);
        state.o2_percent = Math.max(14.2, state.o2_percent - 0.12 - Math.random() * 0.05);
        state.ch4_ppm += (Math.random() - 0.4) * 40;
        state.distance_cm += (Math.random() - 0.5) * 1.5;
      } else if (this.scenario === 'LORA_DEGRADATION' && nodeId === 'NODE-01') {
        // Severe RF attenuation (rock fall shielding antenna or antenna tilt)
        state.rssi = Math.max(-128, state.rssi - 2.5);
        state.snr = Math.max(-16, state.snr - 0.8);
      } else {
        // NORMAL baseline brownian walk
        state.distance_cm = Math.max(200, Math.min(240, state.distance_cm + (Math.random() - 0.5) * 1.2));
        state.ch4_ppm = Math.max(350, Math.min(1200, state.ch4_ppm + (Math.random() - 0.5) * 25));
        state.co_ppm = Math.max(4, Math.min(14, state.co_ppm + (Math.random() - 0.5) * 0.5));
        state.o2_percent = Math.max(20.7, Math.min(21.0, state.o2_percent + (Math.random() - 0.5) * 0.02));
        state.rssi = Math.max(-92, Math.min(-72, state.rssi + Math.round((Math.random() - 0.5) * 1.5)));
        state.snr = Math.max(6, Math.min(11, state.snr + (Math.random() - 0.5) * 0.2));
        
        // Very slow battery drain
        if (Math.random() < 0.01) {
          state.battery = Math.max(10, state.battery - 1);
        }
      }

      // If LORA_DEGRADATION is active, simulate 40% packet drop
      if (this.scenario === 'LORA_DEGRADATION' && nodeId === 'NODE-01' && Math.random() < 0.4) {
        this.store.gatewayStats.packets_corrupted += 1;
        return; // drop packet
      }

      const packet = {
        node_id: nodeId,
        timestamp: nowIso,
        distance_cm: state.distance_cm,
        ch4_ppm: state.ch4_ppm,
        co_ppm: state.co_ppm,
        o2_percent: state.o2_percent,
        rssi: state.rssi,
        snr: state.snr,
        battery: state.battery
      };

      const result = this.store.ingest(packet);

      // Broadcast live telemetry update over WebSockets
      if (this.broadcastFn) {
        this.broadcastFn({
          type: 'TELEMETRY_UPDATE',
          node_id: nodeId,
          telemetry: result.telemetry,
          predictions: result.predictions,
          newAlerts: result.newAlerts,
          scenario: this.scenario
        });
      }
    });
  }
}

module.exports = SimulationEngine;

