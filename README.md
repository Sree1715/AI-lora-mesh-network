# ⛏️ Mine Rescue and Safety Monitoring System (MRSMS)
### Surface Control Command & Underground Telemetry Station

A complete, responsive, mission-critical industrial web platform designed for underground mine rescue and safety operations. The system collects, visualizes, and analyzes real-time subterranean telemetry transmitted over LoRa wireless mesh networks, tracking tunnel ceiling clearance, monitoring explosive and toxic gases, calculating dynamic safety indexes, running forward predictive gas hazard models, and coordinating emergency evacuation protocols.

---

## 📸 Key Capabilities & Features

### 1. Live Telemetry Dashboard
- **Ultrasonic Sensor Clearance**:
  - Real-time tunnel ceiling clearance, obstacle tracking, and cave-in proximity distance in centimeters.
  - Color-coded status badges: `CLEAR` (> 180 cm), `CAUTION` (100–180 cm), and `STRUCTURAL HAZARD / CAVE-IN RISK` (< 100 cm).
  - Clearance depth bar and real-time rate of convergence ($\Delta\text{cm/min}$).
- **Multi-Gas Environmental Monitoring**:
  - **Methane ($\text{CH}_4$)**: Displayed in PPM and % LEL (Lower Explosive Limit, where $100\%\text{ LEL} = 50,000\text{ ppm}$). Safety thresholds calibrated to MSHA regulations ($10\%\text{ LEL} / 5,000\text{ ppm}$ Caution; $20\%\text{ LEL} / 10,000\text{ ppm}$ Mandatory Evacuation Ceiling).
  - **Carbon Monoxide ($\text{CO}$)**: Measured in PPM with OSHA 8-hr REL limit ($35\text{ ppm}$) and toxic fire threshold ($100\text{ ppm}$).
  - **Oxygen ($\text{O}_2$)**: Real-time atmospheric concentration with OSHA deficiency alarm ($< 19.5\%$), critical asphyxiation warning ($< 16.0\%$), and enrichment alarm ($> 23.5\%$).
- **Gas Prediction Engine**:
  - Analyzes rate of gas accumulation ($\text{ppm/min}$) using linear regression with exponential dispersion damping.
  - Forecasts gas concentrations 10 minutes into the future.
  - Automatically calculates **Time-to-Breach** countdowns (e.g., *"$\text{CH}_4$ projected to breach 20% LEL in 4m 12s"*).
  - Computes regression confidence scores ($R^2$) to distinguish natural drift from aggressive accumulation surges.
- **LoRa Wireless Network Diagnostics**:
  - Live Packet Reception Rate (PRR %), packet loss counter, signal strength (RSSI in dBm), signal-to-noise ratio (SNR in dB), battery percentage, voltage, and last transmission timestamp.
- **Sector & Rescue Personnel Tracking**:
  - Subsurface spatial tracking across Active Extraction Stopes, Deep Drifts, North Incline Airway, and East Safe Refuge Stations.
  - Real-time status for rescue teams (Alpha, Bravo, Charlie) with SCBA oxygen levels, average crew heart rates, and distress beacons.
  - Composite **Tunnel Safety Index** (0–100 scale).

### 2. Interactive Graphing & Visualizations
- **Ultrasonic Distance Trend Stream**: Live streaming area graph tracking ceiling shifts and sudden seismic convergence.
- **Multi-Gas Concentration & Predictive Curves**: Multi-line graph with solid lines for live readings and dashed/dotted forward curves for predictive trajectories.
- **Time Interval Controls**: Toggle viewing windows between `Live 60s`, `15m`, `1h`, and `8h Shift View`.
- **Visual Danger Zone Radial Gauges**: High-contrast semi-circular gauges with calibrated safe, caution, and hazard arc segments for instantaneous control room evaluation.

