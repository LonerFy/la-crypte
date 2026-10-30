/* Paint — bibliothèque de peinture nocturne : textures de brume, silhouettes, lumières, créatures. */
window.Paint = (function () {
  'use strict';
  const C = window.Crypte;
  const P = {};
  const TAU = Math.PI * 2;
  P.TAU = TAU;

  /* ---------- Textures de bruit (tuilables) ---------- */
  function noiseCanvas(w, h, cells, oct, seed, contrast, bias, vfade) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'); const img = g.createImageData(w, h); const d = img.data;
    const rng = C.seeded(seed);
    const grids = [];
    for (let o = 0; o < oct; o++) {
      const cx = cells * (1 << o), cy = Math.max(1, Math.round(cells * (1 << o) * h / w));
      const arr = new Float32Array(cx * cy);
      for (let i = 0; i < arr.length; i++) arr[i] = rng();
      grids.push({ cx, cy, arr });
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = 0, amp = 1, tot = 0;
        for (let o = 0; o < oct; o++) {
          const gr = grids[o];
          const fx = x / w * gr.cx, fy = y / h * gr.cy;
          const x0 = Math.floor(fx), y0 = Math.floor(fy);
          let tx = fx - x0, ty = fy - y0;
          tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
          const xa = x0 % gr.cx, xb = (x0 + 1) % gr.cx, ya = y0 % gr.cy, yb = (y0 + 1) % gr.cy;
          const a = gr.arr[ya * gr.cx + xa], b = gr.arr[ya * gr.cx + xb], c = gr.arr[yb * gr.cx + xa], e = gr.arr[yb * gr.cx + xb];
          v += (a + (b - a) * tx + (c - a) * ty + (a - b - c + e) * tx * ty) * amp;
          tot += amp; amp *= 0.5;
        }
        v = v / tot;
        v = C.clamp((v - 0.5 + (bias || 0)) * contrast + 0.5, 0, 1);
        if (vfade) v *= Math.pow(Math.sin(Math.PI * (y + 0.5) / h), 0.9);
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = v * 255;
      }
    }
    g.putImageData(img, 0, 0);
    return cv;
  }
  let _fog = null, _cloud = null, _grit = null;
  P.fogTex = () => _fog || (_fog = noiseCanvas(512, 192, 3, 5, 7, 1.5, -0.05, true));
  P.cloudTex = () => _cloud || (_cloud = noiseCanvas(512, 192, 3, 5, 21, 2.6, -0.12, true));
  P.gritTex = () => _grit || (_grit = noiseCanvas(256, 256, 8, 4, 33, 1.8, 0));
  const tints = new Map();
  P.tint = (tex, col) => {
    const k = (tex === _fog ? 'f' : tex === _cloud ? 'c' : 'g') + col;
    if (tints.has(k)) return tints.get(k);
    const cv = document.createElement('canvas'); cv.width = tex.width; cv.height = tex.height;
    const g = cv.getContext('2d'); g.drawImage(tex, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, cv.width, cv.height);
    tints.set(k, cv); return cv;
  };
  /* Bande de brume tuilée de x0 à x1 */
  P.fog = (c, v, y, hgt, alpha, off, col, tex) => {
    if (alpha <= 0.002 || hgt <= 0) return;
    const t = P.tint(tex || P.fogTex(), col || '#b8c0c8');
    const k = hgt / t.height, x0 = v.x0 - 40, x1 = v.x1 + 40;
    if (!t._pat) t._pat = new Map();
    let pat = t._pat.get(c); if (!pat) { pat = c.createPattern(t, 'repeat-x'); t._pat.set(c, pat); }
    c.save(); c.globalAlpha = alpha; c.translate(off % (t.width * k), y); c.scale(k, k);
    c.fillStyle = pat; const ox = (x0 - off % (t.width * k)) / k; c.fillRect(ox, 0, (x1 - x0) / k, t.height);
    c.restore();
  };
  P.clouds = (c, v, y, hgt, alpha, off, col) => P.fog(c, v, y, hgt, alpha, off, col, P.cloudTex());

  /* ---------- Ciel, étoiles, lune ---------- */
  P.sky = (c, v, stops) => {
    const g = c.createLinearGradient(0, v.y0, 0, v.y1);
    stops.forEach((s, i) => g.addColorStop(Array.isArray(s) ? s[0] : i / (stops.length - 1), Array.isArray(s) ? s[1] : s));
    c.fillStyle = g; c.fillRect(v.x0 - 10, v.y0 - 10, v.x1 - v.x0 + 20, v.y1 - v.y0 + 20);
  };
  P.stars = (c, v, t, n, alpha, seed, yMax) => {
    const r = C.seeded(seed || 5); const w = 2400, x0 = -400; const ym = yMax == null ? 520 : yMax;
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * w, y = -300 + r() * (ym + 300), s = 0.6 + r() * 1.8, ph = r() * 6.28;
      if (x < v.x0 || x > v.x1) continue;
      const a = alpha * (0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + r()) + ph)));
      c.fillStyle = 'rgba(235,235,255,' + a.toFixed(3) + ')'; c.fillRect(x, y, s, s);
    }
  };
  P.moon = (c, x, y, r, col, o) => {
    o = o || {};
    const halo = o.halo == null ? 1 : o.halo;
    let g = c.createRadialGradient(x, y, r * 0.6, x, y, r * 6);
    g.addColorStop(0, C.rgba(col, 0.32 * halo)); g.addColorStop(0.25, C.rgba(col, 0.12 * halo)); g.addColorStop(1, C.rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
    c.fillStyle = col; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.globalAlpha = 0.35; c.drawImage(P.tint(P.cloudTex(), '#000000'), x - r * 1.6, y - r * 1.1, r * 4.4, r * 2.2);
    g = c.createRadialGradient(x - r * 0.35, y - r * 0.3, r * 0.2, x, y, r * 1.05);
    g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    c.globalAlpha = 1; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
  };

  /* ---------- Relief ---------- */
  P.ridge = (c, v, y, amp, seed, col, step, freq) => {
    const st = step || 24, f = freq || 1;
    c.fillStyle = col; c.beginPath(); c.moveTo(v.x0 - 50, v.y1 + 50);
    for (let x = Math.floor((v.x0 - 50) / st) * st; x <= v.x1 + 50; x += st) {
      const n = Math.sin(x * 0.004 * f + seed) * 0.5 + Math.sin(x * 0.011 * f + seed * 2.1) * 0.3 + Math.sin(x * 0.029 * f + seed * 3.7) * 0.2;
      c.lineTo(x, y - n * amp);
    }
    c.lineTo(v.x1 + 50, v.y1 + 50); c.closePath(); c.fill();
  };
  P.ground = (c, v, y, top, bot) => {
    const g = c.createLinearGradient(0, y, 0, Math.max(y + 1, v.y1));
    g.addColorStop(0, top); g.addColorStop(1, bot || '#000');
    c.fillStyle = g; c.fillRect(v.x0 - 20, y, v.x1 - v.x0 + 40, Math.max(10, v.y1 - y + 20));
  };

  /* ---------- Arbres (sprites mis en cache) ---------- */
  const trees = new Map();
  P.treeSprite = (seed0, col, kind) => {
    const seed = C.lowPower ? (seed0 % 7) + 3 : seed0;
    const k = seed + col + (kind || '');
    if (trees.has(k)) return trees.get(k);
    const W = 760, H = 760, SS = C.lowPower ? 0.42 : 0.7, cv = document.createElement('canvas'); cv.width = Math.round(W * SS); cv.height = Math.round(H * SS);
    const g = cv.getContext('2d'); g.scale(SS, SS); g.fillStyle = col; const rng = C.seeded(seed);
    const perches = [];
    const seg = (x, y, a, len, wd, d) => {
      let cx = x, cy = y, ca = a; const steps = 3; const w2 = wd * 0.66;
      for (let s = 0; s < steps; s++) {
        ca += (rng() - 0.5) * 0.5;
        const nx = cx + Math.cos(ca) * len / steps, ny = cy + Math.sin(ca) * len / steps;
        const wa = wd + (w2 - wd) * (s / steps), wb = wd + (w2 - wd) * ((s + 1) / steps);
        const px = Math.cos(ca + Math.PI / 2), py = Math.sin(ca + Math.PI / 2);
        g.beginPath(); g.moveTo(cx + px * wa / 2, cy + py * wa / 2); g.lineTo(nx + px * wb / 2, ny + py * wb / 2);
        g.lineTo(nx - px * wb / 2, ny - py * wb / 2); g.lineTo(cx - px * wa / 2, cy - py * wa / 2); g.fill();
        g.beginPath(); g.arc(nx, ny, wb / 2, 0, TAU); g.fill();
        cx = nx; cy = ny;
      }
      if (d >= 2 && d <= 4 && Math.abs(Math.sin(ca)) < 0.55 && rng() < 0.5) perches.push({ x: cx, y: cy - w2 / 2 });
      if (d <= 0 || len < 5) return;
      const n = kind === 'pine' ? 2 : (d > 5 ? (rng() < 0.6 ? 3 : 2) : (rng() < 0.8 ? 2 : 1));
      for (let i = 0; i < n; i++) {
        const spread = kind === 'willow' ? 0.9 : 0.55;
        const na = ca + (i - (n - 1) / 2) * spread + (rng() - 0.5) * 0.6;
        seg(cx, cy, kind === 'willow' && d < 4 ? na + 0.6 : na, len * (0.64 + rng() * 0.2), w2, d - 1);
      }
    };
    // racines
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.05 + i * 0.22) ; g.beginPath(); g.moveTo(W / 2 - 30 + i * 15, H - 40); g.quadraticCurveTo(W / 2 + Math.cos(a) * 60, H - 20, W / 2 + Math.cos(a) * (70 + rng() * 30), H - 4); g.lineTo(W / 2 + Math.cos(a) * 20, H - 4); g.fill(); }
    seg(W / 2, H - 20, -Math.PI / 2 + (rng() - 0.5) * 0.2, 170, 52, 8);
    const out = { cv, perches, W, H };
    trees.set(k, out); return out;
  };
  /* Arbre posé au sol : x,y = pied ; h = hauteur voulue */
  P.tree = (c, x, y, h, seed, col, t, sway) => {
    const s = P.treeSprite(seed, col || '#050405');
    const k = h / 600;
    c.save(); c.translate(x, y);
    if (sway) c.transform(1, 0, Math.sin((t || 0) * 0.7 + seed) * 0.02 * sway, 1, 0, 0);
    c.drawImage(s.cv, -s.W / 2 * k, -(s.H - 20) * k, s.W * k, s.H * k);
    c.restore();
    return s;
  };
  P.treePerch = (s, x, y, h, i) => { const k = h / 600, p = s.perches[i % Math.max(1, s.perches.length)] || { x: s.W / 2, y: 200 }; return { x: x + (p.x - s.W / 2) * k, y: y + (p.y - (s.H - 20)) * k }; };

  P.pine = (c, x, y, h, col, snow) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y - h);
    const tiers = 5;
    for (let i = 1; i <= tiers; i++) { const ty = y - h + h * i / tiers * 0.92, tw = h * 0.1 + h * 0.32 * i / tiers; c.lineTo(x + tw, ty); c.lineTo(x + tw * 0.45, ty - h * 0.03); }
    c.lineTo(x + h * 0.04, y); c.lineTo(x - h * 0.04, y);
    for (let i = tiers; i >= 1; i--) { const ty = y - h + h * i / tiers * 0.92, tw = h * 0.1 + h * 0.32 * i / tiers; c.lineTo(x - tw * 0.45, ty - h * 0.03); c.lineTo(x - tw, ty); }
    c.closePath(); c.fill();
    if (snow) {
      c.fillStyle = snow;
      for (let i = 1; i <= tiers; i++) { const ty = y - h + h * i / tiers * 0.92, tw = h * 0.1 + h * 0.32 * i / tiers; c.beginPath(); c.moveTo(x - tw * 0.9, ty - h * 0.005); c.quadraticCurveTo(x, ty - h * 0.09, x + tw * 0.9, ty - h * 0.005); c.lineTo(x + tw * 0.4, ty - h * 0.04); c.lineTo(x - tw * 0.4, ty - h * 0.04); c.fill(); }
    }
  };

  /* ---------- Tombes ---------- */
  P.grave = (c, x, y, w, h, type, col, lit) => {
    c.fillStyle = col;
    c.beginPath();
    if (type === 'cross') {
      c.rect(x - w * 0.12, y - h, w * 0.24, h); c.rect(x - w * 0.42, y - h * 0.78, w * 0.84, w * 0.22);
    } else if (type === 'obelisk') {
      c.moveTo(x - w * 0.5, y); c.lineTo(x - w * 0.5, y - h * 0.15); c.lineTo(x - w * 0.3, y - h * 0.18); c.lineTo(x - w * 0.18, y - h * 0.9); c.lineTo(x, y - h); c.lineTo(x + w * 0.18, y - h * 0.9); c.lineTo(x + w * 0.3, y - h * 0.18); c.lineTo(x + w * 0.5, y - h * 0.15); c.lineTo(x + w * 0.5, y);
    } else if (type === 'slab') {
      c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h * 0.7); c.lineTo(x - w * 0.3, y - h); c.lineTo(x + w * 0.3, y - h); c.lineTo(x + w / 2, y - h * 0.7); c.lineTo(x + w / 2, y);
    } else if (type === 'angel') {
      c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h * 0.45); c.lineTo(x + w / 2, y - h * 0.45); c.lineTo(x + w / 2, y); c.closePath();
      c.moveTo(x - w * 0.12, y - h * 0.45); c.lineTo(x - w * 0.16, y - h * 0.82); c.lineTo(x + w * 0.16, y - h * 0.82); c.lineTo(x + w * 0.12, y - h * 0.45);
      c.moveTo(x + w * 0.12, y - h * 0.9); c.arc(x, y - h * 0.9, w * 0.12, 0, TAU);
      c.moveTo(x - w * 0.1, y - h * 0.78); c.quadraticCurveTo(x - w * 0.6, y - h * 1.0, x - w * 0.5, y - h * 0.55); c.lineTo(x - w * 0.12, y - h * 0.62);
      c.moveTo(x + w * 0.1, y - h * 0.78); c.quadraticCurveTo(x + w * 0.6, y - h * 1.0, x + w * 0.5, y - h * 0.55); c.lineTo(x + w * 0.12, y - h * 0.62);
    } else {
      c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h + w / 2); c.arc(x, y - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, y);
    }
    c.fill();
    if (lit) {
      c.strokeStyle = C.rgba('#d8dce6', 0.12 * lit); c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - w * 0.45, y - h * 0.1); c.lineTo(x - w * 0.45, y - h * 0.75); c.stroke();
    }
  };

  /* ---------- Créatures volantes ---------- */
  P.bat = (c, x, y, s, ph, col) => {
    const f = Math.sin(ph);
    c.fillStyle = col || '#050304';
    c.beginPath();
    c.moveTo(x, y - s * 0.22);
    c.quadraticCurveTo(x - s * 0.5, y - s * (0.45 + f * 0.6), x - s * 1.15, y - s * (0.05 + f * 0.85));
    c.quadraticCurveTo(x - s * 0.95, y + s * 0.05 - f * s * 0.3, x - s * 0.78, y + s * 0.22 - f * s * 0.45);
    c.quadraticCurveTo(x - s * 0.6, y + s * 0.02 - f * s * 0.2, x - s * 0.42, y + s * 0.22 - f * s * 0.2);
    c.quadraticCurveTo(x - s * 0.28, y + s * 0.05, x - s * 0.12, y + s * 0.28);
    c.lineTo(x, y + s * 0.38);
    c.lineTo(x + s * 0.12, y + s * 0.28);
    c.quadraticCurveTo(x + s * 0.28, y + s * 0.05, x + s * 0.42, y + s * 0.22 - f * s * 0.2);
    c.quadraticCurveTo(x + s * 0.6, y + s * 0.02 - f * s * 0.2, x + s * 0.78, y + s * 0.22 - f * s * 0.45);
    c.quadraticCurveTo(x + s * 0.95, y + s * 0.05 - f * s * 0.3, x + s * 1.15, y - s * (0.05 + f * 0.85));
    c.quadraticCurveTo(x + s * 0.5, y - s * (0.45 + f * 0.6), x, y - s * 0.22);
    c.fill();
    c.beginPath(); c.moveTo(x - s * 0.12, y - s * 0.16); c.lineTo(x - s * 0.11, y - s * 0.4); c.lineTo(x - s * 0.03, y - s * 0.26); c.lineTo(x + s * 0.03, y - s * 0.26); c.lineTo(x + s * 0.11, y - s * 0.4); c.lineTo(x + s * 0.12, y - s * 0.16); c.fill();
  };
  P.crow = (c, x, y, s, st, dir, col, ph) => {
    c.save(); c.translate(x, y); c.scale(dir || 1, 1); c.fillStyle = col || '#040304';
    if (st === 'fly') {
      const f = Math.sin(ph || 0);
      c.beginPath(); c.ellipse(0, 0, s * 0.55, s * 0.18, 0, 0, TAU); c.fill();
      c.beginPath(); c.arc(s * 0.55, -s * 0.05, s * 0.15, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(s * 0.68, -s * 0.07); c.lineTo(s * 0.92, 0); c.lineTo(s * 0.68, s * 0.04); c.fill();
      c.beginPath(); c.moveTo(-s * 0.5, 0); c.lineTo(-s * 0.95, -s * 0.12); c.lineTo(-s * 0.95, s * 0.14); c.fill();
      c.beginPath(); c.moveTo(-s * 0.15, -s * 0.05); c.quadraticCurveTo(-s * 0.1, -s * (0.5 + f * 0.6), -s * 0.55, -s * (0.2 + f * 0.9)); c.quadraticCurveTo(-s * 0.2, -s * (0.1 + f * 0.3), s * 0.25, -s * 0.02); c.fill();
    } else {
      c.beginPath(); c.ellipse(0, -s * 0.3, s * 0.34, s * 0.22, -0.5, 0, TAU); c.fill();
      c.beginPath(); c.arc(s * 0.26, -s * 0.56, s * 0.13, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(s * 0.36, -s * 0.6); c.lineTo(s * 0.58, -s * 0.52); c.lineTo(s * 0.36, -s * 0.5); c.fill();
      c.beginPath(); c.moveTo(-s * 0.22, -s * 0.18); c.lineTo(-s * 0.6, s * 0.05); c.lineTo(-s * 0.48, s * 0.1); c.lineTo(-s * 0.1, -s * 0.1); c.fill();
      c.strokeStyle = col || '#040304'; c.lineWidth = s * 0.05; c.beginPath(); c.moveTo(0, -s * 0.12); c.lineTo(-s * 0.02, 0); c.moveTo(s * 0.08, -s * 0.12); c.lineTo(s * 0.1, 0); c.stroke();
    }
    c.restore();
  };

  /* ---------- Lumière ---------- */
  P.glow = (c, x, y, r, col, a) => {
    if (a <= 0.003 || r <= 0) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, C.rgba(col, a)); g.addColorStop(0.35, C.rgba(col, a * 0.35)); g.addColorStop(1, C.rgba(col, 0));
    const op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter';
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.globalCompositeOperation = op;
  };
  P.flicker = (t, seed) => 0.82 + 0.1 * Math.sin(t * 9.3 + seed) + 0.06 * Math.sin(t * 23.1 + seed * 2) + 0.04 * Math.sin(t * 41 + seed * 3);
  P.flame = (c, x, y, h, t, a, seed) => {
    if (a <= 0) return;
    const s = seed || 0;
    const sway = Math.sin(t * 7.3 + s) * 0.12 + Math.sin(t * 13.1 + s) * 0.06;
    const fl = 0.88 + 0.12 * Math.sin(t * 17 + s);
    P.glow(c, x, y - h * 0.5, h * 4, '#ff9a3a', 0.28 * a);
    c.save(); c.globalAlpha = a;
    c.beginPath(); c.moveTo(x, y);
    c.bezierCurveTo(x - h * 0.34, y - h * 0.22, x - h * 0.14 + sway * h, y - h * 0.72, x + sway * h * 1.3, y - h * fl);
    c.bezierCurveTo(x + h * 0.14 + sway * h, y - h * 0.72, x + h * 0.34, y - h * 0.22, x, y);
    const g = c.createLinearGradient(0, y, 0, y - h);
    g.addColorStop(0, '#fff8d8'); g.addColorStop(0.35, '#ffd060'); g.addColorStop(0.75, 'rgba(255,110,20,0.75)'); g.addColorStop(1, 'rgba(255,60,10,0)');
    c.fillStyle = g; c.fill();
    if (h < 40) { c.fillStyle = 'rgba(80,120,255,0.35)'; c.beginPath(); c.ellipse(x, y - h * 0.08, h * 0.12, h * 0.1, 0, 0, TAU); c.fill(); }
    c.restore();
  };
  P.candle = (c, x, y, s, t, lit, seed) => {
    const w = s * 0.28;
    let g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, '#8d806a'); g.addColorStop(0.45, '#efe4ca'); g.addColorStop(1, '#7a6d58');
    c.fillStyle = g; c.fillRect(x - w / 2, y - s, w, s);
    c.fillStyle = '#e9dcc0'; c.beginPath(); c.ellipse(x, y - s, w / 2, w * 0.14, 0, 0, TAU); c.fill();
    c.fillStyle = '#efe4ca'; c.beginPath(); c.moveTo(x + w * 0.2, y - s); c.quadraticCurveTo(x + w * 0.5, y - s * 0.7, x + w * 0.35, y - s * 0.55); c.quadraticCurveTo(x + w * 0.2, y - s * 0.7, x + w * 0.2, y - s); c.fill();
    c.strokeStyle = '#111'; c.lineWidth = Math.max(1, s * 0.02); c.beginPath(); c.moveTo(x, y - s); c.lineTo(x, y - s - s * 0.08); c.stroke();
    if (lit > 0) P.flame(c, x, y - s - s * 0.05, s * 0.32, t, lit, seed || x);
    return { x, y: y - s - s * 0.2 };
  };
  P.rays = (c, x, y, ang, spread, len, col, a, n, t) => {
    if (a <= 0) return;
    const op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? 0 : i / (n - 1) - 0.5;
      const aa = ang + k * spread, w = spread / n * (0.5 + 0.5 * Math.sin((t || 0) * 0.5 + i * 1.7));
      const g = c.createLinearGradient(x, y, x + Math.cos(aa) * len, y + Math.sin(aa) * len);
      g.addColorStop(0, C.rgba(col, a)); g.addColorStop(1, C.rgba(col, 0));
      c.fillStyle = g; c.beginPath(); c.moveTo(x, y);
      c.lineTo(x + Math.cos(aa - w) * len, y + Math.sin(aa - w) * len); c.lineTo(x + Math.cos(aa + w) * len, y + Math.sin(aa + w) * len); c.fill();
    }
    c.globalCompositeOperation = op;
  };

  /* ---------- Fenêtres ---------- */
  P.win = (c, x, y, w, h, lit, t, col, o) => {
    o = o || {};
    const a = lit > 0 ? lit * (o.steady ? 1 : P.flicker(t, x * 0.13)) : 0;
    c.save();
    c.beginPath();
    if (o.arch) { c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); }
    else if (o.gothic) { c.moveTo(x, y + h); c.lineTo(x, y + w * 0.6); c.quadraticCurveTo(x, y, x + w / 2, y - w * 0.15); c.quadraticCurveTo(x + w, y, x + w, y + w * 0.6); c.lineTo(x + w, y + h); c.closePath(); }
    else c.rect(x, y, w, h);
    if (a > 0) { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, C.rgba(col || '#ffc56a', a * 0.75)); g.addColorStop(1, C.rgba(C.shade(col || '#ffc56a', 0.7), a)); c.fillStyle = g; }
    else c.fillStyle = o.dark || '#020203';
    c.fill();
    c.strokeStyle = o.frame || '#030203'; c.lineWidth = Math.max(1.5, w * 0.07);
    c.beginPath(); c.moveTo(x + w / 2, y + (o.arch || o.gothic ? 0 : 0)); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * 0.5); c.lineTo(x + w, y + h * 0.5); c.stroke();
    c.restore();
    if (a > 0) P.glow(c, x + w / 2, y + h / 2, Math.max(w, h) * 1.6, col || '#ffb04a', 0.22 * a);
  };

  /* ---------- Éclair ---------- */
  P.makeBolt = (x0, y0, x1, y1, rough) => {
    const R = rough || 1;
    const mid = (pts, disp, depth) => {
      if (depth === 0) return pts;
      const out = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        out.push([(a[0] + b[0]) / 2 + (Math.random() - 0.5) * disp, (a[1] + b[1]) / 2 + (Math.random() - 0.5) * disp * 0.3]);
        out.push(b);
      }
      return mid(out, disp * 0.55, depth - 1);
    };
    const main = mid([[x0, y0], [x1, y1]], Math.abs(y1 - y0) * 0.45 * R, 6);
    const branches = [];
    for (let i = 0; i < 4; i++) {
      const k = Math.floor(main.length * (0.2 + Math.random() * 0.6)), p = main[k];
      const len = Math.abs(y1 - y0) * (0.15 + Math.random() * 0.25), ang = Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      branches.push(mid([p, [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len]], len * 0.5, 4));
    }
    return { main, branches, life: 1 };
  };
  P.drawBolt = (c, b, a, col) => {
    if (!b || a <= 0) return;
    const line = (pts, w) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.lineWidth = w; c.stroke(); };
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = C.rgba(col || '#9fc4ff', 0.35 * a); line(b.main, 14); b.branches.forEach((br) => line(br, 6));
    c.strokeStyle = C.rgba('#e8f0ff', 0.9 * a); line(b.main, 3.2); b.branches.forEach((br) => line(br, 1.4));
    c.strokeStyle = 'rgba(255,255,255,' + a + ')'; line(b.main, 1.2);
    c.restore();
  };

  /* ---------- Particules en coordonnées de vue ---------- */
  P.parts = (c, st, key, type, n, v, dt, t, o) => {
    if (n && C.lowPower) n = Math.max(1, Math.round(n * 0.55));
    o = o || {};
    let arr = st[key];
    const W = v.x1 - v.x0, H = v.y1 - v.y0;
    const mk = (init) => {
      const p = { x: Math.random(), y: init ? Math.random() : (type === 'embers' || type === 'ash' ? 1.05 : -0.05), s: Math.random(), ph: Math.random() * 6.28, vx: 0, vy: 0 };
      if (type === 'rain') { p.vy = 1.6 + Math.random() * 0.8; p.vx = -0.15 + (o.wind || 0); }
      if (type === 'snow') { p.vy = 0.05 + Math.random() * 0.08; p.vx = (o.wind || 0) * 0.3; }
      if (type === 'embers') { p.vy = -0.08 - Math.random() * 0.12; }
      if (type === 'ash') { p.vy = -0.02 - Math.random() * 0.05; }
      if (type === 'dust') { p.vy = (Math.random() - 0.5) * 0.01; p.vx = (Math.random() - 0.5) * 0.01; }
      if (type === 'fireflies') { p.y = 0.45 + Math.random() * 0.5; }
      if (type === 'leaves') { p.vy = 0.06 + Math.random() * 0.06; p.vx = 0.08 + (o.wind || 0); }
      return p;
    };
    if (!arr || arr.length !== n) { arr = st[key] = []; for (let i = 0; i < n; i++) arr.push(mk(true)); }
    const col = o.col || '#ffffff', a0 = o.alpha == null ? 1 : o.alpha;
    for (const p of arr) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (type === 'fireflies' || type === 'dust') { p.vx += (Math.random() - 0.5) * 0.004; p.vy += (Math.random() - 0.5) * 0.004; p.vx *= 0.98; p.vy *= 0.98; }
      if (p.y > 1.08 || p.y < -0.1 || p.x < -0.1 || p.x > 1.1) {
        if (type === 'fireflies' || type === 'dust') { p.x = (p.x + 1) % 1; p.y = C.clamp(p.y, 0, 1); }
        else Object.assign(p, mk(false));
        if (type === 'rain' || type === 'snow' || type === 'leaves') p.x = Math.random() * 1.2 - 0.1;
      }
      const X = v.x0 + p.x * W, Y = v.y0 + p.y * H;
      switch (type) {
        case 'rain': {
          const len = 18 + p.s * 26;
          c.strokeStyle = C.rgba(col, (0.12 + p.s * 0.25) * a0); c.lineWidth = 1 + p.s * 0.6;
          c.beginPath(); c.moveTo(X, Y); c.lineTo(X + p.vx * len * 0.6, Y + len); c.stroke();
          if (o.ground && Y > o.ground && Y < o.ground + 30 && Math.random() < 0.3) { c.fillStyle = C.rgba(col, 0.3 * a0); c.fillRect(X - 3, o.ground + (Y - o.ground) * 0.2, 6, 1.5); }
          break;
        }
        case 'snow': c.fillStyle = C.rgba(col, (0.4 + p.s * 0.5) * a0); c.beginPath(); c.arc(X + Math.sin(t + p.ph) * 10, Y, 1 + p.s * 2.4, 0, TAU); c.fill(); break;
        case 'embers': {
          const fl = 0.5 + 0.5 * Math.sin(t * 6 + p.ph);
          c.fillStyle = 'rgba(255,' + Math.floor(110 + 90 * fl) + ',30,' + (0.4 + 0.6 * fl) * a0 + ')';
          c.beginPath(); c.arc(X + Math.sin(t * 2 + p.ph) * 14, Y, 1 + p.s * 2.2, 0, TAU); c.fill(); break;
        }
        case 'ash': c.fillStyle = C.rgba(col, (0.25 + p.s * 0.4) * a0); c.fillRect(X + Math.sin(t + p.ph) * 20, Y, 1.5 + p.s * 2, 1.5 + p.s * 2); break;
        case 'dust': c.fillStyle = C.rgba(col, (0.1 + 0.35 * Math.abs(Math.sin(t + p.ph))) * a0); c.fillRect(X, Y, 1 + p.s * 2, 1 + p.s * 2); break;
        case 'fireflies': {
          const a = (0.2 + 0.8 * Math.pow(Math.abs(Math.sin(t * 1.3 + p.ph)), 3)) * a0;
          P.glow(c, X, Y, 14 + p.s * 10, '#e8f07a', a * 0.8); c.fillStyle = 'rgba(250,255,190,' + a + ')'; c.fillRect(X - 1, Y - 1, 2.5, 2.5); break;
        }
        case 'leaves': {
          c.save(); c.translate(X + Math.sin(t * 1.5 + p.ph) * 20, Y); c.rotate(t * 2 + p.ph);
          c.fillStyle = C.rgba(o.col || '#5a2a08', 0.85 * a0); c.beginPath(); c.ellipse(0, 0, 6 + p.s * 4, 3 + p.s * 2, 0, 0, TAU); c.fill(); c.restore(); break;
        }
      }
    }
  };

  /* ---------- Citrouille ---------- */
  const FACE = {
    eyeL: [[-0.6, -0.34], [-0.13, -0.13], [-0.5, -0.04]],
    eyeR: [[0.6, -0.34], [0.13, -0.13], [0.5, -0.04]],
    nose: [[0, -0.06], [0.09, 0.08], [-0.09, 0.08]],
    mouth: [[-0.66, 0.12], [-0.48, 0.21], [-0.4, 0.13], [-0.3, 0.25], [-0.18, 0.17], [-0.1, 0.28], [0, 0.2], [0.1, 0.28], [0.18, 0.17], [0.3, 0.25], [0.4, 0.13], [0.48, 0.21], [0.66, 0.12], [0.52, 0.4], [0.34, 0.5], [0.22, 0.43], [0.09, 0.55], [-0.09, 0.55], [-0.22, 0.43], [-0.34, 0.5], [-0.52, 0.4]]
  };
  const poly = (c, pts, x, y, R, dx, dy, sy) => { c.beginPath(); pts.forEach((p, i) => { const X = x + p[0] * R + (dx || 0), Y = y + p[1] * R * (sy || 1) + (dy || 0); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
  P.pumpkin = (c, x, y, R, o) => {
    o = o || {};
    const lit = o.lit || 0, t = o.t || 0, amb = o.amb == null ? 0.7 : o.amb, seed = o.seed || 0;
    const fl = lit * P.flicker(t, seed);
    const cy = y - R * 0.8;
    const bright = C.clamp(amb * 0.75 + fl * 0.4, 0.05, 1.3);
    if (fl > 0) { P.glow(c, x, y - R * 0.1, R * 3.2, '#ff8a1e', 0.22 * fl); c.fillStyle = C.rgba('#ff7a10', 0.18 * fl); c.beginPath(); c.ellipse(x, y + R * 0.02, R * 1.6, R * 0.18, 0, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.ellipse(x, y, R * 1.05, R * 0.12, 0, 0, TAU); c.fill();
    const lobes = [[-0.62, 0.5, 0.82], [0.62, 0.5, 0.82], [-0.36, 0.62, 0.95], [0.36, 0.62, 0.95], [0, 0.66, 1.08]];
    for (const [dx, wf, lk] of lobes) {
      const lx = x + dx * R, rx = R * wf, ry = R * 0.8;
      const g = c.createRadialGradient(lx - rx * 0.25, cy - ry * 0.35, rx * 0.1, lx, cy, rx * 1.3);
      g.addColorStop(0, C.shade('#f08a2c', bright * lk * 1.15)); g.addColorStop(0.55, C.shade('#c9561a', bright * lk)); g.addColorStop(1, C.shade('#4a1a04', bright * lk));
      c.fillStyle = g; c.beginPath(); c.ellipse(lx, cy, rx, ry, 0, 0, TAU); c.fill();
      c.strokeStyle = C.rgba('#200800', 0.55); c.lineWidth = Math.max(1, R * 0.025); c.stroke();
    }
    c.fillStyle = C.shade('#3e4a1c', 0.4 + bright * 0.6); c.beginPath();
    c.moveTo(x - R * 0.08, cy - R * 0.74); c.quadraticCurveTo(x - R * 0.05, cy - R * 1.02, x + R * 0.12, cy - R * 1.12); c.lineTo(x + R * 0.18, cy - R * 1.04); c.quadraticCurveTo(x + R * 0.06, cy - R * 0.95, x + R * 0.08, cy - R * 0.74); c.fill();
    if (o.face === 'none') return;
    const mo = 1 + (o.mouth || 0) * 0.5;
    const parts = [FACE.eyeL, FACE.eyeR, FACE.nose];
    // épaisseur de la chair taillée
    c.fillStyle = C.shade('#e8a04a', 0.25 + fl * 0.9);
    parts.forEach((p) => { poly(c, p, x, cy, R, R * 0.03, R * 0.03); c.fill(); });
    poly(c, FACE.mouth, x, cy, R, R * 0.03, R * 0.03, mo); c.fill();
    if (fl > 0.02) {
      const g = c.createRadialGradient(x, cy + R * 0.15, 0, x, cy + R * 0.1, R * 0.9);
      g.addColorStop(0, C.rgba('#fff6b0', fl)); g.addColorStop(0.4, C.rgba('#ffc02a', fl)); g.addColorStop(1, C.rgba('#e85a00', Math.min(1, fl * 1.1)));
      c.fillStyle = g;
    } else c.fillStyle = '#0d0400';
    parts.forEach((p) => { poly(c, p, x, cy, R); c.fill(); });
    poly(c, FACE.mouth, x, cy, R, 0, 0, mo); c.fill();
    if (fl > 0.02) { P.glow(c, x, cy + R * 0.1, R * 1.6, '#ffb030', 0.3 * fl); }
  };
  P.pumpkinMouth = (x, y, R) => ({ x, y: y - R * 0.8 + R * 0.33 });

  /* ---------- Silhouettes humaines ---------- */
  P.fig = (c, x, y, h, kind, o) => {
    o = o || {};
    const col = o.col || '#050405';
    c.save(); c.translate(x, y); if (o.flip) c.scale(-1, 1); c.fillStyle = col;
    const u = h / 100;
    const head = (hx, hy, r) => { c.beginPath(); c.ellipse(hx * u, hy * u, r * u * 0.85, r * u, 0, 0, TAU); c.fill(); };
    if (kind === 'man') {
      head(0, -88, 7);
      if (o.hat) { c.fillRect(-9 * u, -96 * u, 18 * u, 2.4 * u); c.fillRect(-6 * u, -112 * u, 12 * u, 16 * u); }
      c.beginPath(); c.moveTo(-9 * u, -80 * u); c.lineTo(9 * u, -80 * u); c.lineTo(12 * u, -38 * u); c.lineTo(14 * u, -30 * u); c.lineTo(-14 * u, -30 * u); c.lineTo(-12 * u, -38 * u); c.fill();
      c.fillRect(-8 * u, -32 * u, 6 * u, 32 * u); c.fillRect(2 * u, -32 * u, 6 * u, 32 * u);
      c.beginPath(); c.moveTo(-9 * u, -78 * u); c.lineTo(-15 * u, -45 * u); c.lineTo(-11 * u, -44 * u); c.lineTo(-6 * u, -70 * u); c.fill();
      c.beginPath(); c.moveTo(9 * u, -78 * u); c.lineTo(15 * u + (o.reach || 0) * u, -45 * u - (o.raise || 0) * u); c.lineTo(11 * u + (o.reach || 0) * u, -44 * u - (o.raise || 0) * u); c.lineTo(6 * u, -70 * u); c.fill();
    } else if (kind === 'woman') {
      head(0, -88, 6.5);
      if (o.hair) { c.beginPath(); c.moveTo(-6 * u, -94 * u); c.quadraticCurveTo(-11 * u, -70 * u, -9 * u, -58 * u); c.lineTo(9 * u, -58 * u); c.quadraticCurveTo(11 * u, -70 * u, 6 * u, -94 * u); c.fill(); }
      c.beginPath(); c.moveTo(-6 * u, -80 * u); c.lineTo(6 * u, -80 * u); c.lineTo(8 * u, -60 * u); c.quadraticCurveTo(22 * u, -10 * u, 24 * u, 0); c.lineTo(-24 * u, 0); c.quadraticCurveTo(-22 * u, -10 * u, -8 * u, -60 * u); c.fill();
      c.beginPath(); c.moveTo(-6 * u, -78 * u); c.lineTo(-12 * u - (o.reach || 0) * u, -48 * u - (o.raise || 0) * u); c.lineTo(-9 * u - (o.reach || 0) * u, -47 * u - (o.raise || 0) * u); c.lineTo(-3 * u, -70 * u); c.fill();
      c.beginPath(); c.moveTo(6 * u, -78 * u); c.lineTo(12 * u + (o.reach || 0) * u, -48 * u - (o.raise || 0) * u); c.lineTo(9 * u + (o.reach || 0) * u, -47 * u - (o.raise || 0) * u); c.lineTo(3 * u, -70 * u); c.fill();
    } else if (kind === 'cloak') {
      head(0, -90, 7);
      const sp = o.spread || 0;
      c.beginPath(); c.moveTo(-6 * u, -84 * u); c.quadraticCurveTo(-17 * u, -88 * u, -15 * u, -97 * u); c.lineTo(-10 * u, -86 * u); c.lineTo(10 * u, -86 * u); c.lineTo(15 * u, -97 * u); c.quadraticCurveTo(17 * u, -88 * u, 6 * u, -84 * u); c.fill();
      c.beginPath(); c.moveTo(-10 * u, -82 * u);
      c.quadraticCurveTo((-26 - sp * 40) * u, (-50 - sp * 20) * u, (-24 - sp * 50) * u, (0 - sp * 30) * u);
      c.lineTo((-12 - sp * 25) * u, (-6 - sp * 18) * u); c.lineTo(-4 * u, 0); c.lineTo(4 * u, 0); c.lineTo((12 + sp * 25) * u, (-6 - sp * 18) * u);
      c.lineTo((24 + sp * 50) * u, (0 - sp * 30) * u); c.quadraticCurveTo((26 + sp * 40) * u, (-50 - sp * 20) * u, 10 * u, -82 * u); c.fill();
      if (o.lining) { c.fillStyle = o.lining; c.beginPath(); c.moveTo(-9 * u, -80 * u); c.quadraticCurveTo((-18 - sp * 30) * u, -50 * u, (-14 - sp * 30) * u, (-10 - sp * 20) * u); c.lineTo(-6 * u, -10 * u); c.closePath(); c.fill(); c.fillStyle = col; }
    } else if (kind === 'giant') {
      c.beginPath(); c.moveTo(-8 * u, -98 * u); c.lineTo(8 * u, -98 * u); c.lineTo(9 * u, -84 * u); c.lineTo(-9 * u, -84 * u); c.fill();
      c.beginPath(); c.moveTo(-6 * u, -84 * u); c.lineTo(-22 * u, -78 * u); c.lineTo(-18 * u, -40 * u); c.lineTo(-14 * u, -38 * u); c.lineTo(-12 * u, 0); c.lineTo(-3 * u, 0); c.lineTo(0, -34 * u); c.lineTo(3 * u, 0); c.lineTo(12 * u, 0); c.lineTo(14 * u, -38 * u); c.lineTo(18 * u, -40 * u); c.lineTo(22 * u, -78 * u); c.lineTo(6 * u, -84 * u); c.fill();
      c.beginPath(); c.moveTo(-21 * u, -76 * u); c.lineTo(-30 * u - (o.reach || 0) * u, -36 * u - (o.raise || 0) * u); c.lineTo(-24 * u - (o.reach || 0) * u, -34 * u - (o.raise || 0) * u); c.lineTo(-17 * u, -62 * u); c.fill();
      c.beginPath(); c.moveTo(21 * u, -76 * u); c.lineTo(30 * u + (o.reachR || 0) * u, -36 * u - (o.raiseR || 0) * u); c.lineTo(24 * u + (o.reachR || 0) * u, -34 * u - (o.raiseR || 0) * u); c.lineTo(17 * u, -62 * u); c.fill();
      if (o.eyes) { c.fillStyle = C.rgba('#e8d24a', o.eyes); c.fillRect(-5 * u, -93 * u, 3 * u, 1.6 * u); c.fillRect(2 * u, -93 * u, 3 * u, 1.6 * u); }
    } else if (kind === 'shroud') {
      c.beginPath(); c.moveTo(0, -104 * u); c.quadraticCurveTo(-11 * u, -102 * u, -10 * u, -86 * u); c.quadraticCurveTo(-20 * u, -60 * u, -18 * u, 0);
      for (let i = 0; i < 6; i++) c.lineTo((-18 + i * 6 + 3) * u, (i % 2 ? -4 : 2) * u);
      c.lineTo(18 * u, 0); c.quadraticCurveTo(20 * u, -60 * u, 10 * u, -86 * u); c.quadraticCurveTo(11 * u, -102 * u, 0, -104 * u); c.fill();
      if (o.mask) {
        const g = c.createRadialGradient(0, -90 * u, 1, 0, -90 * u, 9 * u); g.addColorStop(0, '#d9d4c8'); g.addColorStop(1, '#8c877c');
        c.fillStyle = g; c.beginPath(); c.ellipse(0, -90 * u, 6.2 * u, 8.2 * u, 0, 0, TAU); c.fill();
        c.fillStyle = '#0a0606'; c.beginPath(); c.ellipse(-2.4 * u, -92 * u, 1.6 * u, 1.2 * u, 0, 0, TAU); c.ellipse(2.4 * u, -92 * u, 1.6 * u, 1.2 * u, 0, 0, TAU); c.fill();
        c.fillRect(-1.6 * u, -85 * u, 3.2 * u, 1 * u);
        c.fillStyle = '#9a0a12'; const r = C.seeded(4);
        for (let i = 0; i < 26; i++) { c.beginPath(); c.arc((r() - 0.5) * 30 * u, (-100 + r() * 96) * u, (0.4 + r() * 1.2) * u, 0, TAU); c.fill(); }
      }
    } else if (kind === 'ghost') {
      const wv = Math.sin((o.t || 0) * 3);
      c.beginPath(); c.moveTo(-16 * u, 0); c.quadraticCurveTo(-20 * u, -60 * u, 0, -100 * u); c.quadraticCurveTo(20 * u, -60 * u, 16 * u, 0);
      for (let i = 0; i < 5; i++) c.quadraticCurveTo((16 - i * 8 - 4) * u, (8 + wv * 4 * (i % 2 ? 1 : -1)) * u, (16 - (i + 1) * 8) * u, 0);
      c.fill();
      c.fillStyle = 'rgba(0,0,0,0.85)'; c.beginPath(); c.ellipse(-5 * u, -70 * u, 2.6 * u, 4 * u, 0, 0, TAU); c.ellipse(5 * u, -70 * u, 2.6 * u, 4 * u, 0, 0, TAU); c.ellipse(0, -55 * u, 3 * u, 5 * u, 0, 0, TAU); c.fill();
    } else if (kind === 'child') {
      head(0, -60, 7);
      if (o.hat === 'witch') { c.beginPath(); c.moveTo(-12 * u, -64 * u); c.lineTo(12 * u, -64 * u); c.lineTo(3 * u, -92 * u); c.fill(); }
      c.beginPath(); c.moveTo(-8 * u, -54 * u); c.lineTo(8 * u, -54 * u); c.lineTo(12 * u, -18 * u); c.lineTo(-12 * u, -18 * u); c.fill();
      c.fillRect(-7 * u, -20 * u, 5 * u, 20 * u); c.fillRect(2 * u, -20 * u, 5 * u, 20 * u);
      if (o.bag) { c.fillRect(10 * u, -34 * u, 8 * u, 10 * u); }
    }
    c.restore();
  };

  /* ---------- Cheval (vue de profil) ---------- */
  P.horse = (c, x, y, s, ph, col, o) => {
    o = o || {};
    c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); c.fillStyle = col || '#040304'; c.strokeStyle = col || '#040304'; c.lineCap = 'round';
    const gal = o.still ? 0 : 1;
    const bob = Math.sin(ph * 2) * 3 * gal;
    c.translate(0, bob);
    const leg = (hx, hy, a1, a2, l1, l2) => {
      const kx = hx + Math.sin(a1) * l1, ky = hy + Math.cos(a1) * l1;
      const fx = kx + Math.sin(a1 + a2) * l2, fy = ky + Math.cos(a1 + a2) * l2;
      c.lineWidth = 9; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.stroke();
      c.lineWidth = 6; c.beginPath(); c.moveTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      c.beginPath(); c.arc(fx, fy, 4, 0, TAU); c.fill();
    };
    const p = ph;
    leg(42, -70, gal * Math.sin(p) * 0.7 + 0.1, gal * Math.max(0, -Math.cos(p)) * 1.2, 34, 36);
    leg(-40, -72, gal * Math.sin(p + 2.2) * 0.65 - 0.1, -gal * Math.max(0, Math.cos(p + 2.2)) * 1.1, 34, 38);
    c.beginPath(); c.ellipse(0, -88, 56, 26, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(38, -102); c.quadraticCurveTo(58, -128, 66, -150); c.lineTo(82, -146); c.quadraticCurveTo(74, -120, 56, -78); c.fill();
    c.beginPath(); c.moveTo(66, -152); c.quadraticCurveTo(92, -146, 104, -128); c.quadraticCurveTo(106, -120, 96, -120); c.quadraticCurveTo(84, -126, 74, -132); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(70, -152); c.lineTo(74, -164); c.lineTo(78, -151); c.fill();
    c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(48 + i * 3, -110 - i * 6); c.lineTo(36 + i * 3 - Math.sin(p + i) * 6 * gal, -104 - i * 6); c.stroke(); }
    c.beginPath(); c.moveTo(-52, -96); c.quadraticCurveTo(-82, -90 + Math.sin(p) * 8 * gal, -96, -56 + Math.sin(p * 1.3) * 10 * gal); c.quadraticCurveTo(-80, -78, -54, -84); c.fill();
    leg(46, -70, gal * Math.sin(p + 0.9) * 0.75 + 0.1, gal * Math.max(0, -Math.cos(p + 0.9)) * 1.2, 34, 36);
    leg(-36, -72, gal * Math.sin(p + 3.1) * 0.7 - 0.1, -gal * Math.max(0, Math.cos(p + 3.1)) * 1.1, 34, 38);
    c.restore();
  };

  /* ---------- Reflet d'eau (copie inversée de l'écran) ---------- */
  P.reflect = (S, yStage, depth, alpha, t, tintCol, maxH) => {
    const c = S.ctx, cv = c.canvas, dpr = S.dpr;
    const ys = S.toScreen(0, yStage, depth).y * dpr;
    if (ys <= 0 || ys >= cv.height) return;
    const H = Math.min(cv.height - ys, ys, (maxH || 99999) * dpr);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha;
    const step = Math.max(2, Math.round((C.lowPower ? 6 : 3) * dpr));
    for (let k = 0; k < H; k += step) {
      const off = Math.sin(k * 0.045 / dpr + t * 1.8) * (1 + k / dpr * 0.03) * dpr;
      c.drawImage(cv, 0, Math.max(0, ys - k - step), cv.width, step, off, ys + k, cv.width, step);
    }
    c.globalAlpha = 1;
    const g = c.createLinearGradient(0, ys, 0, ys + H);
    g.addColorStop(0, C.rgba(tintCol || '#05080c', 0.35)); g.addColorStop(1, C.rgba(tintCol || '#05080c', 0.95));
    c.fillStyle = g; c.fillRect(0, ys, cv.width, H + 2);
    c.restore();
  };

  /* ---------- Visages de sursaut ---------- */
  P.scare = (c, kind, w, h, p, t) => {
    const env = p < 0.06 ? p / 0.06 : 1 - C.sstep(0.62, 1, p);
    if (env <= 0) return;
    c.save();
    c.fillStyle = 'rgba(0,0,0,' + (0.88 * env) + ')'; c.fillRect(0, 0, w, h);
    if (Math.random() < 0.12 && p > 0.1) { c.restore(); return; }
    const z = 0.6 + C.easeOut(Math.min(1, p * 1.6)) * 0.75;
    const jx = (Math.random() - 0.5) * 16 * env, jy = (Math.random() - 0.5) * 16 * env;
    const cx = w / 2 + jx, cy = h * 0.5 + jy, M = Math.min(w, h);
    c.globalAlpha = env;
    if (kind === 'eye') {
      const W = Math.max(w, h * 1.2) * 0.75 * z, H = W * 0.42 * C.clamp(p * 4, 0.05, 1);
      c.fillStyle = '#2a1a14'; c.fillRect(0, 0, w, h);
      c.save(); c.beginPath(); c.moveTo(cx - W / 2, cy); c.quadraticCurveTo(cx, cy - H * 1.3, cx + W / 2, cy); c.quadraticCurveTo(cx, cy + H * 1.3, cx - W / 2, cy); c.clip();
      let g = c.createRadialGradient(cx, cy, 0, cx, cy, W / 2); g.addColorStop(0, '#e9eef0'); g.addColorStop(0.7, '#c9cfcf'); g.addColorStop(1, '#6b6058');
      c.fillStyle = g; c.fillRect(cx - W / 2, cy - H, W, H * 2);
      const r = C.seeded(9); c.strokeStyle = 'rgba(160,20,20,0.55)'; c.lineWidth = 1.4;
      for (let i = 0; i < 26; i++) { const a = r() * TAU, d0 = W * 0.12, d1 = W * (0.25 + r() * 0.25); c.beginPath(); c.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0 * 0.6); c.quadraticCurveTo(cx + Math.cos(a + 0.3) * d1 * 0.7, cy + Math.sin(a + 0.3) * d1 * 0.5, cx + Math.cos(a) * d1, cy + Math.sin(a) * d1 * 0.6); c.stroke(); }
      const ir = W * 0.13 + Math.sin(t * 30) * 2;
      g = c.createRadialGradient(cx, cy, ir * 0.2, cx, cy, ir); g.addColorStop(0, '#2b3d4a'); g.addColorStop(0.6, '#7d97a8'); g.addColorStop(1, '#3d4f5c');
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, ir, 0, TAU); c.fill();
      c.fillStyle = '#000'; c.beginPath(); c.arc(cx, cy, ir * 0.32, 0, TAU); c.fill();
      c.fillStyle = 'rgba(225,235,240,0.62)'; c.beginPath(); c.ellipse(cx + ir * 0.1, cy - ir * 0.05, ir * 1.1, ir * 0.9, 0.3, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(cx - ir * 0.35, cy - ir * 0.4, ir * 0.14, 0, TAU); c.fill();
      c.restore();
    } else if (kind === 'eyes') {
      const s = M * 0.16 * z;
      [[-1, 1], [1, 1]].forEach(([sx]) => {
        const ex = cx + sx * s * 1.4, ey = cy - s * 0.2;
        P.glow(c, ex, ey, s * 3, '#ff1a10', 0.6);
        c.fillStyle = '#ff2a12'; c.beginPath(); c.moveTo(ex - s, ey + s * 0.1 * sx); c.quadraticCurveTo(ex, ey - s * 0.75, ex + s, ey - s * 0.1 * sx); c.quadraticCurveTo(ex, ey + s * 0.55, ex - s, ey + s * 0.1 * sx); c.fill();
        c.fillStyle = '#ffd0a0'; c.beginPath(); c.ellipse(ex, ey, s * 0.4, s * 0.25, 0, 0, TAU); c.fill();
        c.fillStyle = '#000'; c.beginPath(); c.ellipse(ex, ey, s * 0.09, s * 0.3, 0, 0, TAU); c.fill();
      });
    } else if (kind === 'pumpkin') {
      P.pumpkin(c, cx, cy + M * 0.45 * z, M * 0.42 * z, { lit: 1, t, amb: 0.8, mouth: 0.4 });
      P.parts(c, P._scareParts = P._scareParts || {}, 'e', 'embers', 40, { x0: 0, x1: w, y0: 0, y1: h }, 0.02, t);
    } else if (kind === 'creature') {
      const R = M * 0.42 * z;
      let g = c.createLinearGradient(0, cy - R, 0, cy + R); g.addColorStop(0, '#2b3324'); g.addColorStop(0.6, '#8a9a5c'); g.addColorStop(1, '#c9cf86');
      c.fillStyle = g; c.beginPath(); c.moveTo(cx - R * 0.62, cy - R * 0.9); c.lineTo(cx + R * 0.62, cy - R * 0.9); c.lineTo(cx + R * 0.66, cy + R * 0.3); c.quadraticCurveTo(cx + R * 0.5, cy + R * 1.05, cx, cy + R * 1.05); c.quadraticCurveTo(cx - R * 0.5, cy + R * 1.05, cx - R * 0.66, cy + R * 0.3); c.closePath(); c.fill();
      c.fillStyle = '#0a0c08'; c.fillRect(cx - R * 0.66, cy - R * 1.0, R * 1.32, R * 0.32);
      c.strokeStyle = '#1a1208'; c.lineWidth = Math.max(2, R * 0.02); c.beginPath(); c.moveTo(cx - R * 0.6, cy - R * 0.6); c.lineTo(cx + R * 0.1, cy - R * 0.66); c.stroke();
      for (let i = 0; i < 8; i++) { const sx = cx - R * 0.55 + i * R * 0.09; c.beginPath(); c.moveTo(sx, cy - R * 0.7); c.lineTo(sx + R * 0.02, cy - R * 0.58); c.stroke(); }
      [-1, 1].forEach((s) => {
        const ex = cx + s * R * 0.26, ey = cy - R * 0.2;
        c.fillStyle = 'rgba(10,10,6,0.9)'; c.beginPath(); c.ellipse(ex, ey, R * 0.2, R * 0.14, 0, 0, TAU); c.fill();
        c.fillStyle = '#d9c23a'; c.beginPath(); c.ellipse(ex, ey + R * 0.01, R * 0.09, R * 0.05, 0, 0, TAU); c.fill();
        c.fillStyle = '#000'; c.beginPath(); c.arc(ex, ey + R * 0.01, R * 0.025, 0, TAU); c.fill();
      });
      c.fillStyle = '#120a08'; c.beginPath(); c.ellipse(cx, cy + R * 0.55, R * 0.3, R * 0.06 + R * 0.14 * C.clamp(p * 3, 0, 1), 0, 0, TAU); c.fill();
    } else if (kind === 'mask-old') {
      const R = M * 0.4 * z;
      let g = c.createRadialGradient(cx, cy - R * 0.2, R * 0.1, cx, cy, R * 1.1); g.addColorStop(0, '#e6e1d6'); g.addColorStop(0.7, '#a39d90'); g.addColorStop(1, '#3a3630');
      c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, R * 0.75, R, 0, 0, TAU); c.fill();
      c.fillStyle = '#050303'; c.beginPath(); c.ellipse(cx - R * 0.3, cy - R * 0.18, R * 0.2, R * 0.14, 0.1, 0, TAU); c.ellipse(cx + R * 0.3, cy - R * 0.18, R * 0.2, R * 0.14, -0.1, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(cx - R * 0.06, cy + R * 0.05); c.lineTo(cx + R * 0.06, cy + R * 0.05); c.lineTo(cx, cy + R * 0.2); c.fill();
      c.fillRect(cx - R * 0.3, cy + R * 0.45, R * 0.6, R * 0.05);
      const r = C.seeded(11); c.fillStyle = '#a00a14';
      for (let i = 0; i < 70; i++) { c.beginPath(); c.arc(cx + (r() - 0.5) * R * 1.5, cy + (r() - 0.5) * R * 2, R * (0.01 + r() * 0.04), 0, TAU); c.fill(); }
    } else {
      // visage pâle aux orbites noires (face, mary, wraith)
      const R = M * 0.36 * z;
      const hp = () => { c.beginPath(); c.moveTo(cx, cy - R * 1.05); c.bezierCurveTo(cx + R * 0.8, cy - R * 1.05, cx + R * 0.8, cy - R * 0.2, cx + R * 0.6, cy + R * 0.3); c.bezierCurveTo(cx + R * 0.48, cy + R * 0.78, cx + R * 0.2, cy + R * 1.08, cx, cy + R * 1.1); c.bezierCurveTo(cx - R * 0.2, cy + R * 1.08, cx - R * 0.48, cy + R * 0.78, cx - R * 0.6, cy + R * 0.3); c.bezierCurveTo(cx - R * 0.8, cy - R * 0.2, cx - R * 0.8, cy - R * 1.05, cx, cy - R * 1.05); c.closePath(); };
      hp();
      let g = c.createRadialGradient(cx, cy - R * 0.35, R * 0.1, cx, cy, R * 1.2);
      g.addColorStop(0, kind === 'wraith' ? '#b4bcbc' : '#b6b0a3'); g.addColorStop(0.55, '#5b5954'); g.addColorStop(1, '#0a0a0a');
      c.fillStyle = g; c.fill();
      c.save(); hp(); c.clip();
      c.globalAlpha = 0.6; c.drawImage(P.tint(P.gritTex(), '#000000'), cx - R, cy - R * 1.1, R * 2, R * 2.3); c.globalAlpha = 1;
      [-1, 1].forEach((s) => { const gg = c.createRadialGradient(cx + s * R * 0.42, cy + R * 0.38, 0, cx + s * R * 0.42, cy + R * 0.38, R * 0.4); gg.addColorStop(0, 'rgba(0,0,0,0.6)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(cx - R, cy - R, R * 2, R * 2.2); });
      [-1, 1].forEach((s) => {
        const ex = cx + s * R * 0.28, ey = cy - R * 0.12;
        const gg = c.createRadialGradient(ex, ey, 0, ex, ey, R * 0.38); gg.addColorStop(0, 'rgba(0,0,0,1)'); gg.addColorStop(0.55, 'rgba(0,0,0,0.94)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gg; c.beginPath(); c.ellipse(ex, ey, R * 0.38, R * 0.32, s * 0.15, 0, TAU); c.fill();
        c.fillStyle = kind === 'mary' ? 'rgba(220,30,25,0.95)' : 'rgba(235,235,225,0.9)'; c.beginPath(); c.arc(ex + s * R * 0.02, ey + R * 0.02, R * 0.02, 0, TAU); c.fill();
        if (kind === 'mary') { c.strokeStyle = 'rgba(110,0,6,0.9)'; c.lineWidth = R * 0.03; c.beginPath(); c.moveTo(ex, ey + R * 0.18); c.quadraticCurveTo(ex + s * R * 0.03, ey + R * 0.45, ex - s * R * 0.01, ey + R * 0.8); c.stroke(); }
      });
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.moveTo(cx - R * 0.07, cy + R * 0.27); c.lineTo(cx + R * 0.07, cy + R * 0.27); c.lineTo(cx, cy + R * 0.04); c.fill();
      const mo = C.clamp(p * 3, 0.2, 1);
      const mg = c.createRadialGradient(cx, cy + R * 0.6, 0, cx, cy + R * 0.6, R * 0.35); mg.addColorStop(0, '#000'); mg.addColorStop(0.7, '#0a0303'); mg.addColorStop(1, 'rgba(10,3,3,0)');
      c.fillStyle = mg; c.beginPath(); c.ellipse(cx, cy + R * 0.6, R * (0.15 + mo * 0.05), R * (0.1 + mo * 0.3), 0, 0, TAU); c.fill();
      if (kind === 'mask') { const r = C.seeded(11); c.fillStyle = 'rgba(150,6,14,0.9)'; for (let i = 0; i < 60; i++) { c.beginPath(); c.arc(cx + (r() - 0.5) * R * 1.4, cy + (r() - 0.5) * R * 2, R * (0.008 + r() * 0.035), 0, TAU); c.fill(); } }
      c.restore();
      if (kind !== 'face' && kind !== 'mask') {
        c.strokeStyle = '#030303'; c.lineCap = 'round';
        const r = C.seeded(3);
        for (let i = 0; i < 70; i++) {
          const s = r() < 0.5 ? -1 : 1, x0 = cx + s * R * (0.1 + r() * 0.65), y0 = cy - R * (0.95 + r() * 0.15);
          c.lineWidth = R * (0.015 + r() * 0.035);
          c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(x0 + s * R * (0.3 + r() * 0.3), y0 + R * 0.6, x0 + s * R * (0.1 + r() * 0.3), y0 + R * 1.4, x0 + s * R * (0.2 + r() * 0.3) + Math.sin(t * 3 + i) * R * 0.03, y0 + R * (2 + r() * 0.6)); c.stroke();
        }
        c.fillStyle = '#030303'; c.beginPath(); c.ellipse(cx, cy - R * 0.85, R * 0.7, R * 0.3, 0, 0, TAU); c.fill();
      }
    }
    c.restore();
  };

  return P;
})();
