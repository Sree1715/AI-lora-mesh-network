import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GasPredictionChart from './components/GasPredictionChart';
import ClearanceChart from './components/ClearanceChart';
import VisualGauges from './components/VisualGauges';
import TelemetryGrid from './components/TelemetryGrid';
import AlertLog from './components/AlertLog';
import EmergencySOSModal from './components/EmergencySOSModal';
import CaveDisaster3D from './components/CaveDisaster3D';
import { useLoRaWebSocket } from './hooks/useLoRaWebSocket';
import { soundEngine } from './utils/audioAlarm';

export default function App() {
  const [activeTab, setActiveTab] = useState('cave3d');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);

  const {
    connectionStatus,
    selectedNodeId,
    selectNode,
    nodes,
    telemetry,
    allLatest,
    history,
    predictions,
    rescueTeams,
    evacuation,
    alerts,
    isAudioMuted,
    setIsAudioMuted,
    audioVolume,
    setAudioVolume,
    acknowledgeAlert,
    resolveAlert,
    triggerEvacuation,
    cancelEvacuation,
  } = useLoRaWebSocket();

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalAlerts = alerts.filter(a => a.status === 'ACTIVE' && (a.severity === 'CRITICAL' || a.severity === 'EMERGENCY'));
  const selectedNode = nodes.find(n => n.node_id === selectedNodeId) || nodes[0];

  // Auto-trigger SOS siren when gas hits critical levels
  useEffect(() => {
    const ch4 = telemetry?.ch4_ppm || 0;
    const co = telemetry?.co_ppm || 0;
    const o2 = telemetry?.o2_percent || 21;
    const so2 = telemetry?.so2_ppm || 0;

    const isGasCritical = ch4 >= 10000 || co >= 100 || o2 <= 16.0 || so2 >= 20;

    if (isGasCritical && !isAudioMuted) {
      soundEngine.startAmbulanceSiren();
      setSosTriggered(true);
    } else if (!isGasCritical) {
      if (sosTriggered) {
        soundEngine.stopAlarm();
        setSosTriggered(false);
      }
    }
  }, [telemetry, isAudioMuted]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans bg-grid-pattern selection:bg-amber-500 selection:text-black">
      <Navbar
        connectionStatus={connectionStatus}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onSelectNode={selectNode}
        activeAlertsCount={activeAlertsCount}
        isAudioMuted={isAudioMuted}
        onToggleMute={() => setIsAudioMuted(!isAudioMuted)}
        evacuation={evacuation}
        onOpenSOS={() => setIsSOSOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sosTriggered={sosTriggered}
      />

      {/* Auto SOS Banner — fires when gas is critical */}
      {sosTriggered && (
        <div className="bg-red-600 border-b-2 border-red-400 px-4 py-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-bold text-white text-sm uppercase tracking-widest">CRITICAL GAS LEAK DETECTED — SOS ACTIVATED</div>
              <div className="text-red-100 text-xs font-mono">
                {criticalAlerts[0]?.title} • Location: {criticalAlerts[0]?.sector_name || selectedNode?.sector_name || 'Underground Sector'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-red-200">🔊 AMBULANCE SIREN ACTIVE</span>
            <button
              onClick={() => { soundEngine.stopAlarm(); setSosTriggered(false); }}
              className="px-3 py-1 rounded bg-black/40 border border-white/30 text-white text-xs font-bold hover:bg-black/60"
            >
              SILENCE ALARM
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className="px-3 py-1 rounded bg-white text-red-600 text-xs font-bold hover:bg-red-50"
            >
              View Incidents →
            </button>
          </div>
        </div>
      )}

      {/* Critical ticker for non-SOS active alerts */}
      {!sosTriggered && criticalAlerts.length > 0 && (
        <div className="bg-red-950/80 border-b border-red-500/80 px-4 py-2 flex items-center justify-between text-xs font-mono text-red-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0"></span>
            <span className="font-bold text-red-400 shrink-0">ACTIVE HAZARD:</span>
            <span className="truncate">{criticalAlerts[0].title} — {criticalAlerts[0].sector_name}</span>
          </div>
          <button onClick={() => setActiveTab('alerts')} className="shrink-0 px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold ml-3">
            Incidents ({criticalAlerts.length}) →
          </button>
        </div>
      )}

      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-4 md:p-6 space-y-5">

        {/* TAB 1: 3D CAVE DISASTER VIEW (DEFAULT HOME) */}
        {activeTab === 'cave3d' && (
          <div className="space-y-5">
            <CaveDisaster3D
              telemetry={telemetry}
              predictions={predictions}
              alerts={alerts}
              rescueTeams={rescueTeams}
              sosTriggered={sosTriggered}
              nodes={nodes}
            />
          </div>
        )}

        {/* TAB 2: PREDICTIONS & TRENDS */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <GasPredictionChart history={history} predictions={predictions} currentTelemetry={telemetry} />
            <ClearanceChart history={history} currentDistance={telemetry?.distance_cm} predictions={predictions} />
            <VisualGauges telemetry={telemetry} />
          </div>
        )}

        {/* TAB 3: GAS SENSING — CO, CH4, SO2, CO2 */}
        {activeTab === 'gassensing' && (
          <div className="space-y-5">
            {/* Gas Sensing Header */}
            <div className="bg-[#0c1322] border border-cyan-900/40 rounded-xl p-4">
              <h2 className="font-bold text-slate-100 uppercase tracking-wider text-sm mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Multi-Gas Environmental Monitoring
              </h2>
              <p className="text-xs text-slate-400 font-mono">Real-time sensor readings — Carbon Monoxide · Methane · Sulphur Dioxide · Carbon Dioxide · Oxygen</p>
            </div>
            <TelemetryGrid telemetry={telemetry} predictions={predictions} selectedNode={selectedNode} onSelectNode={selectNode} />
            <VisualGauges telemetry={telemetry} />
            <GasPredictionChart history={history} predictions={predictions} currentTelemetry={telemetry} />
          </div>
        )}

        {/* TAB 4: INCIDENT PROTOCOL — with leak locations */}
        {activeTab === 'alerts' && (
          <div className="space-y-5">
            {/* Active Gas Leak Location Panel */}
            {criticalAlerts.length > 0 && (
              <div className="bg-red-950/60 border border-red-500/60 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-red-400 uppercase tracking-wider text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  Active Gas Leak Locations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {criticalAlerts.map(a => (
                    <div key={a.id} className="bg-red-900/30 border border-red-500/40 rounded-lg p-3 font-mono text-xs space-y-1">
                      <div className="text-red-300 font-bold">{a.title}</div>
                      <div className="text-slate-300">📍 Location: <strong className="text-white">{a.sector_name || 'Unknown Sector'}</strong></div>
                      <div className="text-slate-300">🔬 Node: <strong className="text-amber-300">{a.node_id}</strong></div>
                      <div className="text-slate-300">📊 Reading: <strong className="text-red-300">{a.message}</strong></div>
                      <div className="text-slate-500">🕐 {new Date(a.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <AlertLog alerts={alerts} onAcknowledge={acknowledgeAlert} onResolve={resolveAlert} />
          </div>
        )}
      </main>

      <EmergencySOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        evacuation={evacuation}
        onTriggerEvac={triggerEvacuation}
        onCancelEvac={cancelEvacuation}
        nodes={nodes}
      />

      <footer className="bg-[#070b13] border-t border-slate-800/80 px-4 py-2 text-[11px] font-mono text-slate-500">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            GAS MONITORING SYSTEM ONLINE
          </span>
          <span>CO · CH₄ · SO₂ · CO₂ · O₂ · OSHA/MSHA Title 30 Compliant · Mine Rescue Station #4</span>
        </div>
      </footer>
    </div>
  );
}
