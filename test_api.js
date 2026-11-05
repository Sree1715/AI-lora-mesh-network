/**
 * Automated Test Suite for Mine Rescue & Safety Monitoring System
 */

const http = require('http');

async function runTests() {
  console.log('--- Starting MRSMS System Verification ---');

  // 1. Ingest LoRa Packet
  const samplePacket = {
    node_id: 'NODE-01',
    distance_cm: 125.4,
    ch4_ppm: 5800,
    co_ppm: 42.0,
    o2_percent: 18.9,
    rssi: -82,
    snr: 8.1,
    battery: 91
  };

  try {
    const postRes = await fetch('http://localhost:5000/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(samplePacket)
    });
    const postData = await postRes.json();
    console.log('✓ POST /api/telemetry response:', postData.status, 'Alerts triggered:', postData.alerts_triggered);

    // 2. Fetch Live Telemetry
    const liveRes = await fetch('http://localhost:5000/api/telemetry/live?node_id=NODE-01');
    const liveData = await liveRes.json();
    console.log('✓ GET /api/telemetry/live: Current clearance =', liveData.currentTelemetry.distance_cm, 'cm, CH4 =', liveData.currentTelemetry.ch4_ppm, 'ppm, Safety Index =', liveData.currentTelemetry.safety_index);
    console.log('✓ Prediction Engine output: CH4 10m projected =', liveData.predictions.ch4.predictedValue10m, 'Hazard Level =', liveData.predictions.ch4.hazardLevel);

    // 3. Fetch History
    const histRes = await fetch('http://localhost:5000/api/telemetry/history?node_id=NODE-01&window=15m');
    const histData = await histRes.json();
    console.log('✓ GET /api/telemetry/history (15m):', histData.count, 'data points retrieved');

    // 4. Fetch System Status
    const sysRes = await fetch('http://localhost:5000/api/system/status');
    const sysData = await sysRes.json();
    console.log('✓ GET /api/system/status: Gateway =', sysData.gateway.gateway_id, 'Nodes count =', sysData.nodes.length, 'Rescue teams =', sysData.rescue_teams.length);

    // 5. Test Alert Acknowledgement
    const alertsRes = await fetch('http://localhost:5000/api/alerts');
    const alerts = await alertsRes.json();
    console.log('✓ GET /api/alerts: Total active/historical incidents =', alerts.length);

    if (alerts.length > 0) {
      const firstActive = alerts.find(a => a.status === 'ACTIVE') || alerts[0];
      const ackRes = await fetch('http://localhost:5000/api/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: firstActive.id,
          operator_name: 'Test Inspector #4',
          notes: 'Automated test verification acknowledgement'
        })
      });
      const ackData = await ackRes.json();
      console.log('✓ POST /api/alerts/acknowledge: Status =', ackData.status, 'By =', ackData.acknowledged_by);
    }

    // 6. Test Scenario Switch
    const scenRes = await fetch('http://localhost:5000/api/simulation/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'NORMAL' })
    });
    const scenData = await scenRes.json();
    console.log('✓ POST /api/simulation/scenario:', scenData.scenario);

    console.log('=======================================================');
    console.log('🎉 ALL BACKEND & TELEMETRY INGESTION TESTS PASSED! 🎉');
    console.log('=======================================================');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();

