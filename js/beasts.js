/* Beasts — portraits peints des créatures tapies derrière les chaînes (rendus une fois, mis en cache).
   Chaque créature est dessinée dans une boîte de 400 × 520 unités, pied en bas au centre. */
window.Beasts = (function () {
  'use strict';
  const C = window.Crypte, P = window.Paint;
  const TAU = Math.PI * 2, W = 400, H = 520;
  const cache = new Map();

  /* ---------- Outils de peinture ---------- */
  const path = (g, fn) => { g.beginPath(); fn(g); };
  function shade(g, fn, cx, cy, r, stops) {
    path(g, fn); const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    stops.forEach((s) => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fill();
  }
  function grit(g, fn, x, y, w, h, a, seed) {
    g.save(); path(g, fn); g.clip();
    g.globalAlpha = a; g.globalCompositeOperation = 'multiply';
    const t = P.tint(P.gritTex(), '#000000');
    const m = 80, o = (seed || 0) % 50;
    g.drawImage(t, x - m - o, y - m, w + m * 2, h + m * 2);
    g.globalAlpha = a * 0.5; g.drawImage(t, x - m * 1.5, y - m * 1.2 + o, (w + m * 3) * 0.7, (h + m * 3) * 0.7); g.drawImage(t, x - m * 1.5 + (w + m * 3) * 0.7 - 2, y - m * 1.2 + o, (w + m * 3) * 0.7, (h + m * 3) * 0.7);
    g.globalCompositeOperation = 'screen'; g.globalAlpha = a * 0.16;
    g.drawImage(P.tint(P.gritTex(), '#ffffff'), x - m + o, y - m, w + m * 2, h + m * 2);
    g.restore();
  }
  function rim(g, fn, col, wdt, blur) {
    g.save(); path(g, fn); g.clip();
    g.shadowColor = col; g.shadowBlur = blur || 18; g.lineWidth = wdt || 6; g.strokeStyle = col;
    path(g, fn); g.stroke(); g.restore();
  }
  function socket(g, x, y, rx, ry, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    let gr = g.createRadialGradient(0, 0, 0, 0, 0, rx * 1.6);
    gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx * 1.6, ry * 1.6, 0, 0, TAU); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fill();
    g.restore();
  }
  function cracks(g, x, y, n, len, seed, col) {
    const r = C.seeded(seed); g.strokeStyle = col || 'rgba(20,14,8,0.7)'; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      let px = x + (r() - 0.5) * len, py = y + (r() - 0.5) * len, a = r() * TAU;
      g.lineWidth = 0.6 + r() * 1.4; g.beginPath(); g.moveTo(px, py);
      for (let k = 0; k < 5; k++) { a += (r() - 0.5) * 1.2; px += Math.cos(a) * len * 0.12; py += Math.sin(a) * len * 0.12; g.lineTo(px, py); }
      g.stroke();
    }
  }
  function tooth(g, x, y, w, h, dir, stain) {
    const gr = g.createLinearGradient(x, y, x, y + h * dir);
    gr.addColorStop(0, stain ? '#6a5a32' : '#9a8a62'); gr.addColorStop(0.35, '#e6dcc2'); gr.addColorStop(1, '#f6eedc');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x - w * 0.35, y + h * dir * 0.7, x + w * 0.05, y + h * dir); g.quadraticCurveTo(x + w * 0.35, y + h * dir * 0.6, x + w / 2, y); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,30,10,0.45)'; g.lineWidth = 0.8; g.stroke();
  }
  function limb(g, x0, y0, x1, y1, w0, w1, light, dark) {
    const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
    const gr = g.createLinearGradient(x0 + nx * w0, y0 + ny * w0, x0 - nx * w0, y0 - ny * w0);
    gr.addColorStop(0, light); gr.addColorStop(0.45, C.mix(light, dark, 0.5)); gr.addColorStop(1, dark);
    g.fillStyle = gr; g.beginPath();
    g.moveTo(x0 + nx * w0, y0 + ny * w0); g.lineTo(x1 + nx * w1, y1 + ny * w1); g.lineTo(x1 - nx * w1, y1 - ny * w1); g.lineTo(x0 - nx * w0, y0 - ny * w0); g.closePath(); g.fill();
    g.beginPath(); g.arc(x1, y1, w1 * 1.15, 0, TAU); g.fill();
  }
  function fadeOut(g, y0, y1) {
    g.save(); g.globalCompositeOperation = 'source-atop';
    let lg = g.createLinearGradient(60, 0, 380, 0); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(0.45, 'rgba(0,0,0,0.18)'); lg.addColorStop(1, 'rgba(0,0,0,0.78)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, 'rgba(0,0,0,0.1)'); lg.addColorStop(0.5, 'rgba(0,0,0,0.25)'); lg.addColorStop(1, 'rgba(0,0,0,0.7)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(40,30,60,0.12)'; g.fillRect(0, 0, W, H);
    g.restore();
    g.save(); g.globalCompositeOperation = 'destination-out';
    const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gr; g.fillRect(0, y0, W, H - y0 + 10);
    const rg = g.createRadialGradient(W / 2, H * 0.45, H * 0.32, W / 2, H * 0.45, H * 0.62);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.restore();
  }
  function hair(g, x0, x1, y0, n, len, seed, sway) {
    const r = C.seeded(seed); g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * r(), y = y0 + r() * 20, L = len * (0.6 + r() * 0.5), s = (x - (x0 + x1) / 2) * 0.25 + (r() - 0.5) * 30 + (sway || 0);
      g.strokeStyle = 'rgba(4,4,4,' + (0.55 + r() * 0.45) + ')'; g.lineWidth = 0.8 + r() * 2.2;
      g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + s * 0.3, y + L * 0.35, x + s * 0.8, y + L * 0.7, x + s + (r() - 0.5) * 20, y + L); g.stroke();
    }
  }

  /* ---------- Les créatures ---------- */
  const DRAW = {
    /* Le Sourire : visage cendreux, orbites vides, rictus d'une oreille à l'autre */
    grin(g) {
      const head = (h) => { h.moveTo(200, 60); h.bezierCurveTo(296, 58, 326, 150, 316, 222); h.bezierCurveTo(306, 292, 268, 338, 200, 356); h.bezierCurveTo(132, 338, 94, 292, 84, 222); h.bezierCurveTo(74, 150, 104, 58, 200, 60); h.closePath(); };
      shade(g, (h) => { h.moveTo(110, 520); h.bezierCurveTo(120, 420, 160, 360, 200, 352); h.bezierCurveTo(240, 360, 280, 420, 290, 520); h.closePath(); }, 190, 380, 160, [[0, '#4a453e'], [0.6, '#1c1a17'], [1, '#050404']]);
      shade(g, head, 168, 150, 230, [[0, '#b4ad9f'], [0.35, '#7c766b'], [0.7, '#34302a'], [1, '#0b0a09']]);
      grit(g, head, 70, 50, 260, 320, 0.7, 7);
      shade(g, (h) => h.ellipse(200, 152, 112, 26, 0, 0, TAU), 200, 152, 110, [[0, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]);
      [[132, 238], [268, 238]].forEach(([x, y]) => shade(g, (h) => h.ellipse(x, y, 34, 18, 0, 0, TAU), x, y - 6, 36, [[0, 'rgba(215,205,185,0.45)'], [1, 'rgba(215,205,185,0)']]));
      socket(g, 153, 190, 31, 22, 0.32); socket(g, 247, 190, 31, 22, -0.32);
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.4;
      [[0, 110], [10, 122], [-8, 134]].forEach(([dx, y]) => { g.beginPath(); g.moveTo(140 + dx, y); g.quadraticCurveTo(200, y - 12, 260 - dx, y); g.stroke(); });
      const up = (t) => ({ x: 92 + 216 * t, y: 252 + Math.sin(Math.PI * t) * 26 }), lo = (t) => ({ x: 92 + 216 * t, y: 252 + Math.sin(Math.PI * t) * 92 });
      const mouth = (h) => { h.moveTo(92, 252); h.quadraticCurveTo(200, 304, 308, 252); h.quadraticCurveTo(200, 436, 92, 252); h.closePath(); };
      g.save(); path(g, mouth); g.clip();
      g.fillStyle = '#0c0202'; g.fillRect(80, 240, 240, 140);
      g.strokeStyle = '#4a0a10'; g.lineWidth = 14; g.beginPath(); g.moveTo(92, 256); g.quadraticCurveTo(200, 308, 308, 256); g.stroke();
      g.beginPath(); g.moveTo(98, 262); g.quadraticCurveTo(200, 426, 302, 262); g.stroke();
      const r = C.seeded(3);
      for (let i = 1; i < 24; i++) { const t = i / 24, p = up(t), m = Math.sin(Math.PI * t); tooth(g, p.x, p.y + 4, 8 + m * 3, 14 + m * 22 + r() * 8, 1, r() < 0.3); }
      for (let i = 1; i < 20; i++) { const t = i / 20, p = lo(t), m = Math.sin(Math.PI * t); tooth(g, p.x, p.y - 6, 7 + m * 3, 10 + m * 18 + r() * 6, -1, r() < 0.3); }
      g.restore();
      g.strokeStyle = 'rgba(28,8,6,0.85)'; g.lineWidth = 3; path(g, mouth); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1.6;
      [[92, 252, 72, 214], [308, 252, 328, 214], [96, 262, 88, 300], [304, 262, 312, 300]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c2) / 2 + (a < 200 ? 6 : -6), (b + d) / 2, c2, d); g.stroke(); });
      cracks(g, 200, 120, 6, 80, 21, 'rgba(30,22,14,0.4)');
      rim(g, head, 'rgba(200,190,230,0.35)', 5, 14);
      fadeOut(g, 330, 470);
      return { eyes: [[153, 192], [247, 192]], eye: 4.5 };
    },

    /* Le Wendigo : crâne de cerf, bois déchiquetés, épaules décharnées */
    wendigo(g) {
      const ant = (x, y, a, len, w, d, r) => {
        const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
        limb(g, x, y, x1, y1, w, w * 0.62, '#7a6c58', '#16120c');
        if (d > 0) { ant(x1, y1, a + (r() - 0.6) * 0.5, len * 0.75, w * 0.62, d - 1, r); if (r() < 0.8) ant(x1, y1, a + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.5), len * 0.5, w * 0.5, d - 2, r); }
      };
      const r = C.seeded(12); ant(170, 118, -2.1, 62, 9, 3, r); ant(230, 118, -1.04, 62, 9, 3, r);
      shade(g, (h) => { h.moveTo(40, 520); h.bezierCurveTo(50, 440, 110, 404, 170, 396); h.lineTo(230, 396); h.bezierCurveTo(290, 404, 350, 440, 360, 520); h.closePath(); }, 200, 420, 200, [[0, '#3a332a'], [0.6, '#14110d'], [1, '#040303']]);
      g.strokeStyle = 'rgba(170,160,140,0.22)'; g.lineWidth = 3;
      for (let i = 0; i < 5; i++) { const y = 440 + i * 18; g.beginPath(); g.moveTo(110 + i * 4, y); g.quadraticCurveTo(160, y - 14, 194, y - 2); g.moveTo(290 - i * 4, y); g.quadraticCurveTo(240, y - 14, 206, y - 2); g.stroke(); }
      g.lineWidth = 6; g.strokeStyle = 'rgba(170,160,140,0.18)'; g.beginPath(); g.moveTo(200, 404); g.lineTo(200, 520); g.stroke();
      const skull = (h) => { h.moveTo(200, 98); h.bezierCurveTo(252, 98, 278, 140, 272, 192); h.bezierCurveTo(268, 232, 246, 252, 240, 292); h.bezierCurveTo(234, 344, 222, 384, 200, 398); h.bezierCurveTo(178, 384, 166, 344, 160, 292); h.bezierCurveTo(154, 252, 132, 232, 128, 192); h.bezierCurveTo(122, 140, 148, 98, 200, 98); h.closePath(); };
      shade(g, skull, 182, 160, 260, [[0, '#e2d9c4'], [0.3, '#a89e88'], [0.65, '#463f33'], [1, '#0e0c09']]);
      grit(g, skull, 120, 90, 160, 310, 0.75, 19);
      cracks(g, 200, 150, 9, 70, 33); cracks(g, 205, 300, 5, 50, 41);
      socket(g, 171, 188, 24, 20, 0.35); socket(g, 229, 188, 24, 20, -0.35);
      g.fillStyle = '#000'; g.beginPath(); g.moveTo(200, 248); g.bezierCurveTo(186, 238, 180, 262, 196, 282); g.lineTo(200, 290); g.lineTo(204, 282); g.bezierCurveTo(220, 262, 214, 238, 200, 248); g.fill();
      g.fillStyle = '#0a0705'; g.beginPath(); g.moveTo(172, 346); g.quadraticCurveTo(200, 360, 228, 346); g.lineTo(222, 392); g.quadraticCurveTo(200, 404, 178, 392); g.closePath(); g.fill();
      for (let i = 0; i < 7; i++) { const x = 178 + i * 7.4; tooth(g, x, 350 + Math.abs(i - 3) * 1.5, 6, 18 + (i === 1 || i === 5 ? 12 : 0), 1, i % 2); }
      for (let i = 0; i < 6; i++) { const x = 181 + i * 7.6; tooth(g, x, 392, 6, 12, -1, i % 2); }
      rim(g, skull, 'rgba(220,210,250,0.3)', 5, 12);
      fadeOut(g, 430, 510);
      return { eyes: [[171, 190], [229, 190]], eye: 3.4 };
    },

    /* Le Rampant : corps blême à quatre pattes, coudes trop hauts, mâchoire décrochée, cheveux qui tombent */
    crawler(g) {
      const skin = '#9c9486', dk = '#0e0c0a';
      [[150, 320, 96, 236, 136, 470], [250, 320, 304, 236, 264, 470]].forEach(([a, b, c2, d, e, f]) => { limb(g, a, b, c2, d, 13, 9, C.mix(skin, dk, 0.45), dk); limb(g, c2, d, e, f, 9, 6, C.mix(skin, dk, 0.5), dk); });
      shade(g, (h) => h.ellipse(200, 320, 116, 56, 0, 0, TAU), 190, 290, 140, [[0, '#a69e90'], [0.5, '#5a544b'], [1, '#141210']]);
      grit(g, (h) => h.ellipse(200, 320, 116, 56, 0, 0, TAU), 80, 260, 240, 120, 0.6, 5);
      for (let i = 0; i < 9; i++) { const x = 120 + i * 20, y = 278 - Math.sin(i / 8 * Math.PI) * 10; shade(g, (h) => h.ellipse(x, y, 7, 5, 0, 0, TAU), x - 2, y - 2, 8, [[0, '#d8d0c2'], [1, 'rgba(60,55,48,0)']]); }
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(130 + i * 6, 300 + i * 6); g.quadraticCurveTo(160, 320 + i * 4, 170, 350); g.moveTo(270 - i * 6, 300 + i * 6); g.quadraticCurveTo(240, 320 + i * 4, 230, 350); g.stroke(); }
      const arms = [[128, 328, 40, 190, 78, 478], [272, 328, 360, 190, 322, 478]];
      arms.forEach(([a, b, c2, d, e, f], i) => {
        limb(g, a, b, c2, d, 16, 11, skin, dk); limb(g, c2, d, e, f, 11, 8, skin, dk);
        shade(g, (h) => h.arc(c2, d, 14, 0, TAU), c2 - 4, d - 4, 16, [[0, '#e6ded0'], [1, 'rgba(80,74,66,0)']]);
        for (let k = 0; k < 4; k++) { const ang = Math.PI * (i ? 0.1 + k * 0.17 : 0.9 - k * 0.17); const x1 = e + Math.cos(ang) * 30, y1 = f + 6 + Math.sin(ang) * 10; limb(g, e, f, x1, y1, 3.6, 2.4, skin, dk); limb(g, x1, y1, x1 + Math.cos(ang) * 22, y1 + 8, 2.4, 1.4, skin, dk); }
      });
      const head = (h) => h.ellipse(200, 352, 50, 60, 0, 0, TAU);
      shade(g, head, 186, 330, 80, [[0, '#ddd5c6'], [0.45, '#8a8276'], [1, '#1a1815']]);
      grit(g, head, 150, 290, 100, 130, 0.6, 9);
      g.fillStyle = '#060303'; g.beginPath(); g.moveTo(176, 386); g.bezierCurveTo(170, 430, 182, 482, 200, 490); g.bezierCurveTo(218, 482, 230, 430, 224, 386); g.quadraticCurveTo(200, 394, 176, 386); g.fill();
      g.strokeStyle = 'rgba(120,20,24,0.8)'; g.lineWidth = 3; g.stroke();
      for (let i = 0; i < 6; i++) { tooth(g, 180 + i * 8, 390 + Math.abs(i - 2.5) * 1.4, 6, 11, 1, i % 2); tooth(g, 186 + i * 6, 486 - Math.abs(i - 2.5) * 2, 5, 9, -1, 1); }
      socket(g, 183, 344, 12, 9, 0.2); socket(g, 217, 344, 12, 9, -0.2);
      hair(g, 156, 244, 296, 70, 150, 17, 0);
      rim(g, head, 'rgba(210,205,240,0.3)', 4, 10);
      fadeOut(g, 470, 520);
      return { eyes: [[183, 346], [217, 346]], eye: 2.8 };
    },

    /* Le Spectre : capuche en lambeaux, crâne à moitié éclairé */
    wraith(g) {
      const hood = (h) => { h.moveTo(200, 58); h.bezierCurveTo(282, 58, 334, 130, 334, 222); h.bezierCurveTo(334, 300, 352, 380, 362, 520); h.lineTo(38, 520); h.bezierCurveTo(48, 380, 66, 300, 66, 222); h.bezierCurveTo(66, 130, 118, 58, 200, 58); h.closePath(); };
      shade(g, hood, 150, 120, 420, [[0, '#3c3640'], [0.5, '#17141a'], [1, '#050406']]);
      grit(g, hood, 30, 50, 340, 470, 0.5, 13);
      const r = C.seeded(4); g.lineCap = 'round';
      for (let i = 0; i < 14; i++) { const x = 70 + r() * 260; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3 + r() * 6; g.beginPath(); g.moveTo(x, 140 + r() * 80); g.bezierCurveTo(x + (r() - 0.5) * 40, 300, x + (r() - 0.5) * 50, 400, x + (r() - 0.5) * 60, 520); g.stroke(); g.strokeStyle = 'rgba(150,140,170,0.08)'; g.lineWidth = 2; g.stroke(); }
      const open = (h) => h.ellipse(200, 222, 80, 104, 0, 0, TAU);
      g.fillStyle = '#000'; path(g, open); g.fill();
      g.save(); path(g, open); g.clip();
      const skull = (h) => { h.moveTo(200, 150); h.bezierCurveTo(244, 150, 258, 188, 254, 222); h.bezierCurveTo(250, 248, 238, 256, 236, 280); h.lineTo(164, 280); h.bezierCurveTo(162, 256, 150, 248, 146, 222); h.bezierCurveTo(142, 188, 156, 150, 200, 150); h.closePath(); };
      shade(g, skull, 168, 196, 120, [[0, '#d6cdb8'], [0.4, '#857b68'], [0.75, '#2a251e'], [1, '#000']]);
      grit(g, skull, 140, 140, 120, 160, 0.7, 23);
      socket(g, 180, 214, 15, 13, 0.15); socket(g, 222, 214, 15, 13, -0.15);
      g.fillStyle = '#000'; g.beginPath(); g.moveTo(200, 236); g.lineTo(192, 256); g.lineTo(208, 256); g.closePath(); g.fill();
      shade(g, (h) => { h.moveTo(170, 282); h.quadraticCurveTo(200, 296, 230, 282); h.lineTo(226, 316); h.quadraticCurveTo(200, 330, 174, 316); h.closePath(); }, 186, 292, 50, [[0, '#a89e88'], [1, '#141210']]);
      for (let i = 0; i < 8; i++) { tooth(g, 172 + i * 8, 272, 7, 13, 1, i % 3 === 0); tooth(g, 174 + i * 7.5, 300, 6, 10, -1, 1); }
      cracks(g, 200, 180, 5, 40, 51);
      g.restore();
      shade(g, open, 280, 230, 120, [[0, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.9)']]);
      rim(g, hood, 'rgba(170,160,210,0.25)', 6, 16);
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
      for (let x = 30; x < 370; x += 18) { const d = 30 + r() * 60; g.beginPath(); g.moveTo(x, 521); g.lineTo(x + 9, 520 - d); g.lineTo(x + 18, 521); g.fill(); }
      g.restore();
      fadeOut(g, 440, 520);
      return { eyes: [[180, 216], [222, 216]], eye: 2.6 };
    },

    /* Le Grand : silhouette décharnée, bras jusqu'au sol, bouche verticale */
    tall(g) {
      const skin = '#8f8a80', dk = '#090808';
      [[164, 150, 120, 330, 132, 470], [236, 150, 280, 330, 268, 470]].forEach(([a, b, c2, d, e, f], i) => {
        limb(g, a, b, c2, d, 11, 7, C.mix(skin, dk, i ? 0.6 : 0.2), dk); limb(g, c2, d, e, f, 7, 5, C.mix(skin, dk, i ? 0.6 : 0.25), dk);
        for (let k = 0; k < 4; k++) { const ang = Math.PI / 2 + (k - 1.5) * 0.18 * (i ? -1 : 1); const x1 = e + Math.cos(ang) * 30, y1 = f + Math.sin(ang) * 30; limb(g, e, f, x1, y1, 2.6, 1.8, skin, dk); limb(g, x1, y1, x1 + Math.cos(ang + (i ? -0.4 : 0.4)) * 26, y1 + 22, 1.8, 0.8, skin, dk); }
      });
      const torso = (h) => { h.moveTo(150, 146); h.bezierCurveTo(170, 128, 230, 128, 250, 146); h.bezierCurveTo(246, 190, 236, 220, 226, 252); h.bezierCurveTo(218, 280, 232, 330, 226, 370); h.bezierCurveTo(210, 380, 190, 380, 174, 370); h.bezierCurveTo(168, 330, 182, 280, 174, 252); h.bezierCurveTo(164, 220, 154, 190, 150, 146); h.closePath(); };
      shade(g, torso, 180, 170, 220, [[0, '#a29d92'], [0.45, '#504c45'], [1, '#0a0909']]);
      grit(g, torso, 140, 120, 120, 260, 0.6, 31);
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2.2; for (let i = 0; i < 7; i++) { const y = 176 + i * 15; g.beginPath(); g.moveTo(198, y); g.quadraticCurveTo(178, y - 6, 166, y + 8); g.moveTo(202, y); g.quadraticCurveTo(222, y - 6, 234, y + 8); g.stroke(); }
      limb(g, 200, 118, 200, 140, 8, 9, skin, dk);
      const head = (h) => { h.moveTo(200, 18); h.bezierCurveTo(228, 18, 236, 56, 232, 82); h.bezierCurveTo(228, 108, 214, 124, 200, 126); h.bezierCurveTo(186, 124, 172, 108, 168, 82); h.bezierCurveTo(164, 56, 172, 18, 200, 18); h.closePath(); };
      shade(g, head, 188, 50, 90, [[0, '#d8d2c6'], [0.5, '#7a756c'], [1, '#121110']]);
      grit(g, head, 160, 10, 80, 120, 0.6, 37);
      socket(g, 189, 66, 7, 6, 0.2); socket(g, 211, 66, 7, 6, -0.2);
      g.fillStyle = '#040202'; g.beginPath(); g.ellipse(200, 100, 6, 20, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(90,20,20,0.7)'; g.lineWidth = 1.5; g.stroke();
      for (let i = 0; i < 5; i++) { tooth(g, 196, 84 + i * 7, 4, 5, 1, 1); tooth(g, 204, 87 + i * 7, 4, 5, 1, 1); }
      rim(g, head, 'rgba(220,215,250,0.35)', 4, 10); rim(g, torso, 'rgba(220,215,250,0.2)', 4, 10);
      fadeOut(g, 400, 520);
      return { eyes: [[189, 67], [211, 67]], eye: 2.2 };
    },

    /* Main décharnée, horizontale, doigts recourbés (boîte 320 × 140, poignet à gauche) */
    hand(g) {
      const skin = '#a39e90', dk = '#1a1815';
      limb(g, -20, 70, 150, 72, 20, 17, skin, dk);
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; [60, 76, 90].forEach((y, i) => { g.beginPath(); g.moveTo(30, y); g.quadraticCurveTo(100, y - 4 + i * 2, 160, y + (i - 1) * 6); g.stroke(); });
      shade(g, (h) => h.ellipse(176, 74, 34, 30, 0, 0, TAU), 168, 62, 44, [[0, '#cfc8b8'], [0.5, '#6e695f'], [1, '#141210']]);
      grit(g, (h) => h.ellipse(176, 74, 34, 30, 0, 0, TAU), 140, 40, 80, 70, 0.6, 3);
      for (let k = 0; k < 4; k++) {
        const y0 = 52 + k * 13, x0 = 200, a1 = -0.15 + k * 0.12;
        const x1 = x0 + Math.cos(a1) * 46, y1 = y0 + Math.sin(a1) * 46;
        const a2 = a1 + 0.7, x2 = x1 + Math.cos(a2) * 34, y2 = y1 + Math.sin(a2) * 34;
        const a3 = a2 + 0.8, x3 = x2 + Math.cos(a3) * 24, y3 = y2 + Math.sin(a3) * 24;
        limb(g, x0, y0, x1, y1, 6, 5, skin, dk); limb(g, x1, y1, x2, y2, 5, 4, skin, dk); limb(g, x2, y2, x3, y3, 4, 2.6, skin, dk);
        [[x1, y1], [x2, y2]].forEach(([x, y]) => shade(g, (h) => h.arc(x, y, 6, 0, TAU), x - 2, y - 2, 7, [[0, '#e0d8c8'], [1, 'rgba(90,84,74,0)']]));
        g.fillStyle = '#0c0a08'; g.beginPath(); g.moveTo(x3, y3); g.quadraticCurveTo(x3 + Math.cos(a3 + 0.6) * 16, y3 + Math.sin(a3 + 0.6) * 16, x3 + Math.cos(a3 + 1.1) * 20, y3 + Math.sin(a3 + 1.1) * 20); g.lineTo(x3 + Math.cos(a3 - 1.2) * 3, y3 + Math.sin(a3 - 1.2) * 3); g.fill();
      }
      limb(g, 170, 98, 200, 116, 6, 4, skin, dk);
      g.save(); g.globalCompositeOperation = 'source-atop'; const lg = g.createLinearGradient(0, 0, 320, 0); lg.addColorStop(0, 'rgba(0,0,0,0.85)'); lg.addColorStop(0.5, 'rgba(0,0,0,0.25)'); lg.addColorStop(1, 'rgba(0,0,0,0.1)'); g.fillStyle = lg; g.fillRect(0, 0, 320, 140); g.restore();
      return {};
    }
  };

  function get(kind, k) {
    const key = kind + k;
    if (cache.has(key)) return cache.get(key);
    const isHand = kind === 'hand', w = isHand ? 320 : W, h = isHand ? 140 : H;
    const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    const g = cv.getContext('2d'); g.scale(k, k);
    let info = {};
    try { info = DRAW[kind](g) || {}; } catch (e) { console.warn(e); }
    const out = Object.assign({ cv, w, h }, info);
    cache.set(key, out); return out;
  }
  return { get, kinds: ['grin', 'wendigo', 'crawler', 'wraith', 'tall'] };
})();
