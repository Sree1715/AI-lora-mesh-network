import React from 'react';
import { 
  MapPin, Layers, Radio, HardHat, ShieldCheck, 
  ShieldAlert, AlertTriangle, Wind, Info, Compass 
} from 'lucide-react';

export default function SubsurfaceMap({ nodes, allLatest, selectedNodeId, onSelectNode, rescueTeams }) {
  const getNodeColor = (nodeId) => {
    const data = allLatest[nodeId];
    if (!data) return '#10b981';
    if (data.distance_cm < 100 || data.ch4_ppm >= 10000 || data.co_ppm >= 100 || data.o2_percent <= 16) {
      return '#ef4444'; // Red hazard
    }
    if (data.distance_cm < 180 || data.ch4_ppm >= 5000 || data.co_ppm >= 35 || data.o2_percent <= 19.5) {
      return '#f59e0b'; // Amber caution
    }
    return '#10b981'; // Green safe
  };

  return (
    <div className="space-y-4">
      <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-industrial text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>Subsurface Mine Cross-Section & Tactical Spatial Map</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Elevation schematic of shaft complexes, LoRa transceivers, rescue team positions, and air currents
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Normal Sector
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Caution Convergence
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span> Hazard Zone
            </span>
          </div>
        </div>

        {/* Interactive Schematic Diagram (SVG) */}
        <div className="relative w-full h-[480px] bg-[#070b13] border border-slate-800/80 rounded-xl overflow-hidden my-3 p-4">
          <svg viewBox="0 0 1000 500" className="w-full h-full">
            {/* Background Strata Lines */}
            <path d="M 0 100 Q 300 110, 600 95 T 1000 105" stroke="#1e293b" strokeWidth="1" fill="none" />
            <path d="M 0 220 Q 250 240, 550 210 T 1000 230" stroke="#1e293b" strokeWidth="1" fill="none" />
            <path d="M 0 340 Q 350 360, 700 330 T 1000 350" stroke="#1e293b" strokeWidth="1" fill="none" />
            <path d="M 0 440 Q 400 450, 750 435 T 1000 445" stroke="#1e293b" strokeWidth="1" fill="none" />

            {/* Surface Ground Elevation & Headframe */}
            <rect x="0" y="0" width="1000" height="60" fill="#0d1424" />
            <line x1="0" y1="60" x2="1000" y2="60" stroke="#334155" strokeWidth="3" />
            <text x="20" y="38" fill="#94a3b8" fontSize="12" fontFamily="monospace" fontWeight="bold">
              SURFACE LEVEL (0m) — SURFACE CONTROL COMMAND & GATEWAY GW-SURFACE-01
            </text>

            {/* Surface Hoist Tower / Headframe Graphic */}
            <polygon points="140,60 170,10 190,10 220,60" fill="none" stroke="#64748b" strokeWidth="3" />
            <circle cx="180" cy="15" r="10" stroke="#f59e0b" strokeWidth="2" fill="none" />
            <circle cx="180" cy="15" r="3" fill="#f59e0b" />

            {/* Main Vertical Production Hoist Shaft */}
            <rect x="165" y="60" width="30" height="420" fill="#0b111e" stroke="#334155" strokeWidth="2" strokeDasharray="6 4" />
            <text x="110" y="280" fill="#64748b" fontSize="10" fontFamily="monospace" transform="rotate(-90 110 280)">
              MAIN HOIST SHAFT (VERT)
            </text>

            {/* Ventilation Airflow Path (Animated dashed cyan stroke) */}
            <path 
              d="M 180 60 L 180 180 L 450 180 L 450 300 L 780 300 L 780 420 L 300 420" 
              fill="none" 
              stroke="#06b6d4" 
              strokeWidth="2" 
              strokeDasharray="8 6" 
              opacity="0.6"
            />

            {/* Level 1 Drift: North Incline Shaft (-180m) */}
            <g 
              className="cursor-pointer group"
              onClick={() => onSelectNode('NODE-03')}
            >
              <rect 
                x="195" y="165" width="450" height="30" 
                fill={selectedNodeId === 'NODE-03' ? '#1e293b' : '#111827'} 
                stroke={getNodeColor('NODE-03')} 
                strokeWidth={selectedNodeId === 'NODE-03' ? '2.5' : '1.5'} 
                rx="4"
              />
              <text x="210" y="184" fill="#f8fafc" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                LEVEL 1 (-180m): Sector 7 North Incline Shaft Airway
              </text>
              {/* Node 03 Marker */}
              <circle cx="580" cy="180" r="12" fill={getNodeColor('NODE-03')} fillOpacity="0.3" stroke={getNodeColor('NODE-03')} strokeWidth="2" />
              <circle cx="580" cy="180" r="5" fill={getNodeColor('NODE-03')} />
              <text x="600" y="184" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">NODE-03</text>
            </g>

            {/* Level 2 Drift: Level 300 Deep Drift (-300m) */}
            <g 
              className="cursor-pointer group"
              onClick={() => onSelectNode('NODE-02')}
            >
              <rect 
                x="195" y="285" width="580" height="30" 
                fill={selectedNodeId === 'NODE-02' ? '#1e293b' : '#111827'} 
                stroke={getNodeColor('NODE-02')} 
                strokeWidth={selectedNodeId === 'NODE-02' ? '2.5' : '1.5'} 
                rx="4"
              />
              <text x="210" y="304" fill="#f8fafc" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                LEVEL 2 (-300m): Sector 2 Deep Drift Level 300 Crosscut
              </text>
              {/* Node 02 Marker */}
              <circle cx="480" cy="300" r="12" fill={getNodeColor('NODE-02')} fillOpacity="0.3" stroke={getNodeColor('NODE-02')} strokeWidth="2" />
              <circle cx="480" cy="300" r="5" fill={getNodeColor('NODE-02')} />
              <text x="500" y="304" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">NODE-02</text>
              
              {/* Team Bravo Pin */}
              <g transform="translate(680, 288)">
                <rect x="0" y="0" width="80" height="24" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="6" y="16" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">BRAVO (4)</text>
              </g>
            </g>

            {/* Level 3 Drift: East Refuge Chamber (-350m) */}
            <g 
              className="cursor-pointer group"
              onClick={() => onSelectNode('NODE-04')}
            >
              <rect 
                x="195" y="345" width="380" height="35" 
                fill={selectedNodeId === 'NODE-04' ? '#1e293b' : '#111827'} 
                stroke={getNodeColor('NODE-04')} 
                strokeWidth={selectedNodeId === 'NODE-04' ? '2.5' : '1.5'} 
                rx="4"
              />
              {/* Safe Chamber Room Graphic */}
              <rect x="520" y="340" width="80" height="45" fill="#065f46" stroke="#10b981" strokeWidth="2" rx="6" />
              <text x="530" y="367" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="bold">REFUGE</text>
              <text x="210" y="367" fill="#f8fafc" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                LEVEL 3 (-350m): Sector 5 East Safe Refuge Station
              </text>
              
              {/* Node 04 Marker */}
              <circle cx="460" cy="362" r="12" fill={getNodeColor('NODE-04')} fillOpacity="0.3" stroke={getNodeColor('NODE-04')} strokeWidth="2" />
              <circle cx="460" cy="362" r="5" fill={getNodeColor('NODE-04')} />
              <text x="475" y="356" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">NODE-04</text>

              {/* Team Charlie Pin */}
              <g transform="translate(350, 350)">
                <rect x="0" y="0" width="85" height="24" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
                <text x="6" y="16" fill="#06b6d4" fontSize="10" fontFamily="monospace" fontWeight="bold">CHARLIE (3)</text>
              </g>
            </g>

            {/* Level 4 Drift: Sector 4 Extraction Stope Sub-B (-420m - Primary Deep Workings) */}
            <g 
              className="cursor-pointer group"
              onClick={() => onSelectNode('NODE-01')}
            >
              <rect 
                x="195" y="405" width="720" height="35" 
                fill={selectedNodeId === 'NODE-01' ? '#1e293b' : '#111827'} 
                stroke={getNodeColor('NODE-01')} 
                strokeWidth={selectedNodeId === 'NODE-01' ? '2.5' : '1.5'} 
                rx="4"
              />
              <text x="210" y="427" fill="#f8fafc" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                LEVEL 4 (-420m): Sector 4 Sub-level B Active Extraction Stope (PRIMARY DEEP ZONE)
              </text>

              {/* Cave-in visualization if distance_cm < 100 */}
              {(allLatest['NODE-01']?.distance_cm < 100) && (
                <g transform="translate(680, 400)">
                  <polygon points="0,0 20,-15 40,0 60,-10 80,0 60,35 15,35" fill="#ef4444" opacity="0.6" />
                  <text x="10" y="25" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">CAVE-IN</text>
                </g>
              )}

              {/* Node 01 Marker */}
              <circle cx="620" cy="422" r="14" fill={getNodeColor('NODE-01')} fillOpacity="0.3" stroke={getNodeColor('NODE-01')} strokeWidth="2.5" />
              <circle cx="620" cy="422" r="6" fill={getNodeColor('NODE-01')} />
              <text x="640" y="426" fill="#f8fafc" fontSize="11" fontFamily="monospace" fontWeight="bold">NODE-01 (Active)</text>

              {/* Team Alpha Pin */}
              <g transform="translate(750, 410)">
                <rect x="0" y="0" width="80" height="24" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
                <text x="6" y="16" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">ALPHA (5)</text>
              </g>
            </g>

            {/* Depth Markers on Right Edge */}
            <line x1="940" y1="60" x2="940" y2="450" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="950" y="65" fill="#64748b" fontSize="10" fontFamily="monospace">0m</text>
            <text x="950" y="185" fill="#64748b" fontSize="10" fontFamily="monospace">-180m</text>
            <text x="950" y="305" fill="#64748b" fontSize="10" fontFamily="monospace">-300m</text>
            <text x="950" y="365" fill="#64748b" fontSize="10" fontFamily="monospace">-350m</text>
            <text x="950" y="425" fill="#64748b" fontSize="10" fontFamily="monospace">-420m</text>
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
          <span>* Click on any drift tunnel or node marker to immediately switch live telemetry dashboard</span>
          <span className="text-cyan-400">Ventilation Velocity: 3.2 m/s North Incline Flow</span>
        </div>
      </div>
    </div>
  );
}

