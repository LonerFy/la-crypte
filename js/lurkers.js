/* Lurkers — créatures tapies dans la pénombre derrière les chaînes : yeux, silhouettes, mains griffues. */
window.Lurkers = (function () {
  'use strict';
  const C = window.Crypte, P = window.Paint;
  const TAU = Math.PI * 2;
  const EYE_COLS = ['#ff2a14', '#ffb020', '#b8ff3a', '#ff4a2a', '#e8f0ff'];
  const KINDS = ['horned', 'tall', 'hunched', 'hood'];

  function make(cv, opts) {
    const c = cv.getContext('2d');
    const L = { cv, c, w: 0, h: 0, dpr: 1, on: false, raf: 0, last: 0, t: 0, eyes: [], shapes: [], hands: [], mx: -9999, my: -9999, nextWhisper: 4, onScare: opts && opts.onScare };
    const nEyes = C.lowPower ? 9 : 16, nShapes = C.lowPower ? 3 : 5;

    function rpos() { return { x: C.rnd(0.06, 0.94) * L.w, y: C.rnd(0.08, 0.92) * L.h }; }
    function spawnEye(e) {
      const p = rpos();
      return Object.assign(e || {}, { x: p.x, y: p.y, s: C.rnd(0.9, 2.1), col: C.pick(EYE_COLS), a: 0, ta: 1, life: C.rnd(5, 14), blink: C.rnd(1, 4), slit: Math.random() < 0.4, gap: C.rnd(14, 26), drift: C.rnd(-6, 6), wait: C.rnd(0, 3) });
    }
    function spawnShape(s) {
      const p = rpos();
      return Object.assign(s || {}, { x: p.x, y: Math.max(p.y, L.h * 0.35), k: C.pick(KINDS), sc: C.rnd(0.8, 1.6), a: 0, ta: C.rnd(0.85, 1), life: C.rnd(6, 12), wait: C.rnd(0, 3), sway: C.rnd(0, TAU), col: C.pick(EYE_COLS) });
    }
    function spawnHand() {
      const side = C.pick(['l', 'r', 'b']);
      return { side, pos: C.rnd(0.15, 0.85), p: 0, dir: 1, hold: C.rnd(1.5, 3.5), sc: C.rnd(0.8, 1.3) };
    }
    function resize() {
      const r = cv.getBoundingClientRect();
      L.w = Math.max(1, r.width); L.h = Math.max(1, r.height);
      L.dpr = C.lowPower ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.25);
      cv.width = Math.round(L.w * L.dpr); cv.height = Math.round(L.h * L.dpr);
      L.eyes = []; for (let i = 0; i < nEyes; i++) { const e = spawnEye(); e.a = Math.random() < 0.5 ? C.rnd(0.3, 1) : 0; L.eyes.push(e); }
      L.shapes = []; for (let i = 0; i < nShapes; i++) L.shapes.push(spawnShape());
      L.hands = [];
    }

    function eyePair(e, t) {
      const bl = (t + e.blink) % 4.2 < 0.13 ? 0.08 : 1;
      const a = e.a; if (a <= 0.01) return;
      const sz = 6 * e.s;
      P.glow(c, e.x, e.y, 46 * e.s, e.col, 0.28 * a);
      [-1, 1].forEach((d) => {
        const x = e.x + d * e.gap * e.s * 0.5;
        c.save(); c.translate(x, e.y); c.rotate(d * 0.18);
        c.fillStyle = C.rgba(e.col, a); c.beginPath(); c.ellipse(0, 0, sz, sz * 0.55 * bl, 0, 0, TAU); c.fill();
        c.fillStyle = C.rgba('#fff4d0', 0.75 * a * bl); c.beginPath(); c.ellipse(0, 0, sz * 0.35, sz * 0.28 * bl, 0, 0, TAU); c.fill();
        if (e.slit && bl > 0.5) { c.fillStyle = 'rgba(0,0,0,' + a + ')'; c.beginPath(); c.ellipse(0, 0, sz * 0.12, sz * 0.5, 0, 0, TAU); c.fill(); }
        c.restore();
      });
    }
    function silhouette(s, t) {
      if (s.a <= 0.01) return;
      const u = 2.2 * s.sc, x = s.x + Math.sin(t * 0.4 + s.sway) * 6, y = s.y;
      P.glow(c, x, y - 50 * u, 170 * u, '#5a4a70', 0.5 * s.a);
      P.glow(c, x, y - 50 * u, 90 * u, '#8a6a7a', 0.25 * s.a);
      c.save(); c.globalAlpha = s.a; c.fillStyle = '#000'; c.strokeStyle = 'rgba(150,120,160,0.35)'; c.lineWidth = 1.5;
      c.beginPath();
      if (s.k === 'horned') {
        c.ellipse(x, y - 60 * u, 18 * u, 22 * u, 0, 0, TAU);
        c.moveTo(x - 12 * u, y - 76 * u); c.quadraticCurveTo(x - 34 * u, y - 96 * u, x - 26 * u, y - 122 * u); c.quadraticCurveTo(x - 22 * u, y - 96 * u, x - 4 * u, y - 80 * u);
        c.moveTo(x + 12 * u, y - 76 * u); c.quadraticCurveTo(x + 34 * u, y - 96 * u, x + 26 * u, y - 122 * u); c.quadraticCurveTo(x + 22 * u, y - 96 * u, x + 4 * u, y - 80 * u);
        c.moveTo(x - 60 * u, y + 40 * u); c.quadraticCurveTo(x - 56 * u, y - 36 * u, x, y - 40 * u); c.quadraticCurveTo(x + 56 * u, y - 36 * u, x + 60 * u, y + 40 * u);
      } else if (s.k === 'tall') {
        c.ellipse(x, y - 110 * u, 11 * u, 16 * u, 0, 0, TAU);
        c.moveTo(x - 16 * u, y + 40 * u); c.lineTo(x - 14 * u, y - 92 * u); c.lineTo(x + 14 * u, y - 92 * u); c.lineTo(x + 16 * u, y + 40 * u);
        c.moveTo(x - 14 * u, y - 86 * u); c.lineTo(x - 30 * u, y - 10 * u); c.lineTo(x - 26 * u, y + 18 * u); c.lineTo(x - 22 * u, y - 10 * u); c.lineTo(x - 10 * u, y - 70 * u);
        c.moveTo(x + 14 * u, y - 86 * u); c.lineTo(x + 30 * u, y - 10 * u); c.lineTo(x + 26 * u, y + 18 * u); c.lineTo(x + 22 * u, y - 10 * u); c.lineTo(x + 10 * u, y - 70 * u);
      } else if (s.k === 'hunched') {
        c.moveTo(x - 70 * u, y + 40 * u); c.quadraticCurveTo(x - 70 * u, y - 40 * u, x - 10 * u, y - 50 * u); c.quadraticCurveTo(x + 30 * u, y - 52 * u, x + 44 * u, y - 30 * u);
        c.quadraticCurveTo(x + 66 * u, y - 34 * u, x + 70 * u, y - 14 * u); c.quadraticCurveTo(x + 60 * u, y + 4 * u, x + 40 * u, y); c.lineTo(x + 60 * u, y + 40 * u);
        for (let i = 0; i < 4; i++) { c.moveTo(x + 50 * u + i * 5 * u, y + 30 * u); c.lineTo(x + 58 * u + i * 6 * u, y + 46 * u); c.lineTo(x + 52 * u + i * 5 * u, y + 34 * u); }
      } else {
        c.moveTo(x, y - 100 * u); c.quadraticCurveTo(x - 30 * u, y - 96 * u, x - 28 * u, y - 60 * u); c.quadraticCurveTo(x - 50 * u, y - 20 * u, x - 56 * u, y + 40 * u); c.lineTo(x + 56 * u, y + 40 * u); c.quadraticCurveTo(x + 50 * u, y - 20 * u, x + 28 * u, y - 60 * u); c.quadraticCurveTo(x + 30 * u, y - 96 * u, x, y - 100 * u);
      }
      c.fill(); c.stroke(); c.restore();
      const ey = s.k === 'horned' ? y - 62 * u : s.k === 'tall' ? y - 110 * u : s.k === 'hunched' ? y - 26 * u : y - 68 * u;
      const ex = s.k === 'hunched' ? x + 52 * u : x;
      eyePair({ x: ex, y: ey, s: 0.55 * s.sc, col: s.col, a: s.a * 0.9, blink: s.sway, gap: s.k === 'tall' ? 11 : 16, slit: s.k === 'horned' }, t);
    }
    function hand(h, dt) {
      if (h.dir > 0) { h.p = Math.min(1, h.p + dt * 0.7); if (h.p >= 1) { h.hold -= dt; if (h.hold <= 0) h.dir = -1; } }
      else h.p = Math.max(0, h.p - dt * 1.2);
      const e = C.easeOut(h.p), u = 2.4 * h.sc, reach = 110 * u * e;
      let x, y, ang;
      if (h.side === 'l') { x = -10 + reach; y = h.pos * L.h; ang = 0; }
      else if (h.side === 'r') { x = L.w + 10 - reach; y = h.pos * L.h; ang = Math.PI; }
      else { x = h.pos * L.w; y = L.h + 10 - reach; ang = -Math.PI / 2; }
      c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = '#020102';
      c.fillRect(-220 * u, -9 * u, 220 * u, 18 * u);
      c.beginPath(); c.ellipse(4 * u, 0, 16 * u, 14 * u, 0, 0, TAU); c.fill();
      const curl = h.p >= 1 ? 0.35 + 0.15 * Math.sin(L.t * 6) : 0;
      for (let i = 0; i < 4; i++) {
        const fy = (-10 + i * 7) * u, a0 = (i - 1.5) * 0.18;
        c.save(); c.translate(14 * u, fy); c.rotate(a0 + curl);
        c.fillRect(0, -2.4 * u, 30 * u, 4.8 * u); c.translate(30 * u, 0); c.rotate(0.4 + curl);
        c.fillRect(0, -2 * u, 22 * u, 4 * u);
        c.beginPath(); c.moveTo(22 * u, -2 * u); c.lineTo(34 * u, 1 * u); c.lineTo(22 * u, 2 * u); c.fill();
        c.restore();
      }
      c.restore();
      return h.dir < 0 && h.p <= 0;
    }
    function frame(ts) {
      if (!L.on) return;
      L.raf = requestAnimationFrame(frame);
      if (C.lowPower && ts - L.last < 32) return;
      const dt = Math.min(0.06, (ts - (L.last || ts)) / 1000); L.last = ts; L.t += dt; const t = L.t;
      c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0); c.clearRect(0, 0, L.w, L.h);
      const v = { x0: 0, x1: L.w };
      P.fog(c, v, L.h * 0.15, L.h * 0.5, 0.16, t * 9, '#3a3a44');
      for (const s of L.shapes) {
        if (s.wait > 0) { s.wait -= dt; continue; }
        s.life -= dt; const tgt = s.life > 0 ? s.ta : 0;
        s.a += (tgt - s.a) * (1 - Math.exp(-dt * (s.life > 0 ? 1.1 : 1.5)));
        if (Math.hypot(L.mx - s.x, L.my - s.y) < 160) { s.life = Math.min(s.life, 0); }
        silhouette(s, t);
        if (s.life <= 0 && s.a < 0.02) spawnShape(s);
      }
      P.fog(c, v, L.h * 0.45, L.h * 0.6, 0.2, -t * 13, '#2a2a33');
      for (const e of L.eyes) {
        if (e.wait > 0) { e.wait -= dt; continue; }
        e.life -= dt; e.x += e.drift * dt;
        const near = Math.hypot(L.mx - e.x, L.my - e.y) < 130;
        if (near && e.life > 0) e.life = 0;
        const tgt = e.life > 0 ? e.ta : 0;
        e.a += (tgt - e.a) * (1 - Math.exp(-dt * (e.life > 0 ? 0.9 : near ? 9 : 2)));
        eyePair(e, t);
        if (e.life <= 0 && e.a < 0.02) { spawnEye(e); e.wait = C.rnd(0.5, 3); }
      }
      if (L.hands.length < (C.lowPower ? 1 : 2) && Math.random() < dt * 0.12) L.hands.push(spawnHand());
      L.hands = L.hands.filter((h) => !hand(h, dt));
      if (t > L.nextWhisper) { L.nextWhisper = t + C.rnd(9, 18); if (window.Sound && Math.random() < 0.6) Sound.cue(C.pick(['whisper', 'growl', 'moan']), { gain: 0.5, f: 120, dur: 2 }); }
      const g = c.createRadialGradient(L.w / 2, L.h / 2, Math.min(L.w, L.h) * 0.2, L.w / 2, L.h / 2, Math.max(L.w, L.h) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = g; c.fillRect(0, 0, L.w, L.h);
    }
    L.start = () => { if (L.on) return; resize(); L.on = true; L.last = 0; L.raf = requestAnimationFrame(frame); };
    L.stop = () => { L.on = false; cancelAnimationFrame(L.raf); };
    L.resize = () => { if (L.on) resize(); };
    L.point = (x, y) => { L.mx = x; L.my = y; };
    L.wake = () => {
      L.eyes.forEach((e) => { e.wait = C.rnd(0, 0.5); e.life = C.rnd(2, 4); e.ta = 1; if (Math.hypot(L.mx - e.x, L.my - e.y) < 160) { const p = rpos(); e.x = p.x; e.y = p.y; } });
      if (window.Sound) Sound.cue('growl', { gain: 0.8, delay: 0.3 });
    };
    L.flee = () => { L.eyes.forEach((e) => { e.life = 0; }); L.shapes.forEach((s) => { s.life = 0; }); L.hands.forEach((h) => { h.dir = -1; }); };
    return L;
  }
  return { make };
})();
