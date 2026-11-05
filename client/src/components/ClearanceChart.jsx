import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, ReferenceLine, CartesianGrid 
} from 'recharts';
import { Ruler, AlertTriangle, Clock, RefreshCw, ZoomIn } from 'lucide-react';

export default function ClearanceChart({ history, currentDistance, predictions }) {
  const [windowPeriod, setWindowPeriod] = useState('15m'); // 60s, 15m, 1h, shift

  // Filter history based on selected time window
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    const now = Date.now();
    let limitMs = 15 * 60 * 1000;
    if (windowPeriod === '60s') limitMs = 60 * 1000;
    else if (windowPeriod === '15m') limitMs = 15 * 60 * 1000;
    else if (windowPeriod === '1h') limitMs = 60 * 60 * 1000;
    else if (windowPeriod === 'shift') limitMs = 8 * 60 * 60 * 1000;

    const filtered = history.filter(item => {
      const t = new Date(item.timestamp).getTime();
      return (now - t) <= limitMs;
    });

    return filtered.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      distance: item.distance_cm,
      timestamp: item.timestamp
    }));
  }, [history, windowPeriod]);

  // Compute Stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0, avg: 0, delta: 0 };
    const vals = chartData.map(d => d.distance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const delta = vals[vals.length - 1] - vals[0];
    return {
      min: min.toFixed(1),
      max: max.toFixed(1),
      avg: avg.toFixed(1),
      delta: delta.toFixed(1)
    };
  }, [chartData]);

  // Detect sudden rapid convergence
  const suddenDrop = useMemo(() => {
    if (chartData.length < 5) return false;
    const recent = chartData.slice(-6);
    const diff = recent[0].distance - recent[recent.length - 1].distance;
    return diff > 25; // Dropped more than 25 cm rapidly
  }, [chartData]);

  return (
    <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between">
      {/* Header with Title & Interval Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-cyan-400 border border-cyan-500/20">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-industrial text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>Ultrasonic Clearance Trend Stream</span>
              {suddenDrop && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500 animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> RAPID CONVERGENCE DETECTED
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">Tunnel clearance shifts and obstacle encroachment (cm)</p>
          </div>
        </div>

        {/* Viewing Window Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
          {[
            { id: '60s', label: '60s' },
            { id: '15m', label: '15m' },
            { id: '1h', label: '1h' },
            { id: 'shift', label: '8h Shift' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setWindowPeriod(opt.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                windowPeriod === opt.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 text-xs font-mono">
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block">CURRENT</span>
          <span className={`text-base font-bold font-telemetry ${currentDistance < 100 ? 'text-red-400' : currentDistance < 180 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {currentDistance !== undefined ? `${currentDistance} cm` : '---'}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block">MINIMUM DIP</span>
          <span className={`text-base font-bold font-telemetry ${stats.min < 100 ? 'text-red-400' : 'text-slate-200'}`}>
            {stats.min} cm
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block">MAXIMUM CLEARANCE</span>
          <span className="text-base font-bold font-telemetry text-slate-200">
            {stats.max} cm
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block">NET PERIOD DELTA</span>
          <span className={`text-base font-bold font-telemetry ${Number(stats.delta) < -10 ? 'text-red-400' : 'text-slate-300'}`}>
            {Number(stats.delta) > 0 ? `+${stats.delta}` : stats.delta} cm
          </span>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="w-full h-64 md:h-72 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="clearanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              domain={[0, 320]} 
              tickLine={false}
              tickFormatter={(v) => `${v}cm`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/50 p-2.5 rounded-lg shadow-xl font-mono text-xs">
                      <div className="text-slate-400 text-[10px] mb-1">{data.time}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">Clearance:</span>
                        <span className="text-white font-telemetry font-bold text-sm">{data.distance} cm</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Status: {data.distance < 100 ? '🚨 CRITICAL HAZARD' : data.distance < 180 ? '⚠️ CAUTION' : '✅ SAFE'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Caution Threshold Line (180 cm) */}
            <ReferenceLine 
              y={180} 
              stroke="#f59e0b" 
              strokeDasharray="4 4" 
              label={{ value: 'Caution (180cm)', fill: '#f59e0b', fontSize: 10, position: 'right' }} 
            />

            {/* Critical Collapse Hazard Threshold Line (100 cm) */}
            <ReferenceLine 
              y={100} 
              stroke="#ef4444" 
              strokeWidth={1.5}
              strokeDasharray="3 3" 
              label={{ value: 'Collapse Hazard (100cm)', fill: '#ef4444', fontSize: 10, position: 'right' }} 
            />

            <Area 
              type="monotone" 
              dataKey="distance" 
              stroke="#06b6d4" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#clearanceGradient)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Threshold Explanation */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Live Telemetry
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-0.5 bg-amber-400"></span> Convergence Limit (180cm)
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-0.5 bg-red-400"></span> Impending Cave-in (100cm)
          </span>
        </div>
        <div className="text-slate-500">
          Telemetry rate: 1.2s • LoRa SF7
        </div>
      </div>
    </div>
  );
}