### 3. Emergency Safety Protocol & Incident Response
- **Procedural Web Audio Siren**: Synthesizes realistic dual-tone industrial emergency sirens, caution double-chirps, and evacuation klaxons using the Web Audio API (with mute, volume, and test buttons).
- **Incident Log Table**: Filterable and searchable audit trail with severity indicators, parameter readings, and operator acknowledgement workflow.
- **Export Capabilities**: One-click download of incident logs as **CSV** or **JSON**.
- **Manual SOS Evacuation Console**: 2-stage emergency broadcast console to blast warnings across individual or all mine sectors with live personnel headcount tracking (*Evacuated* vs *In-Transit* vs *Unaccounted*).

### 4. Built-in Hardware Simulator & Live Ingestion
- **Realistic Sensor Simulator**: Streams natural brownian sensor drift and micro-vibrations across all 4 mine nodes.
- **Preset Disaster Scenarios**:
  1. *Normal Baseline*: Safe operations.
  2. *Tunnel Squeeze / Cave-in*: Ultrasonic clearance collapses from 220 cm to 55 cm.
  3. *Methane Vein Breach*: $\text{CH}_4$ spikes rapidly to 14,000+ ppm.
  4. *Underground Fire*: $\text{CO}$ spikes and $\text{O}_2$ drops below 16%.
  5. *LoRa Signal Degradation*: Signal attenuation and 40% packet drops.
- **Manual Sensor Injection Sliders**: Adjust clearance, $\text{CH}_4$, $\text{CO}$, $\text{O}_2$, RSSI, and battery interactively in real time.

---

## 🛠️ System Architecture

```mermaid
flowchart TD
    subgraph Physical / Simulated Hardware
        Node1["Node-01: Stope Sub-B\n(Ultrasonic, CH4, CO, O2)"]
        Node2["Node-02: Deep Drift -300m"]
        Node3["Node-03: North Airway -180m"]
        Node4["Node-04: East Refuge Bay -350m"]
        ExtGW["External LoRa Gateway / ESP32 / Python"]
    end

    subgraph Surface Station Backend [Node.js Express + WebSocket (Port 5000)]
        API["REST API (/api/telemetry)"]
        WSS["WebSocket Server (/ws)"]
        Store["Telemetry Ring Buffer Store\n(1000 samples/node)"]
        PredEngine["Gas Prediction Engine\n(Linear & Exp Regressions)"]
        AlertEngine["MSHA/OSHA Threshold Monitor"]
        SimEngine["Brownian Sensor Simulator"]
    end

    subgraph Surface Command Dashboard [React + Vite + Tailwind (Port 5000 / 5173)]
        HUD["Live Telemetry Grid"]
        Gauges["Radial Arc Danger Gauges"]
        Charts["Clearance & Gas Recharts"]
        Map["2D Subsurface Schematic Map"]
        Siren["Web Audio Synthesizer"]
        Incidents["Incident Protocol & Ack Table"]
        EvacModal["Emergency SOS Console"]
    end

    Node1 -->|LoRa RF 915MHz| ExtGW
    Node2 -->|LoRa RF 915MHz| ExtGW
    ExtGW -->|HTTP POST| API
    SimEngine -->|Internal Telemetry| Store
    API --> Store
    Store --> PredEngine
    Store --> AlertEngine
    Store --> WSS
    WSS -->|Real-time JSON Stream| HUD
    WSS --> Gauges
    WSS --> Charts
    WSS --> Map
    AlertEngine -->|Audio Klaxon| Siren
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v24+)
- npm (v9+)

### Installation
From the root directory (`d:\reading data`):
```bash
# 1. Install server dependencies
cd server
npm install

# 2. Install client dependencies
cd ../client
npm install

# 3. Build the client application
npm run build
```

### Running the Application

#### Option A: Unified Production Mode (Recommended)
Starts the backend server and automatically serves the optimized frontend dashboard on **port 5000**:
```bash
# From the root directory:
npm start
```
Open your browser and navigate to:
👉 **`http://localhost:5000`**

#### Option B: Developer Mode with Hot Reloading
Run the backend and Vite development server concurrently:

*Terminal 1 (Backend API & WebSocket Stream):*
```bash
node server/server.js
```

*Terminal 2 (Vite Hot-Reload Client):*
```bash
cd client
npm run dev
```
Open your browser at:
👉 **`http://localhost:5173`** (Automatically proxies API and WebSocket requests to port 5000).

