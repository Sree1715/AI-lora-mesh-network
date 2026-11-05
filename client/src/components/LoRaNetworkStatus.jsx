import React from 'react';
import { 
  Radio, Wifi, Battery, BatteryCharging, Zap, 
  Server, Shield, Activity, RefreshCw, Signal, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function LoRaNetworkStatus({ gatewayStats, nodes, allLatest, selectedNodeId, onSelectNode }) {
  const getSignalStrengthColor = (rssi) => {
    if (rssi >= -85) return 'text-emerald-400';
    if (rssi >= -105) return 'text-amber-400';
    return 'text-red-400';
  };

  const getSignalBars = (rssi) => {
    if (rssi >= -75) return 4;
    if (rssi >= -90) return 3;
    if (rssi >= -110) return 2;
    return 1;
  };

  return (
    <div className="space-y-4">
      {/* Surface Gateway Overview Card */}
      <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-industrial text-base font-bold text-slate-100 uppercase tracking-wider">
                  Surface LoRaWAN Gateway Station
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  ONLINE & BRIDGED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Gateway ID: <strong>{gatewayStats?.gateway_id || 'GW-SURFACE-01'}</strong> • Subsurface Incline Repeater Line
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">BAND / CHANNELS</span>
              <span className="text-slate-200 font-bold">{gatewayStats?.frequency || '915.0 MHz (US915)'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">MODULATION</span>
              <span className="text-cyan-400 font-bold">{gatewayStats?.spreading_factor || 'SF7 BW125'}</span>
            </div>
          </div>
        </div>

        {/* Gateway Statistics Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">PACKET RECEPTION RATE (PRR)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-telemetry text-emerald-400">
                {gatewayStats?.packet_reception_rate || 99.4}%
              </span>
              <span className="text-[10px] text-slate-400">0.6% loss</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">TOTAL PACKETS INGESTED</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-telemetry text-slate-100">
                {(gatewayStats?.packets_received || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">pkts</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">AVERAGE NETWORK RSSI</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-telemetry ${getSignalStrengthColor(gatewayStats?.avg_rssi || -80)}`}>
                {gatewayStats?.avg_rssi || -82}
              </span>
              <span className="text-[10px] text-slate-400">dBm</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">AVERAGE SNR</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-telemetry text-cyan-400">
                +{gatewayStats?.avg_snr || 8.5}
              </span>
              <span className="text-[10px] text-slate-400">dB</span>
            </div>
          </div>
        </div>
      </div>

      {/* LoRa Underground Node Mesh Matrix */}
      <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-industrial text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Underground Telemetry Transceiver Nodes</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Rugged explosion-proof LoRa mesh transceivers deployed across tunnel sectors
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            4 / 4 Nodes Active
          </span>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {nodes.map(node => {
            const latest = allLatest[node.node_id] || {};
            const isSelected = selectedNodeId === node.node_id;
            const bars = getSignalBars(latest.rssi || -80);

            return (
              <div
                key={node.node_id}
                onClick={() => onSelectNode(node.node_id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected 
                    ? 'bg-slate-900/90 border-cyan-500 shadow-lg shadow-cyan-500/10' 
                    : 'bg-[#0f172a]/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                {/* Node Status Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">{node.node_id}</span>
                      {isSelected && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          SELECTED
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-1 line-clamp-1">{node.name}</h4>
                  </div>

                  {/* Signal bars icon */}
                  <div className="flex items-end gap-0.5 h-4" title={`RSSI: ${latest.rssi} dBm`}>
                    {[1, 2, 3, 4].map(b => (
                      <div
                        key={b}
                        className={`w-1 rounded-sm transition-all ${
                          b <= bars ? 'bg-cyan-400' : 'bg-slate-800'
                        }`}
                        style={{ height: `${b * 25}%` }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Node specs */}
                <div className="mt-3 space-y-2 text-xs font-mono border-t border-slate-800/80 pt-2.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Depth:</span>
                    <strong className="text-slate-200">{node.elevation_m} meters</strong>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Signal (RSSI):</span>
                    <strong className={getSignalStrengthColor(latest.rssi || -80)}>
                      {latest.rssi !== undefined ? `${latest.rssi} dBm` : '---'}
                    </strong>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>SNR:</span>
                    <strong className="text-slate-200">
                      {latest.snr !== undefined ? `+${latest.snr} dB` : '---'}
                    </strong>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Battery:</span>
                    <div className="flex items-center gap-1.5">
                      <Battery className={`w-3.5 h-3.5 ${(latest.battery || 90) < 20 ? 'text-red-400' : 'text-emerald-400'}`} />
                      <strong className="text-slate-200">{latest.battery || 95}%</strong>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Tunnel Clearance:</span>
                    <strong className={latest.distance_cm < 100 ? 'text-red-400 font-bold' : latest.distance_cm < 180 ? 'text-amber-400' : 'text-emerald-400'}>
                      {latest.distance_cm !== undefined ? `${latest.distance_cm} cm` : '---'}
                    </strong>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Firmware:</span>
                    <span className="text-slate-500 text-[10px]">{node.firmware}</span>
                  </div>
                </div>

                {/* Last Transmission Timestamp */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Transmitting
                  </span>
                  <span>1.2s cadence</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

