/* Lurkers — créatures tapies dans la pénombre derrière les chaînes : yeux, silhouettes, mains griffues. */
window.Lurkers = (function () {
  'use strict';
  const C = window.Crypte, P = window.Paint;
  const TAU = Math.PI * 2;
  const EYE_COLS = ['#ff3a1a', '#ffb43a', '#c8ff5a', '#e8c070', '#ff6a2a'];
  const KINDS = ['grin', 'wendigo', 'crawler', 'wraith', 'tall'];

  function make(cv, opts) {
    const c = cv.getContext('2d');
    const L = { cv, c, w: 0, h: 0, dpr: 1, on: false, raf: 0, last: 0, t: 0, eyes: [], shapes: [], hands: [], mx: -9999, my: -9999, nextWhisper: 4, onScare: opts && opts.onScare };
    const nEyes = C.lowPower ? 7 : 12, nShapes = C.lowPower ? 2 : 4;

    /* Bande verticale visible à l'écran (la zone scellée peut être bien plus haute que l'écran sur téléphone) */
    function band() {
      const r = cv.getBoundingClientRect(), vh = window.innerHeight || L.h;
      const y0 = C.clamp(-r.top, 0, L.h), y1 = C.clamp(vh - r.top, 0, L.h);
      return y1 - y0 > 120 ? [y0, y1] : [0, L.h];
    }
    function rpos() { const [y0, y1] = band(); return { x: C.rnd(0.06, 0.94) * L.w, y: C.rnd(y0 + (y1 - y0) * 0.06, y1 - (y1 - y0) * 0.06) }; }
    const sizeH = (sc) => Math.min(520, Math.max(C.touch ? L.w * 0.78 : 230, L.w * 0.42)) * sc;
    function spawnEye(e) {
      const p = rpos();
      return Object.assign(e || {}, { x: p.x, y: p.y, s: C.rnd(0.8, 1.8), col: C.pick(EYE_COLS), a: 0, ta: C.rnd(0.7, 1), life: C.rnd(5, 14), blink: C.rnd(1, 4), one: Math.random() < 0.12, mis: C.rnd(0.8, 1.1), tilt: C.rnd(-2, 2), gap: C.rnd(12, 30), drift: C.rnd(-6, 6), wait: C.rnd(0, 3) });
    }
    function spawnShape(s) {
      const p = rpos();
      const used = L.shapes.filter((o) => o !== s && o.a > 0.05).map((o) => o.k);
      const free = KINDS.filter((k) => used.indexOf(k) < 0);
      const sc = C.rnd(0.75, 1.1), Hd = sizeH(sc), [b0, b1] = band();
      return Object.assign(s || {}, { x: C.rnd(0.12, 0.88) * L.w, y: C.rnd(Math.min(b1, b0 + Hd * 0.95), b1 + Hd * 0.12), k: C.pick(free.length ? free : KINDS), sc, flip: Math.random() < 0.5, a: 0, ta: C.rnd(0.8, 1), life: C.rnd(6, 12), wait: C.rnd(0, 3), sway: C.rnd(0, TAU), col: C.pick(EYE_COLS), tw: 0, tj: 0 });
    }
    function spawnHand() {
      const side = C.pick(['l', 'r', 'b']);
      return { side, pos: C.rnd(0.15, 0.85), p: 0, dir: 1, hold: C.rnd(2, 4), sc: C.rnd(0.8, 1.15) };
    }
    function resize() {
      const r = cv.getBoundingClientRect();
      L.w = Math.max(1, r.width); L.h = Math.max(1, r.height);
      L.dpr = C.lowPower ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.25);
      cv.width = Math.round(L.w * L.dpr); cv.height = Math.round(L.h * L.dpr);
      L.eyes = []; for (let i = 0; i < nEyes; i++) { const e = spawnEye(); e.a = Math.random() < 0.5 ? C.rnd(0.3, 1) : 0; L.eyes.push(e); }
      L.shapes = []; for (let i = 0; i < nShapes; i++) { const sh = spawnShape(); L.shapes.push(sh); }
      L.hands = [];
    }

    const SK = C.lowPower ? 0.55 : Math.min(1, (window.devicePixelRatio || 1) * 0.85);
    /* Reflet d'œil réaliste : petit, rond, lueur diffuse, point spéculaire */
    function eyeDot(x, y, r, col, a, bl) {
      if (a <= 0.01) return;
      P.glow(c, x, y, r * 7, col, 0.22 * a);
      c.save(); c.translate(x, y); c.scale(1, Math.max(0.06, bl));
      const g = c.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
      g.addColorStop(0, C.rgba('#fffbe8', a)); g.addColorStop(0.35, C.rgba(col, a)); g.addColorStop(1, C.rgba(C.shade(col, 0.35), 0.6 * a));
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.restore();
    }
    function eyePair(e, t) {
      const a = e.a; if (a <= 0.01) return;
      const bl = (t + e.blink) % 4.6 < 0.14 ? 0.08 : 1;
      const r = 2.2 * e.s, gap = e.gap * e.s * 0.5;
      eyeDot(e.x - gap, e.y + e.tilt, r, e.col, a, bl);
      if (!e.one) eyeDot(e.x + gap, e.y - e.tilt, r * e.mis, e.col, a * 0.92, bl);
    }
    function beast(s, t, dt) {
      if (s.a <= 0.01) return;
      const sp = Beasts.get(s.k, SK);
      const Hd = sizeH(s.sc), Wd = Hd * sp.w / sp.h;
      if (s.tw > 0) s.tw -= dt; else if (Math.random() < dt * 0.25) { s.tw = 0.14; s.tj = C.rnd(-0.09, 0.09); if (window.Sound && s.a > 0.6 && Math.random() < 0.3) Sound.cue('creak', { dur: 0.3, v: 0.25, f: 900 }); }
      const breathe = 1 + Math.sin(t * 1.3 + s.sway) * 0.012, emerge = 0.9 + 0.1 * s.a;
      const rot = Math.sin(t * 0.5 + s.sway) * 0.025 + (s.tw > 0 ? s.tj : 0);
      P.glow(c, s.x, s.y - Hd * 0.6, Hd * 0.7, '#4a3e5c', 0.45 * s.a);
      c.save(); c.translate(s.x, s.y); c.rotate(rot); c.scale(emerge * (s.flip ? -1 : 1), emerge * breathe);
      c.globalAlpha = s.a; c.drawImage(sp.cv, -Wd / 2, -Hd, Wd, Hd);
      c.restore();
      if (!sp.eyes) return;
      const bl = (t + s.sway) % 5.2 < 0.15 ? 0.08 : 1;
      sp.eyes.forEach(([ex, ey], i) => {
        let lx = (ex - sp.w / 2) * Wd / sp.w * (s.flip ? -1 : 1), ly = (ey - sp.h) * Hd / sp.h;
        const cs = Math.cos(rot), sn = Math.sin(rot);
        lx *= emerge; ly *= emerge * breathe;
        eyeDot(s.x + lx * cs - ly * sn, s.y + lx * sn + ly * cs, sp.eye * Hd / 520 * (i ? 0.92 : 1), s.col, s.a, bl);
      });
    }
    function hand(h, dt) {
      if (h.dir > 0) { h.p = Math.min(1, h.p + dt * 0.55); if (h.p >= 1) { h.hold -= dt; if (h.hold <= 0) h.dir = -1; } }
      else h.p = Math.max(0, h.p - dt * 1.4);
      const sp = Beasts.get('hand', SK), Ld = Math.min(340, Math.max(200, L.w * 0.3)) * h.sc, Hd = Ld * sp.h / sp.w;
      const reach = Ld * 0.95 * C.easeOut(h.p);
      let x, y, ang;
      if (h.y == null) { const [b0, b1] = band(); h.y = b0 + (b1 - b0) * h.pos; }
      if (h.side === 'l') { x = -Ld + reach; y = h.y; ang = 0; }
      else if (h.side === 'r') { x = L.w + Ld - reach; y = h.y; ang = Math.PI; }
      else { x = h.pos * L.w; y = band()[1] + Ld - reach; ang = -Math.PI / 2; }
      const tremble = h.p >= 1 ? Math.sin(L.t * 23) * 0.012 + Math.sin(L.t * 7) * 0.02 : 0;
      c.save(); c.translate(x, y); c.rotate(ang + tremble); if (h.side === 'r') c.scale(1, -1);
      c.globalAlpha = Math.min(1, h.p * 2); c.drawImage(sp.cv, 0, -Hd / 2, Ld, Hd);
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
        if (Math.abs(L.mx - s.x) < 150 && L.my < s.y && L.my > s.y - 520 * s.sc) { s.life = Math.min(s.life, 0); }
        beast(s, t, dt);
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