---

## 🧪 Automated System Verification

An automated test suite is included to verify end-to-end ingestion, prediction forecasting, history retrieval, and alert workflows:
```bash
npm run test:api
```
Sample test output:
```text
--- Starting MRSMS System Verification ---
✓ POST /api/telemetry response: INGESTED Alerts triggered: 4
✓ GET /api/telemetry/live: Current clearance = 125.4 cm, CH4 = 5800 ppm, Safety Index = 25
✓ Prediction Engine output: CH4 10m projected = 13966.82 Hazard Level = CRITICAL
✓ GET /api/telemetry/history (15m): 67 data points retrieved
✓ GET /api/system/status: Gateway = GW-SURFACE-01 Nodes count = 4 Rescue teams = 3
✓ GET /api/alerts: Total active/historical incidents = 4
✓ POST /api/alerts/acknowledge: Status = ACKNOWLEDGED By = Test Inspector #4
✓ POST /api/simulation/scenario: NORMAL
=======================================================
🎉 ALL BACKEND & TELEMETRY INGESTION TESTS PASSED! 🎉
=======================================================
```

---

## 📡 Sending External Hardware LoRa Telemetry to the API

Physical LoRa gateway stations, ESP32 nodes, or edge microcontrollers can transmit sensor telemetry directly to the REST endpoint:

### Endpoint: `POST http://localhost:5000/api/telemetry`
**Headers:** `Content-Type: application/json`

### JSON Telemetry Payload Format:
```json
{
  "node_id": "NODE-01",
  "timestamp": "2026-11-03T12:00:00.000Z",
  "distance_cm": 142.5,
  "ch4_ppm": 6200,
  "co_ppm": 48.0,
  "o2_percent": 19.1,
  "rssi": -84,
  "snr": 7.8,
  "battery": 89
}
```

### 1. cURL Example
```bash
curl -X POST http://localhost:5000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "NODE-01",
    "distance_cm": 142.5,
    "ch4_ppm": 6200,
    "co_ppm": 48.0,
    "o2_percent": 19.1,
    "rssi": -84,
    "snr": 7.8,
    "battery": 89
  }'
```

### 2. Python Gateway Serial Bridge Script
```python
import requests, time, random

API_ENDPOINT = "http://localhost:5000/api/telemetry"

while True:
    payload = {
        "node_id": "NODE-01",
        "distance_cm": round(random.uniform(190, 230), 1),
        "ch4_ppm": round(random.uniform(500, 1100), 1),
        "co_ppm": round(random.uniform(5, 12), 1),
        "o2_percent": round(random.uniform(20.7, 20.95), 2),
        "rssi": -82,
        "snr": 8.4,
        "battery": 94
    }
    response = requests.post(API_ENDPOINT, json=payload)
    print("Ingested. Status:", response.status_code)
    time.sleep(1.2)
```

### 3. ESP32 / Arduino LoRa C++ Transmitter
```cpp
#include <SPI.h>
#include <LoRa.h>

void sendLoRaTelemetry(float distanceCm, float ch4Ppm, float coPpm, float o2Pct, int batteryPct) {
  String json = "{\"node_id\":\"NODE-01\",\"distance_cm\":" + String(distanceCm, 1) + 
                ",\"ch4_ppm\":" + String(ch4Ppm, 1) + 
                ",\"co_ppm\":" + String(coPpm, 1) + 
                ",\"o2_percent\":" + String(o2Pct, 2) + 
                ",\"rssi\":-80,\"battery\":" + String(batteryPct) + "}";
                
  LoRa.beginPacket();
  LoRa.print(json);
  LoRa.endPacket();
}
```

