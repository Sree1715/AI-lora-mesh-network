import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Wind, Shield, Eye, MapPin } from 'lucide-react';

export default function CaveDisaster3D({ telemetry, predictions, alerts, rescueTeams, sosTriggered, nodes }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [viewMode, setViewMode] = useState('3d');
  const [showResolution, setShowResolution] = useState(true);

  const ch4 = telemetry?.ch4_ppm || 680;
  const co = telemetry?.co_ppm || 8;
  const so2 = telemetry?.so2_ppm || 1.8;
  const co2 = telemetry?.co2_ppm || 415;
  const o2 = telemetry?.o2_percent || 20.9;
  const safetyIndex = telemetry?.safety_index || 100;

  const ch4Sev = ch4 >= 10000 ? 'critical' : ch4 >= 5000 ? 'caution' : 'safe';
  const coSev = co >= 100 ? 'critical' : co >= 35 ? 'caution' : 'safe';
  const so2Sev = so2 >= 20 ? 'critical' : so2 >= 5 ? 'caution' : 'safe';
  const gasSeverity = [ch4Sev, coSev, so2Sev].includes('critical') ? 'critical' :
                      [ch4Sev, coSev, so2Sev].includes('caution') ? 'caution' : 'safe';

  const activeAlerts = (alerts || []).filter(a => a.status === 'ACTIVE');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      t += 0.022;
      ctx.clearRect(0, 0, W, H);
      viewMode === '3d' ? draw3D(ctx, W, H, t) : drawTop(ctx, W, H, t);
      animRef.current = requestAnimationFrame(draw);
    };

    const sevColor = (sev) => ({
      critical: { r: 239, g: 68, b: 68 },
      caution: { r: 245, g: 158, b: 11 },
      safe: { r: 16, g: 185, b: 129 }
    }[sev] || { r: 16, g: 185, b: 129 });

    const draw3D = (ctx, W, H, t) => {
      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#040810');
      bg.addColorStop(1, '#080f1e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Cave floor
      const floorGrad = ctx.createLinearGradient(0, H * 0.65, 0, H);
      floorGrad.addColorStop(0, '#14202e');
      floorGrad.addColorStop(1, '#0a1218');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(W, H);
      ctx.lineTo(W * 0.72, H * 0.65);
      ctx.lineTo(W * 0.28, H * 0.65);
      ctx.closePath();
      ctx.fill();

      // Left wall
      ctx.fillStyle = '#0d1928';
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(W * 0.28, H * 0.65);
      ctx.lineTo(W * 0.1, H * 0.1);
      ctx.lineTo(0, H * 0.15);
      ctx.closePath();
      ctx.fill();

      // Right wall
      ctx.fillStyle = '#0b1624';
      ctx.beginPath();
      ctx.moveTo(W, H);
      ctx.lineTo(W * 0.72, H * 0.65);
      ctx.lineTo(W * 0.9, H * 0.1);
      ctx.lineTo(W, H * 0.15);
      ctx.closePath();
      ctx.fill();

      // Ceiling
      ctx.fillStyle = '#06090f';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(W, 0);
      ctx.lineTo(W * 0.9, H * 0.1);
      ctx.lineTo(W * 0.1, H * 0.1);
      ctx.closePath();
      ctx.fill();

      // Stalactites
      for (let i = 0; i < 9; i++) {
        const sx = W * 0.12 + i * W * 0.09;
        const sh = 18 + Math.sin(i * 1.4 + t * 0.08) * 8;
        ctx.fillStyle = '#121e2f';
        ctx.beginPath();
        ctx.moveTo(sx - 5, 0);
        ctx.lineTo(sx, sh);
        ctx.lineTo(sx + 5, 0);
        ctx.closePath();
        ctx.fill();
      }

      // === GAS CLOUD ===
      const gc = sevColor(gasSeverity);
      const leakX = W * 0.72, leakY = H * 0.48;
      const cloudX = W * 0.42, cloudY = H * 0.42;

      // Crack (leak source)
      ctx.strokeStyle = `rgba(${gc.r},${gc.g},${gc.b},0.95)`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(leakX, leakY - 18);
      ctx.lineTo(leakX - 9, leakY + 2);
      ctx.lineTo(leakX + 6, leakY + 10);
      ctx.lineTo(leakX - 2, leakY + 24);
      ctx.stroke();

      // Pulsing glow at crack
      const crackR = 28 + Math.sin(t * 3.5) * 9;
      const crackGlow = ctx.createRadialGradient(leakX, leakY, 0, leakX, leakY, crackR);
      crackGlow.addColorStop(0, `rgba(${gc.r},${gc.g},${gc.b},0.7)`);
      crackGlow.addColorStop(1, `rgba(${gc.r},${gc.g},${gc.b},0)`);
      ctx.fillStyle = crackGlow;
      ctx.beginPath();
      ctx.arc(leakX, leakY, crackR, 0, Math.PI * 2);
      ctx.fill();

      // Gas cloud blobs
      for (let layer = 4; layer >= 0; layer--) {
        const alpha = (0.045 + layer * 0.025) * (gasSeverity === 'critical' ? 1.6 : gasSeverity === 'caution' ? 1.1 : 0.6);
        const r = 85 + layer * 42 + Math.sin(t * 0.65 + layer) * 14;
        const ox = Math.sin(t * 0.38 + layer * 1.1) * 18;
        const oy = Math.cos(t * 0.28 + layer * 0.9) * 10;
        const cg = ctx.createRadialGradient(cloudX + ox, cloudY + oy, 0, cloudX + ox, cloudY + oy, r);
        cg.addColorStop(0, `rgba(${gc.r},${gc.g},${gc.b},${alpha * 2})`);
        cg.addColorStop(0.5, `rgba(${gc.r},${gc.g},${gc.b},${alpha})`);
        cg.addColorStop(1, `rgba(${gc.r},${gc.g},${gc.b},0)`);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cloudX + ox, cloudY + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gas flow particles
      for (let i = 0; i < 14; i++) {
        const frac = ((t * 0.75 + i / 14) % 1);
        const px = leakX + (cloudX - leakX) * frac + Math.sin(t + i * 0.9) * 14;
        const py = leakY + (cloudY - leakY) * frac - frac * 22;
        const pa = frac < 0.5 ? frac * 2 : (1 - frac) * 2;
        ctx.fillStyle = `rgba(${gc.r},${gc.g},${gc.b},${pa * 0.65})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.5 + frac * 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // === RESOLUTION PATHS ===
      if (showResolution) {
        // Gas escape tracking (cyan)
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(34,211,238,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leakX, leakY);
        ctx.bezierCurveTo(leakX - 35, leakY - 65, W * 0.52, H * 0.28, W * 0.28, H * 0.12);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(34,211,238,0.85)';
        ctx.beginPath();
        ctx.arc(W * 0.28, H * 0.12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 9px monospace';
        ctx.fillText('GAS ESCAPE ROUTE', W * 0.29, H * 0.11);

        // Ventilation fix path (green)
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = 'rgba(16,185,129,0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(W * 0.14, H * 0.5);
        ctx.bezierCurveTo(W * 0.26, H * 0.5, W * 0.46, H * 0.44, leakX, leakY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Rotating fan
        const fx = W * 0.1, fy = H * 0.5, fr = 11 + Math.sin(t * 5) * 2;
        ctx.strokeStyle = 'rgba(16,185,129,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const a = t * 4.5 + (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + Math.cos(a) * fr * 0.9, fy + Math.sin(a) * fr * 0.9);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(16,185,129,0.8)';
        ctx.font = '8px monospace';
        ctx.fillText('VENTILATION', fx - 18, fy + fr + 12);
      }

      // === RESCUE TEAMS ===
      const teams = [
        { x: W * 0.22, y: H * 0.74, label: 'ALPHA', color: '#60a5fa' },
        { x: W * 0.48, y: H * 0.79, label: 'BRAVO', color: '#a78bfa' },
        { x: W * 0.14, y: H * 0.63, label: 'CHARLIE', color: '#34d399' },
      ];
      teams.forEach(team => {
        ctx.fillStyle = team.color;
        ctx.beginPath();
        ctx.arc(team.x, team.y - 10, 7, Math.PI, 0);
        ctx.rect(team.x - 7, team.y - 10, 14, 5);
        ctx.fill();
        ctx.fillStyle = team.color + '99';
        ctx.fillRect(team.x - 4, team.y - 4, 8, 12);
        ctx.strokeStyle = team.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(team.x, team.y - 5, 10 + Math.sin(t * 2.2) * 3, 0, Math.PI * 2);
        ctx.globalAlpha = 0.35 + Math.sin(t * 2.2) * 0.25;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = team.color;
        ctx.font = 'bold 8px monospace';
        ctx.fillText(team.label, team.x - 16, team.y + 20);
      });

      // === SENSOR NODES ===
      const sensorNodes = [
        { x: W * 0.4, y: H * 0.58, gas: ch4Sev, label: 'CH\u2084' },
        { x: W * 0.56, y: H * 0.63, gas: coSev, label: 'CO' },
        { x: W * 0.33, y: H * 0.5, gas: so2Sev, label: 'SO\u2082' },
      ];
      sensorNodes.forEach(nd => {
        const nc = { critical: '#ef4444', caution: '#f59e0b', safe: '#10b981' }[nd.gas];
        ctx.fillStyle = nc;
        ctx.strokeStyle = nc + 'aa';
        ctx.lineWidth = 1.5;
        ctx.fillRect(nd.x - 6, nd.y - 6, 12, 12);
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, 11 + Math.sin(t * 3 + nd.x) * 3.5, 0, Math.PI * 2);
        ctx.globalAlpha = 0.28 + Math.sin(t * 3) * 0.18;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = nc;
        ctx.font = 'bold 8px monospace';
        ctx.fillText(nd.label, nd.x + 7, nd.y + 4);
      });

      // === SOS OVERLAY ===
      if (sosTriggered) {
        const sosAlpha = 0.12 + Math.sin(t * 8) * 0.08;
        ctx.fillStyle = `rgba(239,68,68,${sosAlpha})`;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = `rgba(239,68,68,${0.85 + Math.sin(t * 8) * 0.15})`;
        ctx.font = `bold ${Math.round(28 + Math.sin(t * 6) * 3)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('\uD83D\uDEA8 GAS LEAK CRITICAL \u2014 SOS ACTIVE \uD83D\uDEA8', W / 2, H * 0.08);
        ctx.textAlign = 'left';
      }

      // === HUD ===
      ctx.fillStyle = 'rgba(8,13,25,0.88)';
      ctx.strokeStyle = 'rgba(34,211,238,0.3)';
      ctx.lineWidth = 1;
      ctx.fillRect(10, H - 102, 185, 92);
      ctx.strokeRect(10, H - 102, 185, 92);

      const readings = [
        { l: 'CH\u2084', v: `${ch4.toLocaleString()} ppm`, s: ch4Sev },
        { l: 'CO', v: `${co} ppm`, s: coSev },
        { l: 'SO\u2082', v: `${so2} ppm`, s: so2Sev },
        { l: 'CO\u2082', v: `${co2} ppm`, s: 'safe' },
        { l: 'O\u2082', v: `${o2}%`, s: o2 <= 16 ? 'critical' : o2 <= 19.5 ? 'caution' : 'safe' },
      ];
      readings.forEach((g, i) => {
        const col = { critical: '#ef4444', caution: '#f59e0b', safe: '#10b981' }[g.s];
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(g.l + ':', 18, H - 86 + i * 16);
        ctx.fillStyle = col;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(g.v, 55, H - 86 + i * 16);
      });

      // Safety index badge
      const siColor = safetyIndex < 40 ? '#ef4444' : safetyIndex < 70 ? '#f59e0b' : '#10b981';
      ctx.fillStyle = siColor + '22';
      ctx.strokeStyle = siColor;
      ctx.fillRect(W - 100, H - 42, 88, 30);
      ctx.strokeRect(W - 100, H - 42, 88, 30);
      ctx.fillStyle = siColor;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`SAFETY: ${safetyIndex}`, W - 94, H - 23);

      // Title
      ctx.fillStyle = 'rgba(34,211,238,0.9)';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('MINE DISASTER 3D \u00B7 GAS TRACKING ACTIVE', W * 0.5 - 148, 18);
    };

    const drawTop = (ctx, W, H, t) => {
      ctx.fillStyle = '#050810';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(28,38,54,0.7)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 42) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Tunnels
      const tunnels = [
        [50, H/2, W-50, H/2, 60],
        [W*0.28, H*0.18, W*0.28, H*0.82, 48],
        [W*0.65, H*0.22, W*0.65, H*0.78, 44],
        [W*0.28, H*0.33, W*0.65, H*0.33, 40],
        [W*0.28, H*0.67, W*0.65, H*0.67, 40],
      ];
      tunnels.forEach(([x1,y1,x2,y2,w]) => {
        const angle = Math.atan2(y2-y1, x2-x1);
        const nx = Math.sin(angle)*w/2, ny = Math.cos(angle)*w/2;
        ctx.fillStyle = '#0e1d2e';
        ctx.strokeStyle = '#1a3050';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1-nx, y1+ny); ctx.lineTo(x2-nx, y2+ny);
        ctx.lineTo(x2+nx, y2-ny); ctx.lineTo(x1+nx, y1-ny);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });

      // Gas cloud top view
      const gc = sevColor(gasSeverity);
      const lx = W * 0.65, ly = H * 0.5;
      for (let layer = 4; layer >= 0; layer--) {
        const a = 0.04 + layer * 0.035;
        const r = 55 + layer * 32 + Math.sin(t * 0.5 + layer) * 10;
        const ox = Math.sin(t * 0.3 + layer) * 14, oy = Math.cos(t * 0.4 + layer) * 9;
        const grad = ctx.createRadialGradient(lx+ox, ly+oy, 0, lx+ox, ly+oy, r);
        grad.addColorStop(0, `rgba(${gc.r},${gc.g},${gc.b},${a*2.2})`);
        grad.addColorStop(1, `rgba(${gc.r},${gc.g},${gc.b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(lx+ox, ly+oy, r, 0, Math.PI*2); ctx.fill();
      }

      // Flow arrows
      if (showResolution) {
        ctx.strokeStyle = `rgba(${gc.r},${gc.g},${gc.b},0.55)`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5,3]);
        [0, Math.PI/4, -Math.PI/4, Math.PI/2, -Math.PI/2].forEach((angle, ai) => {
          const d = 75 + Math.sin(t + ai) * 8;
          ctx.beginPath();
          ctx.moveTo(lx + Math.cos(angle)*22, ly + Math.sin(angle)*22);
          ctx.lineTo(lx + Math.cos(angle)*d, ly + Math.sin(angle)*d);
          ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(16,185,129,0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(80, H/2); ctx.lineTo(lx-22, ly); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Teams top view
      [{x:W*0.22,y:H*0.5,l:'ALPHA',c:'#60a5fa'},{x:W*0.48,y:H*0.67,l:'BRAVO',c:'#a78bfa'},{x:W*0.28,y:H*0.33,l:'CHARLIE',c:'#34d399'}].forEach(tp => {
        ctx.fillStyle = tp.c; ctx.strokeStyle = tp.c; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 12 + Math.sin(t*2)*3, 0, Math.PI*2);
        ctx.globalAlpha = 0.28; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = tp.c; ctx.font = 'bold 8px monospace';
        ctx.fillText(tp.l, tp.x - 15, tp.y + 20);
      });

      // SOS overlay top view
      if (sosTriggered) {
        ctx.fillStyle = `rgba(239,68,68,${0.08 + Math.sin(t*8)*0.06})`;
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = `rgba(239,68,68,${0.85+Math.sin(t*8)*0.15})`;
        ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
        ctx.fillText('\uD83D\uDEA8 SOS \u2014 GAS LEAK ACTIVE \uD83D\uDEA8', W/2, H*0.08);
        ctx.textAlign = 'left';
      }

      // HUD
      ctx.fillStyle = 'rgba(8,13,25,0.88)';
      ctx.fillRect(10, H-100, 180, 90);
      ctx.strokeStyle = 'rgba(34,211,238,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(10, H-100, 180, 90);
      [{l:'CH\u2084',v:`${ch4.toLocaleString()} ppm`,s:ch4Sev},{l:'CO',v:`${co} ppm`,s:coSev},{l:'SO\u2082',v:`${so2} ppm`,s:so2Sev},{l:'CO\u2082',v:`${co2} ppm`,s:'safe'},{l:'O\u2082',v:`${o2}%`,s:o2<=16?'critical':o2<=19.5?'caution':'safe'}].forEach((g,i)=>{
        const col={critical:'#ef4444',caution:'#f59e0b',safe:'#10b981'}[g.s];
        ctx.fillStyle='#94a3b8'; ctx.font='10px monospace'; ctx.fillText(g.l+':',18,H-84+i*16);
        ctx.fillStyle=col; ctx.font='bold 10px monospace'; ctx.fillText(g.v,52,H-84+i*16);
      });

      ctx.fillStyle='rgba(34,211,238,0.9)'; ctx.font='bold 10px monospace';
      ctx.fillText('TOP-DOWN MAP \u00B7 GAS DISPERSION', 20, 20);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [viewMode, gasSeverity, ch4, co, so2, co2, o2, showResolution, ch4Sev, coSev, so2Sev, sosTriggered, safetyIndex]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
    });
    if (canvasRef.current?.parentElement) resizeObserver.observe(canvasRef.current.parentElement);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className={`carbon-panel rounded-xl border shadow-xl overflow-hidden ${sosTriggered ? 'border-red-500 shadow-red-900/40' : 'border-slate-800'}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${sosTriggered ? 'bg-red-500/20 border-red-500/50' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
            <Eye className={`w-4 h-4 ${sosTriggered ? 'text-red-400' : 'text-cyan-400'}`} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
              3D Cave Disaster Management
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                gasSeverity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' :
                gasSeverity === 'caution' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {gasSeverity === 'critical' ? <><AlertTriangle className="w-3 h-3" /> CRITICAL GAS</> :
                 gasSeverity === 'caution' ? <><AlertTriangle className="w-3 h-3" /> GAS CAUTION</> :
                 <><Shield className="w-3 h-3" /> STABLE</>}
              </span>
              {sosTriggered && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-red-600/30 text-red-300 border-red-500/70 animate-pulse flex items-center gap-1">
                  🚨 SOS ACTIVE
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">Gas leak tracking · Rescue routing · Ventilation resolution · Auto-SOS on critical levels</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResolution(v => !v)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold border transition-all ${showResolution ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            {showResolution ? '✓ RESOLUTION PATHS' : 'SHOW PATHS'}
          </button>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {['3d','top'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${viewMode === mode ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-600/40' : 'text-slate-400 hover:text-slate-200'}`}>
                {mode === '3d' ? '3D VIEW' : 'TOP MAP'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-96 md:h-[480px]">
        <canvas ref={canvasRef} width={900} height={460} className="w-full h-full" />
      </div>

      {/* Gas readings bar below canvas */}
      <div className="px-4 py-3 bg-[#070c18] border-t border-slate-800 grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Methane CH\u2084', value: ch4.toLocaleString(), unit: 'ppm', sev: ch4Sev, thresh: '\u226510,000 = CRITICAL' },
          { label: 'Carbon Monoxide CO', value: co, unit: 'ppm', sev: coSev, thresh: '\u2265100 = CRITICAL' },
          { label: 'Sulphur Dioxide SO\u2082', value: so2, unit: 'ppm', sev: so2Sev, thresh: '\u226520 = CRITICAL' },
          { label: 'Carbon Dioxide CO\u2082', value: co2, unit: 'ppm', sev: 'safe', thresh: '\u22655000 = CAUTION' },
          { label: 'Oxygen O\u2082', value: o2, unit: '%', sev: o2 <= 16 ? 'critical' : o2 <= 19.5 ? 'caution' : 'safe', thresh: '\u226416% = CRITICAL' },
        ].map(g => {
          const col = { critical: 'text-red-400 border-red-500/50 bg-red-500/10', caution: 'text-amber-400 border-amber-500/50 bg-amber-500/10', safe: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' }[g.sev];
          return (
            <div key={g.label} className={`rounded-lg border p-2.5 ${col}`}>
              <div className="text-[10px] font-mono text-slate-400 mb-0.5">{g.label}</div>
              <div className="text-lg font-bold font-mono">{g.value}<span className="text-xs ml-1 font-normal">{g.unit}</span></div>
              <div className="text-[9px] font-mono text-slate-500 mt-0.5">{g.thresh}</div>
            </div>
          );
        })}
      </div>

      {/* Active leak locations */}
      {activeAlerts.length > 0 && (
        <div className="px-4 py-3 bg-red-950/30 border-t border-red-800/40">
          <div className="text-[11px] font-mono text-red-400 font-bold mb-2 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> GAS LEAK LOCATIONS DETECTED:
          </div>
          <div className="flex flex-wrap gap-2">
            {activeAlerts.slice(0, 4).map(a => (
              <span key={a.id} className="text-[10px] font-mono bg-red-900/40 border border-red-700/50 text-red-300 px-2 py-1 rounded">
                📍 {a.sector_name || 'Sector 4'} · {a.node_id} · {a.title.split(':')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-800 flex flex-wrap gap-4 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/80 inline-block" /> Gas Source/Crack</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-400/80 inline-block" /> Gas Escape Tracking</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400/80 inline-block" /> Ventilation Resolution</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-400/80 inline-block" /> Rescue Teams</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400/80 inline-block" /> Gas Sensor Nodes</span>
      </div>
    </div>
  );
}
