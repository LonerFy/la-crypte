/* Intro — cinématique d'entrée : orage, citrouille qui s'allume, nuée de chauves-souris, titre qui brûle. */
window.Intro = (function () {
  'use strict';
  const C = window.Crypte, P = window.Paint, $ = C.$;
  const root = $('#intro'), cv = $('#introCv'), ui = $('#introUi'), title = $('#introTitle'), skipB = $('#introSkip');
  let c = null, w = 0, h = 0, dpr = 1, raf = 0, t0 = 0, last = 0, phase = 'gate', s0 = 0, cb = null, done = false;
  let flash = 0, bolt = null, bats = [], evs = [], emb = {}, force = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); w = window.innerWidth; h = window.innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  function strike(k) {
    const x = w * C.rnd(0.15, 0.85);
    bolt = P.makeBolt(x + C.rnd(-200, 200), -20, x, h * C.rnd(0.35, 0.55)); bolt.life = 1;
    flash = k;
  }
  function geom() {
    const portrait = h > w, M = Math.min(w, h);
    const R = M * (portrait ? 0.3 : 0.23), gy = h * (portrait ? 0.6 : 0.7);
    return { R, gy, mx: w / 2, my: gy - R * 0.8 + R * 0.33 };
  }
  function scene(t, s, dt) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = geom();
    const lit = s < 0 ? 0.07 + 0.05 * Math.sin(t * 2.2) : s < 2.3 ? 0.07 : s < 3.2 ? C.clamp((s - 2.3) / 0.9, 0, 1) * (0.6 + 0.4 * Math.random()) : 1;
    const zoom = s < 3.6 ? 1 : 1 + C.easeIn(C.clamp((s - 3.6) / 2.2, 0, 1)) * 2.4;
    const vis = 0.07 + flash * 0.85;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, C.mix('#020104', '#8a90b8', flash * 0.7)); sky.addColorStop(0.7, C.mix('#0a0610', '#5a5070', flash * 0.6)); sky.addColorStop(1, '#000');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    P.clouds(c, { x0: 0, x1: w }, -h * 0.05, h * 0.55, 0.65, t * 22, C.mix('#05030a', '#2a2840', flash));
    if (bolt) { P.drawBolt(c, bolt, bolt.life, '#b8c8ff'); bolt.life -= dt * 2.4; if (bolt.life <= 0) bolt = null; }
    c.save();
    c.translate(g.mx, g.my); c.scale(zoom, zoom); c.translate(-g.mx, -g.my);
    const bk = '#000';
    P.tree(c, w * 0.1, g.gy + 10, h * 0.85, 7, bk, t, 1);
    P.tree(c, w * 0.92, g.gy + 10, h * 0.7, 9, bk, t + 2, 1);
    c.fillStyle = bk;
    const gw = Math.min(w * 0.7, g.R * 5.2), gx = w / 2 - gw / 2, gt = g.gy - g.R * 2.6;
    c.fillRect(gx - 14, gt - 30, 28, g.gy - gt + 30); c.fillRect(gx + gw - 14, gt - 30, 28, g.gy - gt + 30);
    c.lineWidth = 4; c.strokeStyle = bk;
    for (let i = 1; i < 14; i++) { const x = gx + i * gw / 14, top = gt + Math.abs(i - 7) * g.R * 0.05 - g.R * 0.35; c.beginPath(); c.moveTo(x, g.gy); c.lineTo(x, top); c.stroke(); c.beginPath(); c.moveTo(x - 6, top + 4); c.lineTo(x, top - 12); c.lineTo(x + 6, top + 4); c.fill(); }
    c.beginPath(); c.moveTo(gx, gt); c.quadraticCurveTo(w / 2, gt - g.R * 0.9, gx + gw, gt); c.lineWidth = 8; c.stroke();
    c.beginPath(); c.moveTo(gx, gt + g.R * 0.5); c.lineTo(gx + gw, gt + g.R * 0.5); c.lineWidth = 5; c.stroke();
    [[0.2, 'round', 0.9], [0.32, 'cross', 1.1], [0.7, 'slab', 1], [0.82, 'round', 0.8]].forEach(([k, type, sc]) => P.grave(c, w * k, g.gy + 6, g.R * 0.5 * sc, g.R * 0.8 * sc, type, bk));
    c.fillStyle = bk; c.fillRect(0, g.gy, w, h - g.gy + 10);
    P.fog(c, { x0: -50, x1: w + 50 }, g.gy - g.R * 0.6, g.R * 1.4, 0.18 + flash * 0.3, t * 30, '#8890a8');
    P.pumpkin(c, g.mx, g.gy, g.R, { lit, t, amb: Math.max(vis * 0.9, lit * 0.45), mouth: s > 3.4 ? C.clamp((s - 3.4) * 2, 0, 1) * 0.6 : 0, seed: 2 });
    if (lit > 0.5) P.parts(c, emb, 'e', 'embers', 30, { x0: g.mx - g.R, x1: g.mx + g.R, y0: g.gy - g.R * 3, y1: g.gy - g.R * 0.5 }, dt, t);
    c.restore();
    if (s > 3.4 && s < 5.4) { const n = Math.min(C.lowPower ? 130 : 260, Math.floor((s - 3.4) * 180)); while (bats.length < n) bats.push({ x: C.rnd(-0.3, 0.3), y: C.rnd(-0.12, 0.12), z: 1, vz: C.rnd(0.35, 0.9), dx: C.rnd(-1.4, 1.4), dy: C.rnd(-1.2, 0.6), ph: C.rnd(0, 6), s: C.rnd(0.6, 1.4) }); }
    for (let i = bats.length - 1; i >= 0; i--) {
      const b = bats[i]; b.z -= b.vz * dt; b.ph += dt * 22; b.x += b.dx * dt * 0.25; b.y += b.dy * dt * 0.25;
      if (b.z < 0.05) { bats.splice(i, 1); continue; }
      const sx = g.mx + (b.x * g.R * 2) / b.z, sy = g.my + (b.y * g.R * 2) / b.z, sz = (g.R * 0.09 * b.s) / b.z;
      P.bat(c, sx, sy, sz, b.ph, '#000');
    }
    if (s > 4.9) { c.fillStyle = 'rgba(0,0,0,' + C.clamp((s - 4.9) / 0.6, 0, 1) + ')'; c.fillRect(0, 0, w, h); }
    if (flash > 0.02) { c.fillStyle = 'rgba(220,230,255,' + (flash * 0.18) + ')'; c.fillRect(0, 0, w, h); }
    flash *= Math.exp(-dt * 4.5);
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    const t = (ts - t0) / 1000, s = phase === 'seq' ? (ts - s0) / 1000 : -1;
    if (phase === 'gate' && Math.random() < dt / 9) strike(0.35);
    for (const e of evs) if (!e.done && s >= e.at) { e.done = true; e.fn(); }
    scene(t, s, dt);
    if (phase === 'seq' && s > 7.4) finish();
  }
  function go(sound) {
    if (phase !== 'gate') return;
    C.T.sound = !!sound; Sound.enable(C.T.sound); C.emit('sound', C.T.sound);
    ui.classList.add('gone');
    const seen = C.store.get('crypte2.seen', false);
    C.store.set('crypte2.seen', true);
    if (C.T.intro === 'une fois' && seen && !force) { finish(); return; }
    force = false;
    phase = 'seq'; s0 = performance.now(); skipB.hidden = false;
    Sound.ambient({ wind: 0.6, drone: [36.7, 55] });
    evs = [
      { at: 0.3, fn: () => Sound.cue('organ') },
      { at: 1.0, fn: () => { strike(0.8); Sound.cue('thunder', { delay: 0.1 }); } },
      { at: 1.8, fn: () => { strike(1); Sound.cue('thunder', { delay: 0.05 }); } },
      { at: 2.4, fn: () => Sound.cue('match') },
      { at: 2.7, fn: () => Sound.cue('laugh', { f: 95, n: 7 }) },
      { at: 3.5, fn: () => Sound.cue('swarm') },
      { at: 5.6, fn: () => { title.classList.add('burn'); Sound.cue('braam'); } }
    ];
  }
  function finish() {
    if (done) return; done = true;
    if (!title.classList.contains('burn')) { title.classList.add('burn'); }
    skipB.hidden = true;
    root.classList.add('out');
    setTimeout(() => { cancelAnimationFrame(raf); root.hidden = true; window.removeEventListener('resize', resize); }, 1300);
    if (cb) cb();
  }
  function start(onDone) {
    cb = onDone; c = cv.getContext('2d'); resize();
    window.addEventListener('resize', resize);
    t0 = last = performance.now();
    raf = requestAnimationFrame(frame);
    $('#introSound').addEventListener('click', () => go(true));
    $('#introSilent').addEventListener('click', () => go(false));
    skipB.addEventListener('click', finish);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && phase === 'seq' && !done) finish(); });
    setTimeout(() => { const b = $('#introSound'); if (b) b.focus({ preventScroll: true }); }, 80);
  }
  function replay() {
    done = false; phase = 'gate'; bats = []; evs = []; force = true;
    root.hidden = false; root.classList.remove('out'); ui.classList.remove('gone'); title.classList.remove('burn');
    t0 = last = performance.now(); resize(); window.addEventListener('resize', resize);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  return { start, replay, isDone: () => done };
})();
