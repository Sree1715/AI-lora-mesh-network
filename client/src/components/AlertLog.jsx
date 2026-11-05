import React, { useState, useMemo } from 'react';
import { 
  Bell, AlertTriangle, ShieldAlert, CheckCircle2, 
  Download, Filter, Search, Clock, Check, MessageSquare 
} from 'lucide-react';

export default function AlertLog({ alerts, onAcknowledge, onResolve }) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Acknowledgement modal state
  const [selectedAlertForAck, setSelectedAlertForAck] = useState(null);
  const [operatorName, setOperatorName] = useState('Surface Controller #1');
  const [ackNotes, setAckNotes] = useState('');

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchSearch = searchTerm === '' || 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.node_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.sector_name && a.sector_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSeverity && matchStatus && matchSearch;
    });
  }, [alerts, severityFilter, statusFilter, searchTerm]);

  // Handle Submit Ack
  const handleAckSubmit = (e) => {
    e.preventDefault();
    if (selectedAlertForAck) {
      onAcknowledge(selectedAlertForAck.id, operatorName, ackNotes);
      setSelectedAlertForAck(null);
      setAckNotes('');
    }
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Alert ID', 'Timestamp', 'Severity', 'Title', 'Message', 'Node', 'Sector', 'Reading', 'Status', 'Acknowledged By', 'Notes'];
    const rows = filteredAlerts.map(a => [
      `"${a.id}"`,
      `"${a.timestamp}"`,
      `"${a.severity}"`,
      `"${a.title}"`,
      `"${a.message.replace(/"/g, '""')}"`,
      `"${a.node_id}"`,
      `"${a.sector_name || ''}"`,
      `"${a.reading || ''}"`,
      `"${a.status}"`,
      `"${a.acknowledged_by || ''}"`,
      `"${a.notes ? a.notes.replace(/"/g, '""') : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MRSMS_Incident_Log_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredAlerts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MRSMS_Incident_Log_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Acknowledgement Modal */}
      {selectedAlertForAck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-cyan-500/50 rounded-xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 text-cyan-400 pb-3 border-b border-slate-800">
              <CheckCircle2 className="w-5 h-5" />
              <h4 className="font-industrial text-base font-bold text-white uppercase tracking-wider">
                Acknowledge Incident Protocol
              </h4>
            </div>

            <div className="mt-3 text-xs font-mono space-y-2">
              <p className="text-slate-300 font-bold">{selectedAlertForAck.title}</p>
              <p className="text-slate-400">{selectedAlertForAck.message}</p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                Node: {selectedAlertForAck.node_id} • Reading: {selectedAlertForAck.reading}
              </div>
            </div>

            <form onSubmit={handleAckSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">OPERATOR CALLSIGN / NAME</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">MITIGATION ACTION & PROTOCOL NOTES</label>
                <textarea
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  placeholder="e.g., Auxiliary fan turned on, rescue team notified, stope shoring dispatched..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAlertForAck(null)}
                  className="px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow"
                >
                  Confirm Acknowledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Alert Log Table Container */}
      <div className="carbon-panel rounded-xl p-4 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-industrial text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span>Incident Log & Emergency Safety Protocol Table</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-amber-300 border border-slate-700">
                  {filteredAlerts.length} Recorded Incidents
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Real-time incident audit trail with MSHA-compliant timestamping and operator acknowledgement
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 my-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alerts, nodes, messages..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              <span className="text-slate-500 text-[10px] pl-2 pr-1">SEVERITY:</span>
              {['ALL', 'CRITICAL', 'CAUTION', 'EMERGENCY'].map(s => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    severityFilter === s ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              <span className="text-slate-500 text-[10px] pl-2 pr-1">STATUS:</span>
              {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    statusFilter === st ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Node / Sector</th>
                <th className="py-2.5 px-3">Alert Title & Detail</th>
                <th className="py-2.5 px-3">Reading vs Limit</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active or historical incidents match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(alert => {
                  const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY';
                  const isActive = alert.status === 'ACTIVE';

                  return (
                    <tr 
                      key={alert.id}
                      className={`transition-colors ${
                        isActive && isCritical ? 'bg-red-950/20 hover:bg-red-950/30' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      {/* Severity Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          alert.severity === 'EMERGENCY' ? 'bg-red-600 text-white border-red-400 animate-pulse' :
                          alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/60' :
                          alert.severity === 'CAUTION' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                          'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {alert.severity}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap text-[11px]">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="block text-[10px] text-slate-500">
                          {new Date(alert.timestamp).toISOString().substring(0, 10)}
                        </span>
                      </td>

                      {/* Node & Sector */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-amber-300 block">{alert.node_id}</span>
                        <span className="text-[10px] text-slate-400 block line-clamp-1">{alert.sector_name}</span>
                      </td>

                      {/* Title & Message */}
                      <td className="py-3 px-3 max-w-sm">
                        <span className="font-bold text-slate-100 block">{alert.title}</span>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{alert.message}</p>
                        {alert.notes && (
                          <div className="mt-1 text-[10px] text-cyan-300 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Note: {alert.notes}
                          </div>
                        )}
                      </td>

                      {/* Reading vs Threshold */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-200 block">{alert.reading}</span>
                        <span className="text-[10px] text-slate-500 block">Ceiling: {alert.threshold}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          alert.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse' :
                          alert.status === 'ACKNOWLEDGED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {alert.status}
                        </span>
                        {alert.acknowledged_by && (
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            Ack by {alert.acknowledged_by}
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {alert.status === 'ACTIVE' && (
                          <button
                            onClick={() => setSelectedAlertForAck(alert)}
                            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[11px] font-bold mr-1.5 transition-all"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== 'RESOLVED' && (
                          <button
                            onClick={() => onResolve(alert.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-all"
                          >
                            Resolve
                          </button>
                        )}
                        {alert.status === 'RESOLVED' && (
                          <span className="text-emerald-400 text-[11px] flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Cleared
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

