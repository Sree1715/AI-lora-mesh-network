import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, Radio, CheckSquare, 
  Square, Users, CheckCircle2, Volume2, X 
} from 'lucide-react';
import * as api from '../utils/api';

export default function EmergencySOSModal({ isOpen, onClose, evacuation, onTriggerEvac, onCancelEvac, nodes }) {
  const [step, setStep] = useState(1); // 1 = Config/Confirm, 2 = Execution
  const [selectedSectors, setSelectedSectors] = useState(['SEC-04', 'SEC-02', 'SEC-07', 'SEC-05']);
  const [operatorCallsign, setOperatorCallsign] = useState('Chief Safety Officer - Station Alpha');
  const [evacReason, setEvacReason] = useState('Critical Multi-gas & Tunnel Convergence Hazard Threshold Breached');

  if (!isOpen) return null;

  const toggleSector = (secId) => {
    setSelectedSectors(prev => 
      prev.includes(secId) ? prev.filter(s => s !== secId) : [...prev, secId]
    );
  };

  const selectAllSectors = () => {
    setSelectedSectors(['SEC-04', 'SEC-02', 'SEC-07', 'SEC-05']);
  };

  const handleExecuteEvac = () => {
    onTriggerEvac(selectedSectors, operatorCallsign, evacReason);
    setStep(2);
  };

  const handleUpdateHeadcount = async (deltaEvac) => {
    const curEvac = evacuation.personnel_evacuated || 12;
    const curInTransit = evacuation.personnel_in_transit || 28;
    const curUnacc = evacuation.personnel_unaccounted || 2;

    const newEvac = Math.min(evacuation.personnel_total || 42, curEvac + deltaEvac);
    const newInTransit = Math.max(0, curInTransit - deltaEvac);
    const newUnacc = newInTransit === 0 ? 0 : curUnacc;

    await api.updateEvacuationHeadcountApi(newEvac, newInTransit, newUnacc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#0b101b] border-2 border-red-600 rounded-2xl max-w-2xl w-full shadow-2xl shadow-red-950/60 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-rose-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-black/40 border border-white/20">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-industrial text-lg font-bold uppercase tracking-wider">
                Emergency Mine Evacuation Broadcast Console
              </h3>
              <p className="text-xs text-red-200 font-mono">
                Subsurface Audio-Visual Klaxon & Radio Blast Protocol
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-black/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* If already active */}
          {evacuation.is_active ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500 text-center space-y-2 animate-pulse">
                <span className="text-xs font-mono font-bold text-red-300 block">
                  🚨 LIVE GENERAL EVACUATION ORDER ACTIVELY BROADCASTING
                </span>
                <h4 className="text-lg font-industrial font-bold text-white">
                  ALL UNDERGROUND PERSONNEL ARE ORDERED TO EXIT OR SECURE IN REFUGE BAYS
                </h4>
                <p className="text-xs text-slate-300 font-mono">
                  Initiated by: {evacuation.initiated_by} • Timestamp: {evacuation.initiated_at}
                </p>
              </div>

              {/* Headcount Dashboard */}
              <div className="grid grid-cols-3 gap-3 text-center font-mono">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 block">EVACUATED TO SURFACE</span>
                  <span className="text-3xl font-bold text-emerald-300 font-telemetry">
                    {evacuation.personnel_evacuated || 12}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Personnel</span>
                </div>

                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40">
                  <span className="text-[10px] text-amber-400 block">IN-TRANSIT / IN REFUGE</span>
                  <span className="text-3xl font-bold text-amber-300 font-telemetry">
                    {evacuation.personnel_in_transit || 28}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Moving</span>
                </div>

                <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40">
                  <span className="text-[10px] text-red-400 block">UNACCOUNTED</span>
                  <span className="text-3xl font-bold text-red-300 font-telemetry">
                    {evacuation.personnel_unaccounted || 2}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Checking tags</span>
                </div>
              </div>

              {/* Headcount update buttons */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Surface Hoist Tag Ingestion:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateHeadcount(5)}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    +5 Personnel Surfaced
                  </button>
                  <button
                    onClick={() => handleUpdateHeadcount(20)}
                    className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
                  >
                    All Remaining Surfaced
                  </button>
                </div>
              </div>

              {/* Stand Down Button */}
              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    onCancelEvac(operatorCallsign);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-lg font-mono font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600"
                >
                  Stand Down Evacuation Order
                </button>
              </div>
            </div>
          ) : (
            /* Evacuation Confirmation Protocol Form */
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-800/60 text-xs font-mono text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-industrial tracking-wider uppercase">
                    Mandatory Life Safety Broadcast Warning
                  </strong>
                  Broadcasting this command triggers emergency sirens, strobe beacons, and LoRa emergency packets to all miners and autonomous haulage vehicles across selected sectors.
                </div>
              </div>

              {/* Sector Selection Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-bold text-slate-300">
                    TARGET EVACUATION SECTORS:
                  </label>
                  <button 
                    type="button" 
                    onClick={selectAllSectors} 
                    className="text-[11px] font-mono text-cyan-400 hover:underline"
                  >
                    Select All Sectors
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    { id: 'SEC-04', label: 'Sector 4: Sub-level B Extraction Stope (-420m)' },
                    { id: 'SEC-02', label: 'Sector 2: Deep Drift Level 300 (-300m)' },
                    { id: 'SEC-07', label: 'Sector 7: North Incline Shaft (-180m)' },
                    { id: 'SEC-05', label: 'Sector 5: East Refuge Chamber Station (-350m)' }
                  ].map(sec => {
                    const isChecked = selectedSectors.includes(sec.id);
                    return (
                      <div 
                        key={sec.id}
                        onClick={() => toggleSector(sec.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                          isChecked ? 'bg-red-950/40 border-red-500/70 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {isChecked ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                        <span className="text-[11px] font-semibold">{sec.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operator Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">AUTHORIZING OFFICER CALLSIGN</label>
                  <input
                    type="text"
                    value={operatorCallsign}
                    onChange={(e) => setOperatorCallsign(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">EVACUATION REASON / LOG</label>
                  <input
                    type="text"
                    value={evacReason}
                    onChange={(e) => setEvacReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Two-stage verification active • 2-tone Klaxon
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteEvac}
                    className="px-6 py-2 rounded-lg text-xs font-industrial font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 animate-pulse"
                  >
                    🚨 TRANSMIT EVACUATION ALARM NOW
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

