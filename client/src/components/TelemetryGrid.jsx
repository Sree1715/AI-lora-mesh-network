import React from 'react';
import { 
  Ruler, Flame, Wind, AlertOctagon, TrendingUp, TrendingDown, 
  Minus, ShieldCheck, ShieldAlert, AlertTriangle, ArrowUpRight, 
  Battery, Radio, Gauge
} from 'lucide-react';

export default function TelemetryGrid({ telemetry, predictions, selectedNode, onSelectNode }) {
  if (!telemetry) {
    return (
      <div className="bg-[#101726] border border-slate-800 rounded-xl p-8 text-center text-slate-400 font-mono">
        <div className="inline-block animate-spin mb-3">
          <Radio className="w-8 h-8 text-cyan-400" />
        </div>
        <p>Awaiting LoRa node telemetry packet...</p>
      </div>
    );
  }

  const { distance_cm, ch4_ppm, ch4_lel_percent, co_ppm, o2_percent, rssi, snr, battery, safety_index } = telemetry;

  // 1. Ultrasonic Status Calculation
  let clearanceStatus = { text: 'CLEAR', color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', textCol: 'text-emerald-400' };
  if (distance_cm < 100) {
    clearanceStatus = { text: 'STRUCTURAL HAZARD', color: 'red', bg: 'bg-red-500/20 animate-pulse', border: 'border-red-500', textCol: 'text-red-400' };
  } else if (distance_cm < 180) {
    clearanceStatus = { text: 'CAUTION', color: 'amber', bg: 'bg-amber-500/15', border: 'border-amber-500/50', textCol: 'text-amber-400' };
  }

  // 2. CH4 Status Calculation
  let ch4Status = { text: 'SAFE', color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', textCol: 'text-emerald-400' };
  if (ch4_ppm >= 10000) {
    ch4Status = { text: 'CRITICAL (20% LEL)', color: 'red', bg: 'bg-red-500/20 animate-pulse', border: 'border-red-500', textCol: 'text-red-400' };
  } else if (ch4_ppm >= 5000) {
    ch4Status = { text: 'ELEVATED (10% LEL)', color: 'amber', bg: 'bg-amber-500/15', border: 'border-amber-500/50', textCol: 'text-amber-400' };
  }

  // 3. CO Status Calculation
  let coStatus = { text: 'NORMAL', color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', textCol: 'text-emerald-400' };
  if (co_ppm >= 100) {
    coStatus = { text: 'LETHAL CEILING', color: 'red', bg: 'bg-red-500/20 animate-pulse', border: 'border-red-500', textCol: 'text-red-400' };
  } else if (co_ppm >= 35) {
    coStatus = { text: 'CAUTION (>35 PPM)', color: 'amber', bg: 'bg-amber-500/15', border: 'border-amber-500/50', textCol: 'text-amber-400' };
  }

  // 4. O2 Status Calculation
  let o2Status = { text: 'OPTIMAL (20.9%)', color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', textCol: 'text-emerald-400' };
  if (o2_percent <= 16.0) {
    o2Status = { text: 'ASPHYXIATION RISK', color: 'red', bg: 'bg-red-500/20 animate-pulse', border: 'border-red-500', textCol: 'text-red-400' };
  } else if (o2_percent <= 19.5) {
    o2Status = { text: 'DEFICIENT (<19.5%)', color: 'amber', bg: 'bg-amber-500/15', border: 'border-amber-500/50', textCol: 'text-amber-400' };
  } else if (o2_percent > 23.5) {
    o2Status = { text: 'ENRICHED (>23.5%)', color: 'cyan', bg: 'bg-cyan-500/15', border: 'border-cyan-500/50', textCol: 'text-cyan-400' };
  }

  // Safety Index tier
  const score = safety_index !== undefined ? safety_index : 100;
  let safetyTier = { label: 'OPTIMAL SAFE', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (score < 40) {
    safetyTier = { label: 'CRITICAL HAZARD', color: 'text-red-400', badgeBg: 'bg-red-500/20 border-red-500' };
  } else if (score < 70) {
    safetyTier = { label: 'ELEVATED RISK', color: 'text-amber-400', badgeBg: 'bg-amber-500/15 border-amber-500/40' };
  } else if (score < 85) {
    safetyTier = { label: 'ACCEPTABLE', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/10 border-cyan-500/30' };
  }

  return (
    <div className="space-y-4">
      {/* Node Info & Location Banner */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <div>
            <span className="text-xs text-slate-400 font-mono">SELECTED UNDERGROUND NODE</span>
            <h2 className="text-sm md:text-base font-bold font-industrial text-slate-100 flex items-center gap-2">
              <span className="text-amber-400">{telemetry.node_id}</span>
              <span className="text-slate-500">|</span>
              <span>{selectedNode?.sector_name || 'Active Mining Sector'}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono border border-slate-700">
                Depth: {selectedNode?.elevation_m || -420}m
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>RSSI: <strong className="text-slate-100">{rssi} dBm</strong></span>
            <span className="text-slate-600">/</span>
            <span>SNR: <strong className="text-slate-100">{snr} dB</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>Battery: <strong className="text-slate-100">{battery}%</strong> ({telemetry.battery_volts || 4.1}V)</span>
          </div>

          <div className="text-[11px] text-slate-400">
            Packet #{telemetry.packet_id || '904'}
          </div>
        </div>
      </div>

      {/* Grid of Primary Sensor Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1. Ultrasonic Sensor Clearance */}
        <div className={`carbon-panel rounded-xl p-4 border transition-all duration-300 relative overflow-hidden ${
          clearanceStatus.text === 'STRUCTURAL HAZARD' ? 'animate-alarm-red' : clearanceStatus.border
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400 border border-cyan-500/20">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">ULTRASONIC CLEARANCE</span>
                <p className="text-xs text-slate-500 font-sans">Tunnel Ceiling & Obstacles</p>
              </div>
            </div>
            <span className={`text-[10px] font-industrial font-bold px-2 py-0.5 rounded border ${clearanceStatus.bg} ${clearanceStatus.border} ${clearanceStatus.textCol}`}>
              {clearanceStatus.text}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl lg:text-4xl font-bold font-telemetry tracking-tight text-white">
                {distance_cm}
              </span>
              <span className="text-sm font-mono text-slate-400">cm</span>
            </div>
            
            {/* Rate of rise/fall */}
            {predictions?.distance && (
              <div className="flex items-center gap-1 text-xs font-mono text-slate-400" title="Clearance rate of shift per minute">
                {predictions.distance.ratePerMin < -0.5 ? (
                  <TrendingDown className="w-4 h-4 text-red-400 animate-pulse" />
                ) : predictions.distance.ratePerMin > 0.5 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-500" />
                )}
                <span className={predictions.distance.ratePerMin < -0.5 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                  {predictions.distance.ratePerMin > 0 ? `+${predictions.distance.ratePerMin}` : predictions.distance.ratePerMin} cm/m
                </span>
              </div>
            )}
          </div>

          {/* Visual Clearance Depth Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>0 cm (Collapse)</span>
              <span>100 cm</span>
              <span>180 cm</span>
              <span>300 cm (Clear)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80 flex">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  distance_cm < 100 
                    ? 'bg-red-500 animate-pulse' 
                    : distance_cm < 180 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (distance_cm / 300) * 100))}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Cave-in Proximity:</span>
            <span className={distance_cm < 100 ? 'text-red-400 font-bold' : 'text-slate-200'}>
              {distance_cm < 100 ? 'IMMINENT HAZARD (<1.0m)' : distance_cm < 180 ? 'CONVERGENCE DETECTED' : 'NOMINAL CLEARANCE'}
            </span>
          </div>
        </div>

        {/* 2. Methane (CH4) Concentration */}
        <div className={`carbon-panel rounded-xl p-4 border transition-all duration-300 relative overflow-hidden ${
          ch4Status.text.includes('CRITICAL') ? 'animate-alarm-red' : ch4Status.border
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">METHANE (CH4)</span>
                <p className="text-xs text-slate-500 font-sans">Combustible Gas LEL</p>
              </div>
            </div>
            <span className={`text-[10px] font-industrial font-bold px-2 py-0.5 rounded border ${ch4Status.bg} ${ch4Status.border} ${ch4Status.textCol}`}>
              {ch4Status.text}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl lg:text-4xl font-bold font-telemetry tracking-tight text-white">
                {ch4_ppm.toLocaleString()}
              </span>
              <span className="text-sm font-mono text-slate-400">ppm</span>
            </div>
            <div className="text-right">
              <span className={`text-base font-bold font-telemetry ${ch4_lel_percent >= 20 ? 'text-red-400' : ch4_lel_percent >= 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {ch4_lel_percent}%
              </span>
              <span className="text-[10px] font-mono text-slate-400 block">LEL</span>
            </div>
          </div>

          {/* CH4 Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>0% LEL</span>
              <span>10% (5k ppm)</span>
              <span>20% (10k ppm)</span>
              <span>50%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80 flex">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  ch4_ppm >= 10000 
                    ? 'bg-red-500 animate-pulse' 
                    : ch4_ppm >= 5000 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, (ch4_ppm / 25000) * 100))}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Explosion Risk Ceiling:</span>
            <span className="text-slate-200">
              MSHA Limit: <strong>1.0% (10k ppm)</strong>
            </span>
          </div>
        </div>

        {/* 3. Carbon Monoxide (CO) Concentration */}
        <div className={`carbon-panel rounded-xl p-4 border transition-all duration-300 relative overflow-hidden ${
          coStatus.text.includes('LETHAL') ? 'animate-alarm-red' : coStatus.border
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">CARBON MONOXIDE</span>
                <p className="text-xs text-slate-500 font-sans">Toxic Fire Byproduct</p>
              </div>
            </div>
            <span className={`text-[10px] font-industrial font-bold px-2 py-0.5 rounded border ${coStatus.bg} ${coStatus.border} ${coStatus.textCol}`}>
              {coStatus.text}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl lg:text-4xl font-bold font-telemetry tracking-tight text-white">
                {co_ppm}
              </span>
              <span className="text-sm font-mono text-slate-400">ppm</span>
            </div>

            {predictions?.co && (
              <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                {predictions.co.ratePerMin > 0.5 ? (
                  <TrendingUp className="w-4 h-4 text-red-400 animate-pulse" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-500" />
                )}
                <span className={predictions.co.ratePerMin > 1.0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                  {predictions.co.ratePerMin > 0 ? `+${predictions.co.ratePerMin}` : predictions.co.ratePerMin} ppm/m
                </span>
              </div>
            )}
          </div>

          {/* CO Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>0 ppm</span>
              <span>35 ppm (TWA)</span>
              <span>100 ppm</span>
              <span>200 ppm</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80 flex">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  co_ppm >= 100 
                    ? 'bg-red-500 animate-pulse' 
                    : co_ppm >= 35 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, (co_ppm / 200) * 100))}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>OSHA Safe Limit:</span>
            <span className="text-slate-200">
              8-hr REL: <strong>35 ppm</strong>
            </span>
          </div>
        </div>

        {/* 4. Oxygen (O2) Concentration */}
        <div className={`carbon-panel rounded-xl p-4 border transition-all duration-300 relative overflow-hidden ${
          o2Status.text.includes('ASPHYXIATION') ? 'animate-alarm-red' : o2Status.border
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">OXYGEN (O2)</span>
                <p className="text-xs text-slate-500 font-sans">Atmospheric Respiration</p>
              </div>
            </div>
            <span className={`text-[10px] font-industrial font-bold px-2 py-0.5 rounded border ${o2Status.bg} ${o2Status.border} ${o2Status.textCol}`}>
              {o2Status.text}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl lg:text-4xl font-bold font-telemetry tracking-tight text-white">
                {o2_percent}
              </span>
              <span className="text-sm font-mono text-slate-400">%</span>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">Atmospheric Normal</span>
              <span className="text-xs font-mono font-bold text-teal-300">20.9%</span>
            </div>
          </div>

          {/* O2 Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>15%</span>
              <span>19.5% Safe</span>
              <span>20.9%</span>
              <span>23.5%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80 flex">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  o2_percent <= 16.0 
                    ? 'bg-red-500 animate-pulse' 
                    : o2_percent <= 19.5 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, ((o2_percent - 14) / 10) * 100))}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Minimum Breathable:</span>
            <span className="text-slate-200">
              OSHA: <strong>19.5% Vol</strong>
            </span>
          </div>
        </div>

      </div>

      {/* Predictive Warning & Safety Index Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Predictive Hazard Analysis Card */}
        <div className="lg:col-span-2 bg-[#0c1322] border border-cyan-900/40 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                <h3 className="font-industrial text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Gas Prediction & Hazard Forecast Engine</span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                    AI LINEAR & EXPONENTIAL PROJECTION
                  </span>
                </h3>
              </div>

              {predictions?.ch4?.hazardLevel === 'CRITICAL' ? (
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/50 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL CROSSING PROJECTED
                </span>
              ) : predictions?.ch4?.hazardLevel === 'CAUTION' ? (
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> CAUTION ACCUMULATION
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> STABLE GAS DYNAMICS
                </span>
              )}
            </div>

            {/* Prediction Metrics Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs font-mono">
              {/* CH4 Forecast */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">CH4 FORECAST (10 MIN)</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-bold text-amber-300 font-telemetry">
                    {predictions?.ch4?.predictedValue10m || ch4_ppm}
                  </span>
                  <span className="text-[10px] text-slate-400">ppm</span>
                </div>
                <p className="text-[10px] mt-1 text-slate-400">
                  Rate: <strong className={predictions?.ch4?.ratePerMin > 100 ? 'text-red-400' : 'text-slate-300'}>
                    {predictions?.ch4?.ratePerMin > 0 ? `+${predictions?.ch4?.ratePerMin}` : predictions?.ch4?.ratePerMin || 0} ppm/min
                  </strong>
                </p>
                {predictions?.ch4?.timeToCriticalSec ? (
                  <span className="mt-1 inline-block text-[10px] font-bold text-red-400 animate-pulse">
                    Breach in ~{Math.round(predictions.ch4.timeToCriticalSec / 60)}m {predictions.ch4.timeToCriticalSec % 60}s!
                  </span>
                ) : (
                  <span className="mt-1 inline-block text-[10px] text-emerald-400">No breach predicted</span>
                )}
              </div>

              {/* CO Forecast */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">CO FORECAST (10 MIN)</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-bold text-rose-300 font-telemetry">
                    {predictions?.co?.predictedValue10m || co_ppm}
                  </span>
                  <span className="text-[10px] text-slate-400">ppm</span>
                </div>
                <p className="text-[10px] mt-1 text-slate-400">
                  Rate: <strong className={predictions?.co?.ratePerMin > 1 ? 'text-red-400' : 'text-slate-300'}>
                    {predictions?.co?.ratePerMin > 0 ? `+${predictions?.co?.ratePerMin}` : predictions?.co?.ratePerMin || 0} ppm/min
                  </strong>
                </p>
                {predictions?.co?.timeToCriticalSec ? (
                  <span className="mt-1 inline-block text-[10px] font-bold text-red-400 animate-pulse">
                    Breach in ~{Math.round(predictions.co.timeToCriticalSec / 60)}m {predictions.co.timeToCriticalSec % 60}s!
                  </span>
                ) : (
                  <span className="mt-1 inline-block text-[10px] text-emerald-400">No breach predicted</span>
                )}
              </div>

              {/* Ultrasonic Cave-in Forecast */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">CLEARANCE SHIFT</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-bold text-cyan-300 font-telemetry">
                    {predictions?.distance?.predictedValue10m || distance_cm}
                  </span>
                  <span className="text-[10px] text-slate-400">cm</span>
                </div>
                <p className="text-[10px] mt-1 text-slate-400">
                  Convergence: <strong className={predictions?.distance?.ratePerMin < -1 ? 'text-red-400' : 'text-slate-300'}>
                    {predictions?.distance?.ratePerMin || 0} cm/min
                  </strong>
                </p>
                {predictions?.distance?.timeToCriticalSec ? (
                  <span className="mt-1 inline-block text-[10px] font-bold text-red-400 animate-pulse">
                    Cave-in warning in ~{Math.round(predictions.distance.timeToCriticalSec / 60)}m!
                  </span>
                ) : (
                  <span className="mt-1 inline-block text-[10px] text-emerald-400">Structural integrity stable</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Composite Tunnel Safety Index Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-industrial text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              TUNNEL SAFETY INDEX
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${safetyTier.badgeBg} ${safetyTier.color}`}>
              {safetyTier.label}
            </span>
          </div>

          <div className="flex items-center justify-center py-3 gap-6">
            <div className="relative flex items-center justify-center">
              {/* Radial Score Ring */}
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="#1e293b"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke={score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#10b981'}
                  strokeWidth="8"
                  strokeDasharray={289}
                  strokeDashoffset={289 - (289 * score) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <span className={`text-3xl font-bold font-telemetry ${safetyTier.color}`}>
                  {score}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">/ 100</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
              <div>
                <span className="block text-slate-500 text-[10px]">OSHA RATING</span>
                <strong className={safetyTier.color}>
                  {score >= 85 ? 'CLASS 1 (SAFE)' : score >= 70 ? 'CLASS 2 (MODERATE)' : score >= 40 ? 'CLASS 3 (HAZARD)' : 'CLASS 4 (EVACUATE)'}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px]">SCBA GEAR REQ</span>
                <strong className="text-slate-200">
                  {score < 60 ? 'MANDATORY ON' : 'STANDBY READY'}
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 text-center">
            Weighted from clearance, gas levels & network link quality
          </div>
        </div>
      </div>
    </div>
  );
}

