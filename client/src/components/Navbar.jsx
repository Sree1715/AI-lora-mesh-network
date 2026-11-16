import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Volume2, VolumeX, AlertTriangle, 
  Activity, Clock, HardHat, Bell,
  BarChart3, Eye, Wind
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
  setActiveTab,
  sosTriggered
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'cave3d', label: '3D Cave Disaster', icon: Eye },
    { id: 'analytics', label: 'Predictions & Trends', icon: BarChart3 },
    { id: 'gassensing', label: 'Gas Sensing', icon: Wind },
    { id: 'alerts', label: 'Incident Protocol', icon: Bell, badge: activeAlertsCount },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b101b]/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      {evacuation.is_active && (
        <div className="bg-red-600 px-4 py-2 flex items-center justify-between text-white font-bold animate-pulse text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-spin" />
            <span className="uppercase tracking-wider">MINE EVACUATION ORDER ACTIVE — ALL PERSONNEL EVACUATE NOW</span>
          </div>
          <button onClick={onOpenSOS} className="bg-black/40 hover:bg-black/60 px-2 py-0.5 rounded border border-white/30 text-white text-xs">
            Evacuation Console →
          </button>
        </div>
      )}

      <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg border border-amber-400/40">
            <HardHat className="w-6 h-6 text-black stroke-[2.5]" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0b101b] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-slate-100 flex items-center gap-2">
              MRSMS
              <span className="text-amber-400 font-light text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                MINE RESCUE SYSTEM
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Gas Leak Detection & Disaster Management · Shaft Complex #4</p>
          </div>
        </div>

        {/* Clock */}
        <div className="hidden lg:flex items-center gap-2 bg-[#121929] border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-200 font-bold">{time.toISOString().substring(11,19)} UTC</span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isAudioMuted 
                ? 'bg-slate-800 border-slate-700 text-slate-400' 
                : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            <span className="hidden sm:inline font-mono">{isAudioMuted ? 'MUTED' : 'ALARM ON'}</span>
          </button>

          <button
            onClick={onOpenSOS}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs tracking-wider uppercase transition-all shadow-lg ${
              sosTriggered || evacuation.is_active
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-500/40'
                : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border border-red-500/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{sosTriggered ? 'SOS ACTIVE!' : evacuation.is_active ? 'EVACUATION ON' : 'EMERGENCY SOS'}</span>
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
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
                    ? 'bg-blue-600/20 text-cyan-300 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1.5 px-1.5 rounded-full text-[10px] font-mono bg-red-500 text-white font-bold animate-pulse">
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
