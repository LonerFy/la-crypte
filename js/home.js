/* Home — cimetière interactif de l'accueil, curseur bougie, bonbon ou sort, cartes des dossiers. */
window.Home = (function () {
  'use strict';
  const C = window.Crypte, P = window.Paint, $ = C.$, $$ = C.$$, SC = window.SCENES;
  const api = {};

  /* =====================================================================
     Scène du cimetière
     ===================================================================== */
  const PUMPS = [[470, 770, 40], [700, 805, 50], [930, 775, 44], [1170, 812, 54], [1410, 780, 42]];
  const EYES = [[150, 430, 0.45], [235, 520, 0.45], [1520, 430, 0.45], [560, 640, 0.7], [1010, 610, 0.7], [1590, 600, 0.7]];
  SC['home-yard'] = {
    focus: [920, 450], dark: 0.5, darkCol: '#04030a', desat: 0,
    init(st) {
      st.pl = PUMPS.map(() => 0); st.on = PUMPS.map(() => false); st.door = 0; st.ghost = -1;
      st.crows = [0, 1, 2, 3].map((i) => ({ i, mode: 'sit', x: 0, y: 0, t: 0, vx: 0, vy: 0, ph: Math.random() * 6 }));
      st.hand = { t: 5, a: 0 }; st.spider = 0.4; st.spT = 0.4; st.flock = -1; st.nextFlock = 4; st.nextBolt = 9;
    },
    draw(S, st, t, dt) {
      const c = S.ctx, pal = P.pal || {};
      const ink = pal.ink || '#0b0809', mold = pal.mold || '#2d3b33', ember = pal.ember || '#e8731c', bone = pal.bone || '#dccfb6', blood = pal.blood || '#b3121d';
      let v = S.layer(0.04);
      P.sky(c, v, [[0, C.mix(ink, '#000000', 0.4)], [0.45, C.mix(ink, mold, 0.45)], [0.72, C.mix(mold, ember, 0.22)], [1, C.mix(ember, ink, 0.55)]]);
      P.stars(c, v, t, 140, 0.85, 7, 420);
      P.moon(c, 1180, 200, 108, C.mix(bone, '#ffffff', 0.25), { halo: 1.3 });
      P.clouds(c, v, 110, 170, 0.5, t * 9, C.shade(ink, 0.8));
      if (t > st.nextFlock && st.flock < 0) { st.flock = 0; st.nextFlock = t + C.rnd(9, 16); }
      if (st.flock >= 0) { st.flock += dt; const fx = -200 + st.flock * 260; for (let i = 0; i < 6; i++) P.bat(c, fx - i * 46 + Math.sin(i * 3) * 20, 180 + Math.sin(st.flock * 2 + i) * 30 + i * 9, 10 + (i % 3) * 3, t * 18 + i, '#020103'); if (fx > 2000) st.flock = -1; }
      v = S.layer(0.22);
      P.ridge(c, v, 600, 50, 2.4, C.mix(ink, mold, 0.25));
      c.save(); c.translate(360, 560); c.fillStyle = C.mix(ink, mold, 0.2);
      c.fillRect(-120, -150, 240, 150); for (let i = 0; i < 3; i++) { const x = -100 + i * 75; c.fillStyle = C.shade(ink, 0.6); c.beginPath(); c.moveTo(x, -20); c.lineTo(x, -110); c.quadraticCurveTo(x + 25, -150, x + 50, -110); c.lineTo(x + 50, -20); c.fill(); }
      c.fillStyle = C.mix(ink, mold, 0.2); c.fillRect(-150, -260, 50, 260); c.beginPath(); c.moveTo(-160, -260); c.lineTo(-125, -330); c.lineTo(-90, -260); c.fill(); c.restore();
      v = S.layer(0.45);
      P.fog(c, v, 470, 200, 0.28, t * 7, C.mix(bone, mold, 0.5));
      const tl = P.tree(c, 170, 660, 780, 13, '#020103', t, 1);
      const tr = P.tree(c, 1500, 660, 620, 27, '#020103', t, 1);
      st.crows.forEach((cr) => {
        const pp = P.treePerch(tr, 1500, 660, 620, cr.i * 2 + 1);
        if (cr.mode === 'sit') { cr.x = pp.x; cr.y = pp.y; P.crow(c, cr.x, cr.y, 26, 'sit', cr.i % 2 ? 1 : -1, '#020103'); }
        else if (cr.mode === 'fly') { cr.t += dt; cr.x += cr.vx * dt; cr.y += cr.vy * dt; cr.vy -= 30 * dt; cr.ph += dt * 14; P.crow(c, cr.x, cr.y, 26, 'fly', cr.vx > 0 ? 1 : -1, '#020103', cr.ph); if (cr.t > 9) { cr.mode = 'back'; cr.t = 0; cr.sx = cr.x; cr.sy = cr.y; } }
        else { cr.t += dt / 3; const k = C.easeIO(Math.min(1, cr.t)); cr.ph += dt * 14; const x = C.lerp(cr.sx, pp.x, k), y = C.lerp(cr.sy, pp.y, k) - Math.sin(k * Math.PI) * 60; P.crow(c, x, y, 26, k < 1 ? 'fly' : 'sit', -1, '#020103', cr.ph); if (k >= 1) cr.mode = 'sit'; }
      });
      v = S.layer(0.7);
      c.fillStyle = C.mix(ink, '#000', 0.3); c.fillRect(v.x0, 630, v.x1 - v.x0, 400);
      [[560, 'round', 46, 80], [640, 'cross', 50, 96], [820, 'slab', 54, 70], [900, 'angel', 70, 130], [1480, 'obelisk', 46, 150], [1580, 'round', 50, 76], [440, 'slab', 46, 64]].forEach(([x, k, w, hh]) => P.grave(c, x, 640, w, hh, k, '#06050a', 0.6));
      c.save(); c.translate(1225, 640); c.fillStyle = '#0a080e';
      c.fillRect(-170, -24, 340, 24); c.fillRect(-150, -40, 300, 18);
      c.fillRect(-135, -260, 270, 222);
      c.beginPath(); c.moveTo(-160, -262); c.lineTo(0, -360); c.lineTo(160, -262); c.closePath(); c.fill();
      c.fillStyle = '#120f16'; [-120, -70, 52, 102].forEach((x) => c.fillRect(x, -250, 20, 212));
      c.fillStyle = '#0d0b10'; c.fillRect(-150, -282, 300, 22);
      c.font = 'italic 22px "IM Fell Double Pica", Georgia, serif'; c.textAlign = 'center'; c.fillStyle = C.mix(bone, ink, 0.6); c.fillText('C R Y P T A', 0, -264);
      const d = C.clamp(st.door, 0, 1);
      c.fillStyle = C.rgba('#6aff8a', 0.15 + d * 0.7); c.beginPath(); c.moveTo(-36, -38); c.lineTo(-36, -150); c.arc(0, -150, 36, Math.PI, 0); c.lineTo(36, -38); c.fill();
      c.fillStyle = '#16121a'; c.save(); c.beginPath(); c.moveTo(-36, -38); c.lineTo(-36, -150); c.arc(0, -150, 36, Math.PI, 0); c.lineTo(36, -38); c.clip();
      c.fillRect(-36 - d * 64, -190, 72, 160); c.restore();
      if (d > 0.05) P.glow(c, 0, -110, 220, '#6aff8a', 0.35 * d);
      c.restore();
      if (st.ghost >= 0) {
        st.ghost += dt / 6; const k = st.ghost;
        const gx = 1225 + Math.sin(k * 6) * 40 - k * 300, gy = 600 - k * 260, gs = 0.6 + k * 1.6;
        c.globalAlpha = Math.sin(Math.min(1, k) * Math.PI) * 0.8;
        P.fig(c, gx, gy, 200 * gs, 'ghost', { col: 'rgba(220,240,230,0.85)', t });
        P.glow(c, gx, gy - 100 * gs, 160 * gs, '#c8ffd8', 0.25);
        c.globalAlpha = 1;
        if (k >= 1) st.ghost = -1;
      }
      v = S.layer(0.9);
      st.hand.t -= dt;
      if (st.hand.t < 0) { st.hand.a += dt / 1.6; if (st.hand.a > 3.4) { st.hand.a = 0; st.hand.t = C.rnd(10, 18); } }
      const ha = st.hand.a < 1 ? C.easeOut(st.hand.a) : st.hand.a < 2.4 ? 1 : 1 - C.easeIn(C.clamp(st.hand.a - 2.4, 0, 1));
      c.fillStyle = '#100a08'; c.beginPath(); c.ellipse(700, 708, 90, 16, 0, 0, Math.PI * 2); c.fill();
      if (ha > 0.01) {
        c.save(); c.beginPath(); c.rect(560, 400, 280, 306); c.clip();
        c.translate(700, 706 + (1 - ha) * 150); c.rotate(-0.15);
        c.fillStyle = '#7f8a70'; c.fillRect(-11, -120, 22, 130);
        c.beginPath(); c.ellipse(0, -132, 20, 22, 0, 0, Math.PI * 2); c.fill();
        for (let i = 0; i < 4; i++) { const tw = Math.sin(t * 9 + i) * 0.25 * (st.hand.a > 1 && st.hand.a < 2.4 ? 1 : 0); c.save(); c.translate(-14 + i * 9.5, -148); c.rotate(-0.25 + i * 0.16 + tw); c.fillRect(-3.5, -36, 7, 36); c.restore(); }
        c.save(); c.translate(18, -130); c.rotate(0.9); c.fillRect(-3.5, -26, 7, 26); c.restore();
        c.restore();
      }
      P.grave(c, 700, 700, 70, 110, 'cross', '#05040a', 0.6);
      v = S.layer(1.05);
      P.fog(c, v, 620, 200, 0.3, -t * 10, C.mix(bone, mold, 0.6));
      c.fillStyle = '#050307'; c.beginPath(); c.moveTo(v.x0, 760); for (let x = v.x0; x < v.x1 + 40; x += 40) c.lineTo(x, 748 + Math.sin(x * 0.01) * 12); c.lineTo(v.x1, v.y1 + 10); c.lineTo(v.x0, v.y1 + 10); c.fill();
      v = S.layer(1.25);
      PUMPS.forEach(([x, y, R], i) => {
        st.pl[i] += ((st.on[i] ? 1 : 0) - st.pl[i]) * (1 - Math.exp(-dt * (st.on[i] ? 3 : 6)));
        P.pumpkin(c, x, y, R, { lit: st.pl[i], t: t + i * 1.7, amb: 0.42, seed: i * 3, mouth: st.door > 0.5 ? 0.3 : 0 });
        if (!st.on[i] && st.pl[i] < 0.5 && st.pl[i] > 0.02) P.parts(c, st, 'sm' + i, 'ash', 10, { x0: x - R, x1: x + R, y0: y - R * 3, y1: y - R }, dt, t, { col: '#8a8a8a' });
      });
      const torch = S.torch;
      if (torch) {
        const tp = S.toStage(torch.x, torch.y, 0.6);
        EYES.forEach(([x, y, d], i) => {
          const dd = Math.hypot(tp.x - x, tp.y - y), a = C.clamp(1 - dd / 240, 0, 1) * (Math.sin(t * 0.8 + i * 2) > -0.9 ? 1 : 0);
          if (a <= 0.02) return;
          const q = S.toScreen(x, y, d), r = S.toStage(q.x, q.y, 1.25); const col = i % 2 ? ember : blood;
          P.glow(c, r.x, r.y, 26, col, 0.6 * a); c.fillStyle = C.rgba(C.mix(col, '#ffffff', 0.3), a); c.beginPath(); c.ellipse(r.x - 9, r.y, 5, 2.4, 0.15, 0, Math.PI * 2); c.ellipse(r.x + 9, r.y, 5, 2.4, -0.15, 0, Math.PI * 2); c.fill();
        });
        st.crows.forEach((cr) => { if (cr.mode !== 'sit') return; const q = S.toScreen(cr.x, cr.y, 0.45); if (Math.hypot(q.x - torch.x, q.y - torch.y) < 90) api.scareCrow(cr); });
      }
      v = S.layer(1.4);
      const sx = 1440;
      st.spider += (st.spT - st.spider) * (1 - Math.exp(-dt * (st.spT < st.spider ? 6 : 0.6)));
      if (Math.random() < dt / 6) st.spT = C.rnd(0.25, 0.75);
      if (torch) { const q = S.toScreen(sx, v.y0 + (v.y1 - v.y0) * st.spider, 1.4); if (Math.hypot(q.x - torch.x, q.y - torch.y) < 120) st.spT = 0.05; }
      const sy = v.y0 + (v.y1 - v.y0) * st.spider * 0.6;
      c.strokeStyle = 'rgba(200,200,210,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx, v.y0 - 10); c.lineTo(sx, sy); c.stroke();
      c.fillStyle = '#030204'; c.beginPath(); c.ellipse(sx, sy + 14, 13, 17, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(sx, sy - 6, 8, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#030204'; c.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) { const wv = Math.sin(t * 6 + i) * 4; [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(sx, sy + 4 + i * 6); c.quadraticCurveTo(sx + s * 24, sy - 12 + i * 8 + wv, sx + s * 34, sy + 10 + i * 9); c.stroke(); }); }
      c.fillStyle = blood; c.fillRect(sx - 3, sy + 10, 6, 8);
      c.fillStyle = '#020103';
      for (let x = Math.floor(v.x0 / 70) * 70; x < v.x1; x += 70) { c.fillRect(x, 820, 8, 200); c.beginPath(); c.moveTo(x - 6, 824); c.lineTo(x + 4, 796); c.lineTo(x + 14, 824); c.fill(); }
      c.fillRect(v.x0, 850, v.x1 - v.x0, 8); c.fillRect(v.x0, 920, v.x1 - v.x0, 8);
      if (t > st.nextBolt) { S.strike(C.rnd(300, 1500)); st.nextBolt = t + C.rnd(14, 26); }
    },
    lights(st, S) {
      const L = [{ x: 1180, y: 200, r: 1300, i: 0.45, c: '#d8d0e8', d: 0.04, g: 0.05 }, { x: 1225, y: 540, r: 340, i: 0.15 + st.door * 0.8, c: '#6aff8a', d: 0.7, g: 0.12 }];
      PUMPS.forEach(([x, y, R], i) => { if (st.pl[i] > 0.02) L.push({ x, y: y - R, r: 300, i: 0.95 * st.pl[i], c: '#ff8a1e', d: 1.25, g: 0.22 }); });
      return L;
    }
  };

  /* =====================================================================
     Héros de l'accueil
     ===================================================================== */
  let hero = null, heroOn = false, wins = 0;
  const hint = $('#heroHint');
  api.scareCrow = (cr) => { cr.mode = 'fly'; cr.t = 0; cr.vx = C.rnd(-160, 160) || 120; cr.vy = -C.rnd(120, 200); Sound.cue('crow', { n: 2, pan: 0.6 }); };
  function heroInit() {
    const cv = $('#heroCv');
    hero = new Stage(cv, { post: false, dprMax: 1.5, lightRes: 0.5, minW: 640, ayP: 0.6 });
    hero.setScene('home-yard');
    hero.onBolt = () => Sound.cue('thunder', { delay: C.rnd(0.3, 1.5), near: false });
    hero.torch = { on: false, x: -999, y: -999, r: C.touch ? 120 : 170, dark: 0, c: '#ffd9a0' };
    const box = $('#hero');
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; };
    box.addEventListener('pointermove', (e) => { const p = pos(e); hero.torch.on = true; hero.torch.x = p.x; hero.torch.y = p.y; hero.ptr.tx = p.x / p.w * 2 - 1; hero.ptr.ty = p.y / p.h * 2 - 1; });
    box.addEventListener('pointerleave', () => { hero.torch.on = false; hero.ptr.tx = 0; hero.ptr.ty = 0; });
    cv.addEventListener('click', (e) => {
      const p = pos(e); const q = hero.toStage(p.x, p.y, 1.25), st = hero.st;
      hero.torch.on = true; hero.torch.x = p.x; hero.torch.y = p.y;
      let hit = false;
      PUMPS.forEach(([x, y, R], i) => {
        if (Math.hypot(q.x - x, q.y - (y - R * 0.8)) < R * 1.25) {
          hit = true; st.on[i] = !st.on[i];
          Sound.cue(st.on[i] ? 'match' : 'gust', { dur: 0.6 });
          if (st.on[i]) Sound.cue('whoosh', { v: 0.2 });
        }
      });
      const lit = st.on.filter(Boolean).length;
      if (hit) {
        if (lit === PUMPS.length) {
          wins++; hero.tween('door', 1, 2.5); st.ghost = 0;
          Sound.cue('creak', { dur: 2.5, f: 300 }); Sound.cue('laugh', { f: 140, delay: 1.4 }); Sound.cue('moan', { delay: 2 });
          hint.textContent = "La crypte s'ouvre. Quelque chose en sort…"; hint.classList.add('win');
        } else {
          if (st.door > 0) hero.tween('door', 0, 1.2);
          hint.classList.remove('win');
          hint.textContent = lit ? lit + ' citrouille' + (lit > 1 ? 's' : '') + ' sur 5. Continue.' : 'Allume les cinq citrouilles. Promène ta lumière dans les arbres.';
        }
      } else {
        st.crows.forEach((cr) => { if (cr.mode !== 'sit') return; const s2 = hero.toScreen(cr.x, cr.y, 0.45); if (Math.hypot(s2.x - p.x, s2.y - p.y) < 60) api.scareCrow(cr); });
      }
    });
    const io = new IntersectionObserver((ents) => { heroOn = ents[0].isIntersecting; sync(); });
    io.observe(box);
    document.addEventListener('visibilitychange', sync);
  }
  function sync() {
    if (!hero) return;
    const vis = heroOn && !document.hidden && !$('#v-accueil').hidden && !(window.Theatre && Theatre.isOpen());
    if (vis) { hero.resize(); hero.start(); } else hero.stop();
  }
  api.sync = sync;
  C.on('theatre', () => sync());
  api.heroStage = () => hero;

  /* =====================================================================
     Curseur bougie + bonbons (calque fixe)
     ===================================================================== */
  const fxCv = $('#fxCv'), fx = fxCv.getContext('2d');
  let touchUntil = 0, sawTouch = false;
  let fw = 0, fh = 0, fdpr = 1, mx = -100, my = -100, hover = false, parts = [], candies = [], fxRaf = 0, fxRun = false, fxLast = 0;
  function fxResize() { fdpr = Math.min(window.devicePixelRatio || 1, 1.5); fw = window.innerWidth; fh = window.innerHeight; fxCv.width = Math.round(fw * fdpr); fxCv.height = Math.round(fh * fdpr); }
  let fxBeat = 0;
  function fxStart() { if (fxRun && performance.now() - fxBeat < 400) return; cancelAnimationFrame(fxRaf); fxRun = true; fxLast = fxBeat = performance.now(); fxRaf = requestAnimationFrame(fxFrame); }
  function cursorOn() { return C.T.cursor && !C.touch && !sawTouch; }
  function fxFrame(ts) {
    fxBeat = performance.now();
    try { fxDraw(ts); } catch (e) { console.warn(e); fxRaf = requestAnimationFrame(fxFrame); }
  }
  function fxDraw(ts) {
    const dt = Math.min(0.05, (ts - fxLast) / 1000); fxLast = ts;
    fx.setTransform(fdpr, 0, 0, fdpr, 0, 0); fx.clearRect(0, 0, fw, fh);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 20 * dt;
      if (p.t > p.life) { parts.splice(i, 1); continue; }
      const a = 1 - p.t / p.life;
      if (p.k === 'e') { fx.fillStyle = 'rgba(255,' + Math.floor(120 + 100 * a) + ',40,' + a + ')'; fx.fillRect(p.x, p.y, 2, 2); }
      else { fx.fillStyle = 'rgba(160,160,170,' + (a * 0.12) + ')'; fx.beginPath(); fx.arc(p.x, p.y, 6 + p.t * 18, 0, 6.283); fx.fill(); }
    }
    for (let i = candies.length - 1; i >= 0; i--) {
      const q = candies[i]; q.t += dt; q.vy += (C.touch ? 650 : 900) * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt;
      if (q.y > fh + 60) { candies.splice(i, 1); continue; }
      fx.save(); fx.translate(q.x, q.y); fx.rotate(q.r);
      if (q.k === 0) { fx.fillStyle = q.c; fx.beginPath(); fx.ellipse(0, 0, 12, 8, 0, 0, 6.283); fx.fill(); fx.beginPath(); fx.moveTo(-11, 0); fx.lineTo(-22, -8); fx.lineTo(-22, 8); fx.fill(); fx.beginPath(); fx.moveTo(11, 0); fx.lineTo(22, -8); fx.lineTo(22, 8); fx.fill(); fx.fillStyle = 'rgba(255,255,255,0.4)'; fx.fillRect(-6, -5, 8, 2); }
      else if (q.k === 1) { fx.fillStyle = '#ffffff'; fx.beginPath(); fx.moveTo(0, -14); fx.lineTo(10, 12); fx.lineTo(-10, 12); fx.fill(); fx.fillStyle = '#f5a51a'; fx.beginPath(); fx.moveTo(-6, 3); fx.lineTo(6, 3); fx.lineTo(10, 12); fx.lineTo(-10, 12); fx.fill(); fx.fillStyle = '#ffe2a0'; fx.beginPath(); fx.moveTo(0, -14); fx.lineTo(3, -6); fx.lineTo(-3, -6); fx.fill(); }
      else { fx.strokeStyle = '#d8c8a0'; fx.lineWidth = 3; fx.beginPath(); fx.moveTo(0, 0); fx.lineTo(0, 26); fx.stroke(); fx.fillStyle = q.c; fx.beginPath(); fx.arc(0, -4, 12, 0, 6.283); fx.fill(); fx.strokeStyle = 'rgba(255,255,255,0.55)'; fx.lineWidth = 2; fx.beginPath(); fx.arc(0, -4, 6, 0, 4.5); fx.stroke(); }
      fx.restore();
    }
    const now = performance.now(), touchA = C.T.cursor && (C.touch || sawTouch) ? C.clamp((touchUntil - now) / 700, 0, 1) : 0;
    if ((cursorOn() || touchA > 0) && mx > -50) {
      const t = ts / 1000, a = cursorOn() ? 1 : touchA, fy = cursorOn() ? my : my - 46, sz = cursorOn() ? (hover ? 24 : 18) : 30;
      P.glow(fx, mx, fy, (hover ? 70 : 50) * (cursorOn() ? 1 : 1.8), '#ff9a3a', (hover ? 0.35 : 0.22) * a);
      if (hover && cursorOn()) { fx.strokeStyle = 'rgba(255,190,110,0.7)'; fx.lineWidth = 1.5; fx.beginPath(); fx.arc(mx, my, 18 + Math.sin(t * 6) * 2, 0, 6.283); fx.stroke(); }
      P.flame(fx, mx, fy + 8, sz, t, a, 4);
      if (Math.random() < dt * 14 * a) parts.push({ k: 'e', x: mx + C.rnd(-3, 3), y: fy - 6, vx: C.rnd(-20, 20), vy: C.rnd(-60, -20), t: 0, life: C.rnd(0.5, 1.1) });
      if (Math.random() < dt * 4 * a) parts.push({ k: 's', x: mx, y: fy - 14, vx: C.rnd(-8, 8), vy: -30, t: 0, life: 1.4 });
    }
    if (!cursorOn() && touchA <= 0 && !parts.length && !candies.length) { fxRun = false; fx.clearRect(0, 0, fw, fh); return; }
    fxRaf = requestAnimationFrame(fxFrame);
  }
  function applyCursor() { document.body.classList.toggle('cur', cursorOn()); if (cursorOn()) fxStart(); }
  api.applyCursor = applyCursor;
  const onTouch = (e) => {
    if (e.pointerType !== 'touch' || !C.T.cursor) return;
    sawTouch = true;
    const first = performance.now() > touchUntil;
    mx = e.clientX; my = e.clientY; touchUntil = performance.now() + 1500;
    if (first && e.type === 'pointerdown') for (let i = 0; i < 10; i++) parts.push({ k: 'e', x: mx, y: my - 40, vx: C.rnd(-80, 80), vy: C.rnd(-120, -30), t: 0, life: C.rnd(0.5, 1.2) });
    fxStart();
  };
  window.addEventListener('pointerdown', onTouch, { passive: true });
  window.addEventListener('pointermove', onTouch, { passive: true });
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; mx = e.clientX; my = e.clientY; hover = !!(e.target.closest && e.target.closest('button, a, [data-go], .card, input, canvas#heroCv')); if (cursorOn()) fxStart(); });
  document.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') mx = -100; });
  window.addEventListener('resize', fxResize);
  fxResize();

  function candyBurst(x, y) {
    const cols = ['#ff4a2a', '#ffb02a', '#8a3ae0', '#2ad06a', '#ff3a9a', '#3ab0ff'];
    for (let i = 0; i < 70; i++) { const a = C.rnd(-Math.PI, 0), sp = C.rnd(300, 900); candies.push({ x, y, vx: Math.cos(a) * sp * 0.8, vy: Math.sin(a) * sp, r: C.rnd(0, 6), vr: C.rnd(-8, 8), k: Math.floor(Math.random() * 3), c: C.pick(cols), t: 0 }); }
    fxStart();
  }

  /* =====================================================================
     Sursaut d'accueil (bonbon ou sort)
     ===================================================================== */
  const scCv = $('#scareCv'), scx = scCv.getContext('2d');
  function homeScare(kind) {
    if (!C.T.scares) { document.body.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-8px,6px)' }, { transform: 'translate(7px,-5px)' }, { transform: 'translate(0,0)' }], { duration: 300, iterations: 2 }); Sound.cue('sting'); return; }
    const d = Math.min(window.devicePixelRatio || 1, 1.5), W = window.innerWidth, Hh = window.innerHeight;
    scCv.width = Math.round(W * d); scCv.height = Math.round(Hh * d); scCv.classList.add('on');
    Sound.cue('scare'); C.vibrate([80, 40, 160]);
    const t0 = performance.now(), dur = 1150;
    const step = (now) => {
      const p = (now - t0) / dur;
      scx.setTransform(d, 0, 0, d, 0, 0); scx.clearRect(0, 0, W, Hh);
      if (p >= 1) { scCv.classList.remove('on'); return; }
      P.scare(scx, kind, W, Hh, p, now / 1000);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  api.homeScare = homeScare;

  const TREATS = [
    "Bonbon ! Le mot Halloween vient de « All Hallows' Eve », la veille de la Toussaint.",
    "Bonbon ! Les premières lanternes d'Halloween étaient des navets creusés, en Irlande.",
    "Bonbon ! Au Mexique, on offre aux morts des crânes en sucre, les calaveras.",
    "Bonbon ! Mary Shelley a imaginé Frankenstein pendant un concours d'histoires de fantômes, en 1816.",
    "Bonbon ! Quand tu as peur, ton cœur peut gagner trente battements par minute en une seconde.",
    "Bonbon ! Bram Stoker n'est jamais allé en Transylvanie."
  ];
  const TRICKS = [
    "Sort ! Cette nuit, quelque chose grattera sous ton lit. Ne regarde pas.",
    "Sort ! Ton reflet aura une seconde de retard pendant trois jours.",
    "Sort ! Compte les marches de ton escalier ce soir. Il y en aura une de plus.",
    "Sort ! Quelqu'un vient de prononcer ton nom devant un miroir.",
    "Sort ! La prochaine fois que ton téléphone sonnera, l'appel viendra de chez toi."
  ];
  let lastTrick = null;
  function trickOrTreat(btn) {
    if (!C.T.sound) { C.T.sound = true; Sound.enable(true); C.emit('sound', true); }
    const out = $('#trickOut'), r = btn.getBoundingClientRect();
    Sound.cue('knock', { n: 3 });
    out.className = 'tot-out'; out.textContent = '…';
    btn.disabled = true;
    setTimeout(() => {
      btn.disabled = false;
      let treat = Math.random() < 0.5; if (lastTrick === treat && Math.random() < 0.5) treat = !treat; lastTrick = treat;
      if (treat) { out.classList.add('treat'); out.textContent = C.pick(TREATS); Sound.cue('candy'); const rr = btn.getBoundingClientRect(), by = rr.top > 40 && rr.top < window.innerHeight - 20 ? rr.top : window.innerHeight * 0.65; candyBurst(rr.left + rr.width / 2, by); }
      else { out.classList.add('trick'); out.textContent = C.pick(TRICKS); homeScare(C.pick(['face', 'mary', 'eyes', 'pumpkin', 'mask', 'creature'])); }
    }, 1100);
  }
  api.trickOrTreat = trickOrTreat;

  /* =====================================================================
     Cartes des dossiers (vignettes peintes)
     ===================================================================== */
  const thumbs = [];
  function card(s) {
    const b = document.createElement('button');
    b.className = 'card'; b.dataset.story = s.id; b.style.setProperty('--sc', s.accent);
    b.innerHTML = '<div class="th"><canvas aria-hidden="true"></canvas><span class="yr">' + s.year + '</span><span class="go">Entrer</span><span class="ct">' + s.title + '</span></div>' +
      '<div class="cb"><span class="au">' + s.author + ' · ' + s.dur + '</span><p class="tg">' + s.tag + '</p><div class="bd">' + s.badges.map((x, i) => '<span class="' + (i === 0 ? 'hot' : '') + '">' + x + '</span>').join('') + '</div></div>';
    const cv = b.querySelector('canvas');
    const th = { cv, s, stage: null, drawn: false };
    thumbs.push(th);
    b.addEventListener('pointerenter', () => { if (C.touch) return; ensureThumb(th); if (th.stage) th.stage.start(); });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--rx', '0deg'); b.style.setProperty('--ry', '0deg'); if (th.stage) th.stage.stop(); });
    b.addEventListener('pointermove', (e) => { if (C.touch || C.T.calm) return; const r = b.getBoundingClientRect(); b.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg'); b.style.setProperty('--rx', -((e.clientY - r.top) / r.height - 0.5) * 8 + 'deg'); });
    return b;
  }
  function ensureThumb(th) {
    const r = th.cv.getBoundingClientRect();
    if (r.width < 10) return false;
    if (!th.stage) {
      th.stage = new Stage(th.cv, { post: false, dprMax: 1.25, lightRes: 0.35, minW: 900, darkMul: 0.72 });
      th.stage.grade = th.s.grade;
      const tb = th.s.thumb || { sc: th.s.beats[0].sc };
      th.stage.setScene(tb.sc, tb.set);
      if (tb.cam) { const c2 = th.stage.cam; if (tb.cam.x != null) c2.x = c2.tx = tb.cam.x; if (tb.cam.y != null) c2.y = c2.ty = tb.cam.y; if (tb.cam.z != null) c2.z = c2.tz = tb.cam.z; }
      th.stage.lvl = th.stage.lvlT = 0.3;
    } else th.stage.resize();
    if (!th.drawn) { for (let i = 0; i < 4; i++) th.stage.step(0.25); th.stage.render(); th.drawn = true; }
    return true;
  }
  const io = new IntersectionObserver((ents) => { ents.forEach((e) => { if (e.isIntersecting) { const th = thumbs.find((x) => x.cv === e.target); if (th) ensureThumb(th); } }); }, { rootMargin: '200px' });
  api.buildCards = () => {
    const home = $('#homeStories'), grid = $('#storyGrid');
    window.STORIES.forEach((s) => { home.appendChild(card(s)); grid.appendChild(card(s)); });
    thumbs.forEach((th) => io.observe(th.cv));
    if (C.touch) {
      let cur = null;
      const vis = new Map();
      const pickT = new IntersectionObserver((ents) => {
        ents.forEach((e) => vis.set(e.target, e.intersectionRatio));
        let best = null, br = 0.55;
        vis.forEach((r, cv) => { if (r > br) { br = r; best = cv; } });
        const th = best && thumbs.find((x) => x.cv === best);
        if (cur && cur !== th && cur.stage) cur.stage.stop();
        cur = th || null;
        if (cur && !(window.Theatre && Theatre.isOpen()) && ensureThumb(cur)) cur.stage.start();
      }, { threshold: [0, 0.3, 0.55, 0.8, 1] });
      thumbs.forEach((th) => pickT.observe(th.cv));
      C.on('theatre', (open) => { if (open && cur && cur.stage) cur.stage.stop(); });
    }
  };
  api.refreshThumbs = () => { thumbs.forEach((th) => { th.drawn = false; if (th.cv.getBoundingClientRect().width > 10) ensureThumb(th); }); };
  let rsT = 0; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(api.refreshThumbs, 300); });

  api.init = () => { heroInit(); applyCursor(); };
  return api;
})();
