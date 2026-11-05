import React, { useState } from 'react';
import { 
  Cpu, Play, Pause, AlertTriangle, Flame, Ruler, 
  Wind, Radio, Terminal, Copy, Check, Send, Sliders, 
  RefreshCw, FileCode, Coffee, Layers, CheckCircle2
} from 'lucide-react';
import * as api from '../utils/api';

export default function HardwareSimulatorPanel({ 
  simulatorScenario, 
  isSimulatorRunning, 
  onToggleSimulator, 
  onSetScenario, 
  onOverrideSensor,
  selectedNodeId
}) {
  // Manual slider states
  const [distance, setDistance] = useState(210);
  const [ch4, setCh4] = useState(650);
  const [co, setCo] = useState(8);
  const [o2, setO2] = useState(20.9);
  const [rssi, setRssi] = useState(-80);
  const [battery, setBattery] = useState(95);

  const [copiedCode, setCopiedCode] = useState(null);
  const [injectStatus, setInjectStatus] = useState(null);
  const [activeCodeTab, setActiveCodeTab] = useState('java'); // 'java', 'curl', 'python', 'esp32'

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleManualInject = async () => {
    try {
      setInjectStatus('INJECTING');
      await api.postLoRaTelemetry({
        node_id: selectedNodeId || 'NODE-01',
        distance_cm: distance,
        ch4_ppm: ch4,
        co_ppm: co,
        o2_percent: o2,
        rssi: rssi,
        snr: 8.5,
        battery: battery
      });
      setInjectStatus('SUCCESS');
      setTimeout(() => setInjectStatus(null), 2500);
    } catch (e) {
      console.error('Injection failed', e);
      setInjectStatus('ERROR');
      setTimeout(() => setInjectStatus(null), 2500);
    }
  };

  const javaExample = `// ========================================================
// Java LoRa Gateway Ingestion Client (Java 8+ / Standard SE)
// Package: com.minerescue.client.LoRaGatewayClient
// ========================================================
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

            // Subsurface node telemetry payload
            String payload = "{" +
                "\\"node_id\\":\\"NODE-01\\"," +
                "\\"distance_cm\\":214.5," +
                "\\"ch4_ppm\\":680.0," +
                "\\"co_ppm\\":8.4," +
                "\\"o2_percent\\":20.88," +
                "\\"rssi\\":-79," +
                "\\"snr\\":8.5," +
                "\\"battery\\":94" +
            "}";

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = payload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int statusCode = conn.getResponseCode();
            System.out.println("MRSMS Java Gateway Status: " + statusCode + " INGESTED");

            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) {
                    System.out.println(line);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`;

  const curlExample = `curl -X POST http://localhost:5000/api/telemetry \\
  -H "Content-Type: application/json" \\
  -d '{
    "node_id": "NODE-01",
    "distance_cm": 142.5,
    "ch4_ppm": 6200,
    "co_ppm": 48.0,
    "o2_percent": 19.1,
    "rssi": -84,
    "snr": 7.8,
    "battery": 89
  }'`;

  const pythonExample = `import requests, time, random

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
    r = requests.post(API_ENDPOINT, json=payload)
    print("LoRa Gateway Ingestion Response:", r.status_code)
    time.sleep(1.2)`;

  const esp32Example = `// ESP32 SX1276 LoRa Subsurface Node Payload
#include <SPI.h>
#include <LoRa.h>

void sendTelemetry() {
  String payload = "{\\"node_id\\":\\"NODE-01\\",\\"distance_cm\\":215.4,\\"ch4_ppm\\":720,\\"co_ppm\\":7.5,\\"o2_percent\\":20.88,\\"rssi\\":-79,\\"battery\\":95}";
  LoRa.beginPacket();
  LoRa.print(payload);
  LoRa.endPacket();
}`;

  const javaFiles = [
    {
      name: 'LoRaTelemetryPacket.java',
      package: 'com.minerescue.model',
      path: 'java/src/main/java/com/minerescue/model/LoRaTelemetryPacket.java',
      desc: 'Subsurface telemetry data model, getters/setters, ISO timestamping, and JSON serialization.'
    },
    {
      name: 'GasPredictionEngine.java',
      package: 'com.minerescue.prediction',
      path: 'java/src/main/java/com/minerescue/prediction/GasPredictionEngine.java',
      desc: 'MSHA/OSHA Title 30 safety limits, linear regression rate-of-rise, 10m forecast, and safety index calculation.'
    },
    {
      name: 'LoRaGatewayClient.java',
      package: 'com.minerescue.client',
      path: 'java/src/main/java/com/minerescue/client/LoRaGatewayClient.java',
      desc: 'Standalone executable Java HTTP client using HttpURLConnection (zero external JAR dependencies required).'
    },
    {
      name: 'MineSensorSimulator.java',
      package: 'com.minerescue.simulator',
      path: 'java/src/main/java/com/minerescue/simulator/MineSensorSimulator.java',
      desc: 'Multi-threaded background simulator generating continuous subterranean brownian sensor drift.'
    },
    {
      name: 'pom.xml',
      package: 'Maven Build Descriptor',
      path: 'java/pom.xml',
      desc: 'Standard Maven build configuration with compiler plugin and executable JAR packaging.'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Simulator Master Control Strip */}
      <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-industrial text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span>Integrated LoRa Hardware Simulator Engine</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isSimulatorRunning 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isSimulatorRunning ? 'SIMULATOR STREAMING (1.2s)' : 'SIMULATOR PAUSED'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Generates realistic brownian drift, sensor noise, and catastrophic hazard injection scenarios
              </p>
            </div>
          </div>

          <button
            onClick={onToggleSimulator}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all ${
              isSimulatorRunning
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            {isSimulatorRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulatorRunning ? 'Pause Simulator' : 'Resume Simulator'}</span>
          </button>
        </div>

        {/* Hazard Scenario Presets */}
        <div className="mt-4">
          <label className="block text-xs font-mono font-bold text-slate-300 mb-2">
            SELECT PRESET REAL-WORLD DISASTER SCENARIO:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { id: 'NORMAL', label: '1. Normal Baseline', desc: 'Safe operations, natural drift', color: 'border-emerald-500/50' },
              { id: 'CAVE_IN', label: '2. Cave-in / Squeeze', desc: 'Clearance drops from 220cm to 55cm', color: 'border-red-500/50', icon: Ruler },
              { id: 'METHANE_SURGE', label: '3. Methane Vein Breach', desc: 'CH4 climbs rapidly to 14,000 ppm', color: 'border-amber-500/50', icon: Flame },
              { id: 'FIRE_OUTBREAK', label: '4. Underground Fire', desc: 'CO surges, O2 asphyxiation drop', color: 'border-rose-500/50', icon: AlertTriangle },
              { id: 'LORA_DEGRADATION', label: '5. Wireless Signal Drop', desc: 'Attenuation & 40% packet loss', color: 'border-cyan-500/50', icon: Radio }
            ].map(sc => {
              const isActive = simulatorScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => onSetScenario(sc.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? `bg-slate-800 border-2 ${sc.color} shadow-lg ring-1 ring-cyan-400/20`
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-industrial text-xs font-bold text-slate-100">{sc.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{sc.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Manual Sensor Injection Sliders */}
      <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="font-industrial text-sm font-bold text-slate-100 uppercase tracking-wider">
              Interactive Manual Telemetry Injection ({selectedNodeId || 'NODE-01'})
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Slide values to test threshold triggers in real time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 text-xs font-mono">
          {/* Clearance Slider */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Ultrasonic Clearance:</span>
              <strong className="text-cyan-400">{distance} cm</strong>
            </div>
            <input 
              type="range" min="30" max="300" step="1" 
              value={distance} 
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>30cm (Collapse)</span>
              <span>100cm</span>
              <span>180cm</span>
              <span>300cm</span>
            </div>
          </div>

          {/* CH4 Slider */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Methane (CH4):</span>
              <strong className="text-amber-400">{ch4} ppm ({((ch4/50000)*100).toFixed(1)}% LEL)</strong>
            </div>
            <input 
              type="range" min="200" max="25000" step="100" 
              value={ch4} 
              onChange={(e) => setCh4(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>200 ppm</span>
              <span>5k (10%)</span>
              <span>10k (20%)</span>
              <span>25k ppm</span>
            </div>
          </div>

          {/* CO Slider */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Carbon Monoxide (CO):</span>
              <strong className="text-rose-400">{co} ppm</strong>
            </div>
            <input 
              type="range" min="0" max="250" step="1" 
              value={co} 
              onChange={(e) => setCo(Number(e.target.value))}
              className="w-full accent-rose-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 ppm</span>
              <span>35 ppm</span>
              <span>100 ppm</span>
              <span>250 ppm</span>
            </div>
          </div>

          {/* O2 Slider */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Oxygen (O2):</span>
              <strong className="text-teal-400">{o2}%</strong>
            </div>
            <input 
              type="range" min="12" max="24" step="0.1" 
              value={o2} 
              onChange={(e) => setO2(Number(e.target.value))}
              className="w-full accent-teal-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>12% (Fatal)</span>
              <span>16%</span>
              <span>19.5%</span>
              <span>24%</span>
            </div>
          </div>

          {/* RSSI Slider */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">LoRa Signal (RSSI):</span>
              <strong className="text-cyan-400">{rssi} dBm</strong>
            </div>
            <input 
              type="range" min="-128" max="-60" step="1" 
              value={rssi} 
              onChange={(e) => setRssi(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>-128 dBm</span>
              <span>-100 dBm</span>
              <span>-60 dBm</span>
            </div>
          </div>

          {/* Battery Slider */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Node Battery:</span>
              <strong className="text-emerald-400">{battery}%</strong>
            </div>
            <input 
              type="range" min="5" max="100" step="1" 
              value={battery} 
              onChange={(e) => setBattery(Number(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>5%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            {injectStatus === 'SUCCESS' && <span className="text-emerald-400 font-bold">✅ Telemetry packet ingested & broadcasted!</span>}
            {injectStatus === 'ERROR' && <span className="text-red-400 font-bold">❌ Telemetry injection failed.</span>}
            {injectStatus === 'INJECTING' && <span className="text-cyan-400 font-bold">Transmitting to /api/telemetry...</span>}
            {!injectStatus && 'Click to inject custom telemetry values directly into the pipeline.'}
          </span>

          <button
            onClick={handleManualInject}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Transmit Custom LoRa Packet Now</span>
          </button>
        </div>
      </div>

      {/* NEW: Project Java Source Files Architecture Explorer */}
      <div className="carbon-panel rounded-xl p-4 border border-amber-500/30 shadow-xl bg-gradient-to-br from-[#0c1220] to-[#121a2e]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-industrial text-base font-bold text-slate-100 uppercase tracking-wider">
                  Java Files in Project (LoRa Gateway & Prediction SDK)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  JAVA 8+ / JRE READY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Production-grade Java classes for industrial SCADA, PLC, and LoRa edge gateway integration
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1 rounded border border-slate-800">
            Folder: d:\reading data\java\
          </span>
        </div>

        {/* Java File Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-xs font-mono">
          {javaFiles.map((jf, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-slate-100">{jf.name}</span>
                </div>
                <button
                  onClick={() => handleCopy(jf.name, jf.path)}
                  className="text-slate-400 hover:text-white"
                  title="Copy Path"
                >
                  {copiedCode === jf.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-cyan-400 block mt-1">{jf.package}</span>
              <p className="text-[11px] text-slate-400 mt-1 font-sans line-clamp-2">{jf.desc}</p>
              <div className="mt-2 text-[10px] text-slate-500 truncate bg-slate-950 px-2 py-1 rounded">
                {jf.path}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hardware LoRa Gateway Ingestion Documentation & Code Switcher */}
      <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <h4 className="font-industrial text-sm font-bold text-slate-100 uppercase tracking-wider">
              LoRa Gateway Hardware Integration Guide & API Payload Specifications
            </h4>
          </div>

          {/* Language Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
            {[
              { id: 'java', label: '☕ Java (Gateway Client)', color: 'text-amber-400' },
              { id: 'curl', label: '💻 cURL (Terminal)', color: 'text-cyan-400' },
              { id: 'python', label: '🐍 Python (Bridge)', color: 'text-emerald-400' },
              { id: 'esp32', label: '⚡ ESP32 (C++)', color: 'text-teal-400' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCodeTab(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  activeCodeTab === tab.id
                    ? 'bg-slate-800 text-white shadow border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={tab.color}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Content Container */}
        <div className="mt-4 font-mono text-xs">
          {/* 1. JAVA TAB */}
          {activeCodeTab === 'java' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-amber-400 font-bold text-sm block">LoRaGatewayClient.java</span>
                  <span className="text-[11px] text-slate-400">Zero external dependencies • Standard Java SE (HttpURLConnection)</span>
                </div>
                <button
                  onClick={() => handleCopy('java', javaExample)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  {copiedCode === 'java' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Copy Java Code</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed p-2 max-h-[380px]">
                {javaExample}
              </pre>
            </div>
          )}

          {/* 2. cURL TAB */}
          {activeCodeTab === 'curl' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-cyan-400 font-bold text-sm block">cURL Terminal Ingestion</span>
                  <span className="text-[11px] text-slate-400">Instant test command from PowerShell or Bash</span>
                </div>
                <button
                  onClick={() => handleCopy('curl', curlExample)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  {copiedCode === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>Copy cURL</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed p-2">
                {curlExample}
              </pre>
            </div>
          )}

          {/* 3. PYTHON TAB */}
          {activeCodeTab === 'python' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-emerald-400 font-bold text-sm block">Python Gateway Bridge</span>
                  <span className="text-[11px] text-slate-400">Reads serial/USB and posts JSON to MRSMS endpoint</span>
                </div>
                <button
                  onClick={() => handleCopy('python', pythonExample)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  {copiedCode === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>Copy Python</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed p-2 max-h-[380px]">
                {pythonExample}
              </pre>
            </div>
          )}

          {/* 4. ESP32 TAB */}
          {activeCodeTab === 'esp32' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-teal-400 font-bold text-sm block">ESP32 / Arduino LoRa SX1276 C++</span>
                  <span className="text-[11px] text-slate-400">Subsurface transceivers transmitting packets over 915MHz</span>
                </div>
                <button
                  onClick={() => handleCopy('esp32', esp32Example)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  {copiedCode === 'esp32' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-teal-400" />}
                  <span>Copy ESP32 C++</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed p-2 max-h-[380px]">
                {esp32Example}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
