import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Wind, Flame, Shield, Eye, RotateCcw } from 'lucide-react';

/**
 * 3D CSS/Canvas Cave Disaster Management Visualization
 * Shows gas leak tracking, resolution paths, and team positions
 */
export default function CaveDisaster3D({ telemetry, predictions, alerts, rescueTeams }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'top'
  const [gasSource, setGasSource] = useState({ x: 0.65, y: 0.55 });
  const [showResolution, setShowResolution] = useState(true);

  // Gas severity from telemetry
  const ch4 = telemetry?.ch4_ppm || 680;
  const co = telemetry?.co_ppm || 8;
  const so2 = telemetry?.so2_ppm || 2;
  const co2 = telemetry?.co2_ppm || 420;
  const ch4Severity = ch4 >= 10000 ? 'critical' : ch4 >= 5000 ? 'caution' : 'safe';
  const coSeverity = co >= 100 ? 'critical' : co >= 35 ? 'caution' : 'safe';
  const gasSeverity = ch4Severity === 'critical' || coSeverity === 'critical' ? 'critical' : 
                      ch4Severity === 'caution' || coSeverity === 'caution' ? 'caution' : 'safe';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      t += 0.025;
      timeRef.current = t;

      // Clear
      ctx.clearRect(0, 0, W, H);

      if (viewMode === '3d') {
        draw3DView(ctx, W, H, t);
      } else {
        drawTopView(ctx, W, H, t);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    const draw3DView = (ctx, W, H, t) => {
      // Dark cave background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#060a12');
      bg.addColorStop(1, '#0a0f1e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // --- Draw cave tunnel in 3D perspective ---
      const cx = W / 2;
      const cy = H * 0.5;
      const vanishX = cx;
      const vanishY = H * 0.35;

      // Tunnel walls (perspective lines)
      const leftBase = { x: W * 0.05, y: H * 0.9 };
      const rightBase = { x: W * 0.95, y: H * 0.9 };
      const leftTop = { x: W * 0.1, y: H * 0.15 };
      const rightTop = { x: W * 0.9, y: H * 0.15 };

      // Floor
      const floorGrad = ctx.createLinearGradient(0, H * 0.7, 0, H);
      floorGrad.addColorStop(0, '#1a2535');
      floorGrad.addColorStop(1, '#0d1520');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.moveTo(leftBase.x, H);
      ctx.lineTo(rightBase.x, H);
      ctx.lineTo(W * 0.65, H * 0.7);
      ctx.lineTo(W * 0.35, H * 0.7);
      ctx.closePath();
      ctx.fill();

      // Left wall
      const leftWallGrad = ctx.createLinearGradient(0, 0, W * 0.4, 0);
      leftWallGrad.addColorStop(0, '#0f1a2b');
      leftWallGrad.addColorStop(1, '#162436');
      ctx.fillStyle = leftWallGrad;
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(leftBase.x, H);
      ctx.lineTo(W * 0.35, H * 0.7);
      ctx.lineTo(leftTop.x, leftTop.y);
      ctx.lineTo(0, H * 0.2);
      ctx.closePath();
      ctx.fill();

      // Right wall
      const rightWallGrad = ctx.createLinearGradient(W * 0.6, 0, W, 0);
      rightWallGrad.addColorStop(0, '#162436');
      rightWallGrad.addColorStop(1, '#0f1a2b');
      ctx.fillStyle = rightWallGrad;
      ctx.beginPath();
      ctx.moveTo(W, H);
      ctx.lineTo(rightBase.x, H);
      ctx.lineTo(W * 0.65, H * 0.7);
      ctx.lineTo(rightTop.x, rightTop.y);
      ctx.lineTo(W, H * 0.2);
      ctx.closePath();
      ctx.fill();

      // Ceiling
      const ceilGrad = ctx.createLinearGradient(0, 0, 0, H * 0.3);
      ceilGrad.addColorStop(0, '#080d19');
      ceilGrad.addColorStop(1, '#111d2e');
      ctx.fillStyle = ceilGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(rightTop.x, rightTop.y);
      ctx.lineTo(W * 0.65, H * 0.15);
      ctx.lineTo(W * 0.35, H * 0.15);
      ctx.lineTo(leftTop.x, leftTop.y);
      ctx.closePath();
      ctx.fill();

      // Cave stalactites (ceiling detail)
      ctx.strokeStyle = '#1e2d42';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const sx = W * 0.15 + i * W * 0.1;
        const height = 20 + Math.sin(i * 1.3 + t * 0.1) * 10;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx - 4, height);
        ctx.lineTo(sx + 4, height);
        ctx.closePath();
        ctx.fillStyle = '#1a2a3e';
        ctx.fill();
      }

      // --- GAS CLOUD (animated particles) ---
      const gasColors = {
        critical: { r: 239, g: 68, b: 68 },
        caution: { r: 245, g: 158, b: 11 },
        safe: { r: 16, g: 185, b: 129 }
      };
      const gc = gasColors[gasSeverity];

      // Gas leak source point (crack in wall)
      const leakX = W * 0.68;
      const leakY = H * 0.52;

      // Draw crack/rupture
      ctx.strokeStyle = `rgba(${gc.r},${gc.g},${gc.b},0.9)`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(leakX, leakY - 15);
      ctx.lineTo(leakX - 8, leakY);
      ctx.lineTo(leakX + 5, leakY + 8);
      ctx.lineTo(leakX - 3, leakY + 20);
      ctx.stroke();

      // Pulsing glow at crack
      const crackGlow = ctx.createRadialGradient(leakX, leakY, 0, leakX, leakY, 30 + Math.sin(t * 3) * 8);
      crackGlow.addColorStop(0, `rgba(${gc.r},${gc.g},${gc.b},0.6)`);
      crackGlow.addColorStop(1, `rgba(${gc.r},${gc.g},${gc.b},0)`);
      ctx.fillStyle = crackGlow;
      ctx.beginPath();
      ctx.arc(leakX, leakY, 30 + Math.sin(t * 3) * 8, 0, Math.PI * 2);
      ctx.fill();

      // Gas diffusion cloud (multiple animated blobs)
      const cloudCenterX = W * 0.45;
      const cloudCenterY = H * 0.45;

      for (let layer = 3; layer >= 0; layer--) {
        const alpha = (0.06 + layer * 0.03) * (gasSeverity === 'critical' ? 1.5 : gasSeverity === 'caution' ? 1.0 : 0.5);
        const radius = 90 + layer * 45 + Math.sin(t * 0.7 + layer) * 15;
        const offsetX = Math.sin(t * 0.4 + layer * 1.2) * 20;
        const offsetY = Math.cos(t * 0.3 + layer * 0.8) * 12;

        const cloudGrad = ctx.createRadialGradient(
          cloudCenterX + offsetX, cloudCenterY + offsetY, 0,
          cloudCenterX + offsetX, cloudCenterY + offsetY, radius
        );
        cloudGrad.addColorStop(0, `rgba(${gc.r},${gc.g},${gc.b},${alpha})`);
        cloudGrad.addColorStop(0.5, `rgba(${gc.r},${gc.g},${gc.b},${alpha * 0.5})`);
        cloudGrad.addColorStop(1, `rgba(${gc.r},${gc.g},${gc.b},0)`);
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(cloudCenterX + offsetX, cloudCenterY + offsetY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gas flow particles (streaming from crack to cloud)
      ctx.save();
      for (let i = 0; i < 12; i++) {
        const phaseFrac = ((t * 0.8 + i / 12) % 1);
        const px = leakX + (cloudCenterX - leakX) * phaseFrac + Math.sin(t + i) * 15;
        const py = leakY + (cloudCenterY - leakY) * phaseFrac - phaseFrac * 20;
        const pAlpha = phaseFrac < 0.5 ? phaseFrac * 2 : (1 - phaseFrac) * 2;
        const pSize = 2 + phaseFrac * 5;
        ctx.fillStyle = `rgba(${gc.r},${gc.g},${gc.b},${pAlpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- GAS TRACKING LINE ---
      if (showResolution) {
        // Draw tracking path from source to surface
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leakX, leakY);
        ctx.bezierCurveTo(leakX - 40, leakY - 60, W * 0.5, H * 0.3, W * 0.3, H * 0.15);
        ctx.stroke();
        ctx.setLineDash([]);

        // Track arrow head
        ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
        ctx.beginPath();
        ctx.arc(W * 0.3, H * 0.15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('GAS ESCAPE ROUTE', W * 0.31, H * 0.14);

        // Resolution path (ventilation intervention)
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(W * 0.15, H * 0.5);
        ctx.bezierCurveTo(W * 0.25, H * 0.5, W * 0.45, H * 0.42, leakX, leakY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ventilation fan icon
        const fanX = W * 0.1;
        const fanY = H * 0.5;
        const fanR = 12 + Math.sin(t * 5) * 2;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fanX, fanY, fanR, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const angle = t * 4 + (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(fanX, fanY);
          ctx.lineTo(fanX + Math.cos(angle) * fanR * 0.9, fanY + Math.sin(angle) * fanR * 0.9);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('VENT', fanX - 12, fanY + fanR + 12);
      }

      // --- RESCUE TEAM ICONS ---
      const teams = [
        { x: W * 0.25, y: H * 0.72, label: 'α ALPHA', color: '#60a5fa' },
        { x: W * 0.5, y: H * 0.78, label: 'β BRAVO', color: '#a78bfa' },
        { x: W * 0.15, y: H * 0.62, label: 'γ CHARLIE', color: '#34d399' },
      ];
      teams.forEach(team => {
        // Helmet icon
        ctx.fillStyle = team.color;
        ctx.beginPath();
        ctx.arc(team.x, team.y - 10, 7, Math.PI, 0);
        ctx.rect(team.x - 7, team.y - 10, 14, 5);
        ctx.fill();
        // Body
        ctx.fillStyle = team.color + 'aa';
        ctx.fillRect(team.x - 4, team.y - 4, 8, 12);
        // Ping
        ctx.strokeStyle = team.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(team.x, team.y - 10, 10 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
        ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Label
        ctx.fillStyle = team.color;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(team.label, team.x - 20, team.y + 20);
      });

      // --- GAS SENSOR NODES ---
      const nodes = [
        { x: W * 0.42, y: H * 0.6, gas: ch4Severity, label: 'NODE-01\nCH\u2084' },
        { x: W * 0.58, y: H * 0.65, gas: coSeverity, label: 'NODE-02\nCO' },
        { x: W * 0.35, y: H * 0.52, gas: 'safe', label: 'NODE-03\nSO\u2082' },
      ];
      nodes.forEach(node => {
        const nc = { critical: '#ef4444', caution: '#f59e0b', safe: '#10b981' }[node.gas];
        ctx.fillStyle = nc;
        ctx.strokeStyle = nc;
        ctx.lineWidth = 1.5;
        // Sensor box
        ctx.fillRect(node.x - 6, node.y - 6, 12, 12);
        // Ping ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12 + Math.sin(t * 3 + node.x) * 4, 0, Math.PI * 2);
        ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Label
        ctx.fillStyle = nc;
        ctx.font = '8px monospace';
        const lines = node.label.split('\n');
        lines.forEach((line, i) => ctx.fillText(line, node.x + 8, node.y - 4 + i * 10));
      });

      // --- HUD OVERLAY ---
      // Gas levels display
      const hudX = 12;
      const hudY = H - 100;
      ctx.fillStyle = 'rgba(10,15,30,0.85)';
      ctx.strokeStyle = 'rgba(34,211,238,0.3)';
      ctx.lineWidth = 1;
      ctx.roundRect?.(hudX, hudY, 180, 90, 6);
      ctx.fillRect(hudX, hudY, 180, 90);
      ctx.strokeRect(hudX, hudY, 180, 90);

      const gasReadings = [
        { label: 'CH\u2084', value: `${ch4.toLocaleString()} ppm`, sev: ch4Severity },
        { label: 'CO', value: `${co} ppm`, sev: coSeverity },
        { label: 'SO\u2082', value: `${so2} ppm`, sev: 'safe' },
        { label: 'CO\u2082', value: `${co2} ppm`, sev: 'safe' },
      ];
      gasReadings.forEach((g, i) => {
        const col = { critical: '#ef4444', caution: '#f59e0b', safe: '#10b981' }[g.sev];
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(g.label + ':', hudX + 10, hudY + 18 + i * 18);
        ctx.fillStyle = col;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(g.value, hudX + 50, hudY + 18 + i * 18);
      });

      // Title overlay
      ctx.fillStyle = 'rgba(34,211,238,0.9)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('MINE DISASTER 3D VIEW \u2014 GAS TRACKING ACTIVE', W * 0.5 - 160, 20);

      // Severity badge
      const sevColor = gasSeverity === 'critical' ? '#ef4444' : gasSeverity === 'caution' ? '#f59e0b' : '#10b981';
      ctx.fillStyle = sevColor + '33';
      ctx.strokeStyle = sevColor;
      ctx.lineWidth = 1.5;
      ctx.fillRect(W - 140, 8, 128, 22);
      ctx.strokeRect(W - 140, 8, 128, 22);
      ctx.fillStyle = sevColor;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(gasSeverity.toUpperCase() + ' GAS LEVEL', W - 134, 23);
    };

    const drawTopView = (ctx, W, H, t) => {
      // Top-down map view
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#05080f');
      bg.addColorStop(1, '#0a0f1e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(30,41,59,0.6)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Tunnel corridors
      const tunnels = [
        { x1: 50, y1: H/2, x2: W - 50, y2: H/2, w: 60 },
        { x1: W * 0.3, y1: H * 0.2, x2: W * 0.3, y2: H * 0.8, w: 50 },
        { x1: W * 0.65, y1: H * 0.25, x2: W * 0.65, y2: H * 0.75, w: 45 },
        { x1: W * 0.3, y1: H * 0.35, x2: W * 0.65, y2: H * 0.35, w: 40 },
        { x1: W * 0.3, y1: H * 0.65, x2: W * 0.65, y2: H * 0.65, w: 40 },
      ];
      tunnels.forEach(t2 => {
        const angle = Math.atan2(t2.y2 - t2.y1, t2.x2 - t2.x1);
        const nx = Math.sin(angle) * t2.w / 2;
        const ny = Math.cos(angle) * t2.w / 2;
        ctx.fillStyle = '#0f1d30';
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(t2.x1 - nx, t2.y1 + ny);
        ctx.lineTo(t2.x2 - nx, t2.y2 + ny);
        ctx.lineTo(t2.x2 + nx, t2.y2 - ny);
        ctx.lineTo(t2.x1 + nx, t2.y1 - ny);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // Gas cloud (top view)
      const gc = gasSeverity === 'critical' ? [239, 68, 68] : gasSeverity === 'caution' ? [245, 158, 11] : [16, 185, 129];
      const leakX = W * 0.65;
      const leakY = H * 0.5;
      for (let layer = 4; layer >= 0; layer--) {
        const alpha = 0.05 + layer * 0.04;
        const r = 60 + layer * 35 + Math.sin(t * 0.5 + layer) * 10;
        const offX = Math.sin(t * 0.3 + layer) * 15;
        const offY = Math.cos(t * 0.4 + layer) * 10;
        const grad = ctx.createRadialGradient(leakX + offX, leakY + offY, 0, leakX + offX, leakY + offY, r);
        grad.addColorStop(0, `rgba(${gc[0]},${gc[1]},${gc[2]},${alpha * 2})`);
        grad.addColorStop(1, `rgba(${gc[0]},${gc[1]},${gc[2]},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(leakX + offX, leakY + offY, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flow arrows showing gas direction
      if (showResolution) {
        ctx.strokeStyle = `rgba(${gc[0]},${gc[1]},${gc[2]},0.6)`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        const arrowAngles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];
        arrowAngles.forEach((angle, ai) => {
          const dist = 80 + Math.sin(t + ai) * 10;
          const ex = leakX + Math.cos(angle) * dist;
          const ey = leakY + Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.moveTo(leakX + Math.cos(angle) * 25, leakY + Math.sin(angle) * 25);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // Ventilation intervention arrows (green)
        ctx.strokeStyle = 'rgba(16,185,129,0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(80, H / 2);
        ctx.lineTo(leakX - 25, leakY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Teams (top view dots)
      const teamPositions = [
        { x: W * 0.25, y: H * 0.5, label: 'ALPHA', color: '#60a5fa' },
        { x: W * 0.5, y: H * 0.65, label: 'BRAVO', color: '#a78bfa' },
        { x: W * 0.3, y: H * 0.35, label: 'CHARLIE', color: '#34d399' },
      ];
      teamPositions.forEach(tp => {
        ctx.fillStyle = tp.color;
        ctx.strokeStyle = tp.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 12 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = tp.color;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(tp.label, tp.x - 15, tp.y + 20);
      });

      // Nodes
      const nodePos = [
        { x: W * 0.42, y: H * 0.5, sev: ch4Severity, label: 'CH\u2084' },
        { x: W * 0.58, y: H * 0.5, sev: coSeverity, label: 'CO' },
        { x: W * 0.65, y: H * 0.35, sev: 'safe', label: 'SO\u2082' },
      ];
      nodePos.forEach(nd => {
        const nc = { critical: '#ef4444', caution: '#f59e0b', safe: '#10b981' }[nd.sev];
        ctx.fillStyle = nc;
        ctx.strokeStyle = nc + '99';
        ctx.lineWidth = 2;
        ctx.fillRect(nd.x - 5, nd.y - 5, 10, 10);
        ctx.font = '8px monospace';
        ctx.fillText(nd.label, nd.x + 7, nd.y + 4);
      });

      // HUD
      ctx.fillStyle = 'rgba(10,15,30,0.85)';
      ctx.fillRect(10, H - 95, 175, 85);
      ctx.strokeStyle = 'rgba(34,211,238,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, H - 95, 175, 85);
      const gasR2 = [
        { label: 'CH\u2084', value: `${ch4.toLocaleString()} ppm`, sev: ch4Severity },
        { label: 'CO', value: `${co} ppm`, sev: coSeverity },
        { label: 'SO\u2082', value: `${so2} ppm`, sev: 'safe' },
        { label: 'CO\u2082', value: `${co2} ppm`, sev: 'safe' },
      ];
      gasR2.forEach((g, i) => {
        const col = { critical: '#ef4444', caution: '#f59e0b', safe: '#10b981' }[g.sev];
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(g.label + ':', 20, H - 78 + i * 18);
        ctx.fillStyle = col;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(g.value, 58, H - 78 + i * 18);
      });

      ctx.fillStyle = 'rgba(34,211,238,0.9)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('TOP-DOWN MINE MAP \u2014 GAS DISPERSION', 20, 20);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [viewMode, gasSeverity, ch4, co, so2, co2, showResolution, ch4Severity, coSeverity]);

  // Resize canvas responsively
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    });
    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="carbon-panel rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-industrial text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              3D Cave Disaster Management
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                gasSeverity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' :
                gasSeverity === 'caution' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {gasSeverity === 'critical' ? <><AlertTriangle className="w-3 h-3" /> GAS CRITICAL</> :
                 gasSeverity === 'caution' ? <><AlertTriangle className="w-3 h-3" /> GAS CAUTION</> :
                 <><Shield className="w-3 h-3" /> STABLE</>}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">Real-time gas leak tracking • Rescue routing • Ventilation resolution</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResolution(v => !v)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold border transition-all ${
              showResolution
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {showResolution ? '✓ RESOLUTION PATHS' : 'SHOW PATHS'}
          </button>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {['3d', 'top'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  viewMode === mode
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-600/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === '3d' ? '3D VIEW' : 'TOP MAP'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-80 md:h-96">
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Footer legend */}
      <div className="px-4 py-2 border-t border-slate-800 flex flex-wrap gap-4 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/80 inline-block" /> Gas Source / Crack</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-400/80 inline-block" /> Gas Escape Tracking</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400/80 inline-block" /> Ventilation Resolution</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-400/80 inline-block" /> Rescue Teams</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400/80 inline-block" /> Gas Sensor Nodes</span>
      </div>
    </div>
  );
}
