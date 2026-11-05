import React from 'react';
import { Gauge, ShieldCheck, Ruler, Flame, AlertOctagon, Wind } from 'lucide-react';

/**
 * Semi-Circular SVG Radial Gauge with Danger Zones & Needle Indicator
 */
function RadialGaugeMeter({
  title,
  subtitle,
  icon: Icon,
  value,
  unit,
  min = 0,
  max = 100,
  zones = [], // Array of { from, to, color, label }
  formatValue = (v) => v,
  inverse = false // If true, lower is better (e.g. gas)
}) {
  // Semi-circle from -180 deg (left) to 0 deg (right)
  const clampedVal = Math.max(min, Math.min(max, value !== undefined && value !== null ? value : min));
  const fraction = (clampedVal - min) / (max - min || 1);
  const angleDeg = -180 + fraction * 180; // -180 to 0

  const radius = 70;
  const strokeWidth = 12;
  const cx = 100;
  const cy = 90;

  // Function to compute arc path between two fractions [0, 1]
  const describeArc = (startFraction, endFraction) => {
    const startAngle = -Math.PI + startFraction * Math.PI;
    const endAngle = -Math.PI + endFraction * Math.PI;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArcFlag = endFraction - startFraction > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  // Needle tip coordinates
  const needleLength = 58;
  const radAngle = (angleDeg * Math.PI) / 180;
  const needleX = cx + needleLength * Math.cos(radAngle);
  const needleY = cy + needleLength * Math.sin(radAngle);

  // Find active zone
  const currentZone = zones.find(z => clampedVal >= z.from && clampedVal <= z.to) || zones[zones.length - 1];

  return (
    <div className="carbon-panel rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between items-center text-center relative shadow-lg">
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-300">
          {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
          <span className="font-industrial text-xs font-bold tracking-wider uppercase text-slate-200">
            {title}
          </span>
        </div>
        {currentZone && (
          <span 
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border"
            style={{ 
              borderColor: `${currentZone.color}60`, 
              backgroundColor: `${currentZone.color}20`,
              color: currentZone.color
            }}
          >
            {currentZone.label}
          </span>
        )}
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-48 h-28 my-1 flex items-center justify-center">
        <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible">
          {/* Background Track Arc */}
          <path
            d={describeArc(0, 1)}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Color Arc Zones */}
          {zones.map((zone, idx) => {
            const startFrac = Math.max(0, Math.min(1, (zone.from - min) / (max - min)));
            const endFrac = Math.max(0, Math.min(1, (zone.to - min) / (max - min)));
            if (endFrac <= startFrac) return null;
            return (
              <path
                key={idx}
                d={describeArc(startFrac, endFrac)}
                fill="none"
                stroke={zone.color}
                strokeWidth={strokeWidth - 2}
                opacity={0.85}
              />
            );
          })}

          {/* Needle Center Pivot & Pin */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#f8fafc"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
          <circle cx={cx} cy={cy} r="6" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
        </svg>

        {/* Digital Readout at Bottom Center of Gauge */}
        <div className="absolute bottom-0 text-center">
          <div className="text-xl font-bold font-telemetry text-white leading-none">
            {formatValue(clampedVal)}
            <span className="text-xs font-mono text-slate-400 ml-1">{unit}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{subtitle}</span>
        </div>
      </div>

      {/* Range Scale labels */}
      <div className="w-full flex justify-between px-2 text-[10px] font-mono text-slate-400 border-t border-slate-800/60 pt-1.5">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

export default function VisualGauges({ telemetry }) {
  if (!telemetry) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-industrial text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-cyan-400" />
          Real-Time Visual Radial Gauges & Danger Zones
        </h3>
        <span className="text-[10px] font-mono text-slate-500">CALIBRATED TO MSHA & OSHA TUNNEL SPECIFICATIONS</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Ultrasonic Clearance Gauge */}
        <RadialGaugeMeter
          title="Clearance"
          subtitle="Ceiling Distance"
          icon={Ruler}
          value={telemetry.distance_cm}
          unit="cm"
          min={0}
          max={300}
          zones={[
            { from: 0, to: 100, color: '#ef4444', label: 'CRITICAL HAZARD' },
            { from: 100, to: 180, color: '#f59e0b', label: 'CAUTION ZONE' },
            { from: 180, to: 300, color: '#10b981', label: 'SAFE CLEARANCE' }
          ]}
          formatValue={(v) => Number(v).toFixed(1)}
        />

        {/* 2. Methane CH4 Gauge */}
        <RadialGaugeMeter
          title="Methane (CH4)"
          subtitle="Lower Explosive Limit"
          icon={Flame}
          value={telemetry.ch4_ppm}
          unit="ppm"
          min={0}
          max={20000}
          zones={[
            { from: 0, to: 5000, color: '#10b981', label: '<10% LEL SAFE' },
            { from: 5000, to: 10000, color: '#f59e0b', label: '10-20% CAUTION' },
            { from: 10000, to: 20000, color: '#ef4444', label: '>20% EXPLOSION RISK' }
          ]}
          formatValue={(v) => Math.round(v).toLocaleString()}
        />

        {/* 3. Carbon Monoxide CO Gauge */}
        <RadialGaugeMeter
          title="Carbon Monoxide"
          subtitle="Combustion Byproduct"
          icon={AlertOctagon}
          value={telemetry.co_ppm}
          unit="ppm"
          min={0}
          max={200}
          zones={[
            { from: 0, to: 35, color: '#10b981', label: '<35 SAFE' },
            { from: 35, to: 100, color: '#f59e0b', label: '35-100 CAUTION' },
            { from: 100, to: 200, color: '#ef4444', label: '>100 TOXIC' }
          ]}
          formatValue={(v) => Number(v).toFixed(1)}
        />

        {/* 4. Oxygen O2 Gauge */}
        <RadialGaugeMeter
          title="Oxygen (O2)"
          subtitle="Atmosphere Level"
          icon={Wind}
          value={telemetry.o2_percent}
          unit="%"
          min={12}
          max={25}
          zones={[
            { from: 12, to: 16.0, color: '#ef4444', label: '<16% ASPHYXIA' },
            { from: 16.0, to: 19.5, color: '#f59e0b', label: '16-19.5% DEFICIENT' },
            { from: 19.5, to: 23.5, color: '#10b981', label: '19.5-23.5% SAFE' },
            { from: 23.5, to: 25.0, color: '#06b6d4', label: '>23.5% ENRICHED' }
          ]}
          formatValue={(v) => Number(v).toFixed(2)}
        />

        {/* 5. Safety Index Gauge */}
        <RadialGaugeMeter
          title="Safety Index"
          subtitle="Tunnel Integrity"
          icon={ShieldCheck}
          value={telemetry.safety_index}
          unit="pts"
          min={0}
          max={100}
          zones={[
            { from: 0, to: 40, color: '#ef4444', label: 'DANGER' },
            { from: 40, to: 70, color: '#f59e0b', label: 'WARNING' },
            { from: 70, to: 100, color: '#10b981', label: 'SECURE' }
          ]}
          formatValue={(v) => Math.round(v)}
        />
      </div>
    </div>
  );
}

