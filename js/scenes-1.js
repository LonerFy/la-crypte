/* Décors : Le Cœur révélateur, Le Horla, La Chute de la maison Usher, Dracula.
   Coordonnées de scène : 1600 × 900, sol vers y = 620-640. */
(function () {
  'use strict';
  const C = window.Crypte, P = window.Paint;
  const SC = window.SCENES = window.SCENES || {};
  const TAU = Math.PI * 2;

  /* ---------- Outils de décor ---------- */
  const H = window.SceneKit = {};
  H.poly = (c, pts, fill) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } };
  H.room = (S, o) => {
    const c = S.ctx;
    const bx0 = o.bx0 == null ? 330 : o.bx0, bx1 = o.bx1 == null ? 1270 : o.bx1, by0 = o.by0 == null ? 110 : o.by0, by1 = o.by1 == null ? 640 : o.by1;
    const vx = (bx0 + bx1) / 2, vy = (by0 + by1) / 2 + (o.vpy || 0);
    const far = (x, y) => [vx + (x - vx) * 14, vy + (y - vy) * 14];
    H.poly(c, [[bx0, by0], [bx1, by0], far(bx1, by0), far(bx0, by0)], o.ceil || '#0b0a09');
    let g = c.createLinearGradient(0, by1, 0, by1 + 520); g.addColorStop(0, o.floor || '#1a120c'); g.addColorStop(1, C.shade(o.floor || '#1a120c', 0.55));
    H.poly(c, [[bx0, by1], [bx1, by1], far(bx1, by1), far(bx0, by1)], g);
    g = c.createLinearGradient(bx0, 0, bx0 - 700, 0); g.addColorStop(0, o.side || C.shade(o.wall, 0.75)); g.addColorStop(1, C.shade(o.side || o.wall, 0.4));
    H.poly(c, [[bx0, by0], [bx0, by1], far(bx0, by1), far(bx0, by0)], g);
    g = c.createLinearGradient(bx1, 0, bx1 + 700, 0); g.addColorStop(0, o.side || C.shade(o.wall, 0.75)); g.addColorStop(1, C.shade(o.side || o.wall, 0.4));
    H.poly(c, [[bx1, by0], [bx1, by1], far(bx1, by1), far(bx1, by0)], g);
    c.fillStyle = o.wall; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    if (o.stripes) { c.fillStyle = 'rgba(255,240,220,0.035)'; for (let x = bx0 + 10; x < bx1; x += 44) c.fillRect(x, by0, 14, by1 - by0); }
    c.save(); c.globalAlpha = o.grit == null ? 0.4 : o.grit; c.drawImage(P.tint(P.gritTex(), '#000000'), bx0, by0, bx1 - bx0, by1 - by0); c.restore();
    if (o.peel) { c.fillStyle = 'rgba(0,0,0,0.25)'; const r = C.seeded(o.peel); for (let i = 0; i < 9; i++) { const x = bx0 + r() * (bx1 - bx0), y = by0 + r() * (by1 - by0) * 0.8; c.beginPath(); c.ellipse(x, y, 20 + r() * 50, 10 + r() * 30, r(), 0, TAU); c.fill(); } }
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(bx0, by1 - 16, bx1 - bx0, 16);
    c.strokeStyle = 'rgba(0,0,0,0.38)'; c.lineWidth = 2;
    const n = o.planks || 12;
    for (let i = -n; i <= n * 2; i++) { const x = bx0 + i * (bx1 - bx0) / n; const f = far(x, by1); c.beginPath(); c.moveTo(x, by1); c.lineTo(f[0], f[1]); c.stroke(); }
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 3;
    [[bx0, by0], [bx1, by0], [bx0, by1], [bx1, by1]].forEach((p) => { const f = far(p[0], p[1]); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(f[0], f[1]); c.stroke(); });
    return { bx0, bx1, by0, by1, vx, vy, far };
  };
  H.stone = (c, x, y, w, h, base, bw, bh) => {
    c.fillStyle = base; c.fillRect(x, y, w, h);
    c.save(); c.globalAlpha = 0.5; c.drawImage(P.tint(P.gritTex(), '#000000'), x, y, w, h); c.restore();
    c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 2;
    const BW = bw || 90, BH = bh || 46;
    for (let yy = y, row = 0; yy < y + h; yy += BH, row++) {
      c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke();
      for (let xx = x + (row % 2 ? BW / 2 : 0); xx < x + w; xx += BW) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, Math.min(y + h, yy + BH)); c.stroke(); }
    }
  };
  H.beam = (c, x0, y0, x1, y1, w0, w1, col, a) => {
    if (a <= 0) return;
    const nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1, ux = nx / L, uy = ny / L;
    const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, C.rgba(col, a)); g.addColorStop(1, C.rgba(col, a * 0.35));
    const op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter';
    c.fillStyle = g; c.beginPath(); c.moveTo(x0 + ux * w0, y0 + uy * w0); c.lineTo(x1 + ux * w1, y1 + uy * w1); c.lineTo(x1 - ux * w1, y1 - uy * w1); c.lineTo(x0 - ux * w0, y0 - uy * w0); c.fill();
    c.globalCompositeOperation = op;
  };
  H.sit = (c, x, y, h, col, o) => {
    o = o || {}; const u = h / 100; c.fillStyle = col;
    c.fillRect(x - 8 * u, y - 50 * u, 30 * u, 9 * u);
    c.fillRect(x + 15 * u, y - 46 * u, 7 * u, 46 * u); c.fillRect(x + 15 * u, y - 4 * u, 13 * u, 4 * u);
    c.beginPath(); c.moveTo(x - 11 * u, y - 48 * u); c.lineTo(x + 6 * u, y - 48 * u); c.lineTo(x + 5 * u, y - 86 * u); c.lineTo(x - 11 * u, y - 86 * u); c.fill();
    c.beginPath(); c.ellipse(x - 2 * u, y - 94 * u, 6.5 * u, 7.5 * u, 0, 0, TAU); c.fill();
    if (o.hat) { c.fillRect(x - 10 * u, y - 101 * u, 20 * u, 2.4 * u); c.fillRect(x - 7 * u, y - 118 * u, 14 * u, 17 * u); }
    c.beginPath(); c.moveTo(x + 2 * u, y - 82 * u); c.lineTo(x + 18 * u, y - 56 * u); c.lineTo(x + 14 * u, y - 52 * u); c.lineTo(x - 2 * u, y - 72 * u); c.fill();
  };
  H.chair = (c, x, y, h, col, front) => {
    const u = h / 100; c.fillStyle = col;
    if (front) {
      c.fillRect(x - 32 * u, y - 100 * u, 6 * u, 100 * u); c.fillRect(x + 26 * u, y - 100 * u, 6 * u, 100 * u);
      c.fillRect(x - 32 * u, y - 100 * u, 64 * u, 6 * u); c.fillRect(x - 32 * u, y - 80 * u, 64 * u, 4 * u); c.fillRect(x - 32 * u, y - 62 * u, 64 * u, 4 * u);
      c.fillRect(x - 38 * u, y - 48 * u, 76 * u, 7 * u);
      c.fillRect(x - 36 * u, y - 44 * u, 5 * u, 44 * u); c.fillRect(x + 31 * u, y - 44 * u, 5 * u, 44 * u);
    } else {
      c.fillRect(x - 14 * u, y - 100 * u, 5 * u, 100 * u); c.fillRect(x - 14 * u, y - 48 * u, 34 * u, 5 * u); c.fillRect(x + 16 * u, y - 46 * u, 5 * u, 46 * u);
      c.fillRect(x - 14 * u, y - 96 * u, 5 * u, 4 * u);
    }
  };
  H.drape = (c, x, y, w, h, col, t, side, wind) => {
    const sw = Math.sin(t * 1.1 + x) * 8 * (wind || 1);
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, C.shade(col, 0.5)); g.addColorStop(0.5, col); g.addColorStop(1, C.shade(col, 0.45));
    c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y);
    if (side > 0) { c.quadraticCurveTo(x + w * 0.4 + sw, y + h * 0.5, x + w * 0.55 + sw * 1.5, y + h); c.lineTo(x - 4, y + h); }
    else { c.lineTo(x + w + 4, y + h); c.quadraticCurveTo(x + w * 0.6 + sw, y + h * 0.5, x + w * 0.45 + sw * 1.5, y + h); c.lineTo(x, y + h); }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2;
    for (let i = 1; i < 5; i++) { const xx = x + w * i / 5; c.beginPath(); c.moveTo(xx, y); c.quadraticCurveTo(xx + sw * 0.5, y + h * 0.5, xx + sw, y + h * 0.95); c.stroke(); }
  };
  H.books = (c, x0, y0, x1, y1, shelves, seed) => {
    c.fillStyle = '#120c08'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    const r = C.seeded(seed || 3); const sh = (y1 - y0) / shelves;
    const cols = ['#3a1410', '#1e2a1c', '#2a2016', '#3a2a14', '#1a1a26', '#4a3a24'];
    for (let s = 0; s < shelves; s++) {
      const by = y0 + (s + 1) * sh - 8; let x = x0 + 8;
      while (x < x1 - 14) { const bw = 10 + r() * 16, bh = sh * (0.55 + r() * 0.35); if (r() < 0.06) { x += 20; continue; } c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x, by - bh, bw, bh); c.fillStyle = 'rgba(200,170,90,0.18)'; c.fillRect(x + 2, by - bh + 8, bw - 4, 2); x += bw + 1; }
      c.fillStyle = '#0a0705'; c.fillRect(x0, by, x1 - x0, 8);
    }
  };
  H.wheel = (c, x, y, r, a, col) => {
    c.strokeStyle = col; c.lineWidth = r * 0.12; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.lineWidth = r * 0.06; for (let i = 0; i < 8; i++) { const aa = a + i * Math.PI / 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(aa) * r, y + Math.sin(aa) * r); c.stroke(); }
  };
  H.stormWin = (S, c, x, y, w, h, t, o) => {
    o = o || {};
    c.save(); c.beginPath();
    if (o.gothic) { c.moveTo(x, y + h); c.lineTo(x, y + w * 0.55); c.quadraticCurveTo(x, y, x + w / 2, y - w * 0.18); c.quadraticCurveTo(x + w, y, x + w, y + w * 0.55); c.lineTo(x + w, y + h); c.closePath(); }
    else c.rect(x, y, w, h);
    c.clip();
    const fl = S.flash;
    const g = c.createLinearGradient(0, y - w * 0.2, 0, y + h); g.addColorStop(0, C.mix('#070a12', '#c8d4ff', fl * 0.8)); g.addColorStop(1, C.mix('#1a2232', '#e0e8ff', fl * 0.6));
    c.fillStyle = g; c.fillRect(x - 10, y - w * 0.3, w + 20, h + w * 0.4);
    P.clouds(c, { x0: x - 20, x1: x + w + 20 }, y - 20, h * 0.6, 0.6, t * 14, C.mix('#05070c', '#8890a8', fl));
    if (S.bolt) P.drawBolt(c, S.bolt, S.bolt.life, '#9fc4ff');
    if (o.rain !== false) { c.strokeStyle = 'rgba(180,200,230,0.25)'; c.lineWidth = 1; const r = C.seeded(Math.floor(t * 8)); for (let i = 0; i < 30; i++) { const rx = x + r() * w, ry = y + r() * h; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 2, ry + 14); c.stroke(); } }
    c.restore();
    c.strokeStyle = o.frame || '#070506'; c.lineWidth = Math.max(4, w * 0.04);
    c.beginPath(); c.moveTo(x + w / 2, y - (o.gothic ? w * 0.18 : 0)); c.lineTo(x + w / 2, y + h); for (let k = 1; k < 4; k++) { c.moveTo(x, y + h * k / 4); c.lineTo(x + w, y + h * k / 4); } c.stroke();
    c.lineWidth = Math.max(6, w * 0.06); c.strokeRect(x, y, w, h);
  };
  H.crows = (c, st, t, dt, v, n, col) => {
    if (!st.crowF) { st.crowF = []; for (let i = 0; i < n; i++) st.crowF.push({ x: v.x0 + Math.random() * (v.x1 - v.x0), y: 120 + Math.random() * 200, s: 14 + Math.random() * 10, ph: Math.random() * 6, vx: 50 + Math.random() * 60 }); }
    for (const b of st.crowF) { b.x += b.vx * dt; b.ph += dt * 9; if (b.x > v.x1 + 60) { b.x = v.x0 - 60; b.y = 100 + Math.random() * 220; } P.crow(c, b.x, b.y + Math.sin(b.ph * 0.3) * 6, b.s, 'fly', 1, col || '#050405', b.ph); }
  };
  H.bats = (c, st, t, dt, cx, cy, n, rad, col) => {
    if (!st.batO) { st.batO = []; for (let i = 0; i < n; i++) st.batO.push({ a: Math.random() * TAU, r: rad * (0.6 + Math.random() * 0.6), sp: 0.5 + Math.random() * 0.6, s: 8 + Math.random() * 8, ph: Math.random() * 6, dy: Math.random() * 60 - 30 }); }
    for (const b of st.batO) { b.a += b.sp * dt; b.ph += dt * 16; P.bat(c, cx + Math.cos(b.a) * b.r, cy + Math.sin(b.a * 2) * 40 + b.dy, b.s, b.ph, col); }
  };

  /* =====================================================================
     LE CŒUR RÉVÉLATEUR
     ===================================================================== */
  SC['tt-confess'] = {
    focus: [800, 400], dark: 0.9, darkCol: '#030304', desat: 0.4,
    draw(S, st, t, dt) {
      const c = S.ctx; S.layer(0.5);
      H.room(S, { wall: '#2b2620', floor: '#1b130d', stripes: true, peel: 4 });
      c.fillStyle = '#0d1420'; c.fillRect(1060, 200, 120, 150);
      c.fillStyle = 'rgba(120,150,190,0.35)'; c.fillRect(1066, 206, 108, 138);
      c.fillStyle = '#060606'; for (let i = 0; i < 5; i++) c.fillRect(1068 + i * 26, 200, 6, 150);
      const v = S.layer(1);
      const ang = Math.sin(t * 0.8) * (0.1 + S.lvl * 0.12);
      st.lx = 800 + Math.sin(ang) * 420; st.ly = -120 + Math.cos(ang) * 420;
      c.strokeStyle = '#050505'; c.lineWidth = 3; c.beginPath(); c.moveTo(800, v.y0 - 20); c.lineTo(800, -120); c.lineTo(st.lx, st.ly); c.stroke();
      const sx = st.lx - 800;
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.ellipse(800 - sx * 0.7, 650, 120, 18, 0, 0, TAU); c.fill();
      H.beam(c, st.lx, st.ly + 30, 800 - sx * 0.3, 660, 30, 260, '#ffd9a0', 0.07);
      H.chair(c, 800, 650, 230, '#0b0806', true);
      c.fillStyle = '#141009'; c.beginPath(); c.moveTo(st.lx - 50, st.ly + 20); c.lineTo(st.lx + 50, st.ly + 20); c.lineTo(st.lx + 20, st.ly - 10); c.lineTo(st.lx - 20, st.ly - 10); c.fill();
      c.fillStyle = 'rgba(255,214,150,0.95)'; c.beginPath(); c.ellipse(st.lx, st.ly + 30, 16, 14, 0, 0, TAU); c.fill();
      P.glow(c, st.lx, st.ly + 30, 140, '#ffcf86', 0.5);
      P.parts(c, st, 'dust', 'dust', 60, v, dt, t, { col: '#ffe8c0' });
    },
    lights(st) { return [{ x: st.lx || 800, y: (st.ly || 300) + 40, r: 640, i: 1, c: '#ffcf86', g: 0.22 }, { x: 1120, y: 280, r: 240, i: 0.35, c: '#8fb0d8', g: 0.1 }]; }
  };

  SC['tt-door'] = {
    focus: [820, 440], dark: 0.86, darkCol: '#020203', desat: 0.4,
    init(st) { st.door = 0.06; st.ray = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; S.layer(0.5);
      H.room(S, { bx0: 560, bx1: 1060, by0: 170, by1: 620, wall: '#241f1b', floor: '#1d140d', stripes: true, planks: 8, peel: 9 });
      c.fillStyle = '#0a0705'; c.fillRect(694, 290, 212, 330);
      c.fillStyle = '#000'; c.fillRect(706, 300, 188, 320);
      c.fillStyle = 'rgba(60,80,120,0.25)'; c.fillRect(720, 300, 40 * st.door, 320);
      const op = C.clamp(st.door, 0, 1), pw = 188 * Math.cos(op * 1.35);
      const g = c.createLinearGradient(706, 0, 706 + pw, 0); g.addColorStop(0, '#2e2117'); g.addColorStop(1, '#1a120c');
      c.fillStyle = g; c.beginPath(); c.moveTo(706, 300); c.lineTo(706 + pw, 300 - op * 26); c.lineTo(706 + pw, 620 + op * 26); c.lineTo(706, 620); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 3; c.strokeRect(706 + pw * 0.12, 330, pw * 0.76, 110); c.strokeRect(706 + pw * 0.12, 470, pw * 0.76, 120);
      c.fillStyle = '#b89a5a'; c.beginPath(); c.arc(706 + pw * 0.88, 460, 6, 0, TAU); c.fill();
      c.fillStyle = '#100b07'; c.fillRect(950, 300, 60, 320); c.fillRect(942, 290, 76, 16);
      c.fillStyle = '#d8ccb0'; c.beginPath(); c.arc(980, 340, 20, 0, TAU); c.fill();
      c.strokeStyle = '#111'; c.lineWidth = 2; const hh = (t / 60) * TAU; c.beginPath(); c.moveTo(980, 340); c.lineTo(980, 326); c.moveTo(980, 340); c.lineTo(980 + Math.sin(hh) * 14, 340 - Math.cos(hh) * 14); c.stroke();
      c.fillStyle = '#000'; c.fillRect(962, 380, 36, 200);
      const pa = Math.sin(t * Math.PI) * 0.35; c.strokeStyle = '#a8894a'; c.lineWidth = 2; c.beginPath(); c.moveTo(980, 390); c.lineTo(980 + Math.sin(pa) * 120, 390 + Math.cos(pa) * 120); c.stroke();
      c.fillStyle = '#a8894a'; c.beginPath(); c.arc(980 + Math.sin(pa) * 128, 390 + Math.cos(pa) * 128, 9, 0, TAU); c.fill();
      S.layer(1.35);
      c.fillStyle = '#060404'; c.beginPath(); c.moveTo(1700, 1100); c.quadraticCurveTo(1420, 900, 1230, 800); c.lineTo(1250, 760); c.quadraticCurveTo(1450, 820, 1750, 950); c.fill();
      c.fillStyle = '#16120c'; c.fillRect(1150, 690, 70, 110); c.beginPath(); c.moveTo(1140, 692); c.lineTo(1230, 692); c.lineTo(1185, 650); c.fill();
      c.strokeStyle = '#16120c'; c.lineWidth = 5; c.beginPath(); c.arc(1185, 640, 16, Math.PI, 0); c.stroke();
      c.fillStyle = C.rgba('#ffcf86', 0.25 + st.ray * 0.7); c.fillRect(1146, 742, 6, 10);
      if (st.ray > 0.02) { H.beam(c, 1148, 747, 790, 470, 2, 14, '#ffe6b0', 0.4 * st.ray); P.glow(c, 790, 470, 60, '#ffe6b0', 0.5 * st.ray); }
    },
    lights(st) { return [{ x: 1185, y: 740, r: 200, i: 0.45, c: '#ffcf86', d: 1.35 }, { x: 790, y: 470, r: 160, i: st.ray * 0.8, c: '#ffe6b0' }, { x: 730, y: 460, r: 220, i: st.door * 0.3, c: '#5a78a8' }]; }
  };

  SC['tt-bed'] = {
    focus: [760, 430], dark: 0.86, darkCol: '#020203', desat: 0.35,
    init(st) { st.sit = 0; st.eye = 0; st.ray = 0; },
    draw(S, st, t) {
      const c = S.ctx; S.layer(0.5);
      H.room(S, { wall: '#1f1c19', floor: '#160f0a', stripes: true });
      S.layer(1);
      c.fillStyle = '#0c0907';
      c.fillRect(500, 220, 22, 420); c.fillRect(1180, 220, 22, 420); c.fillRect(490, 205, 722, 26);
      H.drape(c, 520, 230, 90, 380, '#3a0e0e', t, 1, 0.3); H.drape(c, 1090, 230, 90, 380, '#3a0e0e', t, -1, 0.3);
      c.fillStyle = '#120d09'; c.fillRect(520, 380, 40, 260); c.fillRect(1150, 470, 40, 170);
      c.fillStyle = '#26201a'; c.fillRect(540, 556, 640, 60);
      c.fillStyle = '#3a342c'; c.beginPath(); c.moveTo(640, 560); c.quadraticCurveTo(820, 520, 1000, 548); c.quadraticCurveTo(1100, 545, 1160, 560); c.lineTo(1160, 600); c.lineTo(620, 600); c.fill();
      c.fillStyle = '#4a443a'; c.beginPath(); c.ellipse(600, 548, 50, 18, 0, 0, TAU); c.fill();
      const s = C.easeIO(C.clamp(st.sit, 0, 1));
      const hx = C.lerp(600, 640, s), hy = C.lerp(530, 420, s);
      c.fillStyle = '#0d0a08';
      if (s > 0.05) { c.beginPath(); c.moveTo(620, 560); c.lineTo(hx - 24, hy + 20); c.lineTo(hx + 26, hy + 26); c.lineTo(690, 560); c.fill(); }
      c.beginPath(); c.ellipse(hx, hy, 24, 28, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(hx - 24, hy - 10); c.quadraticCurveTo(hx - 10, hy - 60, hx + 30, hy - 50); c.lineTo(hx + 44, hy - 30); c.quadraticCurveTo(hx + 20, hy - 30, hx + 22, hy - 12); c.fill();
      st.ex = hx + 13; st.ey = hy - 2;
      if (st.eye > 0.02) {
        const op = C.clamp(st.eye, 0, 1);
        P.glow(c, st.ex, st.ey, 80, '#c8dcf0', 0.6 * op * Math.max(0.3, st.ray));
        c.fillStyle = C.rgba('#d8e4ee', op); c.beginPath(); c.moveTo(st.ex - 14, st.ey); c.quadraticCurveTo(st.ex, st.ey - 14 * op, st.ex + 14, st.ey); c.quadraticCurveTo(st.ex, st.ey + 12 * op, st.ex - 14, st.ey); c.fill();
        if (op > 0.6) { c.fillStyle = 'rgba(100,130,155,0.9)'; c.beginPath(); c.arc(st.ex + 1, st.ey, 5.5, 0, TAU); c.fill(); c.fillStyle = '#05080a'; c.beginPath(); c.arc(st.ex + 1, st.ey, 2, 0, TAU); c.fill(); c.fillStyle = 'rgba(235,242,246,0.6)'; c.beginPath(); c.ellipse(st.ex + 2, st.ey, 7, 5, 0.3, 0, TAU); c.fill(); }
      }
      if (st.ray > 0.02) H.beam(c, 1500, 640, st.ex + 4, st.ey, 3, 8, '#ffe6b0', 0.32 * st.ray);
    },
    lights(st) { return [{ x: st.ex || 650, y: st.ey || 440, r: 190, i: 0.25 + st.ray * 0.75, c: '#ffe6b0', g: 0.25 }, { x: 1400, y: 600, r: 300, i: 0.2 + st.ray * 0.3, c: '#ffcf86' }, { x: 860, y: 300, r: 700, i: 0.18, c: '#6a7a9a' }]; }
  };

  SC['tt-floor'] = {
    focus: [800, 470], dark: 0.8, darkCol: '#030202', desat: 0.3,
    init(st) { st.lift = 0; st.glow = 0; },
    draw(S, st, t) {
      const c = S.ctx; const v = S.layer(0.9);
      c.fillStyle = '#20160e'; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      const r = C.seeded(12);
      for (let y = Math.floor(v.y0 / 64) * 64; y < v.y1; y += 64) {
        let x = Math.floor(v.x0 / 300) * 300 - r() * 200;
        while (x < v.x1) {
          const L = 260 + r() * 340, inC = y >= 380 && y < 570 && x > 380 && x < 1100;
          const lift = inC ? st.lift * (y === 384 ? -6 : 4) : 0;
          c.fillStyle = C.shade('#3a2817', 0.75 + r() * 0.35); c.fillRect(x, y + lift, L, 60);
          c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + 6, y + lift + 10 + k * 13 + r() * 4); c.quadraticCurveTo(x + L / 2, y + lift + 8 + k * 13 + r() * 8, x + L - 6, y + lift + 10 + k * 13); c.stroke(); }
          c.fillStyle = '#0c0805'; c.beginPath(); c.arc(x + 14, y + lift + 30, 3, 0, TAU); c.arc(x + L - 14, y + lift + 30, 3, 0, TAU); c.fill();
          x += L + 4;
        }
      }
      if (st.glow > 0.01) {
        const pu = 0.45 + 0.55 * S.bump;
        c.save(); c.globalCompositeOperation = 'lighter';
        c.fillStyle = C.rgba('#b0101a', 0.5 * st.glow * pu);
        [384, 448, 512].forEach((y) => c.fillRect(420, y - 4, 640, 5));
        c.restore();
        P.glow(c, 760, 470, 300, '#c0101a', 0.35 * st.glow * pu);
      }
      P.candle(c, 260, 720, 120, t, 1, 3);
    },
    lights(st, S) { return [{ x: 260, y: 600, r: 620, i: 0.95, c: '#ffcf86', g: 0.2 }, { x: 760, y: 470, r: 420, i: st.glow * (0.3 + 0.5 * S.bump), c: '#c0101a', g: 0.1 }]; }
  };

  SC['tt-police'] = {
    focus: [820, 440], dark: 0.55, darkCol: '#05070c', desat: 0.55,
    init(st) { st.glow = 0; },
    hot: { heart: { x: 800, y: 630, r: 110 } },
    draw(S, st, t, dt) {
      const c = S.ctx; S.layer(0.5);
      H.room(S, { wall: '#3a3a3c', floor: '#241a12', stripes: true, side: '#2a2a2c' });
      c.fillStyle = '#9fb0c4'; c.fillRect(1080, 200, 150, 260); c.fillStyle = '#0a0b0d'; c.fillRect(1152, 200, 6, 260); c.fillRect(1080, 326, 150, 6);
      S.layer(1);
      P.rays(c, 1155, 330, 2.6, 0.5, 900, '#b8c8dc', 0.07, 5, t);
      if (st.glow > 0.01) P.glow(c, 800, 640, 160, '#c0101a', 0.4 * st.glow * (0.4 + 0.6 * S.bump));
      [[560, 0], [800, 1], [1040, 2]].forEach(([x, i]) => {
        H.chair(c, x - 6, 640, 150, '#0d0a08');
        H.sit(c, x, 640, 210, '#0b0d14', { hat: true });
        c.fillStyle = '#c8a24a'; c.beginPath(); c.arc(x - 1, 640 - 210 * 0.7, 2.5, 0, TAU); c.arc(x - 1, 640 - 210 * 0.62, 2.5, 0, TAU); c.fill();
      });
      P.fig(c, 1260, 650, 300, 'man', { col: '#060606', raise: st.raise || 0 });
      P.parts(c, st, 'dust', 'dust', 40, S.view, dt, t, { col: '#e0e8f0' });
    },
    lights(st, S) { return [{ x: 1150, y: 340, r: 900, i: 0.7, c: '#b8c8dc', g: 0.08 }, { x: 800, y: 640, r: 260, i: st.glow * (0.3 + 0.6 * S.bump), c: '#c0101a' }]; }
  };

  /* =====================================================================
     LE HORLA
     ===================================================================== */
  function house(c, x, y, w, h, wall, roof, lit, t) {
    c.fillStyle = wall; c.fillRect(x, y - h, w, h);
    c.fillStyle = roof; c.beginPath(); c.moveTo(x - 14, y - h); c.lineTo(x + w * 0.2, y - h - h * 0.55); c.lineTo(x + w * 0.8, y - h - h * 0.55); c.lineTo(x + w + 14, y - h); c.fill();
    c.fillRect(x + w * 0.7, y - h - h * 0.75, w * 0.08, h * 0.3);
    const cols = 4, rows = 2;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const wx = x + w * (0.1 + i * 0.22), wy = y - h + h * (0.15 + j * 0.45);
      P.win(c, wx, wy, w * 0.12, h * 0.3, lit && (i + j) % 3 === 0 ? 0.8 : 0, t, '#ffc56a', { frame: '#2a2a2a', dark: '#1c2026' });
      c.fillStyle = '#2f4a32'; c.fillRect(wx - w * 0.05, wy, w * 0.045, h * 0.3); c.fillRect(wx + w * 0.125, wy, w * 0.045, h * 0.3);
    }
  }
  SC['ho-river'] = {
    focus: [800, 430], dark: 0.1, darkCol: '#0d1014', desat: 0.15,
    init(st) { st.ship = -1; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.1);
      P.sky(c, v, [[0, '#9fb0bc'], [0.5, '#d7d2c2'], [0.62, '#ecdcb8'], [1, '#c9b48a']]);
      P.glow(c, 1150, 300, 400, '#fff2c8', 0.5);
      P.clouds(c, v, 60, 260, 0.35, t * 4, '#f4ece0');
      v = S.layer(0.35);
      P.ridge(c, v, 520, 40, 2, '#7e8a84');
      for (let i = 0; i < 26; i++) { const x = -300 + i * 95 + Math.sin(i * 7) * 30, hh = 90 + Math.sin(i * 3.3) * 25; c.fillStyle = '#4c5a4c'; c.beginPath(); c.ellipse(x, 520 - hh / 2, 16, hh / 2, 0, 0, TAU); c.fill(); }
      v = S.layer(0.6);
      const g = c.createLinearGradient(0, 535, 0, 780); g.addColorStop(0, '#9aa8ac'); g.addColorStop(1, '#3d4a50');
      c.fillStyle = g; c.fillRect(v.x0, 535, v.x1 - v.x0, 300);
      if (st.ship >= 0) {
        st.ship = Math.min(1, st.ship + dt / 26);
        const x = 1900 - st.ship * 2300, y = 610;
        c.save(); c.translate(x, y); c.rotate(Math.sin(t * 0.8) * 0.02);
        c.fillStyle = '#1e1a18'; c.beginPath(); c.moveTo(-150, -10); c.lineTo(160, -10); c.lineTo(130, 22); c.lineTo(-130, 22); c.fill();
        c.fillStyle = '#e9e6dc';
        [[-90, 140], [-10, 170], [70, 130]].forEach(([mx, mh]) => {
          c.fillStyle = '#1e1a18'; c.fillRect(mx - 2, -10 - mh, 4, mh);
          c.fillStyle = '#f2efe6'; for (let k = 0; k < 3; k++) { const sy = -10 - mh + 12 + k * mh * 0.28; c.beginPath(); c.moveTo(mx - 34 + k * 4, sy); c.quadraticCurveTo(mx, sy - 6, mx + 34 - k * 4, sy); c.lineTo(mx + 30 - k * 4, sy + mh * 0.22); c.quadraticCurveTo(mx, sy + mh * 0.26, mx - 30 + k * 4, sy + mh * 0.22); c.fill(); }
        });
        c.fillStyle = '#1f7a3a'; c.fillRect(70, -150, 22, 14); c.fillStyle = '#e8c832'; c.beginPath(); c.moveTo(81, -149); c.lineTo(90, -143); c.lineTo(81, -137); c.lineTo(72, -143); c.fill();
        c.restore();
      }
      P.reflect(S, 538, 0.6, 0.55, t, '#3d4a50', 240);
      P.fog(c, v, 520, 90, 0.35, t * 10, '#f2ede2');
      v = S.layer(1);
      c.fillStyle = '#2f3a24'; c.beginPath(); c.moveTo(v.x0, 780); c.quadraticCurveTo(600, 740, 1100, 770); c.quadraticCurveTo(1400, 785, v.x1, 760); c.lineTo(v.x1, v.y1 + 10); c.lineTo(v.x0, v.y1 + 10); c.fill();
      house(c, 120, 760, 300, 190, '#ddd6c6', '#3c4046', false, t);
      for (let i = 0; i < 18; i++) { c.fillStyle = C.shade('#2b3a22', 0.7 + (i % 4) * 0.1); c.beginPath(); c.arc(-60 + i * 22 + Math.sin(i) * 20, 470 + Math.cos(i * 1.7) * 40 + Math.sin(t * 0.6 + i) * 3, 70, 0, TAU); c.fill(); }
      c.fillStyle = '#2a2018'; c.fillRect(10, 520, 22, 250);
      v = S.layer(1.3);
      c.strokeStyle = '#1f2a16'; c.lineWidth = 2;
      for (let i = 0; i < 80; i++) { const x = v.x0 + (i / 80) * (v.x1 - v.x0), h = 30 + (i * 37 % 40); c.beginPath(); c.moveTo(x, v.y1 + 5); c.quadraticCurveTo(x + 6, v.y1 - h / 2, x + 10 + Math.sin(t + i) * 4, v.y1 - h); c.stroke(); }
    }
  };

  SC['ho-bedroom'] = {
    focus: [800, 430], dark: 0.9, darkCol: '#03050a', desat: 0.35,
    init(st) { st.water = 1; st.candle = 1; st.presence = 0; },
    hot: { carafe: { x: 690, y: 470, r: 70 } },
    draw(S, st, t) {
      const c = S.ctx; S.layer(0.5);
      H.room(S, { wall: '#2a2a30', floor: '#1a140f', stripes: true });
      c.fillStyle = '#0a1020'; c.fillRect(1000, 200, 180, 300);
      const mg = c.createLinearGradient(0, 200, 0, 500); mg.addColorStop(0, '#2a3a5a'); mg.addColorStop(1, '#0e1626'); c.fillStyle = mg; c.fillRect(1008, 208, 164, 284);
      P.moon(c, 1120, 260, 22, '#e8eef8', { halo: 0.5 });
      c.fillStyle = '#05060a'; c.fillRect(1086, 200, 8, 300); c.fillRect(1000, 340, 180, 8);
      H.drape(c, 960, 190, 80, 340, '#5a5a6a', t, 1, 1.4); H.drape(c, 1140, 190, 80, 340, '#5a5a6a', t + 1, -1, 1.4);
      S.layer(1);
      c.fillStyle = '#120d09'; c.fillRect(360, 180, 200, 460); c.fillRect(350, 165, 220, 22);
      const gm = c.createLinearGradient(380, 210, 540, 600); gm.addColorStop(0, '#3a4048'); gm.addColorStop(0.5, '#1c2026'); gm.addColorStop(1, '#2a3038');
      c.fillStyle = gm; c.fillRect(384, 210, 152, 380);
      c.fillStyle = 'rgba(255,255,255,0.05)'; c.beginPath(); c.moveTo(384, 300); c.lineTo(536, 220); c.lineTo(536, 260); c.lineTo(384, 340); c.fill();
      c.fillStyle = '#1a120c'; c.fillRect(1180, 470, 420, 40); c.fillStyle = '#d0ccc0'; c.beginPath(); c.moveTo(1180, 470); c.quadraticCurveTo(1300, 430, 1600, 450); c.lineTo(1600, 520); c.lineTo(1180, 520); c.fill();
      c.fillStyle = '#100a07'; c.fillRect(1180, 470, 22, 170);
      c.fillStyle = '#1c130c'; c.fillRect(620, 520, 220, 16); c.fillRect(632, 536, 12, 104); c.fillRect(816, 536, 12, 104); c.fillRect(636, 590, 188, 8);
      const cx = 690, cy = 520;
      c.save(); c.beginPath(); c.moveTo(cx - 8, cy - 100); c.lineTo(cx + 8, cy - 100); c.lineTo(cx + 8, cy - 70); c.quadraticCurveTo(cx + 34, cy - 50, cx + 30, cy - 4); c.lineTo(cx - 30, cy - 4); c.quadraticCurveTo(cx - 34, cy - 50, cx - 8, cy - 70); c.closePath();
      c.fillStyle = 'rgba(180,200,215,0.12)'; c.fill(); c.clip();
      const lvl = C.clamp(st.water, 0, 1);
      if (lvl > 0.01) { const wy = cy - 4 - 70 * lvl; c.fillStyle = 'rgba(140,175,200,0.4)'; c.fillRect(cx - 40, wy, 80, 80); c.fillStyle = 'rgba(220,240,255,0.5)'; c.fillRect(cx - 40, wy, 80, 2); }
      c.restore();
      c.strokeStyle = 'rgba(220,235,245,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 8, cy - 100); c.lineTo(cx - 8, cy - 70); c.quadraticCurveTo(cx - 34, cy - 50, cx - 30, cy - 4); c.stroke();
      c.fillStyle = 'rgba(220,235,245,0.25)'; c.fillRect(cx + 50, cy - 40, 30, 38);
      P.candle(c, 790, 520, 70, t, st.candle, 11);
      if (st.presence > 0.01) {
        c.save(); c.globalAlpha = st.presence * 0.55; const px = 1000 + Math.sin(t * 0.4) * 80;
        c.beginPath(); c.ellipse(px, 400, 70, 190, 0, 0, TAU); c.clip();
        c.drawImage(P.tint(P.fogTex(), '#000000'), px - 300 + (t * 20) % 100, 200, 700, 420);
        c.restore();
      }
    },
    lights(st) { return [{ x: 790, y: 440, r: 460, i: 0.95 * st.candle, c: '#ffcf86', g: 0.2 }, { x: 1090, y: 360, r: 360, i: 0.5, c: '#8fb0e0', g: 0.1 }]; }
  };

  SC['ho-garden'] = {
    focus: [820, 440], dark: 0.06, darkCol: '#100c08', desat: 0.1,
    init(st) { st.rose = 0; },
    draw(S, st, t) {
      const c = S.ctx; let v = S.layer(0.15);
      P.sky(c, v, [[0, '#a8b8c4'], [0.6, '#efe3c4'], [1, '#e8d2a0']]);
      P.glow(c, 300, 150, 500, '#fff4d0', 0.6);
      v = S.layer(0.5);
      c.fillStyle = '#e2dccc'; c.fillRect(280, 200, 1040, 360);
      c.fillStyle = '#4a4e56'; c.beginPath(); c.moveTo(260, 200); c.lineTo(400, 90); c.lineTo(1200, 90); c.lineTo(1340, 200); c.fill();
      for (let i = 0; i < 6; i++) { const x = 340 + i * 160; P.win(c, x, 260, 60, 110, 0, t, null, { dark: '#3a4450', frame: '#e8e2d4' }); c.fillStyle = '#3c5a3e'; c.fillRect(x - 26, 260, 24, 110); c.fillRect(x + 62, 260, 24, 110); }
      c.fillStyle = '#c9c2b0'; c.fillRect(720, 420, 160, 140);
      v = S.layer(0.8);
      c.fillStyle = '#5a6a3a'; c.fillRect(v.x0, 560, v.x1 - v.x0, 400);
      c.fillStyle = '#c4b89a'; c.beginPath(); c.moveTo(720, 560); c.lineTo(880, 560); c.lineTo(1100, 1000); c.lineTo(500, 1000); c.fill();
      v = S.layer(1);
      const r = C.seeded(8);
      for (let i = 0; i < 14; i++) {
        const bx = 160 + i * 100 + r() * 30, by = 690 + (i % 2) * 30;
        if (bx > 600 && bx < 980) continue;
        c.fillStyle = '#1f3a1c'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(bx + (r() - 0.5) * 60, by - 30 - r() * 40, 30, 0, TAU); c.fill(); }
        for (let k = 0; k < 4; k++) { const rx = bx + (r() - 0.5) * 60, ry = by - 50 - r() * 40; c.fillStyle = '#a3121c'; c.beginPath(); c.arc(rx, ry, 9, 0, TAU); c.fill(); c.strokeStyle = '#5a0408'; c.lineWidth = 1.5; c.beginPath(); c.arc(rx, ry, 4, 0, 5); c.stroke(); }
      }
      c.fillStyle = '#1f3a1c'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(860 + (k - 2) * 26, 700 - (k % 2) * 20, 34, 0, TAU); c.fill(); }
      const rs = C.clamp(st.rose, 0, 1), bend = C.clamp(rs / 0.4, 0, 1), fly = C.clamp((rs - 0.4) / 0.6, 0, 1);
      const sx = 900, sy = 690, tx = 900 + bend * 50, ty = 560 + bend * 30;
      c.strokeStyle = '#2b4a1e'; c.lineWidth = 5; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx - 10 + bend * 60, 620, tx, ty); c.stroke();
      const fx = fly > 0 ? C.lerp(tx, 1000, C.easeOut(fly)) : tx, fy = fly > 0 ? ty - Math.sin(fly * Math.PI * 0.5) * 170 : ty;
      const R = 22 + fly * 6;
      c.fillStyle = '#b0101a'; c.beginPath(); c.arc(fx, fy, R, 0, TAU); c.fill();
      c.fillStyle = '#7a0810'; c.beginPath(); c.arc(fx - 4, fy - 3, R * 0.6, 0, TAU); c.fill();
      c.strokeStyle = '#4a0408'; c.lineWidth = 2; c.beginPath(); for (let a = 0; a < 12; a += 0.2) { const rr = a * 1.6; a === 0 ? c.moveTo(fx + rr, fy) : c.lineTo(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr); } c.stroke();
      if (fly > 0) { c.strokeStyle = '#2b4a1e'; c.lineWidth = 3; c.beginPath(); c.moveTo(fx, fy + R); c.lineTo(fx + 6, fy + R + 40); c.stroke(); }
      P.rays(c, 200, -100, 1.0, 0.5, 1400, '#fff0c8', 0.06, 4, t);
    }
  };

  SC['ho-mirror'] = {
    focus: [800, 430], dark: 0.8, darkCol: '#04060a', desat: 0.35,
    init(st) { st.fog = 0; st.ghost = 0; },
    hot: { mirror: { x: 800, y: 430, r: 210 } },
    draw(S, st, t) {
      const c = S.ctx; let v = S.layer(0.5);
      c.fillStyle = '#1e1b1a'; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      c.save(); c.globalAlpha = 0.5; c.drawImage(P.tint(P.gritTex(), '#000'), v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); c.restore();
      S.layer(0.8);
      c.fillStyle = '#120c08'; c.fillRect(540, 60, 520, 800); c.fillRect(520, 40, 560, 34);
      c.beginPath(); c.moveTo(560, 40); c.quadraticCurveTo(800, -40, 1040, 40); c.fill();
      c.save(); c.beginPath(); c.rect(590, 120, 420, 660); c.clip();
      c.fillStyle = '#262428'; c.fillRect(590, 120, 420, 660);
      c.fillStyle = '#16181e'; c.fillRect(640, 200, 110, 190); c.fillStyle = 'rgba(120,150,200,0.25)'; c.fillRect(646, 206, 98, 178);
      c.fillStyle = '#d0ccc0'; c.fillRect(840, 520, 170, 50); c.fillStyle = '#1a120c'; c.fillRect(840, 560, 170, 220);
      c.fillStyle = '#2a1e14'; c.fillRect(590, 640, 420, 140);
      P.candle(c, 690, 640, 60, t, 1, 5);
      if (st.ghost > 0.01) { c.globalAlpha = st.ghost * 0.4; P.fig(c, 800, 790, 420, 'man', { col: '#9aa4ae' }); c.globalAlpha = 1; }
      if (st.fog > 0.01) { P.fog(c, { x0: 560, x1: 1040 }, 160 + Math.sin(t * 0.3) * 30, 600, st.fog * 0.85, t * 16, '#c8d0d8'); P.fog(c, { x0: 560, x1: 1040 }, 300, 500, st.fog * 0.7, -t * 22, '#a8b0b8'); }
      const sh = c.createLinearGradient(590, 120, 1010, 780); sh.addColorStop(0, 'rgba(255,255,255,0.0)'); sh.addColorStop(0.45, 'rgba(255,255,255,0.07)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.0)');
      c.fillStyle = sh; c.fillRect(590, 120, 420, 660);
      c.restore();
      c.strokeStyle = '#3a2a18'; c.lineWidth = 10; c.strokeRect(590, 120, 420, 660);
      S.layer(1.35);
      c.fillStyle = '#040404'; c.beginPath(); c.moveTo(520, 1100); c.quadraticCurveTo(560, 830, 700, 800); c.quadraticCurveTo(720, 740, 730, 700); c.arc(800, 660, 80, Math.PI * 0.9, Math.PI * 2.1); c.quadraticCurveTo(880, 740, 900, 800); c.quadraticCurveTo(1040, 830, 1080, 1100); c.fill();
      P.candle(c, 1240, 820, 100, t, 1, 9);
    },
    lights() { return [{ x: 1240, y: 700, r: 640, i: 1, c: '#ffcf86', d: 1.35, g: 0.18 }, { x: 690, y: 590, r: 160, i: 0.6, c: '#ffcf86', d: 0.8 }]; }
  };

  SC['ho-fire'] = {
    focus: [800, 420], dark: 0.72, darkCol: '#060204', desat: 0.1,
    init(st) { st.fire = 0.15; st.attic = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; const f = C.clamp(st.fire, 0, 1); let v = S.layer(0.1);
      P.sky(c, v, [[0, '#04030a'], [0.6, C.mix('#0e0812', '#5a1a08', f)], [1, C.mix('#140a0a', '#a0360a', f)]]);
      P.stars(c, v, t, 80, 0.7 * (1 - f * 0.6), 3, 420);
      v = S.layer(0.4);
      for (let i = 0; i < 4; i++) P.clouds(c, v, 0 - i * 60 - (t * 18 % 60), 300, 0.12 + f * 0.25, t * 6 + i * 200, C.mix('#1a1412', '#3a2016', f));
      v = S.layer(0.7);
      P.tree(c, 180, 640, 560, 4, '#030202', t, 1); P.tree(c, 1450, 640, 500, 6, '#030202', t, 1);
      c.fillStyle = '#0c0807'; c.fillRect(480, 300, 640, 340);
      c.beginPath(); c.moveTo(460, 300); c.lineTo(600, 170); c.lineTo(1000, 170); c.lineTo(1140, 300); c.fill();
      c.fillRect(940, 120, 40, 80);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
        const x = 520 + i * 116, y = 360 + j * 140;
        c.fillStyle = '#26221e'; c.fillRect(x, y, 70, 100);
        c.strokeStyle = C.rgba('#ff8a2a', f * (0.5 + 0.5 * Math.sin(t * 9 + i + j))); c.lineWidth = 3; c.strokeRect(x, y, 70, 100);
        c.fillStyle = '#4a4440'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + 10 + k * 17, y + 8, 2.5, 0, TAU); c.arc(x + 10 + k * 17, y + 92, 2.5, 0, TAU); c.fill(); }
      }
      if (st.attic > 0) { P.win(c, 770, 200, 60, 60, 1, t, '#ff7a1a', { steady: true }); P.fig(c, 800, 262, 60 * st.attic, 'woman', { col: '#0a0302', raise: 30 }); }
      if (f > 0.02) {
        const N = 16;
        for (let i = 0; i < N; i++) {
          const x = 470 + i * (680 / (N - 1)), base = i < 2 || i > N - 3 ? 300 : 300 - Math.min(130, Math.abs(i - N / 2) < 4 ? 130 : 60);
          const hh = f * (90 + 70 * Math.sin(t * 5 + i * 1.7) + 50 * Math.sin(t * 11 + i * 3));
          const g = c.createLinearGradient(0, base, 0, base - hh);
          g.addColorStop(0, C.rgba('#fff0a0', 0.95)); g.addColorStop(0.3, C.rgba('#ffa020', 0.9)); g.addColorStop(1, 'rgba(200,40,0,0)');
          c.fillStyle = g; c.beginPath(); c.moveTo(x - 36, base + 10);
          c.quadraticCurveTo(x - 30 + Math.sin(t * 7 + i) * 14, base - hh * 0.5, x + Math.sin(t * 6 + i) * 20, base - hh);
          c.quadraticCurveTo(x + 30 + Math.sin(t * 8 + i) * 14, base - hh * 0.5, x + 36, base + 10); c.fill();
        }
        P.glow(c, 800, 260, 700, '#ff6a1a', 0.35 * f);
      }
      P.parts(c, st, 'emb', 'embers', Math.round(30 + f * 60), v, dt, t);
      v = S.layer(1.3);
      c.fillStyle = '#030202'; c.fillRect(v.x0, 800, v.x1 - v.x0, 400);
      c.beginPath(); c.moveTo(v.x0, 800); for (let x = v.x0; x < v.x1; x += 30) c.lineTo(x, 790 + Math.sin(x * 0.05) * 8); c.lineTo(v.x1, 800); c.fill();
      P.fig(c, 1290, 820, 330, 'man', { col: '#020101' });
    },
    lights(st) { return [{ x: 800, y: 330, r: 400 + 900 * st.fire, i: 0.3 + 0.7 * st.fire, c: '#ff7a2a', g: 0.3 }]; }
  };

  /* =====================================================================
     LA CHUTE DE LA MAISON USHER
     ===================================================================== */
  function usherHouse(c, t, o) {
    o = o || {};
    const col = o.col || '#070607';
    c.fillStyle = col;
    c.fillRect(370, 330, 160, 230); c.beginPath(); c.moveTo(360, 330); c.lineTo(450, 260); c.lineTo(540, 330); c.fill();
    c.fillRect(520, 230, 560, 330);
    c.beginPath(); c.moveTo(505, 232); c.lineTo(800, 120); c.lineTo(1095, 232); c.fill();
    c.fillRect(1070, 170, 130, 390); c.beginPath(); c.moveTo(1060, 172); c.lineTo(1135, 60); c.lineTo(1210, 172); c.fill();
    c.fillRect(600, 150, 26, 60); c.fillRect(960, 160, 26, 60);
    const lit = o.lit == null ? 0.5 : o.lit;
    const wins = [[400, 380], [470, 380], [560, 290], [640, 290], [920, 290], [1000, 290], [560, 420], [640, 420], [920, 420], [1000, 420], [1110, 240], [1110, 360]];
    wins.forEach(([x, y], i) => P.win(c, x, y, 34, 64, (i === 3 || i === 8) ? lit : 0, t, '#d8a050', { arch: true, dark: '#010101', frame: col }));
    c.fillStyle = '#000'; c.fillRect(770, 470, 60, 90); c.beginPath(); c.arc(800, 470, 30, Math.PI, 0); c.fill();
  }
  function fissure(c, w, col, glow) {
    const pts = [[800, 120], [812, 190], [794, 250], [808, 320], [788, 380], [802, 440], [790, 500], [800, 560]];
    if (glow) { c.save(); c.shadowColor = '#e8302a'; c.shadowBlur = 30 * glow; }
    c.strokeStyle = col || '#000'; c.lineWidth = w; c.lineJoin = 'miter';
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
    if (glow) c.restore();
  }
  SC['us-approach'] = {
    focus: [800, 440], dark: 0.42, darkCol: '#06080a', desat: 0.5,
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.1);
      P.sky(c, v, [[0, '#1c1f22'], [0.55, '#3c3d3a'], [1, '#5a564c']]);
      P.clouds(c, v, -40, 340, 0.85, t * 5, '#16181a'); P.clouds(c, v, 120, 220, 0.6, t * 9 + 300, '#22252a');
      v = S.layer(0.3);
      P.ridge(c, v, 540, 50, 1.3, '#1d201e');
      c.save(); c.translate(1150, 490); c.scale(0.22, 0.22); c.translate(-800, -560); usherHouse(c, t, { lit: 0.5, col: '#0c0d0d' }); c.restore();
      v = S.layer(0.6);
      P.ridge(c, v, 600, 30, 4.2, '#141613');
      [[300, 3], [620, 8], [980, 12], [1380, 15]].forEach(([x, s], i) => P.tree(c, x, 610, 240 + i * 30, s, '#8a877e', t, 0.5));
      P.fog(c, v, 520, 140, 0.35, t * 8, '#9aa0a0');
      H.crows(c, st, t, dt, v, 4, '#08090a');
      v = S.layer(1);
      c.fillStyle = '#0d0f0d'; c.beginPath(); c.moveTo(v.x0, 700); c.quadraticCurveTo(700, 660, v.x1, 720); c.lineTo(v.x1, v.y1 + 10); c.lineTo(v.x0, v.y1 + 10); c.fill();
      c.fillStyle = '#2a2620'; c.beginPath(); c.moveTo(600, v.y1 + 10); c.quadraticCurveTo(760, 760, 1050, 700); c.lineTo(1120, 705); c.quadraticCurveTo(860, 780, 820, v.y1 + 10); c.fill();
      v = S.layer(1.3);
      P.horse(c, 420, 830, 1.15, t * 0.6, '#040404', { still: true });
      c.fillStyle = '#040404'; c.beginPath(); c.moveTo(395, 735); c.lineTo(440, 735); c.lineTo(436, 650); c.lineTo(400, 650); c.fill();
      c.beginPath(); c.ellipse(418, 632, 13, 15, 0, 0, TAU); c.fill(); c.fillRect(398, 618, 40, 4); c.fillRect(406, 590, 24, 28);
      c.beginPath(); c.moveTo(400, 660); c.lineTo(370, 760); c.lineTo(390, 760); c.lineTo(414, 690); c.fill();
      c.strokeStyle = '#121410'; c.lineWidth = 2;
      for (let i = 0; i < 90; i++) { const x = v.x0 + (i / 90) * (v.x1 - v.x0), h = 40 + (i * 53 % 60); c.beginPath(); c.moveTo(x, v.y1 + 5); c.quadraticCurveTo(x + 8, v.y1 - h / 2, x + 14 + Math.sin(t * 1.4 + i) * 6, v.y1 - h); c.stroke(); }
    }
  };

  SC['us-house'] = {
    focus: [800, 400], dark: 0.5, darkCol: '#05070a', desat: 0.45,
    init(st) { st.crack = 0.25; },
    hot: { crack: { x: 800, y: 360, r: 110 } },
    draw(S, st, t) {
      const c = S.ctx; let v = S.layer(0.1);
      P.sky(c, v, [[0, '#121416'], [0.6, '#2e302e'], [1, '#3e3c36']]);
      P.clouds(c, v, -30, 360, 0.8, t * 4, '#0c0e10');
      v = S.layer(0.6);
      P.ridge(c, v, 575, 18, 9, '#0e100e');
      usherHouse(c, t, { lit: 0.55 });
      fissure(c, 2 + st.crack * 5, C.rgba('#000000', 0.5 + st.crack * 0.5), st.crack > 0.8 ? 0.4 : 0);
      [[300, 21], [470, 22], [1280, 23], [1430, 24]].forEach(([x, s], i) => P.tree(c, x, 590, 300 - i * 20, s, '#8c897f', t, 0.5));
      P.reflect(S, 585, 0.6, 0.62, t, '#05080a', 360);
      P.fog(c, v, 520, 110, 0.3, t * 7, '#9aa0a0');
      v = S.layer(1.2);
      c.fillStyle = '#060706'; c.fillRect(v.x0, 820, v.x1 - v.x0, 300);
      c.strokeStyle = '#0c0e0b'; c.lineWidth = 2; for (let i = 0; i < 70; i++) { const x = v.x0 + (i / 70) * (v.x1 - v.x0), h = 40 + (i * 31 % 50); c.beginPath(); c.moveTo(x, 830); c.quadraticCurveTo(x + 8, 830 - h / 2, x + 12 + Math.sin(t + i) * 5, 830 - h); c.stroke(); }
    },
    lights(st) { return [{ x: 657, y: 320, r: 120, i: 0.6, c: '#d8a050' }, { x: 937, y: 450, r: 120, i: 0.6, c: '#d8a050' }]; }
  };

  SC['us-study'] = {
    focus: [800, 420], dark: 0.86, darkCol: '#04040a', desat: 0.35, storm: true, ownBolt: true, boltX: 800, boltY: 560,
    init(st) { st.madeline = -1; },
    draw(S, st, t, dt) {
      const c = S.ctx; S.layer(0.5);
      H.room(S, { wall: '#221d22', floor: '#140f0d', side: '#181418' });
      H.stormWin(S, c, 680, 170, 240, 400, t, { gothic: true });
      S.layer(0.8);
      H.books(c, 340, 140, 600, 640, 6, 7); H.books(c, 1000, 140, 1260, 640, 6, 9);
      if (st.madeline >= 0 && st.madeline <= 1) {
        st.madeline = Math.min(1.01, st.madeline + dt / 9);
        const a = Math.sin(st.madeline * Math.PI);
        c.globalAlpha = a * 0.7; P.fig(c, C.lerp(380, 1220, st.madeline), 640, 220, 'woman', { col: '#c8ccd0', hair: true }); c.globalAlpha = 1;
      }
      S.layer(1);
      P.fig(c, 800, 650, 280, 'man', { col: '#040304' });
      c.fillStyle = '#120c08'; c.fillRect(400, 600, 260, 20); c.fillRect(410, 620, 14, 120); c.fillRect(636, 620, 14, 120);
      P.candle(c, 450, 600, 70, t, 1, 1); P.candle(c, 500, 600, 90, t, 1, 2); P.candle(c, 610, 600, 60, t, 1, 3);
      c.fillStyle = '#d8ccb0'; c.fillRect(530, 590, 60, 10);
    },
    lights(st, S) { return [{ x: 520, y: 540, r: 480, i: 0.9, c: '#ffcf86', g: 0.2 }, { x: 800, y: 360, r: 420, i: 0.25 + S.flash * 0.7, c: '#b8c8ff', g: 0.1 }]; }
  };

  SC['us-vault'] = {
    focus: [800, 440], dark: 0.9, darkCol: '#030304', desat: 0.4,
    init(st) { st.lid = 0; st.door = 0.35; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.5);
      H.stone(c, v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0, '#26231f');
      c.fillStyle = '#0b0a09';
      for (let i = 0; i < 4; i++) { const x = 200 + i * 400; c.beginPath(); c.moveTo(x - 200, 640); c.lineTo(x - 200, 260); c.quadraticCurveTo(x, 40, x + 200, 260); c.lineTo(x + 200, 300); c.quadraticCurveTo(x, 110, x - 170, 300); c.lineTo(x - 170, 640); c.fill(); }
      c.fillStyle = '#18150f'; c.fillRect(v.x0, 640, v.x1 - v.x0, 400);
      S.layer(0.9);
      c.fillStyle = '#000'; c.fillRect(280, 280, 220, 360);
      c.fillStyle = '#1a1a1c'; const dw = 220 * (1 - st.door * 0.7); c.fillRect(280, 280, dw, 360);
      c.fillStyle = '#3a3a3e'; for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) { c.beginPath(); c.arc(292 + i * (dw - 24) / 5, 296 + j * 46, 3.5, 0, TAU); c.fill(); }
      c.strokeStyle = '#0a0a0b'; c.lineWidth = 8; c.strokeRect(280, 280, dw, 360);
      S.layer(1);
      c.fillStyle = '#100b08'; c.fillRect(640, 600, 16, 50); c.fillRect(960, 600, 16, 50); c.fillRect(630, 590, 360, 14);
      c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(600, 520); c.lineTo(1000, 520); c.lineTo(980, 592); c.lineTo(620, 592); c.fill();
      c.fillStyle = '#e8e2d4'; c.fillRect(640, 508, 340, 14);
      c.fillStyle = '#cfc8bc'; c.beginPath(); c.ellipse(680, 504, 22, 17, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(160,40,40,0.35)'; c.beginPath(); c.ellipse(688, 508, 6, 4, 0, 0, TAU); c.fill();
      const L = C.clamp(st.lid, 0, 1);
      c.save(); c.translate(C.lerp(1040, 800, L), C.lerp(560, 506, L)); c.rotate(C.lerp(-1.25, 0, L));
      c.fillStyle = '#3a2416'; c.beginPath(); c.moveTo(-210, -14); c.lineTo(210, -14); c.lineTo(196, 14); c.lineTo(-196, 14); c.fill();
      c.strokeStyle = '#1a0e08'; c.lineWidth = 3; c.strokeRect(-150, -8, 300, 14); c.restore();
      c.fillStyle = '#100c09'; c.fillRect(1170, 360, 20, 50); c.fillRect(1150, 350, 60, 14);
      P.flame(c, 1180, 352, 60, t, 1, 4);
      c.strokeStyle = 'rgba(160,180,190,0.3)'; c.lineWidth = 1.5; const dy = (t * 120) % 400; c.beginPath(); c.moveTo(860, 120 + dy); c.lineTo(860, 126 + dy); c.stroke();
    },
    lights() { return [{ x: 1180, y: 320, r: 700, i: 1, c: '#ffb060', g: 0.25 }]; }
  };

  SC['us-storm'] = {
    focus: [800, 430], dark: 0.78, darkCol: '#030306', desat: 0.35, storm: true, ownBolt: true, boltX: 1240, boltY: 520,
    init(st) { st.door = 0; st.mad = 0; },
    draw(S, st, t) {
      const c = S.ctx; S.layer(0.5);
      H.room(S, { wall: '#1c181c', floor: '#120d0b' });
      H.stormWin(S, c, 1140, 160, 190, 360, t);
      H.drape(c, 1100, 150, 70, 400, '#2a1a26', t * 2.4, 1, 2.4); H.drape(c, 1300, 150, 70, 400, '#2a1a26', t * 2.4 + 2, -1, 2.4);
      S.layer(0.8);
      c.fillStyle = '#000'; c.fillRect(690, 220, 220, 400);
      const op = C.clamp(st.door, 0, 1);
      if (st.mad > 0.01) {
        const sw = Math.sin(t * 2.3) * 4;
        c.save(); c.translate(800 + sw, 620);
        P.fig(c, 0, 0, 330, 'woman', { col: '#d8d6d0', hair: true });
        c.strokeStyle = 'rgba(140,0,10,0.9)'; c.lineWidth = 5;
        [[-12, -200, -16, -40], [6, -180, 10, -10], [16, -150, 20, -60], [-4, -120, -10, -5]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(a + 4, (b + e) / 2, d, e); c.stroke(); });
        c.restore();
        c.fillStyle = C.rgba('#000000', 1 - st.mad); c.fillRect(690, 220, 220, 400);
      }
      const pw = 220 * Math.cos(op * 1.4);
      const g = c.createLinearGradient(690, 0, 690 + pw, 0); g.addColorStop(0, '#0f0a0c'); g.addColorStop(1, '#1c1418');
      c.fillStyle = g; c.beginPath(); c.moveTo(690, 220); c.lineTo(690 + pw, 220 - op * 30); c.lineTo(690 + pw, 620 + op * 30); c.lineTo(690, 620); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 3; if (pw > 20) { c.strokeRect(690 + pw * 0.15, 250, pw * 0.7, 150); c.strokeRect(690 + pw * 0.15, 430, pw * 0.7, 160); }
      c.strokeStyle = '#0a0708'; c.lineWidth = 14; c.strokeRect(683, 213, 234, 414);
      S.layer(1.2);
      c.fillStyle = '#120c0a'; c.fillRect(740, 640, 120, 12); c.fillRect(790, 652, 18, 120);
      P.candle(c, 830, 640, 60, t, 1, 7);
      c.fillStyle = '#e8dcc0'; c.beginPath(); c.moveTo(740, 636); c.quadraticCurveTo(770, 626, 798, 636); c.quadraticCurveTo(770, 632, 740, 640); c.fill();
      P.glow(c, 770, 632, 50, '#ffe6b0', 0.3);
      c.fillStyle = '#060405';
      [[420, 1], [1180, -1]].forEach(([x, s]) => { c.beginPath(); c.moveTo(x - 110, 900); c.lineTo(x - 110, 660); c.quadraticCurveTo(x - 110, 520, x, 520); c.quadraticCurveTo(x + 110, 520, x + 110, 660); c.lineTo(x + 110, 900); c.fill(); c.fillRect(x - 150, 690, 300, 200); });
      c.beginPath(); c.ellipse(1150, 600, 26, 30, 0, 0, TAU); c.fill();
    },
    lights(st, S) { return [{ x: 820, y: 580, r: 440, i: 0.9, c: '#ffcf86', d: 1.2, g: 0.2 }, { x: 1230, y: 330, r: 320, i: 0.2 + S.flash * 0.8, c: '#b8c8ff' }, { x: 800, y: 450, r: 260, i: st.mad * 0.45, c: '#c8d0e0', d: 0.8 }]; }
  };

  SC['us-fall'] = {
    focus: [800, 400], dark: 0.3, darkCol: '#08020a', desat: 0.1, storm: true, boltX: 400, boltY: 560,
    init(st) { st.split = 0; st.sink = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.1);
      P.sky(c, v, [[0, '#08040a'], [0.6, '#24080c'], [1, '#3a0e0e']]);
      P.clouds(c, v, -60, 360, 0.7, t * 14, '#0c0406');
      v = S.layer(0.35);
      P.moon(c, 800, 290, 150, '#c0281e', { halo: 1.6 });
      v = S.layer(0.6);
      P.ridge(c, v, 585, 16, 9, '#060405');
      const sp = C.clamp(st.split, 0, 1), sk = C.clamp(st.sink, 0, 1);
      c.save(); c.beginPath(); c.rect(v.x0, v.y0, v.x1 - v.x0, 585 - v.y0); c.clip();
      [[-1, 0, 800], [1, 800, 1700]].forEach(([s, a, b]) => {
        c.save(); c.beginPath(); c.rect(a - (s < 0 ? 900 : 0), 0, b - a + 900, 900); c.clip();
        c.translate(800, 560 + sk * 520); c.rotate(s * sp * 0.09); c.translate(-800 + s * sp * 70, -560);
        usherHouse(c, t, { lit: 0.6 * (1 - sp), col: '#050304' });
        c.restore();
      });
      c.restore();
      if (sp < 0.15) fissure(c, 3 + st.split * 40, '#ff3a2a', 1);
      P.reflect(S, 588, 0.6, 0.65, t, '#060104', 360);
      P.parts(c, st, 'deb', 'snow', sk > 0 ? 40 : 0, v, dt, t, { col: '#3a2a2a' });
      P.parts(c, st, 'rain', 'rain', 160, v, dt, t, { col: '#c0a0a8', ground: 590 });
    },
    lights() { return [{ x: 800, y: 290, r: 700, i: 0.6, c: '#ff4030', d: 0.35, g: 0.15 }]; }
  };

  /* =====================================================================
     DRACULA
     ===================================================================== */
  function mountains(c, v, t, cols, snow) {
    cols.forEach((col, i) => {
      const y = 380 + i * 70, amp = 160 - i * 30, seed = 3 + i * 7;
      c.fillStyle = col; c.beginPath(); c.moveTo(v.x0 - 50, v.y1 + 50);
      const pts = [];
      for (let x = Math.floor((v.x0 - 100) / 40) * 40; x <= v.x1 + 100; x += 40) { const n = Math.abs(Math.sin(x * 0.0035 + seed)) * 0.7 + Math.abs(Math.sin(x * 0.011 + seed * 2)) * 0.3; const yy = y - n * amp; pts.push([x, yy]); c.lineTo(x, yy); }
      c.lineTo(v.x1 + 50, v.y1 + 50); c.closePath(); c.fill();
      if (snow && i < 2) { c.save(); c.clip(); const g = c.createLinearGradient(0, y - amp, 0, y - amp * 0.35); g.addColorStop(0, C.rgba(snow, 0.55 - i * 0.2)); g.addColorStop(1, C.rgba(snow, 0)); c.fillStyle = g; c.fillRect(v.x0 - 60, y - amp - 20, v.x1 - v.x0 + 120, amp); c.restore(); }
    });
  }
  function castle(c, x, y, s, col, lit, t) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col;
    c.beginPath(); c.moveTo(-420, 120); c.lineTo(-300, 20); c.lineTo(-200, 0); c.lineTo(-120, -60); c.lineTo(80, -70); c.lineTo(180, -20); c.lineTo(300, 10); c.lineTo(420, 120); c.fill();
    const tw = (tx, base, w, h, roof) => { c.fillRect(tx, base - h, w, h); c.beginPath(); c.moveTo(tx - 8, base - h); c.lineTo(tx + w / 2, base - h - roof); c.lineTo(tx + w + 8, base - h); c.fill(); };
    tw(-160, -60, 60, 180, 80); tw(-60, -66, 76, 300, 110); tw(60, -70, 52, 170, 70); tw(160, -24, 46, 110, 50); tw(-240, 0, 40, 120, 50);
    c.fillRect(-200, -110, 380, 60); for (let i = 0; i < 10; i++) c.fillRect(-200 + i * 38, -126, 20, 18);
    if (lit) P.win(c, -30, -330, 16, 34, lit, t, '#ffcf6a', { arch: true, frame: col });
    c.restore();
  }
  SC['dr-pass'] = {
    focus: [800, 440], dark: 0.55, darkCol: '#03040a', desat: 0.3,
    init(st) { st.flames = 0; st.wolves = 0; },
    hot: { wolves: { x: 1210, y: 640, r: 110, d: 1.15 } },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#04050b'], [0.6, '#0e1320'], [1, '#1a2030']]);
      P.stars(c, v, t, 140, 0.9, 11, 380);
      P.moon(c, 1260, 150, 52, '#e4e8f0', { halo: 1.1 });
      v = S.layer(0.25);
      mountains(c, v, t, ['#1a2030', '#121722', '#0b0e15'], '#d8e0f0');
      v = S.layer(0.7);
      for (let i = 0; i < 30; i++) { const x = v.x0 + i * 70 - 40, h = 130 + (i * 37 % 70); P.pine(c, x, 610, h, '#05070b', 'rgba(200,215,235,0.35)'); }
      c.fillStyle = '#0a0c12'; c.fillRect(v.x0, 600, v.x1 - v.x0, 400);
      c.fillStyle = '#2a2e38'; c.beginPath(); c.moveTo(500, v.y1 + 10); c.quadraticCurveTo(700, 700, 760, 640); c.lineTo(860, 640); c.quadraticCurveTo(900, 720, 1150, v.y1 + 10); c.fill();
      v = S.layer(1);
      const ph = t * 2.2;
      P.horse(c, 430, 690, 0.62, ph, '#020203'); P.horse(c, 470, 676, 0.58, ph + 1.3, '#020203');
      P.horse(c, 560, 690, 0.62, ph + 0.6, '#020203'); P.horse(c, 600, 676, 0.58, ph + 2, '#020203');
      c.strokeStyle = '#020203'; c.lineWidth = 3; c.beginPath(); c.moveTo(620, 640); c.lineTo(690, 620); c.stroke();
      c.fillStyle = '#030304'; c.fillRect(690, 560, 170, 80); c.beginPath(); c.moveTo(680, 560); c.quadraticCurveTo(775, 530, 870, 560); c.fill();
      H.wheel(c, 720, 670, 34, t * 1.4, '#030304'); H.wheel(c, 830, 670, 40, t * 1.2, '#030304');
      P.fig(c, 700, 570, 120, 'man', { hat: true, col: '#020203', raise: 20 });
      c.fillStyle = '#ff2a1a'; c.fillRect(693, 482, 3, 2); c.fillRect(700, 482, 3, 2);
      [[688, 590], [866, 590]].forEach(([x, y]) => { c.fillStyle = '#1a1a1a'; c.fillRect(x - 6, y - 10, 12, 18); P.glow(c, x, y, 40, '#ffcc77', 0.6); c.fillStyle = '#ffd890'; c.fillRect(x - 4, y - 6, 8, 10); });
      if (st.flames > 0) [[330, 700], [1030, 690], [1250, 720]].forEach(([x, y], i) => {
        const a = st.flames * (0.6 + 0.4 * Math.sin(t * 3 + i * 2));
        const g = c.createLinearGradient(0, y, 0, y - 50); g.addColorStop(0, C.rgba('#d8f0ff', a)); g.addColorStop(0.5, C.rgba('#4a8aff', a * 0.8)); g.addColorStop(1, 'rgba(30,60,255,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(x - 10, y); c.quadraticCurveTo(x - 8 + Math.sin(t * 6 + i) * 6, y - 30, x + Math.sin(t * 5 + i) * 6, y - 52); c.quadraticCurveTo(x + 10, y - 30, x + 10, y); c.fill();
        P.glow(c, x, y - 20, 70, '#4a8aff', 0.4 * a);
      });
      if (st.wolves > 0) {
        const pts = [[1150, 620], [1230, 650], [1290, 610], [320, 640], [250, 620], [980, 625], [180, 650]];
        pts.forEach(([x, y], i) => { const bl = Math.sin(t * 0.9 + i * 2.3) > -0.85 ? 1 : 0; const a = st.wolves * bl; if (a <= 0) return; P.glow(c, x, y, 18, '#e8f04a', 0.5 * a); c.fillStyle = C.rgba('#f0f070', a); c.fillRect(x - 7, y, 4, 2.5); c.fillRect(x + 4, y, 4, 2.5); });
      }
      P.parts(c, st, 'snow', 'snow', 90, v, dt, t, { col: '#e8eef8', wind: 0.04 });
    },
    lights(st) { return [{ x: 777, y: 590, r: 330, i: 0.85, c: '#ffcc77', g: 0.2 }, { x: 1260, y: 150, r: 900, i: 0.4, c: '#c8d4ec', d: 0.05 }, { x: 800, y: 700, r: 900, i: st.flames * 0.3, c: '#4a8aff' }]; }
  };

  SC['dr-castle'] = {
    focus: [820, 360], dark: 0.4, darkCol: '#04030a', desat: 0.25,
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#060410'], [0.6, '#16122a'], [1, '#2a2238']]);
      P.stars(c, v, t, 120, 0.8, 21, 360);
      P.moon(c, 1000, 230, 135, '#ece4d4', { halo: 1.3 });
      P.clouds(c, v, 160, 160, 0.55, t * 10, '#100c18');
      v = S.layer(0.45);
      c.fillStyle = '#050407'; c.beginPath(); c.moveTo(380, 900); c.lineTo(500, 640); c.lineTo(560, 610); c.lineTo(600, 520); c.lineTo(700, 500); c.lineTo(980, 510); c.lineTo(1060, 560); c.lineTo(1120, 620); c.lineTo(1260, 900); c.fill();
      castle(c, 820, 470, 0.95, '#040306', 0.9, t);
      H.bats(c, st, t, dt, 820, 220, 9, 280, '#020103');
      P.fog(c, v, 600, 200, 0.4, t * 8, '#8a8aa8');
      v = S.layer(0.9);
      P.ridge(c, v, 800, 30, 3, '#020203');
    },
    lights() { return [{ x: 798, y: 140, r: 160, i: 0.8, c: '#ffcf6a', d: 0.45 }, { x: 1000, y: 230, r: 1000, i: 0.45, c: '#d8d4ec', d: 0.05 }]; }
  };

  SC['dr-hall'] = {
    focus: [800, 440], dark: 0.85, darkCol: '#040202', desat: 0.2,
    init(st) { st.count = 1; },
    draw(S, st, t, dt) {
      const c = S.ctx; S.layer(0.5);
      H.room(S, { wall: '#2a221e', floor: '#16100c', bx0: 260, bx1: 1340, by0: 80, by1: 650 });
      H.stone(c, 260, 80, 1080, 570, '#2a221e', 120, 60);
      c.fillStyle = '#3a1418'; c.fillRect(860, 130, 160, 300); c.fillStyle = 'rgba(200,160,60,0.25)'; c.fillRect(870, 140, 140, 6); c.fillRect(870, 414, 140, 6);
      S.layer(0.8);
      c.fillStyle = '#1a1410'; c.fillRect(340, 280, 380, 370); c.fillStyle = '#0d0a08'; c.fillRect(320, 260, 420, 34);
      c.fillStyle = '#000'; c.fillRect(390, 340, 280, 310);
      for (let i = 0; i < 6; i++) P.flame(c, 430 + i * 42, 640, 110 + Math.sin(t * 3 + i) * 30, t, 1, i * 3);
      c.fillStyle = '#100a07'; c.fillRect(420, 630, 220, 20);
      S.layer(1);
      c.fillStyle = '#0d0907'; c.fillRect(1060, 600, 300, 18); c.fillRect(1070, 618, 14, 80); c.fillRect(1330, 618, 14, 80);
      P.candle(c, 1200, 600, 60, t, 1, 6); P.candle(c, 1240, 600, 80, t, 1, 7);
      P.fig(c, 760, 700, 250, 'man', { hat: true, col: '#050404' });
      c.fillStyle = '#050404'; c.fillRect(708, 650, 40, 36);
      if (st.count > 0) {
        c.globalAlpha = st.count; P.fig(c, 1000, 700, 330, 'cloak', { col: '#030203', lining: '#4a0408', flip: true }); c.globalAlpha = 1;
        c.fillStyle = '#c8c8c8'; c.fillRect(948, 488, 12, 24); P.flame(c, 954, 486, 26, t, st.count, 8);
      }
      c.strokeStyle = 'rgba(200,200,200,0.12)'; c.lineWidth = 1;
      for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(260, 80 + i * 14); c.quadraticCurveTo(300 + i * 4, 100 + i * 10, 260 + i * 18, 80); c.stroke(); }
    },
    lights(st) { return [{ x: 530, y: 560, r: 760, i: 1, c: '#ff8a3a', d: 0.8, g: 0.25 }, { x: 954, y: 470, r: 380, i: 0.9 * st.count, c: '#ffd27a' }, { x: 1220, y: 540, r: 300, i: 0.7, c: '#ffcf86' }]; }
  };

  SC['dr-mirror'] = {
    focus: [820, 430], dark: 0.66, darkCol: '#05060a', desat: 0.3,
    init(st) { st.hand = 0; st.broken = 0; st.blood = 0; },
    hot: { mirror: { x: 760, y: 360, r: 150 } },
    draw(S, st, t) {
      const c = S.ctx; let v = S.layer(0.5);
      H.stone(c, v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0, '#2a2622', 110, 54);
      c.fillStyle = '#9fb0c8'; c.fillRect(1160, 120, 240, 440);
      c.fillStyle = '#0a0b0d'; for (let i = 0; i < 5; i++) c.fillRect(1170 + i * 52, 120, 8, 440); c.fillRect(1160, 330, 240, 8);
      c.strokeStyle = '#0e0c0a'; c.lineWidth = 18; c.strokeRect(1160, 120, 240, 440);
      v = S.layer(0.8);
      if (!st.broken) {
        c.fillStyle = '#3a2a18'; c.beginPath(); c.arc(760, 360, 162, 0, TAU); c.fill();
        c.save(); c.beginPath(); c.arc(760, 360, 148, 0, TAU); c.clip();
        c.fillStyle = '#2a2826'; c.fillRect(600, 200, 320, 320);
        c.fillStyle = '#9fb0c8'; c.fillRect(612, 230, 70, 170); c.fillStyle = '#0a0b0d'; c.fillRect(640, 230, 6, 170);
        c.fillStyle = '#0a0908'; c.beginPath(); c.arc(780, 360, 48, 0, TAU); c.fill(); c.beginPath(); c.moveTo(690, 520); c.quadraticCurveTo(700, 420, 780, 405); c.quadraticCurveTo(860, 420, 880, 520); c.fill();
        c.fillStyle = '#d8d4cc'; c.beginPath(); c.ellipse(784, 392, 26, 12, 0, 0, Math.PI); c.fill();
        if (st.blood > 0) { c.fillStyle = C.rgba('#a8101a', st.blood); c.beginPath(); c.ellipse(796, 400 + st.blood * 14, 3.5, 5 + st.blood * 6, 0, 0, TAU); c.fill(); }
        const sh = c.createLinearGradient(620, 220, 900, 500); sh.addColorStop(0, 'rgba(255,255,255,0.12)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)'); c.fillStyle = sh; c.fillRect(600, 200, 320, 320);
        c.restore();
      } else {
        c.fillStyle = '#5a5a5a'; c.beginPath(); c.arc(760, 200, 5, 0, TAU); c.fill();
        c.fillStyle = 'rgba(200,210,220,0.5)'; for (let i = 0; i < 9; i++) { const x = 600 + i * 40, y = 700 + (i % 3) * 14; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20, y - 6); c.lineTo(x + 12, y + 8); c.fill(); }
      }
      S.layer(1.35);
      c.fillStyle = '#060505'; c.beginPath(); c.arc(560, 700, 110, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(250, 1100); c.quadraticCurveTo(280, 820, 440, 800); c.lineTo(700, 800); c.quadraticCurveTo(880, 820, 900, 1100); c.fill();
      if (st.hand > 0.01) {
        c.globalAlpha = st.hand;
        c.fillStyle = '#d8d2c4'; c.beginPath(); c.ellipse(690, 812, 70, 28, -0.2, 0, TAU); c.fill();
        [[-50, -6], [-28, -14], [-4, -16], [20, -12]].forEach(([dx, dy], i) => { c.save(); c.translate(660 + dx, 800 + dy); c.rotate(1.25 + i * 0.05); c.fillStyle = '#d8d2c4'; c.fillRect(-7, 0, 14, 62 + i * 4); c.fillStyle = '#5a5a4a'; c.beginPath(); c.moveTo(-6, 62 + i * 4); c.lineTo(6, 62 + i * 4); c.lineTo(0, 76 + i * 4); c.fill(); c.restore(); });
        c.fillStyle = '#0a0606'; c.fillRect(740, 770, 220, 90);
        c.globalAlpha = 1;
      }
    },
    lights() { return [{ x: 1280, y: 340, r: 700, i: 0.6, c: '#a8b8d0', d: 0.5, g: 0.08 }, { x: 960, y: 560, r: 340, i: 0.55, c: '#ffcf86' }]; }
  };

  SC['dr-wall'] = {
    focus: [800, 420], dark: 0.5, darkCol: '#03040a', desat: 0.3,
    init(st) { st.crawl = 0; },
    draw(S, st, t) {
      const c = S.ctx; let v = S.layer(0.1);
      P.sky(c, v, [[0, '#04050c'], [1, '#121628']]);
      P.stars(c, v, t, 80, 0.7, 41, 900);
      P.moon(c, 1460, 150, 60, '#e8ecf4', { halo: 1 });
      v = S.layer(0.3);
      c.fillStyle = '#05060a'; c.fillRect(v.x0, 860, v.x1 - v.x0, 300);
      P.fog(c, v, 760, 200, 0.5, t * 10, '#6a7088');
      v = S.layer(0.7);
      H.stone(c, 380, v.y0 - 50, 860, v.y1 - v.y0 + 100, '#2a2b30', 100, 50);
      const sh = c.createLinearGradient(380, 0, 1240, 0); sh.addColorStop(0, 'rgba(0,0,0,0.7)'); sh.addColorStop(1, 'rgba(160,180,220,0.12)'); c.fillStyle = sh; c.fillRect(380, v.y0 - 50, 860, v.y1 - v.y0 + 100);
      c.fillStyle = '#000'; c.fillRect(740, 40, 110, 160); c.beginPath(); c.arc(795, 40, 55, Math.PI, 0); c.fill();
      const k = C.clamp(st.crawl, 0, 1), cy = 180 + k * 520, sw = Math.sin(t * 2.4) * 10;
      c.save(); c.translate(800 + sw, cy); c.rotate(Math.PI + Math.sin(t * 2.4) * 0.05);
      P.fig(c, 0, 0, 230, 'cloak', { col: '#030204', spread: 0.9 + Math.sin(t * 2.4) * 0.1 });
      c.restore();
      c.fillStyle = '#d8d2c4'; [[-1], [1]].forEach(([s]) => { c.beginPath(); c.ellipse(800 + sw + s * 70, cy + 40 + Math.sin(t * 4.8 + s) * 8, 10, 6, 0, 0, TAU); c.fill(); });
      v = S.layer(1.4);
      c.fillStyle = '#0a0806'; c.fillRect(v.x0 - 10, v.y0 - 10, 290 - v.x0, v.y1 - v.y0 + 20); c.fillRect(v.x0 - 10, 820, v.x1 - v.x0 + 20, 400); c.fillRect(1380, v.y0 - 10, v.x1 - 1370, v.y1 - v.y0 + 20);
      c.fillStyle = '#16120e'; c.fillRect(280, v.y0 - 10, 26, 840 - v.y0); c.fillRect(1354, v.y0 - 10, 26, 840 - v.y0); c.fillRect(280, 800, 1100, 26);
    },
    lights() { return [{ x: 1460, y: 150, r: 1300, i: 0.6, c: '#b8c8e8', d: 0.1, g: 0.06 }]; }
  };

  SC['dr-crypt'] = {
    focus: [800, 460], dark: 0.82, darkCol: '#030203', desat: 0.25,
    init(st) { st.eyes = 0; },
    hot: { box: { x: 800, y: 560, r: 130 } },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.5);
      H.stone(c, v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0, '#221f1c');
      c.fillStyle = '#0a0909';
      for (let i = -1; i < 4; i++) { const x = 300 + i * 500; c.beginPath(); c.moveTo(x - 230, 700); c.lineTo(x - 230, 300); c.quadraticCurveTo(x, 20, x + 230, 300); c.lineTo(x + 230, 340); c.quadraticCurveTo(x, 110, x - 200, 340); c.lineTo(x - 200, 700); c.fill(); }
      c.fillStyle = '#0e1220'; c.beginPath(); c.moveTo(740, 260); c.lineTo(740, 120); c.quadraticCurveTo(800, 60, 860, 120); c.lineTo(860, 260); c.fill();
      c.fillStyle = 'rgba(160,180,220,0.4)'; c.beginPath(); c.moveTo(752, 250); c.lineTo(752, 124); c.quadraticCurveTo(800, 76, 848, 124); c.lineTo(848, 200); c.lineTo(800, 160); c.lineTo(780, 250); c.fill();
      c.fillStyle = '#16120e'; c.fillRect(v.x0, 640, v.x1 - v.x0, 400);
      S.layer(0.8);
      P.rays(c, 800, 200, Math.PI / 2, 0.35, 520, '#b8c8e8', 0.08, 5, t);
      const boxes = [[260, 600, 0.8], [420, 620, 0.9], [1150, 610, 0.85], [1330, 625, 0.95], [330, 680, 1.1], [1260, 690, 1.1]];
      boxes.forEach(([x, y, s]) => { c.fillStyle = '#20160e'; c.fillRect(x - 90 * s, y - 50 * s, 180 * s, 50 * s); c.fillStyle = '#100a06'; c.fillRect(x - 90 * s, y - 50 * s, 180 * s, 8 * s); c.strokeStyle = '#0a0604'; c.lineWidth = 3; c.strokeRect(x - 90 * s, y - 50 * s, 180 * s, 50 * s); c.beginPath(); c.moveTo(x - 30 * s, y - 50 * s); c.lineTo(x - 30 * s, y); c.moveTo(x + 30 * s, y - 50 * s); c.lineTo(x + 30 * s, y); c.stroke(); });
      S.layer(1);
      c.fillStyle = '#2a1c12'; c.fillRect(600, 540, 400, 90); c.strokeStyle = '#0d0805'; c.lineWidth = 4; c.strokeRect(600, 540, 400, 90);
      c.fillStyle = '#1a120a'; c.fillRect(612, 540, 376, 22);
      c.fillStyle = '#d0c8bc'; c.beginPath(); c.ellipse(660, 536, 24, 18, 0, 0, TAU); c.fill();
      c.fillStyle = '#e8e4dc'; c.fillRect(648, 526, 24, 4);
      c.fillStyle = '#050304'; c.beginPath(); c.moveTo(680, 524); c.quadraticCurveTo(820, 500, 980, 530); c.lineTo(980, 548); c.lineTo(680, 552); c.fill();
      c.fillStyle = '#9a0a12'; c.beginPath(); c.ellipse(672, 546, 6, 3, 0, 0, TAU); c.fill(); c.fillRect(670, 548, 2, 8);
      if (st.eyes > 0.01) { P.glow(c, 652, 530, 30, '#ff2010', 0.6 * st.eyes); c.fillStyle = C.rgba('#ff3018', st.eyes); c.fillRect(646, 528, 6, 3); c.fillRect(660, 528, 6, 3); }
      S.layer(1.3);
      c.fillStyle = '#060404'; c.beginPath(); c.moveTo(1700, 1200); c.quadraticCurveTo(1450, 900, 1300, 840); c.lineTo(1320, 800); c.quadraticCurveTo(1500, 860, 1750, 1000); c.fill();
      c.fillStyle = '#1a140c'; c.fillRect(1250, 760, 56, 80); P.flame(c, 1278, 790, 40, t, 1, 5);
    },
    lights(st) { return [{ x: 1278, y: 760, r: 760, i: 1, c: '#ffcf86', d: 1.3, g: 0.2 }, { x: 800, y: 560, r: 300, i: 0.3, c: '#b8c8e8', d: 0.8 }, { x: 656, y: 530, r: 120, i: st.eyes * 0.6, c: '#ff2010' }]; }
  };

  SC['dr-sea'] = {
    focus: [760, 430], dark: 0.5, darkCol: '#03050a', desat: 0.35, storm: true, boltX: 500, boltY: 560,
    init(st) { st.ship = 0; st.dog = -1; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#04060a'], [0.6, '#121a24'], [1, '#1a2430']]);
      P.clouds(c, v, -80, 420, 0.9, t * 30, '#06080c'); P.clouds(c, v, 100, 260, 0.6, t * 45 + 200, '#0c1018');
      v = S.layer(0.35);
      c.fillStyle = '#05070a'; c.beginPath(); c.moveTo(1050, 900); c.lineTo(1100, 470); c.lineTo(1200, 330); c.lineTo(1700, 300); c.lineTo(1800, 900); c.fill();
      c.save(); c.translate(1400, 330); c.fillStyle = '#05070a';
      for (let i = 0; i < 5; i++) { const x = -150 + i * 70; c.fillRect(x, -120 - (i % 2) * 30, 30, 120 + (i % 2) * 30); }
      c.fillRect(-160, -40, 360, 40); c.beginPath(); c.moveTo(-40, -150); c.lineTo(40, -150); c.lineTo(40, -60); c.quadraticCurveTo(0, -120, -40, -60); c.fill();
      c.fillStyle = 'rgba(160,180,220,0.18)'; for (let i = 0; i < 4; i++) c.fillRect(-135 + i * 70, -100, 8, 40);
      c.restore();
      v = S.layer(0.6);
      const waves = (y, amp, sp, col, foam) => {
        c.fillStyle = col; c.beginPath(); c.moveTo(v.x0 - 20, v.y1 + 20);
        for (let x = v.x0 - 20; x <= v.x1 + 20; x += 18) c.lineTo(x, y + Math.sin(x * 0.012 + t * sp) * amp + Math.sin(x * 0.031 - t * sp * 1.3) * amp * 0.4);
        c.lineTo(v.x1 + 20, v.y1 + 20); c.fill();
        if (foam) { c.strokeStyle = 'rgba(200,215,230,0.25)'; c.lineWidth = 3; c.beginPath(); for (let x = v.x0; x < v.x1; x += 18) { const yy = y + Math.sin(x * 0.012 + t * sp) * amp + Math.sin(x * 0.031 - t * sp * 1.3) * amp * 0.4; if (Math.sin(x * 0.012 + t * sp) > 0.6) { c.moveTo(x, yy); c.lineTo(x + 16, yy + 2); } } c.stroke(); }
      };
      waves(560, 12, 1.4, '#0c1218', false);
      st.ship = Math.min(1, st.ship + dt / 30);
      const sx = 380 + st.ship * 300, sy = 575 + Math.sin(t * 1.6) * 10;
      c.save(); c.translate(sx, sy); c.rotate(Math.sin(t * 1.2) * 0.12);
      c.fillStyle = '#030406'; c.beginPath(); c.moveTo(-170, -20); c.lineTo(190, -26); c.lineTo(150, 26); c.lineTo(-140, 26); c.fill();
      [[-60, 220], [70, 250]].forEach(([mx, mh]) => { c.fillRect(mx - 3, -20 - mh, 6, mh); c.fillStyle = '#8a8a86'; c.beginPath(); c.moveTo(mx + 4, -20 - mh + 20); c.lineTo(mx + 70, -20 - mh + 60); c.lineTo(mx + 50, -20 - mh + 90); c.lineTo(mx + 70, -20 - mh + 110); c.lineTo(mx + 4, -40 - mh * 0.4); c.fill(); c.fillStyle = '#030406'; });
      c.strokeStyle = '#030406'; c.lineWidth = 2; c.beginPath(); c.moveTo(-60, -260); c.lineTo(-170, -20); c.moveTo(70, -270); c.lineTo(190, -26); c.stroke();
      c.restore();
      if (st.dog >= 0) {
        st.dog = Math.min(1.2, st.dog + dt / 4);
        const k = st.dog, dx = k < 0.3 ? C.lerp(sx + 150, 860, k / 0.3) : C.lerp(860, 1180, (k - 0.3) / 0.9), dy = k < 0.3 ? sy - 60 - Math.sin(k / 0.3 * Math.PI) * 120 : C.lerp(560, 400, (k - 0.3) / 0.9);
        if (k < 1.15) { c.save(); c.translate(dx, dy); const run = Math.sin(t * 18); c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, 0, 44, 16, k < 0.3 ? -0.4 : -0.25, 0, TAU); c.fill(); c.beginPath(); c.ellipse(46, -16, 16, 12, -0.3, 0, TAU); c.fill(); c.beginPath(); c.moveTo(54, -24); c.lineTo(58, -40); c.lineTo(62, -24); c.fill(); c.lineWidth = 7; c.strokeStyle = '#000'; c.beginPath(); c.moveTo(24, 8); c.lineTo(34 + run * 14, 34); c.moveTo(-26, 8); c.lineTo(-38 - run * 14, 34); c.moveTo(-40, -4); c.quadraticCurveTo(-70, -20, -76, -6); c.stroke(); c.restore(); }
      }
      c.fillStyle = '#05070a'; c.fillRect(700, 540, 520, 22); for (let i = 0; i < 9; i++) c.fillRect(710 + i * 58, 540, 10, 100);
      waves(620, 26, 1.9, '#070b10', true); waves(700, 40, 2.3, '#04070a', true);
      P.parts(c, st, 'rain', 'rain', 240, v, dt, t, { col: '#c0d0e0', wind: -0.3 });
    },
    lights(st, S) { return [{ x: 800, y: 400, r: 1400, i: 0.25 + S.flash * 0.6, c: '#9fb4d0', g: 0.04 }]; }
  };

  SC['dr-whitby'] = {
    focus: [820, 430], dark: 0.66, darkCol: '#03040a', desat: 0.3,
    init(st) { st.vamp = 1; st.fled = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#04050c'], [0.7, '#141a2a'], [1, '#202a3a']]);
      P.stars(c, v, t, 100, 0.8, 51, 400);
      P.moon(c, 1180, 170, 66, '#eef0f6', { halo: 1.2 });
      P.clouds(c, v, 80, 200, 0.6, t * 8, '#0a0c14');
      v = S.layer(0.25);
      const g = c.createLinearGradient(0, 560, 0, 900); g.addColorStop(0, '#1a2232'); g.addColorStop(1, '#06080e'); c.fillStyle = g; c.fillRect(v.x0, 560, v.x1 - v.x0, 400);
      for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(230,235,250,' + (0.25 - i * 0.015) + ')'; const w = 70 - i * 4; c.fillRect(1180 - w / 2 + Math.sin(t * 1.5 + i) * 8, 570 + i * 12, w, 2); }
      v = S.layer(0.55);
      c.fillStyle = '#05060a'; c.fillRect(140, 300, 560, 300);
      for (let i = 0; i < 5; i++) { const x = 180 + i * 104; c.fillStyle = '#0c1220'; c.beginPath(); c.moveTo(x, 520); c.lineTo(x, 360); c.quadraticCurveTo(x + 30, 300, x + 60, 360); c.lineTo(x + 60, 520); c.fill(); c.fillStyle = 'rgba(160,180,220,0.35)'; c.beginPath(); c.moveTo(x + 8, 510); c.lineTo(x + 8, 365); c.quadraticCurveTo(x + 30, 318, x + 52, 365); c.lineTo(x + 52, 510); c.fill(); }
      c.fillStyle = '#05060a'; c.fillRect(120, 200, 50, 420); c.fillRect(670, 240, 50, 380); c.beginPath(); c.moveTo(140, 300); c.lineTo(420, 160); c.lineTo(700, 300); c.lineTo(660, 300); c.lineTo(420, 190); c.lineTo(180, 300); c.fill();
      c.fillStyle = '#07080c'; c.fillRect(v.x0, 600, v.x1 - v.x0, 400);
      v = S.layer(0.9);
      [[300, 'slab'], [420, 'round'], [560, 'cross'], [1260, 'round'], [1380, 'slab'], [1480, 'cross']].forEach(([x, k], i) => { c.save(); c.translate(x, 680); c.rotate((i % 3 - 1) * 0.08); P.grave(c, 0, 0, 60, 100, k, '#08090d', 0.6); c.restore(); });
      S.layer(1);
      c.fillStyle = '#060608'; c.fillRect(860, 650, 240, 16); c.fillRect(870, 666, 12, 50); c.fillRect(1078, 666, 12, 50); c.fillRect(860, 600, 12, 60);
      c.save(); c.translate(960, 652); c.rotate(-1.2); P.fig(c, 0, 0, 220, 'woman', { col: '#d8d8dc', hair: true }); c.restore();
      if (st.vamp > 0.01) {
        c.globalAlpha = st.vamp; c.save(); c.translate(900, 650); c.rotate(0.35); P.fig(c, 0, 0, 260, 'cloak', { col: '#010102', spread: 0.3 }); c.restore();
        P.glow(c, 930, 420, 26, '#ff2010', 0.6 * st.vamp); c.fillStyle = '#ff3018'; c.fillRect(922, 418, 5, 3); c.fillRect(934, 420, 5, 3); c.globalAlpha = 1;
      }
      if (st.fled > 0 && st.fled < 1) { st.fled = Math.min(1, st.fled + dt / 3); P.bat(c, C.lerp(930, 1400, st.fled), C.lerp(420, 120, st.fled), 24, t * 18, '#020203'); }
      P.parts(c, st, 'mist', 'dust', 30, S.view, dt, t, { col: '#c8d0e0', alpha: 0.5 });
      P.fog(c, S.view, 620, 160, 0.3, t * 9, '#8a92a8');
    },
    lights() { return [{ x: 1180, y: 170, r: 1100, i: 0.5, c: '#d8deee', d: 0.05, g: 0.05 }]; }
  };

  SC['dr-end'] = {
    focus: [800, 440], dark: 0.12, darkCol: '#200805', desat: 0.05,
    init(st) { st.dust = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#1c0a24'], [0.45, '#7a1e2a'], [0.7, '#d4501e'], [1, '#f2a043']]);
      P.glow(c, 1100, 500, 420, '#ffd080', 0.6);
      c.fillStyle = '#ffe2a0'; c.beginPath(); c.arc(1100, 500, 60, 0, TAU); c.fill();
      P.clouds(c, v, 220, 160, 0.4, t * 5, '#5a1420');
      v = S.layer(0.3);
      mountains(c, v, t, ['#3a1424', '#2a0e1a', '#1a0812'], '#f0b0a0');
      castle(c, 1290, 330, 0.25, '#14060c', 0, t);
      v = S.layer(0.7);
      const g = c.createLinearGradient(0, 600, 0, 900); g.addColorStop(0, '#d8b0a8'); g.addColorStop(1, '#5a3a42'); c.fillStyle = g; c.fillRect(v.x0, 610, v.x1 - v.x0, 400);
      for (let i = 0; i < 16; i++) P.pine(c, v.x0 + i * 120, 620, 120 + (i * 31 % 50), '#1a0a10', 'rgba(240,200,190,0.5)');
      v = S.layer(1);
      c.fillStyle = '#140808'; c.fillRect(560, 620, 300, 20); H.wheel(c, 600, 670, 40, 0, '#140808'); H.wheel(c, 820, 670, 40, 0, '#140808');
      c.fillRect(590, 540, 240, 80); c.save(); c.translate(830, 540); c.rotate(-0.6); c.fillRect(-240, -12, 240, 12); c.restore();
      if (st.dust > 0) { P.parts(c, st, 'ash', 'ash', Math.round(st.dust * 120), { x0: 560, x1: 900, y0: 200, y1: 560 }, dt, t, { col: '#ffd8a0' }); P.glow(c, 710, 520, 200, '#ffc070', 0.3 * st.dust); }
      P.fig(c, 1000, 700, 260, 'man', { col: '#140808', reach: 10, raise: 20 }); P.fig(c, 1080, 700, 270, 'man', { col: '#140808', hat: true });
      P.fig(c, 420, 700, 240, 'woman', { col: '#140808' });
      P.parts(c, st, 'snow', 'snow', 50, v, dt, t, { col: '#fff0e8', wind: 0.04 });
    }
  };
})();
