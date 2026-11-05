import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Radio, Volume2, VolumeX, AlertTriangle, 
  Activity, Clock, Layers, HardHat, Settings, Bell,
  BarChart3, MapPin, Cpu, CheckCircle2
} from 'lucide-react';

export default function Navbar({ 
  connectionStatus, 
  nodes, 
  selectedNodeId, 
  onSelectNode, 
  activeAlertsCount,
  isAudioMuted,
  onToggleMute,
  evacuation,
  onOpenSOS,
  activeTab,
  setActiveTab
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUTC = (d) => {
    return d.toISOString().substring(11, 19) + ' UTC';
  };

  const formatShift = (d) => {
    const hours = d.getUTCHours();
    const shift = hours >= 6 && hours < 14 ? 'SHIFT A (Morning)' : hours >= 14 && hours < 22 ? 'SHIFT B (Swing)' : 'SHIFT C (Graveyard)';
    return shift;
  };

  const navItems = [
    { id: 'dashboard', label: 'Live Telemetry', icon: Activity },
    { id: 'analytics', label: 'Predictions & Trends', icon: BarChart3 },
    { id: 'map', label: 'Mine Sectors & Map', icon: MapPin },
    { id: 'lora', label: 'LoRa Network Mesh', icon: Radio },
    { id: 'alerts', label: 'Incident Protocol', icon: Bell, badge: activeAlertsCount },
    { id: 'hardware', label: 'Gateway & Simulator', icon: Cpu }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b101b]/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      {/* Top Banner if Emergency Evacuation is Active */}
      {evacuation.is_active && (
        <div className="bg-red-600 px-4 py-2 flex items-center justify-between text-white font-bold animate-pulse text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-spin" />
            <span className="font-industrial tracking-wider uppercase">
              GENERAL MINE EVACUATION ORDER IN EFFECT — ALL PERSONNEL REPORT TO SURFACE OR REFUGE STATIONS
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>INITIATED BY: {evacuation.initiated_by}</span>
            <button 
              onClick={onOpenSOS}
              className="bg-black/40 hover:bg-black/60 px-2 py-0.5 rounded border border-white/30 text-white"
            >
              Evacuation Console &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main Header Strip */}
      <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Station Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 border border-amber-400/40">
            <HardHat className="w-6 h-6 text-black stroke-[2.5]" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0b101b] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-industrial tracking-wider text-slate-100 flex items-center gap-2">
                <span>MRSMS</span>
                <span className="text-amber-400 font-light text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  SURFACE CONTROL STATION
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>MINE RESCUE & SAFETY TELEMETRY</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400">SHAFT COMPLEX #4</span>
            </p>
          </div>
        </div>

        {/* Center: Node Selector & Station Clocks */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Active Node Dropdown */}
          <div className="flex items-center gap-2 bg-[#121929] border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-inner">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium text-[11px]">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              TELEMETRY NODE:
            </span>
            <select
              value={selectedNodeId}
              onChange={(e) => onSelectNode(e.target.value)}
              className="bg-transparent text-amber-300 font-mono font-bold focus:outline-none cursor-pointer pr-1"
            >
              {nodes.map(n => (
                <option key={n.node_id} value={n.node_id} className="bg-slate-900 text-slate-100">
                  {n.node_id} — {n.sector_name.split('-')[0]} ({n.elevation_m}m)
                </option>
              ))}
            </select>
          </div>

          {/* Time & Shift Readout */}
          <div className="hidden lg:flex items-center gap-3 bg-[#121929] border border-slate-700/80 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex items-center gap-2">
              <span className="text-slate-200 font-bold">{formatUTC(time)}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-[11px]">{formatShift(time)}</span>
            </div>
          </div>

          {/* LoRa Connection Pulse */}
          <div className="flex items-center gap-2 bg-[#121929] border border-slate-700/80 px-3 py-1.5 rounded-lg">
            <Radio className={`w-3.5 h-3.5 ${connectionStatus === 'CONNECTED' ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
            <span className="text-[11px] font-mono">
              {connectionStatus === 'CONNECTED' ? (
                <span className="text-emerald-400 font-semibold">LoRa MESH ONLINE</span>
              ) : connectionStatus === 'RECONNECTING' ? (
                <span className="text-amber-400 font-semibold">RECONNECTING...</span>
              ) : (
                <span className="text-red-400 font-semibold">GATEWAY OFFLINE</span>
              )}
            </span>
          </div>
        </div>

        {/* Right: Audio Control & SOS Button */}
        <div className="flex items-center gap-3">
          {/* Audio Alarm Toggle */}
          <button
            onClick={onToggleMute}
            title={isAudioMuted ? "Audio Alarms Muted (Click to Unmute)" : "Audio Alarms Active (Click to Mute)"}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isAudioMuted 
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' 
                : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />}
            <span className="hidden sm:inline font-mono">{isAudioMuted ? 'AUDIO MUTED' : 'SIREN READY'}</span>
          </button>

          {/* Emergency SOS Evacuation Trigger */}
          <button
            onClick={onOpenSOS}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-industrial font-bold text-xs tracking-wider uppercase transition-all shadow-lg ${
              evacuation.is_active
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-500/30'
                : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-900/40 border border-red-500/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{evacuation.is_active ? 'EVACUATION ACTIVE' : 'EMERGENCY SOS'}</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="bg-[#0e1524] border-t border-slate-800/80 px-4">
        <div className="max-w-[1920px] mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-cyan-300 border-b-2 border-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-500 text-white font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

