import React, { useState } from 'react';
import Navbar from './components/Navbar';
import TelemetryGrid from './components/TelemetryGrid';
import VisualGauges from './components/VisualGauges';
import ClearanceChart from './components/ClearanceChart';
import GasPredictionChart from './components/GasPredictionChart';
import SectorPersonnelTracking from './components/SectorPersonnelTracking';
import SubsurfaceMap from './components/SubsurfaceMap';
import AlertLog from './components/AlertLog';
import EmergencySOSModal from './components/EmergencySOSModal';
import CaveDisaster3D from './components/CaveDisaster3D';
import { useLoRaWebSocket } from './hooks/useLoRaWebSocket';
import { soundEngine } from './utils/audioAlarm';
import { AlertTriangle, ShieldCheck, Activity, Bell, HardHat, Eye } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const {
    connectionStatus,
    selectedNodeId,
    selectNode,
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
    acknowledgeAlert,
    resolveAlert,
    triggerEvacuation,
    cancelEvacuation,
    toggleSimulator,
    setScenario,
    overrideSensor
  } = useLoRaWebSocket();

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalAlerts = alerts.filter(a => a.status === 'ACTIVE' && (a.severity === 'CRITICAL' || a.severity === 'EMERGENCY'));
  const selectedNode = nodes.find(n => n.node_id === selectedNodeId) || nodes[0];

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
      />

      {criticalAlerts.length > 0 && !evacuation.is_active && (
        <div className="bg-red-950/80 border-b border-red-500/80 px-4 py-2 flex items-center justify-between text-xs font-mono text-red-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0"></span>
            <span className="font-bold text-red-400 shrink-0">ACTIVE CRITICAL HAZARD:</span>
            <span className="truncate text-white">
              {criticalAlerts[0].title} — {criticalAlerts[0].message}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('alerts')}
            className="shrink-0 px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold ml-3 text-[11px]"
          >
            Review & Acknowledge ({criticalAlerts.length}) &rarr;
          </button>
        </div>
      )}

      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-4 md:p-6 space-y-5">

        {/* TAB 1: LIVE GAS MONITORING DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            <TelemetryGrid
              telemetry={telemetry}
              predictions={predictions}
              selectedNode={selectedNode}
              onSelectNode={selectNode}
            />
            <VisualGauges telemetry={telemetry} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ClearanceChart
                history={history}
                currentDistance={telemetry?.distance_cm}
                predictions={predictions}
              />
              <GasPredictionChart
                history={history}
                predictions={predictions}
                currentTelemetry={telemetry}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <SubsurfaceMap
                  nodes={nodes}
                  allLatest={allLatest}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={selectNode}
                  rescueTeams={rescueTeams}
                />
              </div>
              <div>
                <SectorPersonnelTracking
                  rescueTeams={rescueTeams}
                  allLatest={allLatest}
                  nodes={nodes}
                  onSelectNode={selectNode}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PREDICTIVE ANALYTICS & GAS TRENDS */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <GasPredictionChart
              history={history}
              predictions={predictions}
              currentTelemetry={telemetry}
            />
            <ClearanceChart
              history={history}
              currentDistance={telemetry?.distance_cm}
              predictions={predictions}
            />
            <VisualGauges telemetry={telemetry} />
          </div>
        )}

        {/* TAB 3: 3D CAVE DISASTER MANAGEMENT */}
        {activeTab === 'cave3d' && (
          <div className="space-y-5">
            <CaveDisaster3D
              telemetry={telemetry}
              predictions={predictions}
              alerts={alerts}
              rescueTeams={rescueTeams}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SubsurfaceMap
                nodes={nodes}
                allLatest={allLatest}
                selectedNodeId={selectedNodeId}
                onSelectNode={selectNode}
                rescueTeams={rescueTeams}
              />
              <SectorPersonnelTracking
                rescueTeams={rescueTeams}
                allLatest={allLatest}
                nodes={nodes}
                onSelectNode={selectNode}
              />
            </div>
          </div>
        )}

        {/* TAB 4: GAS SENSING — CO, Methane, SO2, CO2 */}
        {activeTab === 'gassensing' && (
          <div className="space-y-5">
            <div className="carbon-panel rounded-xl p-4 border border-slate-800">
              <h2 className="font-industrial text-sm font-bold text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Multi-Gas Environmental Monitoring — CO, CH₄, SO₂, CO₂
              </h2>
              <TelemetryGrid
                telemetry={telemetry}
                predictions={predictions}
                selectedNode={selectedNode}
                onSelectNode={selectNode}
              />
            </div>
            <GasPredictionChart
              history={history}
              predictions={predictions}
              currentTelemetry={telemetry}
            />
            <VisualGauges telemetry={telemetry} />
          </div>
        )}

        {/* TAB 5: INCIDENT PROTOCOL & ALERT LOG */}
        {activeTab === 'alerts' && (
          <div className="space-y-5">
            <AlertLog
              alerts={alerts}
              onAcknowledge={acknowledgeAlert}
              onResolve={resolveAlert}
            />
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
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              GAS MONITORING: ONLINE
            </span>
            <span>•</span>
            <span>OSHA / MSHA TITLE 30 COMPLIANT</span>
          </div>
          <div className="flex items-center gap-4">
            <span>CO • CH₄ • SO₂ • CO₂ • O₂ Sensing</span>
            <span>•</span>
            <span>Prediction Engine: Linear & Polynomial Diffusion</span>
            <span>•</span>
            <span className="text-cyan-400">Mine Rescue Station #4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
