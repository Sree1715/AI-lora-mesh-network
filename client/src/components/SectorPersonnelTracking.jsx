import React, { useState } from 'react';
import { 
  Users, HardHat, Heart, ShieldAlert, ShieldCheck, 
  Radio, AlertTriangle, Compass, MapPin, Activity, CheckCircle2 
} from 'lucide-react';

export default function SectorPersonnelTracking({ rescueTeams, allLatest, nodes, onSelectNode }) {
  const [teams, setTeams] = useState(rescueTeams || []);

  const toggleDistress = (teamId) => {
    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        return { ...t, distress_beacon: !t.distress_beacon };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-4">
      {/* Rescue Teams Operations Overview */}
      <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-industrial text-base font-bold text-slate-100 uppercase tracking-wider">
                Subterranean Mine Rescue Teams & Personnel
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Active tactical deployment, SCBA oxygen reserves, and crew bio-telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Total Active Teams: <strong className="text-amber-400">{teams.length}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Total Operatives: <strong className="text-cyan-400">{teams.reduce((acc, t) => acc + t.personnel_count, 0)}</strong>
            </span>
          </div>
        </div>

        {/* Rescue Team Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {teams.map(team => {
            const hasDistress = team.distress_beacon;

            return (
              <div 
                key={team.id}
                className={`p-4 rounded-xl border transition-all ${
                  hasDistress 
                    ? 'bg-red-950/40 border-red-500 animate-alarm-red' 
                    : 'bg-[#0f172a]/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Team Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${hasDistress ? 'bg-red-500 text-white' : 'bg-slate-800 text-cyan-400'}`}>
                      <HardHat className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-industrial text-sm font-bold text-slate-100">{team.name}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">{team.lead}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    hasDistress 
                      ? 'bg-red-500 text-white border-red-400 animate-pulse'
                      : team.status === 'OPERATIONAL'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : team.status === 'SHORING_TUNNEL'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  }`}>
                    {hasDistress ? 'DISTRESS SOS' : team.status}
                  </span>
                </div>

                {/* Team Biometrics & Equipment */}
                <div className="mt-3 space-y-2 text-xs font-mono border-t border-slate-800/80 pt-2.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Deployed Sector:</span>
                    <strong className="text-cyan-300">{team.sector_name}</strong>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Crew Complement:</span>
                    <strong className="text-slate-200">{team.personnel_count} Specialists</strong>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>SCBA Respirator Oxygen:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className={`h-full rounded-full ${team.scba_oxygen_level < 85 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${team.scba_oxygen_level}%` }}
                        ></div>
                      </div>
                      <strong className={team.scba_oxygen_level < 85 ? 'text-amber-400' : 'text-emerald-400'}>
                        {team.scba_oxygen_level}%
                      </strong>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Crew Avg Pulse:</span>
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <strong className="text-slate-200">{team.avg_heart_rate} bpm</strong>
                    </div>
                  </div>
                </div>

                {/* Distress Beacon Button */}
                <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Beacon: {hasDistress ? 'EMITTING MAYDAY' : 'NORMAL STANDBY'}
                  </span>
                  <button
                    onClick={() => toggleDistress(team.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                      hasDistress
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                        : 'bg-red-900/30 hover:bg-red-800/50 text-red-400 border border-red-800/60'
                    }`}
                  >
                    {hasDistress ? 'Clear Distress' : 'Trigger Distress SOS'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sector Safety Status Breakdown */}
      <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl">
        <h3 className="font-industrial text-sm font-bold text-slate-100 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Active Mine Sector Tunnel Safety Indexes</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {nodes.map(node => {
            const data = allLatest[node.node_id] || {};
            const index = data.safety_index !== undefined ? data.safety_index : 98;
            
            return (
              <div 
                key={node.node_id}
                onClick={() => onSelectNode(node.node_id)}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">{node.sector_id}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    index < 40 ? 'bg-red-500/20 text-red-400 border-red-500' :
                    index < 70 ? 'bg-amber-500/20 text-amber-400 border-amber-500' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                  }`}>
                    {index < 40 ? 'HAZARD' : index < 70 ? 'CAUTION' : 'SAFE'}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-200 mt-1 line-clamp-1">{node.sector_name}</h4>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">SAFETY INDEX</span>
                  <span className={`text-lg font-bold font-telemetry ${index < 40 ? 'text-red-400' : index < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {index}/100
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full ${index < 40 ? 'bg-red-500' : index < 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${index}%` }}
                  ></div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Clearance: {data.distance_cm || '---'}cm</span>
                  <span>CH4: {data.ch4_ppm || '---'}ppm</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