### 4. Java LoRa Gateway Ingestion Client (Java 8+ / Zero External Dependencies)
Located in `java/src/main/java/com/minerescue/client/LoRaGatewayClient.java`:
```java
package com.minerescue.client;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class LoRaGatewayClient {
    private static final String API_URL = "http://localhost:5000/api/telemetry";

    public static void main(String[] args) {
        try {
            URL url = new URL(API_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);

            String jsonPayload = "{\"node_id\":\"NODE-01\",\"distance_cm\":214.5,\"ch4_ppm\":680.0,\"co_ppm\":8.4,\"o2_percent\":20.88,\"rssi\":-79,\"snr\":8.5,\"battery\":94}";

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int statusCode = conn.getResponseCode();
            System.out.println("MRSMS Java Gateway Response: " + statusCode + " INGESTED");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

#### Included Java Files:
- [`LoRaTelemetryPacket.java`](file:///d:/reading%20data/java/src/main/java/com/minerescue/model/LoRaTelemetryPacket.java): Subsurface telemetry POJO data model and JSON serializer.
- [`GasPredictionEngine.java`](file:///d:/reading%20data/java/src/main/java/com/minerescue/prediction/GasPredictionEngine.java): MSHA/OSHA hazard forecasting & safety index calculations.
- [`LoRaGatewayClient.java`](file:///d:/reading%20data/java/src/main/java/com/minerescue/client/LoRaGatewayClient.java): Executable Java HTTP gateway client.
- [`MineSensorSimulator.java`](file:///d:/reading%20data/java/src/main/java/com/minerescue/simulator/MineSensorSimulator.java): Continuous multi-node background telemetry stream simulator.
- [`pom.xml`](file:///d:/reading%20data/java/pom.xml): Maven build configuration.

---

## 🎛️ REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/telemetry` | Ingest external LoRa packet & broadcast via WebSocket |
| `GET` | `/api/telemetry/live?node_id=...` | Retrieve latest sensor telemetry & predictive forecasts |
| `GET` | `/api/telemetry/history?window=15m` | Retrieve historical data points (`60s`, `15m`, `1h`, `8h`) |
| `GET` | `/api/alerts?status=ACTIVE` | Retrieve active & historical incident alerts |
| `POST` | `/api/alerts/acknowledge` | Acknowledge incident with operator callsign and notes |
| `POST` | `/api/alerts/resolve` | Mark incident as resolved / cleared |
| `POST` | `/api/evacuation` | Broadcast general emergency evacuation order |
| `POST` | `/api/evacuation/cancel` | Cancel evacuation order / stand down |
| `POST` | `/api/evacuation/progress` | Update surface evacuation headcounts |
| `POST` | `/api/simulation/scenario` | Switch hazard scenario (`NORMAL`, `CAVE_IN`, `METHANE_SURGE`, `FIRE_OUTBREAK`, `LORA_DEGRADATION`) |
| `POST` | `/api/simulation/toggle` | Start or pause the simulated sensor stream |
| `GET` | `/api/system/status` | LoRa gateway statistics, active nodes, and rescue teams |

---

## 🛡️ Safety Threshold Standards

Calibrated to **OSHA** and **MSHA (Mine Safety and Health Administration)** Title 30 standards:

| Parameter | Unit | Normal / Safe | Caution Threshold | Critical Action / Evacuation |
|---|---|---|---|---|
| **Ultrasonic Clearance** | cm | $> 180\text{ cm}$ | $100 - 180\text{ cm}$ (Convergence) | $< 100\text{ cm}$ (Cave-in Hazard) |
| **Methane ($\text{CH}_4$)** | ppm (% LEL) | $< 5,000\text{ ppm}$ ($< 10\%\text{ LEL}$) | $5,000 - 10,000\text{ ppm}$ ($10-20\%$) | $\ge 10,000\text{ ppm}$ ($20\%\text{ LEL}$ Mandatory Evac) |
| **Carbon Monoxide ($\text{CO}$)** | ppm | $< 35\text{ ppm}$ | $35 - 100\text{ ppm}$ (OSHA 8-hr REL) | $\ge 100\text{ ppm}$ (Toxic Fire Hazard) |
| **Oxygen ($\text{O}_2$)** | % Vol | $19.5\% - 23.5\%$ | $16.0\% - 19.5\%$ (Deficient) | $\le 16.0\%$ (Asphyxiation Hazard) |
| **Safety Index** | pts | $70 - 100$ | $40 - 69$ | $0 - 39$ |

