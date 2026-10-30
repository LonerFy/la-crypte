/* Décors : Sleepy Hollow, Frankenstein, Le Masque de la Mort rouge, Bloody Mary. */
(function () {
  'use strict';
  const C = window.Crypte, P = window.Paint, H = window.SceneKit;
  const SC = window.SCENES;
  const TAU = Math.PI * 2;

  /* =====================================================================
     LA LÉGENDE DE SLEEPY HOLLOW
     ===================================================================== */
  function church(c, x, y, s, col, lit, t) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col;
    c.fillRect(-90, -120, 180, 120); c.beginPath(); c.moveTo(-100, -120); c.lineTo(0, -190); c.lineTo(100, -120); c.fill();
    c.fillRect(-26, -260, 52, 140); c.beginPath(); c.moveTo(-32, -260); c.lineTo(0, -360); c.lineTo(32, -260); c.fill();
    c.fillRect(-2, -390, 4, 34); c.fillRect(-12, -380, 24, 4);
    if (lit) { P.win(c, -60, -90, 22, 50, lit, t, '#ffc56a', { arch: true, frame: col }); P.win(c, 38, -90, 22, 50, lit, t, '#ffc56a', { arch: true, frame: col }); }
    c.restore();
  }
  function rider(c, x, y, s, ph, o) {
    o = o || {};
    P.horse(c, x, y, s, ph, o.horse || '#030203', { flip: o.flip });
    c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
    const bob = Math.sin(ph * 2) * 3;
    c.translate(0, bob);
    c.fillStyle = o.col || '#030203';
    if (o.headless) {
      c.beginPath(); c.moveTo(-26, -112); c.lineTo(26, -112); c.lineTo(30, -150); c.lineTo(36, -196); c.lineTo(-30, -196); c.lineTo(-24, -150); c.fill();
      c.beginPath(); c.moveTo(-30, -196); c.quadraticCurveTo(-90, -190 + Math.sin(ph * 3) * 10, -140, -150 + Math.sin(ph * 2.3) * 16); c.quadraticCurveTo(-90, -150, -24, -130); c.fill();
      c.fillRect(-10, -200, 22, 8);
      c.beginPath(); c.moveTo(30, -186); c.lineTo(66, -150); c.lineTo(60, -144); c.lineTo(24, -170); c.fill();
      if (o.head) P.pumpkin(c, 70, -116, 20, { lit: o.head, t: o.t, amb: 0.4 });
      c.lineWidth = 9; c.strokeStyle = o.col || '#030203'; c.beginPath(); c.moveTo(0, -112); c.lineTo(20, -70); c.lineTo(10, -40); c.stroke();
    } else {
      c.beginPath(); c.moveTo(-14, -110); c.lineTo(14, -110); c.lineTo(34, -190); c.lineTo(16, -196); c.fill();
      c.beginPath(); c.ellipse(34, -206, 11, 13, 0.3, 0, TAU); c.fill();
      c.fillRect(22, -222, 26, 4); c.fillRect(27, -240, 16, 18);
      c.beginPath(); c.moveTo(-14, -110); c.quadraticCurveTo(-60, -112 + Math.sin(ph * 3) * 8, -80, -96 + Math.sin(ph * 2.7) * 10); c.lineTo(-10, -126); c.fill();
      c.lineWidth = 5; c.strokeStyle = o.col || '#030203';
      c.beginPath(); c.moveTo(22, -180); c.lineTo(-4, -150); c.lineTo(52, -130); c.moveTo(0, -112); c.lineTo(34, -70); c.lineTo(20, -36); c.stroke();
    }
    c.restore();
  }
  SC['sh-valley'] = {
    focus: [800, 440], dark: 0.22, darkCol: '#0a0610', desat: 0.05,
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#140f2a'], [0.45, '#4a2a4c'], [0.68, '#c0603a'], [1, '#f0a050']]);
      P.glow(c, 1300, 560, 500, '#ffb060', 0.5);
      P.clouds(c, v, 150, 180, 0.35, t * 4, '#3a1a30');
      v = S.layer(0.25);
      P.ridge(c, v, 540, 50, 2.2, '#3a2440'); P.ridge(c, v, 570, 30, 5.1, '#2a1830');
      c.fillStyle = 'rgba(230,200,190,0.35)'; c.fillRect(v.x0, 560, 700 - v.x0, 4);
      v = S.layer(0.45);
      church(c, 1120, 580, 0.9, '#1a1018', 0.7, t);
      c.fillStyle = 'rgba(240,230,215,0.4)'; c.fillRect(1100, 260, 40, 150);
      [[820, 0.5], [920, 0.45], [1280, 0.5], [1400, 0.42]].forEach(([x, s]) => { c.save(); c.translate(x, 590); c.scale(s, s); c.fillStyle = '#1a1018'; c.fillRect(-80, -100, 160, 100); c.beginPath(); c.moveTo(-90, -100); c.lineTo(0, -160); c.lineTo(90, -100); c.fill(); P.win(c, -40, -70, 26, 34, 0.9, t, '#ffc56a', { frame: '#1a1018' }); c.restore(); });
      v = S.layer(0.7);
      c.fillStyle = '#2a1a14'; c.fillRect(v.x0, 600, v.x1 - v.x0, 400);
      c.strokeStyle = '#5a4424'; c.lineWidth = 3;
      for (let row = 0; row < 5; row++) for (let i = 0; i < 70; i++) { const x = v.x0 + i * 28 + (row % 2) * 14, y = 640 + row * 22, h = 50 + (i * 13 % 20); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(t + i) * 3, y - h); c.stroke(); c.beginPath(); c.moveTo(x, y - h * 0.5); c.lineTo(x + 10, y - h * 0.7); c.stroke(); }
      v = S.layer(1.15);
      c.fillStyle = '#1a0e08'; c.fillRect(v.x0, 740, v.x1 - v.x0, 400);
      c.save(); c.translate(380, 760); c.fillStyle = '#120806'; c.fillRect(-4, -230, 8, 230); c.fillRect(-80, -180, 160, 8);
      c.beginPath(); c.moveTo(-60, -176); c.lineTo(60, -176); c.lineTo(50, -100); c.lineTo(-50, -100); c.fill();
      c.beginPath(); c.ellipse(0, -205, 20, 24, 0, 0, TAU); c.fill(); c.fillRect(-36, -226, 72, 6); c.beginPath(); c.moveTo(-18, -226); c.lineTo(0, -262); c.lineTo(18, -226); c.fill();
      c.beginPath(); c.moveTo(-80, -180); c.lineTo(-96, -150); c.lineTo(-74, -170); c.moveTo(80, -180); c.lineTo(98, -146); c.lineTo(74, -170); c.fill(); c.restore();
      const r = C.seeded(31);
      for (let i = 0; i < 16; i++) { const x = 200 + i * 90 + r() * 40, y = 780 + r() * 70; if (x > 300 && x < 460) continue; P.pumpkin(c, x, y, 26 + r() * 20, { amb: 0.65, face: 'none' }); }
      P.parts(c, st, 'ff', 'fireflies', 26, v, dt, t);
    }
  };

  SC['sh-party'] = {
    focus: [800, 440], dark: 0.72, darkCol: '#05030a', desat: 0.05,
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#05040c'], [1, '#1a1428']]);
      P.stars(c, v, t, 140, 0.9, 61, 420);
      P.moon(c, 300, 150, 48, '#f0e6d0', { halo: 1 });
      v = S.layer(0.35);
      P.ridge(c, v, 600, 30, 7, '#07060a');
      P.tree(c, 180, 620, 480, 71, '#030203', t, 1); P.tree(c, 1420, 620, 420, 72, '#030203', t, 1);
      v = S.layer(0.7);
      c.fillStyle = '#2a0f0a'; c.fillRect(480, 330, 640, 320);
      c.fillStyle = '#1a0806'; c.beginPath(); c.moveTo(460, 334); c.lineTo(800, 160); c.lineTo(1140, 334); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 2; for (let x = 490; x < 1120; x += 22) { c.beginPath(); c.moveTo(x, 334); c.lineTo(x, 650); c.stroke(); }
      const g = c.createLinearGradient(0, 420, 0, 650); g.addColorStop(0, '#ffa040'); g.addColorStop(1, '#ffd890');
      c.fillStyle = g; c.fillRect(640, 420, 320, 230);
      for (let i = 0; i < 6; i++) {
        const bx = 680 + i * 50 + Math.sin(t * 2.2 + i) * 18, by = 650 + Math.abs(Math.sin(t * 4.4 + i)) * -8;
        P.fig(c, bx - 7, by, 150, 'man', { col: '#3a1408', raise: 20 }); P.fig(c, bx + 9, by, 140, 'woman', { col: '#3a1408', raise: 25 });
      }
      c.save(); c.translate(900, 650); c.fillStyle = '#3a1408'; c.fillRect(-18, -50, 36, 50); P.fig(c, 0, -50, 120, 'man', { col: '#3a1408', raise: 30, reach: 10 });
      c.strokeStyle = '#3a1408'; c.lineWidth = 2; c.beginPath(); c.moveTo(10, -140); c.lineTo(10 + Math.sin(t * 9) * 30, -120); c.stroke(); c.restore();
      c.fillStyle = '#1a0806'; c.fillRect(560, 420, 80, 230); c.fillRect(960, 420, 80, 230);
      c.save(); c.translate(600, 420); c.rotate(-0.3); c.fillStyle = '#2a0f0a'; c.fillRect(-150, 0, 150, 230); c.restore();
      c.save(); c.translate(1000, 420); c.rotate(0.3); c.fillStyle = '#2a0f0a'; c.fillRect(0, 0, 150, 230); c.restore();
      c.strokeStyle = '#100604'; c.lineWidth = 2; c.beginPath(); c.moveTo(470, 340); c.quadraticCurveTo(800, 420, 1130, 340); c.stroke();
      for (let i = 0; i < 11; i++) { const k = i / 10, x = 470 + k * 660, y = 340 + Math.sin(k * Math.PI) * 80 + 8 + Math.sin(t * 2 + i) * 3; c.fillStyle = '#ffcf6a'; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); P.glow(c, x, y, 30, '#ffb04a', 0.5); }
      v = S.layer(1.1);
      c.fillStyle = '#0a0604'; c.fillRect(v.x0, 660, v.x1 - v.x0, 400);
      [[560, 700, 30], [610, 720, 24], [1040, 705, 32]].forEach(([x, y, r], i) => P.pumpkin(c, x, y, r, { lit: 1, t: t + i, amb: 0.5, seed: i }));
      c.fillStyle = '#2a1a08'; c.beginPath(); c.ellipse(300, 720, 90, 60, 0, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(1300, 730, 110, 70, 0, Math.PI, 0); c.fill();
    },
    lights() { return [{ x: 800, y: 540, r: 620, i: 1, c: '#ffa040', d: 0.7, g: 0.3 }, { x: 600, y: 680, r: 200, i: 0.7, c: '#ff8a1e', d: 1.1 }, { x: 1040, y: 680, r: 200, i: 0.7, c: '#ff8a1e', d: 1.1 }, { x: 300, y: 150, r: 900, i: 0.35, c: '#d8d0e8', d: 0.05 }]; }
  };

  SC['sh-road'] = {
    focus: [800, 430], dark: 0.72, darkCol: '#02030a', desat: 0.25,
    init(st) { st.white = 0.6; st.shape = 0; },
    hot: { white: { x: 600, y: 300, r: 90 } },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#03040a'], [1, '#121a2c']]);
      P.stars(c, v, t, 90, 0.7, 81, 400);
      P.moon(c, 1160, 170, 54, '#e8eaf2', { halo: 1 });
      v = S.layer(0.4);
      for (let i = 0; i < 12; i++) P.tree(c, v.x0 + i * 170, 590, 360 + (i * 47 % 120), 90 + i, '#04050a', t, 1);
      c.fillStyle = '#05060a'; c.fillRect(v.x0, 580, v.x1 - v.x0, 400);
      P.fog(c, v, 500, 140, 0.45, t * 6, '#7a84a0');
      v = S.layer(0.75);
      c.fillStyle = '#1a1a1e'; c.beginPath(); c.moveTo(780, 580); c.lineTo(820, 580); c.lineTo(1160, v.y1 + 10); c.lineTo(440, v.y1 + 10); c.fill();
      if (st.shape > 0.01) { c.globalAlpha = st.shape; rider(c, 1190, 650, 0.9, 0, { headless: true, flip: true, col: '#010102', horse: '#010102' }); c.globalAlpha = 1; }
      const tree = P.tree(c, 400, 640, 820, 133, '#020206', t, 0.6);
      if (st.white > 0.01) {
        const sw = Math.sin(t * 0.9) * 0.08;
        c.save(); c.translate(600, 230); c.rotate(sw); c.fillStyle = C.rgba('#cfd2d8', st.white);
        c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-18, 60, -10, 140); c.lineTo(10, 150); c.quadraticCurveTo(16, 70, 8, 0); c.fill(); c.restore();
      }
      const ob = Math.sin(t * 0.7) > -0.9 ? 1 : 0; P.glow(c, 1300, 320, 20, '#f0e070', 0.4 * ob); c.fillStyle = C.rgba('#ffee80', ob); c.fillRect(1292, 318, 5, 4); c.fillRect(1304, 318, 5, 4);
      P.tree(c, 1320, 640, 600, 140, '#020206', t, 0.6);
      P.fog(c, v, 600, 160, 0.3, -t * 9, '#6a748e');
      v = S.layer(1.2);
      c.save(); c.translate(800, 860); const ph = t * 3.2, bob = Math.abs(Math.sin(ph)) * 6; c.translate(0, -bob); c.fillStyle = '#020203';
      c.beginPath(); c.ellipse(0, -110, 70, 60, 0, 0, TAU); c.fill();
      c.lineWidth = 16; c.strokeStyle = '#020203'; c.beginPath(); c.moveTo(-40, -70); c.lineTo(-44 + Math.sin(ph) * 10, 10); c.moveTo(40, -70); c.lineTo(44 - Math.sin(ph) * 10, 10); c.stroke();
      c.beginPath(); c.moveTo(-6, -120); c.quadraticCurveTo(-20 + Math.sin(t * 2) * 10, -40, -4, 0); c.lineWidth = 12; c.stroke();
      c.beginPath(); c.moveTo(-24, -160); c.lineTo(24, -160); c.lineTo(14, -330); c.lineTo(-14, -330); c.fill();
      c.lineWidth = 9; c.beginPath(); c.moveTo(-14, -300); c.lineTo(-62, -250); c.lineTo(-30, -200); c.moveTo(14, -300); c.lineTo(62, -250); c.lineTo(30, -200); c.stroke();
      c.beginPath(); c.ellipse(0, -350, 18, 22, 0, 0, TAU); c.fill(); c.fillRect(-28, -372, 56, 6); c.fillRect(-18, -404, 36, 32);
      c.restore();
    },
    lights() { return [{ x: 1160, y: 170, r: 1200, i: 0.45, c: '#c8d0e8', d: 0.05, g: 0.06 }]; }
  };

  SC['sh-rider'] = {
    focus: [760, 610], dark: 0.55, darkCol: '#02030a', desat: 0.2,
    init(st) { st.gap = 0.8; st.reveal = 0; st.speed = 1; },
    draw(S, st, t, dt) {
      const c = S.ctx; st.run = (st.run || 0) + dt * 420 * st.speed;
      let v = S.layer(0.05);
      P.sky(c, v, [[0, '#03040a'], [1, '#1a2034']]);
      P.stars(c, v, t, 80, 0.7, 91, 400);
      P.moon(c, 1240, 170, 70, '#eceef4', { halo: 1.2 });
      v = S.layer(0.2);
      c.save(); c.translate(-(st.run * 0.08) % 1600, 0); P.ridge(c, { x0: v.x0, x1: v.x1 + 1700, y1: v.y1 }, 600, 70, 3, '#0a0d16'); c.restore();
      v = S.layer(0.5);
      const W = v.x1 - v.x0 + 600;
      for (let i = 0; i < 8; i++) { const x = v.x0 - 300 + ((i * 320 - st.run * 0.45) % W + W) % W; P.tree(c, x, 640, 380 + (i * 37 % 100), 150 + i, '#03040a', t, 0); }
      c.fillStyle = '#05060a'; c.fillRect(v.x0, 630, v.x1 - v.x0, 400);
      v = S.layer(0.85);
      c.fillStyle = '#1a1a1e'; c.fillRect(v.x0, 700, v.x1 - v.x0, 90);
      c.fillStyle = '#0a0a0c'; c.fillRect(v.x0, 790, v.x1 - v.x0, 400);
      const ph = t * 13 * st.speed;
      const hx = 520 - st.gap * 320, ix = 960;
      rider(c, ix, 760, 0.95, ph, { col: '#020203' });
      rider(c, hx, 770, 1.12, ph + 1.3, { headless: true, head: st.reveal, t, col: '#000', horse: '#000' });
      c.fillStyle = C.rgba('#ff2a10', 0.9); c.fillRect(hx + 1.12 * 92, 770 - 1.12 * 138 + Math.sin((ph + 1.3) * 2) * 3, 5, 3);
      P.parts(c, st, 'dust', 'ash', 40, { x0: hx - 100, x1: ix + 100, y0: 640, y1: 800 }, dt, t, { col: '#5a5a62' });
      v = S.layer(1.4);
      for (let i = 0; i < 4; i++) { const x = v.x0 - 200 + ((i * 600 - st.run * 1.6) % (W + 800) + W + 800) % (W + 800); c.fillStyle = '#010102'; c.fillRect(x, v.y0 - 20, 60, v.y1 - v.y0 + 40); }
      S.shake = Math.max(S.shake, 0.08 * st.speed);
    },
    lights(st) { const hx = 520 - st.gap * 320; return [{ x: 1240, y: 170, r: 1300, i: 0.5, c: '#c8d0e8', d: 0.05, g: 0.05 }, { x: hx + 70, y: 640, r: 260, i: st.reveal * 0.9, c: '#ff8a1e', d: 0.85, g: 0.3 }]; }
  };

  SC['sh-bridge'] = {
    focus: [760, 440], dark: 0.72, darkCol: '#02030a', desat: 0.2,
    init(st) { st.rear = 0; st.flee = 0; st.throw = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#03040a'], [1, '#141a2c']]);
      P.stars(c, v, t, 80, 0.7, 101, 400);
      v = S.layer(0.4);
      P.ridge(c, v, 590, 30, 2, '#05060c');
      church(c, 1330, 600, 1.0, '#05060c', 0.5, t);
      P.tree(c, 200, 620, 460, 171, '#030308', t, 1);
      v = S.layer(0.75);
      const g = c.createLinearGradient(0, 640, 0, 900); g.addColorStop(0, '#0e1420'); g.addColorStop(1, '#03050a'); c.fillStyle = g; c.fillRect(v.x0, 640, v.x1 - v.x0, 400);
      c.fillStyle = '#0a0806'; c.fillRect(v.x0, 600, 470 - v.x0, 50); c.fillRect(1030, 600, v.x1 - 1030, 50);
      c.fillStyle = '#16100a'; c.fillRect(440, 600, 620, 22);
      for (let i = 0; i < 9; i++) { c.fillRect(450 + i * 75, 540, 10, 120); }
      c.fillRect(440, 548, 620, 8);
      P.reflect(S, 650, 0.75, 0.45, t, '#03050a', 200);
      P.fog(c, v, 600, 120, 0.4, t * 7, '#7a84a0');
      const k = C.clamp(st.flee, 0, 1);
      rider(c, 1050 + k * 400, 610, 0.55 - k * 0.15, t * 14, { col: '#020203' });
      const rr = C.clamp(st.rear, 0, 1);
      c.save(); c.translate(640, 604); c.rotate(-rr * 0.55); rider(c, 0, 0, 0.9, rr > 0 ? t * 6 : t * 10, { headless: true, head: st.throw > 0.05 ? 0 : 1, t, col: '#000', horse: '#000' }); c.restore();
      if (st.throw > 0.05 && st.throw < 1) {
        st.throw = Math.min(1, st.throw + dt / 0.9);
        const p = st.throw, x = C.lerp(700, 820, p), y = C.lerp(380, 520, p) - Math.sin(p * Math.PI) * 160, R = 20 + C.easeIn(p) * 260;
        P.pumpkin(c, x, y + R * 0.8, R, { lit: 1, t, amb: 0.5, mouth: 0.3 });
        P.parts(c, st, 'emb', 'embers', 30, { x0: x - R, x1: x + R, y0: y - R * 2, y1: y + R }, dt, t);
      }
    },
    lights(st) { return [{ x: 680, y: 470, r: 360, i: st.throw > 0.05 ? 0.3 : 0.8, c: '#ff8a1e', d: 0.75, g: 0.25 }, { x: 1330, y: 520, r: 200, i: 0.5, c: '#ffc56a', d: 0.4 }]; }
  };

  SC['sh-morning'] = {
    focus: [800, 470], dark: 0.05, darkCol: '#101418', desat: 0.4,
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#9aa4ae'], [1, '#e2dcd0']]);
      v = S.layer(0.4);
      for (let i = 0; i < 9; i++) P.tree(c, v.x0 + i * 220, 600, 340, 190 + i, '#6a6e70', t, 0.5);
      P.fog(c, v, 380, 320, 0.7, t * 5, '#e8e6e0');
      v = S.layer(0.8);
      c.fillStyle = '#5a5a4a'; c.fillRect(v.x0, 620, v.x1 - v.x0, 400);
      c.fillStyle = '#8a8070'; c.beginPath(); c.moveTo(700, 620); c.lineTo(900, 620); c.lineTo(1200, v.y1 + 10); c.lineTo(400, v.y1 + 10); c.fill();
      c.fillStyle = '#4a3a2a'; for (let i = 0; i < 12; i++) { c.fillRect(1000 + i * 70, 560, 8, 80); } c.fillRect(1000, 580, 800, 6); c.fillRect(1000, 610, 800, 6);
      P.horse(c, 1300, 640, 0.6, 0, '#3a3836', { still: true, flip: true });
      c.fillStyle = 'rgba(40,30,20,0.4)'; for (let i = 0; i < 10; i++) { c.beginPath(); c.ellipse(860 - i * 30 + (i % 2) * 20, 640 + i * 26, 8, 5, 0, 0, TAU); c.fill(); }
      v = S.layer(1);
      c.fillStyle = '#0c0a0a'; c.beginPath(); c.ellipse(760, 740, 70, 16, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(712, 740); c.quadraticCurveTo(710, 680, 760, 676); c.quadraticCurveTo(810, 680, 808, 740); c.fill();
      [[860, 760, 0.3], [900, 740, -0.6], [830, 780, 1.2], [930, 775, 2], [880, 790, -1.4]].forEach(([x, y, a], i) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#c4601a'; c.beginPath(); c.moveTo(-26, 0); c.quadraticCurveTo(0, -24 - i * 3, 26, 0); c.lineTo(10, 8); c.lineTo(-12, 6); c.fill(); c.fillStyle = '#e8b060'; c.fillRect(-14, 0, 28, 4); c.restore(); });
      P.fog(c, v, 600, 220, 0.4, -t * 6, '#f0eee8');
    }
  };

  /* =====================================================================
     FRANKENSTEIN
     ===================================================================== */
  function aurora(c, v, t, a) {
    const op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) {
      const x = v.x0 + (i / 70) * (v.x1 - v.x0), y = 120 + Math.sin(x * 0.004 + t * 0.25) * 70 + Math.sin(x * 0.011 - t * 0.4) * 30;
      const h = 220 + Math.sin(x * 0.02 + t) * 60;
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, 'rgba(160,60,200,0)'); g.addColorStop(0.3, C.rgba('#5aff9a', 0.12 * a)); g.addColorStop(1, 'rgba(40,255,140,0)');
      c.fillStyle = g; c.fillRect(x, y, (v.x1 - v.x0) / 70 + 2, h);
    }
    c.globalCompositeOperation = op;
  }
  function ice(c, v, y, t, col) {
    const g = c.createLinearGradient(0, y, 0, v.y1); g.addColorStop(0, col || '#9ab0c4'); g.addColorStop(1, '#2a3a4a');
    c.fillStyle = g; c.fillRect(v.x0, y, v.x1 - v.x0, v.y1 - y + 20);
    const r = C.seeded(77);
    c.fillStyle = 'rgba(220,235,250,0.45)';
    for (let i = 0; i < 26; i++) { const x = v.x0 + r() * (v.x1 - v.x0), yy = y + 10 + r() * 300, w = 40 + r() * 120; c.beginPath(); c.moveTo(x - w, yy); c.lineTo(x - w * 0.3, yy - 20 - r() * 40); c.lineTo(x + w * 0.2, yy - 10); c.lineTo(x + w * 0.5, yy - 30 - r() * 30); c.lineTo(x + w, yy); c.fill(); }
    c.strokeStyle = 'rgba(10,20,40,0.5)'; c.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const x = v.x0 + r() * (v.x1 - v.x0), yy = y + 20 + r() * 260; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + 40 + r() * 60, yy + 8 + r() * 20); c.lineTo(x + 90 + r() * 80, yy + r() * 10); c.stroke(); }
  }
  function ship(c, x, y, s, col, lit, t) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col;
    c.beginPath(); c.moveTo(-180, -30); c.lineTo(190, -40); c.lineTo(150, 20); c.lineTo(-150, 20); c.fill();
    [[-80, 240], [40, 280], [140, 200]].forEach(([mx, mh]) => { c.fillRect(mx - 4, -30 - mh, 8, mh); c.fillRect(mx - 60, -30 - mh * 0.75, 120, 5); c.fillRect(mx - 46, -30 - mh * 0.45, 92, 5); });
    c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(-80, -270); c.lineTo(-180, -30); c.moveTo(40, -310); c.lineTo(190, -40); c.stroke();
    if (lit) P.win(c, -120, -24, 22, 14, lit, t, '#ffc56a', { frame: col, steady: true });
    c.restore();
  }
  SC['fr-arctic'] = {
    focus: [800, 430], dark: 0.35, darkCol: '#020812', desat: 0.2,
    init(st) { st.sled = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#02040c'], [1, '#0c1828']]);
      P.stars(c, v, t, 160, 0.9, 111, 480);
      aurora(c, v, t, 1);
      v = S.layer(0.4);
      ice(c, v, 560, t);
      ship(c, 1180, 600, 0.75, '#060a12', 0.6, t);
      st.sled = Math.min(1, st.sled + dt / 40);
      const sx = 200 + st.sled * 600;
      c.fillStyle = '#04070c';
      for (let i = 0; i < 6; i++) { const dx = sx + 40 + i * 22, dy = 590 + Math.abs(Math.sin(t * 8 + i)) * -3; c.beginPath(); c.ellipse(dx, dy, 9, 4, 0, 0, TAU); c.fill(); }
      c.fillRect(sx - 30, 586, 50, 8); P.fig(c, sx - 8, 588, 60, 'giant', { col: '#04070c' });
      P.fog(c, v, 520, 120, 0.35, t * 8, '#b8cce0');
      v = S.layer(1.1);
      ice(c, v, 780, t, '#c8d8e8');
      P.parts(c, st, 'snow', 'snow', 70, v, dt, t, { col: '#ffffff', wind: 0.08 });
    },
    lights() { return [{ x: 800, y: 200, r: 1400, i: 0.5, c: '#5aff9a', d: 0.05, g: 0.04 }, { x: 1090, y: 585, r: 90, i: 0.6, c: '#ffc56a', d: 0.4 }]; }
  };

  SC['fr-lab'] = {
    focus: [800, 440], dark: 0.78, darkCol: '#02030a', desat: 0.2, storm: true, ownBolt: true, boltX: 800, boltY: 520,
    init(st) { st.lever = 0; st.power = 0; st.hand = 0; st.candle = 1; },
    draw(S, st, t, dt) {
      const c = S.ctx; S.layer(0.5);
      const R = H.room(S, { wall: '#1e1c1e', floor: '#141010', side: '#161416', by0: 70 });
      H.stormWin(S, c, 690, 140, 220, 380, t, { gothic: true });
      c.fillStyle = '#070606'; for (let i = 0; i < 5; i++) { c.save(); c.translate(330 + i * 240, 70); c.rotate(0.08); c.fillRect(-10, 0, 20, 140); c.restore(); }
      c.fillRect(330, 70, 940, 16);
      S.layer(0.8);
      c.fillStyle = '#120c08'; c.fillRect(340, 220, 200, 12); c.fillRect(340, 330, 200, 12); c.fillRect(340, 440, 200, 12);
      const r = C.seeded(5);
      [220, 330, 440].forEach((y) => { for (let i = 0; i < 5; i++) { const x = 350 + i * 38, h = 40 + r() * 40; c.fillStyle = 'rgba(80,140,90,0.45)'; c.fillRect(x, y - h, 28, h); c.fillStyle = 'rgba(180,220,190,0.25)'; c.fillRect(x + 3, y - h + 4, 4, h - 8); c.fillStyle = '#2a2a2a'; c.fillRect(x - 2, y - h - 6, 32, 6); if (r() < 0.5) { c.fillStyle = 'rgba(200,190,160,0.5)'; c.beginPath(); c.arc(x + 14, y - h / 2, 8, 0, TAU); c.fill(); } } });
      [[460, 640], [1150, 640]].forEach(([x, y]) => {
        c.fillStyle = '#1a1410'; c.fillRect(x - 30, y - 300, 60, 300);
        c.fillStyle = '#7a4a1a'; for (let k = 0; k < 24; k++) c.fillRect(x - 32, y - 290 + k * 11, 64, 5);
        c.fillStyle = '#3a3a3e'; c.beginPath(); c.arc(x, y - 312, 26, 0, TAU); c.fill();
      });
      c.fillStyle = '#0c0a08'; c.fillRect(1250, 360, 70, 120); c.fillStyle = '#2a2a2e'; c.fillRect(1260, 370, 50, 100);
      c.save(); c.translate(1285, 420); c.rotate(-1.0 + st.lever * 2.0); c.fillStyle = '#6a6a70'; c.fillRect(-5, -90, 10, 90); c.fillStyle = '#a01010'; c.beginPath(); c.arc(0, -94, 12, 0, TAU); c.fill(); c.restore();
      c.strokeStyle = '#0a0808'; c.lineWidth = 6; c.beginPath(); c.moveTo(1250, 440); c.quadraticCurveTo(1180, 600, 1150, 340); c.moveTo(490, 330); c.quadraticCurveTo(560, 560, 640, 590); c.stroke();
      S.layer(1);
      c.fillStyle = '#100c09'; c.fillRect(560, 590, 500, 20); c.fillRect(580, 610, 18, 120); c.fillRect(1022, 610, 18, 120);
      c.fillStyle = '#d8d4c8'; c.beginPath(); c.moveTo(570, 590); c.quadraticCurveTo(600, 540, 650, 548); c.quadraticCurveTo(700, 520, 760, 552); c.quadraticCurveTo(860, 530, 960, 556); c.quadraticCurveTo(1020, 550, 1050, 590); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(570, 590); c.quadraticCurveTo(800, 575, 1050, 590); c.lineTo(1050, 596); c.lineTo(570, 596); c.fill();
      if (st.hand > 0.01) {
        const tw = Math.sin(t * 23) * 0.15 * st.hand * (S.flash + st.power);
        c.save(); c.translate(1040, 592); c.rotate(0.3 + tw); c.fillStyle = '#b8b890'; c.fillRect(-8, 0, 16, 70 * st.hand); c.beginPath(); c.ellipse(0, 70 * st.hand + 12, 14, 18, 0, 0, TAU); c.fill();
        c.strokeStyle = '#2a2a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, 30 * st.hand); c.lineTo(8, 32 * st.hand); c.stroke(); c.restore();
      }
      if (st.power > 0.02) {
        c.save(); c.lineCap = 'round'; c.shadowColor = '#9fe6f5'; c.shadowBlur = 20;
        [[460, 328, 640, 570], [1150, 328, 980, 570], [460, 328, 1150, 328]].forEach(([x0, y0, x1, y1], i) => {
          if (Math.random() > 0.35 + st.power * 0.6) return;
          c.strokeStyle = C.rgba('#e8fbff', 0.9 * st.power); c.lineWidth = 2 + st.power * 2;
          c.beginPath(); c.moveTo(x0, y0); for (let k = 1; k < 10; k++) { const p = k / 10; c.lineTo(C.lerp(x0, x1, p) + (Math.random() - 0.5) * 40, C.lerp(y0, y1, p) + (Math.random() - 0.5) * 40); } c.lineTo(x1, y1); c.stroke();
        });
        c.restore();
      }
      c.fillStyle = '#0d0907'; c.fillRect(260, 640, 140, 14);
      P.candle(c, 330, 640, 50 + 40 * st.candle, t, 0.4 + 0.6 * st.candle, 4);
    },
    lights(st, S) { return [{ x: 330, y: 560, r: 300 + 200 * st.candle, i: 0.5 + 0.5 * st.candle, c: '#ffcf86', g: 0.2 }, { x: 800, y: 420, r: 700, i: st.power * 0.8 + S.flash * 0.5, c: '#9fe6f5', g: 0.2 }, { x: 800, y: 300, r: 400, i: 0.2 + S.flash * 0.6, c: '#b8c8ff', d: 0.5 }]; }
  };

  SC['fr-eye'] = {
    focus: [800, 450], dark: 0.55, darkCol: '#030402', desat: 0.15, storm: true, ownBolt: true,
    init(st) { st.open = 0; },
    draw(S, st, t) {
      const c = S.ctx; const v = S.layer(0.9);
      const g = c.createRadialGradient(800, 450, 50, 800, 450, 900); g.addColorStop(0, '#8a8a5a'); g.addColorStop(0.6, '#4a4a30'); g.addColorStop(1, '#141408');
      c.fillStyle = g; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      c.save(); c.globalAlpha = 0.6; c.drawImage(P.tint(P.gritTex(), '#1a1a08'), v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); c.restore();
      c.fillStyle = '#141408'; c.beginPath(); c.moveTo(380, 250); c.quadraticCurveTo(800, 150, 1220, 270); c.lineTo(1220, 300); c.quadraticCurveTo(800, 200, 380, 290); c.fill();
      c.strokeStyle = '#2a1a10'; c.lineWidth = 6; c.beginPath(); c.moveTo(300, 620); c.quadraticCurveTo(700, 700, 1300, 600); c.stroke();
      c.lineWidth = 3; for (let i = 0; i < 16; i++) { const x = 340 + i * 60, y = 630 + Math.sin(i * 0.5) * 20 + (i > 6 ? -10 : 0); c.beginPath(); c.moveTo(x - 10, y - 16); c.lineTo(x + 10, y + 16); c.stroke(); }
      const o = C.clamp(st.open, 0, 1), W = 560, Hh = 150 * o + 2;
      c.save(); c.beginPath(); c.moveTo(800 - W / 2, 440); c.quadraticCurveTo(800, 440 - Hh * 1.6, 800 + W / 2, 440); c.quadraticCurveTo(800, 440 + Hh * 1.4, 800 - W / 2, 440); c.clip();
      const sg = c.createRadialGradient(800, 440, 20, 800, 440, 300); sg.addColorStop(0, '#d8d0a0'); sg.addColorStop(1, '#6a6a3a'); c.fillStyle = sg; c.fillRect(500, 280, 600, 320);
      c.strokeStyle = 'rgba(140,30,20,0.5)'; c.lineWidth = 1.5; const r = C.seeded(17); for (let i = 0; i < 20; i++) { const a = r() * TAU; c.beginPath(); c.moveTo(800 + Math.cos(a) * 80, 440 + Math.sin(a) * 60); c.lineTo(800 + Math.cos(a) * 260, 440 + Math.sin(a) * 140); c.stroke(); }
      const ig = c.createRadialGradient(800, 440, 10, 800, 440, 80); ig.addColorStop(0, '#2a2008'); ig.addColorStop(0.3, '#b89a20'); ig.addColorStop(1, '#5a4a10'); c.fillStyle = ig; c.beginPath(); c.arc(800 + Math.sin(t * 0.7) * 6, 440, 80, 0, TAU); c.fill();
      c.fillStyle = '#0a0802'; c.beginPath(); c.arc(800 + Math.sin(t * 0.7) * 6, 440, 22, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,240,0.6)'; c.beginPath(); c.ellipse(770, 410, 16, 10, -0.5, 0, TAU); c.fill();
      c.restore();
      c.strokeStyle = '#141008'; c.lineWidth = 8; c.beginPath(); c.moveTo(800 - W / 2, 440); c.quadraticCurveTo(800, 440 - Hh * 1.6, 800 + W / 2, 440); c.stroke();
      c.lineWidth = 3; for (let i = 0; i < 14; i++) { const p = 0.1 + i / 16, x = 800 - W / 2 + p * W, y = 440 - Hh * 1.6 * 2 * p * (1 - p) * 2 * 0.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6 + i, y - 22); c.stroke(); }
      if (S.flash > 0.1) { c.fillStyle = C.rgba('#e8f0ff', S.flash * 0.25); c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); }
    },
    lights(st, S) { return [{ x: 800, y: 420, r: 700, i: 0.6 + S.flash * 0.4, c: '#ffcf86', g: 0.08 }]; }
  };

  SC['fr-forest'] = {
    focus: [800, 440], dark: 0.66, darkCol: '#020610', desat: 0.25,
    init(st) { st.watch = 0; st.burn = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#02040c'], [1, '#121c30']]);
      P.stars(c, v, t, 100, 0.8, 121, 380);
      P.moon(c, 1250, 140, 50, '#eef2fa', { halo: 1 });
      v = S.layer(0.35);
      for (let i = 0; i < 24; i++) P.pine(c, v.x0 + i * 80, 600, 180 + (i * 41 % 80), '#06101c', 'rgba(220,235,250,0.5)');
      c.fillStyle = '#c0cfe0'; c.fillRect(v.x0, 590, v.x1 - v.x0, 400);
      v = S.layer(0.7);
      const b = C.clamp(st.burn, 0, 1);
      c.fillStyle = '#1a120c'; c.fillRect(940, 520, 240, 130);
      c.fillStyle = '#e8f0f8'; c.beginPath(); c.moveTo(920, 524); c.lineTo(1060, 430); c.lineTo(1200, 524); c.fill();
      c.fillStyle = '#100a06'; c.fillRect(1120, 430, 26, 60);
      P.win(c, 980, 560, 50, 40, 0.9, t, '#ffb050', { frame: '#1a120c' });
      if (!b) P.clouds(c, { x0: 1080, x1: 1200 }, 280 - (t * 20 % 140), 160, 0.2, t * 5, '#8a96a8');
      if (b > 0) { for (let i = 0; i < 8; i++) { const x = 930 + i * 34, hh = b * (80 + 50 * Math.sin(t * 6 + i)); const g = c.createLinearGradient(0, 520, 0, 520 - hh); g.addColorStop(0, '#fff0a0'); g.addColorStop(0.4, '#ff8a20'); g.addColorStop(1, 'rgba(200,40,0,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 24, 530); c.quadraticCurveTo(x + Math.sin(t * 7 + i) * 14, 520 - hh * 0.6, x, 520 - hh); c.quadraticCurveTo(x + 20, 520 - hh * 0.5, x + 24, 530); c.fill(); } P.parts(c, st, 'emb', 'embers', 40, { x0: 900, x1: 1220, y0: 200, y1: 560 }, dt, t); }
      P.pine(c, 1300, 640, 300, '#040a14', 'rgba(220,235,250,0.6)');
      v = S.layer(1.1);
      const wx = C.lerp(470, 560, C.clamp(st.watch, 0, 1));
      P.fig(c, wx, 720, 330, 'giant', { col: '#020408', eyes: st.watch * 0.7 });
      P.pine(c, 440, 740, 520, '#020408', 'rgba(220,235,250,0.6)');
      c.fillStyle = '#d8e4f0'; c.fillRect(v.x0, 720, v.x1 - v.x0, 400);
      P.parts(c, st, 'snow', 'snow', 120, v, dt, t, { col: '#ffffff', wind: 0.03 });
    },
    lights(st) { return [{ x: 1005, y: 580, r: 300, i: 0.8, c: '#ffb050', d: 0.7 }, { x: 1250, y: 140, r: 1200, i: 0.4, c: '#c8d4ec', d: 0.05 }, { x: 1060, y: 480, r: 700, i: st.burn * 0.9, c: '#ff7a2a', d: 0.7, g: 0.3 }]; }
  };

  SC['fr-mont'] = {
    focus: [800, 440], dark: 0.15, darkCol: '#0a1018', desat: 0.4,
    init(st) { st.leap = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#7a8898'], [1, '#c8d0d8']]);
      P.clouds(c, v, 40, 260, 0.5, t * 6, '#e8ecf0');
      v = S.layer(0.2);
      c.fillStyle = '#e8eef4'; c.beginPath(); c.moveTo(v.x0, 520); c.lineTo(300, 300); c.lineTo(520, 380); c.lineTo(800, 120); c.lineTo(1060, 340); c.lineTo(1300, 240); c.lineTo(v.x1, 480); c.lineTo(v.x1, 600); c.lineTo(v.x0, 600); c.fill();
      c.fillStyle = '#7a8a9a'; c.beginPath(); c.moveTo(800, 120); c.lineTo(860, 300); c.lineTo(820, 260); c.lineTo(780, 400); c.lineTo(740, 300); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(300, 300); c.lineTo(360, 420); c.lineTo(320, 380); c.lineTo(280, 460); c.fill();
      v = S.layer(0.6);
      const g = c.createLinearGradient(0, 560, 0, 900); g.addColorStop(0, '#c8d8e8'); g.addColorStop(1, '#7a92a8'); c.fillStyle = g; c.fillRect(v.x0, 560, v.x1 - v.x0, 400);
      c.strokeStyle = 'rgba(20,40,70,0.55)'; c.lineWidth = 4;
      for (let i = 0; i < 12; i++) { const x = v.x0 + i * 160; c.beginPath(); c.moveTo(x, 900); c.quadraticCurveTo(800 + (x - 800) * 0.4, 700, 800 + (x - 800) * 0.15, 580); c.stroke(); }
      P.fog(c, v, 500, 200, 0.55, t * 10, '#eef2f6');
      const k = C.clamp(st.leap, 0, 1), s = 0.25 + k * 0.85;
      const fx = C.lerp(1300, 940, k), fy = C.lerp(600, 740, k) - Math.abs(Math.sin(k * Math.PI * 3)) * 80 * (1 - k * 0.5);
      if (k > 0.001) P.fig(c, fx, fy, 300 * s, 'giant', { col: '#14181e', reach: 10, raise: 20, raiseR: 30 });
      v = S.layer(1.3);
      P.fig(c, 560, 860, 300, 'man', { col: '#0c0f14' });
      P.parts(c, st, 'snow', 'snow', 60, v, dt, t, { col: '#ffffff', wind: 0.12 });
    }
  };

  SC['fr-orkney'] = {
    focus: [800, 430], dark: 0.86, darkCol: '#02040a', desat: 0.3,
    init(st) { st.face = 0; st.torn = 0; },
    draw(S, st, t) {
      const c = S.ctx; let v = S.layer(0.5);
      H.stone(c, v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0, '#26282a', 70, 40);
      c.fillStyle = '#0a1220'; c.fillRect(960, 200, 240, 220);
      const g = c.createLinearGradient(0, 200, 0, 420); g.addColorStop(0, '#1a2a44'); g.addColorStop(1, '#3a4a66'); c.fillStyle = g; c.fillRect(966, 206, 228, 208);
      P.moon(c, 1140, 250, 22, '#f0f2f8', { halo: 0.6 });
      c.fillStyle = 'rgba(200,215,235,0.4)'; for (let i = 0; i < 5; i++) c.fillRect(966, 360 + i * 10 + Math.sin(t + i) * 2, 228, 2);
      if (st.face > 0.01) {
        c.save(); c.beginPath(); c.rect(966, 206, 228, 208); c.clip(); c.globalAlpha = st.face;
        c.fillStyle = '#05070a'; c.beginPath(); c.moveTo(980, 420); c.lineTo(990, 300); c.lineTo(1010, 250); c.lineTo(1130, 250); c.lineTo(1150, 300); c.lineTo(1160, 420); c.fill();
        c.fillStyle = '#e0d070'; c.fillRect(1030, 300, 18, 6); c.fillRect(1090, 300, 18, 6);
        c.strokeStyle = '#c8c4b0'; c.lineWidth = 3; c.beginPath(); c.moveTo(1030, 360); c.quadraticCurveTo(1070, 376, 1112, 356); c.stroke();
        c.restore();
      }
      c.fillStyle = '#0a0706'; c.fillRect(950, 190, 260, 14); c.fillRect(950, 418, 260, 14); c.fillRect(1074, 200, 10, 220);
      S.layer(1);
      c.fillStyle = '#120d09'; c.fillRect(400, 600, 560, 20); c.fillRect(420, 620, 18, 110); c.fillRect(922, 620, 18, 110);
      if (st.torn < 0.5) { c.fillStyle = '#cfcac0'; c.beginPath(); c.moveTo(420, 600); c.quadraticCurveTo(500, 560, 600, 566); c.quadraticCurveTo(700, 550, 800, 570); c.quadraticCurveTo(900, 560, 940, 600); c.fill(); }
      else { c.fillStyle = '#cfcac0'; [[460, 590], [560, 600], [700, 585], [840, 596], [520, 650], [760, 660]].forEach(([x, y], i) => { c.save(); c.translate(x, y); c.rotate(i); c.beginPath(); c.moveTo(-30, 0); c.lineTo(10, -14); c.lineTo(36, 4); c.lineTo(0, 12); c.fill(); c.restore(); }); }
      c.fillStyle = '#5a5a5e'; c.fillRect(840, 590, 60, 6); c.fillRect(870, 580, 4, 14);
      P.candle(c, 380, 600, 60, t, 1, 5);
    },
    lights(st) { return [{ x: 380, y: 520, r: 560, i: 0.9, c: '#ffcf86', g: 0.2 }, { x: 1080, y: 310, r: 280, i: 0.55, c: '#a8b8d8', d: 0.5 }]; }
  };

  SC['fr-wedding'] = {
    focus: [800, 440], dark: 0.76, darkCol: '#030306', desat: 0.3, storm: true, ownBolt: true, boltX: 1240, boltY: 520,
    init(st) { st.point = 0; },
    draw(S, st, t) {
      const c = S.ctx; S.layer(0.5);
      H.room(S, { wall: '#2a2224', floor: '#160f0c', stripes: true });
      H.stormWin(S, c, 1120, 170, 240, 380, t);
      if (st.point > 0.01) {
        c.save(); c.beginPath(); c.rect(1120, 170, 240, 380); c.clip(); c.globalAlpha = st.point;
        P.fig(c, 1250, 640, 420, 'giant', { col: '#010102', reach: 100 * st.point, raise: 50 * st.point, eyes: 0.8 });
        c.restore();
      }
      H.drape(c, 1080, 160, 70, 420, '#5a5050', t * 3, 1, 3); H.drape(c, 1330, 160, 70, 420, '#5a5050', t * 3 + 2, -1, 3);
      S.layer(1);
      c.fillStyle = '#100a08'; c.fillRect(380, 470, 30, 170); c.fillRect(380, 560, 560, 40); c.fillRect(910, 520, 30, 120);
      c.fillStyle = '#d0c8bc'; c.fillRect(400, 540, 520, 30);
      c.save(); c.translate(560, 548); c.rotate(-0.06);
      c.fillStyle = '#ece8e0'; c.beginPath(); c.moveTo(-120, 0); c.quadraticCurveTo(0, -30, 140, -10); c.quadraticCurveTo(220, 0, 260, 20); c.lineTo(-120, 22); c.fill();
      c.beginPath(); c.ellipse(-140, 4, 22, 18, 0, 0, TAU); c.fillStyle = '#d8d0c4'; c.fill();
      c.fillStyle = '#100808'; c.beginPath(); c.moveTo(-160, -6); c.quadraticCurveTo(-200, 40, -190, 90); c.lineTo(-170, 90); c.quadraticCurveTo(-176, 40, -140, 10); c.fill();
      c.strokeStyle = '#ece8e0'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(20, 10); c.quadraticCurveTo(40, 60, 30, 110); c.stroke();
      c.restore();
      c.save(); c.translate(1000, 690); c.rotate(1.4); P.candle(c, 0, 0, 60, t, 0.6, 2); c.restore();
    },
    lights(st, S) { return [{ x: 1000, y: 650, r: 320, i: 0.6, c: '#ffcf86' }, { x: 1240, y: 360, r: 520, i: 0.25 + S.flash * 0.8, c: '#b8c8ff', d: 0.5, g: 0.1 }]; }
  };

  SC['fr-ice'] = {
    focus: [800, 440], dark: 0.3, darkCol: '#020610', desat: 0.25,
    init(st) { st.drift = 0; st.pyre = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#010309'], [1, '#0a1422']]);
      P.stars(c, v, t, 160, 0.9, 131, 500);
      aurora(c, v, t, 0.6);
      v = S.layer(0.4);
      const g = c.createLinearGradient(0, 560, 0, 900); g.addColorStop(0, '#0a1420'); g.addColorStop(1, '#02050a'); c.fillStyle = g; c.fillRect(v.x0, 560, v.x1 - v.x0, 400);
      const r = C.seeded(19);
      for (let i = 0; i < 18; i++) { const x = v.x0 + ((r() * (v.x1 - v.x0) + t * 6 * (r() + 0.3)) % (v.x1 - v.x0)), y = 580 + r() * 260, w = 40 + r() * 100; c.fillStyle = C.rgba('#b8cce0', 0.5 + r() * 0.3); c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w * 0.4, y - 8); c.lineTo(x + w * 0.6, y - 6); c.lineTo(x + w, y); c.lineTo(x, y + 6); c.fill(); }
      ship(c, 300, 600, 0.8, '#03060c', 0.9, t);
      const k = C.clamp(st.drift, 0, 1), s = 1 - k * 0.75, x = C.lerp(820, 1300, k), y = C.lerp(700, 590, k);
      c.fillStyle = C.rgba('#c8d8e8', 0.8); c.beginPath(); c.ellipse(x, y, 90 * s, 16 * s, 0, 0, TAU); c.fill();
      P.fig(c, x, y - 6 * s, 260 * s, 'giant', { col: '#010204' });
      if (st.pyre > 0) { P.flame(c, x + 40 * s, y - 4 * s, 50 * s, t, st.pyre, 3); P.flame(c, x + 60 * s, y - 2 * s, 36 * s, t, st.pyre, 7); }
      P.fog(c, v, 560, 120, 0.3, t * 6, '#9ab0c8');
    },
    lights(st) { const k = C.clamp(st.drift, 0, 1); return [{ x: 240, y: 580, r: 200, i: 0.8, c: '#ffc56a', d: 0.4 }, { x: C.lerp(860, 1320, k), y: C.lerp(680, 580, k), r: 300 * (1 - k * 0.6), i: st.pyre * 0.9, c: '#ff8a2a', d: 0.4 }, { x: 800, y: 200, r: 1400, i: 0.35, c: '#5aff9a', d: 0.05 }]; }
  };

  /* =====================================================================
     LE MASQUE DE LA MORT ROUGE
     ===================================================================== */
  const ROOMS = [
    { wall: '#16285c', pane: '#3a64e8', name: 'La salle bleue' },
    { wall: '#3a124e', pane: '#a43ae0', name: 'La salle pourpre' },
    { wall: '#103a22', pane: '#2ad06a', name: 'La salle verte' },
    { wall: '#5a2a0a', pane: '#ff8a1a', name: 'La salle orange' },
    { wall: '#8a8680', pane: '#f4f0e8', name: 'La salle blanche' },
    { wall: '#3a1a52', pane: '#c07af0', name: 'La salle violette' },
    { wall: '#050404', pane: '#d0101c', name: 'La salle noire' }
  ];
  SC.ROOMS = ROOMS;
  SC['mr-plague'] = {
    focus: [800, 440], dark: 0.35, darkCol: '#100202', desat: 0.1,
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#120404'], [0.6, '#3a0c0a'], [1, '#6a1a10']]);
      P.glow(c, 900, 360, 260, '#ff5030', 0.35); c.fillStyle = 'rgba(200,60,40,0.6)'; c.beginPath(); c.arc(900, 360, 60, 0, TAU); c.fill();
      P.clouds(c, v, 200, 200, 0.4, t * 4, '#2a0606');
      v = S.layer(0.35);
      P.ridge(c, v, 580, 40, 3, '#1a0404');
      [[200, 201], [560, 202], [1300, 203]].forEach(([x, s]) => P.tree(c, x, 600, 360, s, '#0a0202', t, 0.6));
      P.fog(c, v, 450, 250, 0.5, t * 6, '#8a2a20');
      v = S.layer(0.8);
      c.fillStyle = '#100303'; c.fillRect(v.x0, 640, v.x1 - v.x0, 400);
      c.fillStyle = '#2a1410'; c.beginPath(); c.moveTo(600, 640); c.lineTo(1000, 640); c.lineTo(1400, v.y1 + 10); c.lineTo(200, v.y1 + 10); c.fill();
      c.fillStyle = '#0a0202'; c.fillRect(860, 610, 300, 60); H.wheel(c, 900, 690, 40, 0, '#0a0202'); H.wheel(c, 1120, 690, 40, 0, '#0a0202');
      c.fillStyle = '#4a3a34'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(910 + i * 66, 604 - (i % 2) * 10, 40, 18, 0.1 * i, 0, TAU); c.fill(); }
      P.crow(c, 1000, 586, 30, 'sit', 1, '#050101'); P.crow(c, 1100, 594, 26, 'sit', -1, '#050101');
      c.strokeStyle = '#0a0202'; c.lineWidth = 6; c.beginPath(); c.moveTo(860, 640); c.lineTo(780, 650); c.stroke();
      const wk = Math.sin(t * 2) * 6;
      P.fig(c, 740, 690, 210, 'man', { col: '#0a0202', hat: true, raise: 20 + wk });
      P.parts(c, st, 'ash', 'ash', 50, v, dt, t, { col: '#5a2a20' });
    }
  };

  SC['mr-abbey'] = {
    focus: [800, 400], dark: 0.55, darkCol: '#05030a', desat: 0.1,
    init(st) { st.weld = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#04030a'], [1, '#1a1020']]);
      P.stars(c, v, t, 120, 0.8, 141, 360);
      v = S.layer(0.4);
      c.fillStyle = '#05040a'; c.beginPath(); c.moveTo(v.x0, 700); c.quadraticCurveTo(800, 520, v.x1, 700); c.lineTo(v.x1, v.y1 + 10); c.lineTo(v.x0, v.y1 + 10); c.fill();
      c.fillStyle = '#07060c'; c.fillRect(280, 260, 1040, 340);
      for (let i = 0; i < 26; i++) c.fillRect(280 + i * 40, 240, 22, 22);
      [[280, 160], [1240, 160], [740, 100]].forEach(([x, top]) => { c.fillRect(x, top, 90, 440); c.beginPath(); c.moveTo(x - 10, top); c.lineTo(x + 45, top - 70); c.lineTo(x + 100, top); c.fill(); });
      ROOMS.forEach((R, i) => { const x = 380 + i * 128, fl = 0.75 + 0.25 * Math.sin(t * 6 + i * 2); P.win(c, x, 320, 40, 110, fl, t, R.pane, { gothic: true, frame: '#07060c' }); });
      c.fillStyle = '#121216'; c.fillRect(720, 470, 160, 130);
      c.strokeStyle = '#2a2a30'; c.lineWidth = 6; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(730 + i * 28, 470); c.lineTo(730 + i * 28, 600); c.stroke(); }
      if (st.weld > 0) { const x = 800, y = 530 + Math.sin(t * 3) * 30; P.glow(c, x, y, 120, '#ffb040', 0.7 * st.weld); P.parts(c, st, 'sp', 'embers', 50, { x0: x - 120, x1: x + 120, y0: y - 160, y1: y + 60 }, dt * 3, t); }
      v = S.layer(1);
      P.fig(c, 640, 760, 220, 'man', { col: '#020103', raise: 40 * st.weld }); P.fig(c, 960, 760, 230, 'man', { col: '#020103', raise: 40 * st.weld, flip: true });
      c.fillStyle = '#020103'; c.fillRect(v.x0, 760, v.x1 - v.x0, 300);
    },
    lights(st) { return [{ x: 800, y: 380, r: 700, i: 0.5, c: '#c07af0', d: 0.4, g: 0.1 }, { x: 800, y: 530, r: 300, i: st.weld, c: '#ffb040', d: 0.4 }]; }
  };

  SC['mr-room'] = {
    focus: [800, 430], dark: 0.72, darkCol: '#030205', desat: 0.0,
    init(st) { st.room = 0; st.rc = 0; st.freeze = 0; st.fig = 0; st.figX = 1200; st.prince = 0; st.princeX = 300; st.ember = 1; st.dead = 0; st.clock = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx;
      st.rc += (st.room - st.rc) * (1 - Math.exp(-dt * 3));
      const i0 = Math.floor(C.clamp(st.rc, 0, 6)), i1 = Math.min(6, i0 + 1), f = C.clamp(st.rc - i0, 0, 1);
      const wall = C.mix(ROOMS[i0].wall, ROOMS[i1].wall, f), pane = C.mix(ROOMS[i0].pane, ROOMS[i1].pane, f);
      const emb = C.clamp(st.ember, 0, 1);
      S.layer(0.5);
      const R = H.room(S, { wall: C.shade(wall, 0.55), floor: '#0a0806', side: C.shade(wall, 0.35), ceil: C.shade(wall, 0.2), bx0: 300, bx1: 1300, by0: 80, by1: 640, grit: 0.25 });
      for (let k = 0; k < 20; k++) { const x = 300 + k * 50; const g = c.createLinearGradient(x, 0, x + 50, 0); g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(0.5, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); c.fillStyle = g; c.fillRect(x, 80, 50, 560); }
      [380, 1140].forEach((x, j) => { const fl = emb * (0.7 + 0.3 * Math.sin(t * 7 + j * 3)); P.win(c, x, 170, 80, 360, fl, t, pane, { gothic: true, frame: '#050404', dark: '#050404' }); });
      if (st.rc > 5.5 || st.clock) {
        const a = st.rc > 5.5 ? C.clamp((st.rc - 5.5) * 2, 0, 1) : 1;
        c.globalAlpha = a; c.fillStyle = '#020101'; c.fillRect(730, 150, 140, 490); c.beginPath(); c.moveTo(720, 150); c.lineTo(800, 90); c.lineTo(880, 150); c.fill();
        c.fillStyle = '#c8c0a8'; c.beginPath(); c.arc(800, 220, 44, 0, TAU); c.fill();
        c.strokeStyle = '#0a0a0a'; c.lineWidth = 4; c.beginPath(); c.moveTo(800, 220); c.lineTo(800, 184); c.moveTo(800, 220); c.lineTo(822, 216); c.stroke();
        for (let k = 0; k < 12; k++) { const a2 = k / 12 * TAU; c.fillStyle = '#0a0a0a'; c.fillRect(800 + Math.sin(a2) * 36 - 2, 220 - Math.cos(a2) * 36 - 2, 4, 4); }
        c.fillStyle = '#080606'; c.fillRect(760, 290, 80, 320);
        const pa = st.stop ? 0 : Math.sin(t * Math.PI * 0.75) * 0.3; c.strokeStyle = '#8a7040'; c.lineWidth = 3; c.beginPath(); c.moveTo(800, 300); c.lineTo(800 + Math.sin(pa) * 230, 300 + Math.cos(pa) * 230); c.stroke();
        c.fillStyle = '#a88a4a'; c.beginPath(); c.arc(800 + Math.sin(pa) * 240, 300 + Math.cos(pa) * 240, 22, 0, TAU); c.fill();
        c.globalAlpha = 1;
      }
      S.layer(0.8);
      const fg = c.createLinearGradient(0, 640, 0, 900); fg.addColorStop(0, C.rgba(pane, 0.18 * emb)); fg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = fg; c.fillRect(-500, 640, 2600, 400);
      const dead = C.clamp(st.dead, 0, 1);
      for (let k = 0; k < 9; k++) {
        const bx = 380 + (k % 5) * 200 + (k > 4 ? 100 : 0), by = 680 + (k > 4 ? 70 : 0), s = by > 700 ? 1.1 : 0.95;
        const sp = st.freeze ? 0 : 1; st['a' + k] = (st['a' + k] || k) + dt * 1.6 * sp;
        const a = st['a' + k], ox = Math.cos(a) * 26, oy = Math.sin(a) * 6;
        if (dead > 0.5) { c.fillStyle = '#060404'; c.beginPath(); c.ellipse(bx, by, 70 * s, 14 * s, 0, 0, TAU); c.fill(); continue; }
        const col = '#0a0708';
        P.fig(c, bx + ox, by + oy, 190 * s, 'man', { col, raise: 30, reach: 10 });
        P.fig(c, bx - ox, by - oy, 175 * s, 'woman', { col, raise: 34 });
        c.fillStyle = C.shade(ROOMS[(k + 2) % 7].pane, 0.8); c.fillRect(bx + ox - 6 * s, by + oy - 176 * s, 12 * s, 4 * s); c.fillRect(bx - ox - 6 * s, by - oy - 162 * s, 12 * s, 4 * s);
      }
      if (st.prince > 0.01) { c.globalAlpha = st.prince; P.fig(c, st.princeX, 740, 250, 'man', { col: '#050304', raise: 60, reach: 20 }); c.fillStyle = '#c8c8d0'; c.save(); c.translate(st.princeX + 30, 740 - 250 * 0.95); c.rotate(-0.6); c.fillRect(0, -2, 50, 4); c.restore(); c.globalAlpha = 1; }
      if (st.fig > 0.01) { c.globalAlpha = st.fig; P.fig(c, st.figX, 760, 400, 'shroud', { col: '#bdb8ae', mask: true }); c.globalAlpha = 1; }
      P.fog(c, S.view, 600, 180, 0.15 * emb, t * 6, C.mix(pane, '#ffffff', 0.4));
    },
    lights(st) {
      const i0 = Math.round(C.clamp(st.rc, 0, 6)), pane = ROOMS[i0].pane, emb = C.clamp(st.ember, 0, 1);
      return [{ x: 420, y: 360, r: 700, i: 0.8 * emb, c: pane, g: 0.25 }, { x: 1180, y: 360, r: 700, i: 0.8 * emb, c: pane, g: 0.25 }, { x: st.figX, y: 560, r: 300, i: st.fig * 0.4, c: '#d8d0c8', d: 0.8 }];
    }
  };

  /* =====================================================================
     BLOODY MARY
     ===================================================================== */
  SC['bm-house'] = {
    focus: [800, 430], dark: 0.62, darkCol: '#04030a', desat: 0.05,
    init(st) { st.bath = 0; },
    draw(S, st, t, dt) {
      const c = S.ctx; let v = S.layer(0.05);
      P.sky(c, v, [[0, '#05040e'], [1, '#1c1630']]);
      P.stars(c, v, t, 100, 0.8, 151, 360);
      P.moon(c, 1240, 150, 74, '#f2ead8', { halo: 1.3 });
      P.clouds(c, v, 120, 160, 0.4, t * 6, '#0e0a1a');
      v = S.layer(0.5);
      P.tree(c, 1360, 640, 560, 161, '#030206', t, 1);
      c.fillStyle = '#16121a'; c.fillRect(460, 290, 680, 360);
      c.fillStyle = '#0a080e'; c.beginPath(); c.moveTo(430, 294); c.lineTo(800, 120); c.lineTo(1170, 294); c.fill();
      c.fillRect(980, 140, 40, 100);
      P.win(c, 520, 470, 90, 110, 0.95, t, '#ffb860', { frame: '#0a080e' }); P.win(c, 990, 470, 90, 110, 0.95, t, '#ffb860', { frame: '#0a080e' });
      P.win(c, 520, 330, 80, 90, 0, t, null, { frame: '#0a080e' });
      P.win(c, 1000, 330, 80, 90, st.bath, t + 3, '#ff9a40', { frame: '#0a080e' });
      P.win(c, 760, 180, 80, 70, 0, t, null, { frame: '#0a080e', arch: true });
      c.fillStyle = '#100c12'; c.fillRect(700, 520, 200, 130); c.fillStyle = '#2a1a0a'; c.fillRect(760, 540, 80, 110);
      c.fillStyle = 'rgba(255,190,110,0.6)'; c.fillRect(770, 552, 60, 24);
      c.fillStyle = '#0c0a10'; c.fillRect(680, 500, 240, 20); c.fillRect(690, 520, 12, 130); c.fillRect(898, 520, 12, 130);
      c.strokeStyle = 'rgba(220,220,230,0.25)'; c.lineWidth = 1; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(690, 520); c.quadraticCurveTo(720 + i * 8, 540 + i * 6, 690 + i * 14, 600); c.stroke(); }
      for (let i = 0; i < 3; i++) { c.fillStyle = '#18121a'; c.fillRect(720 - i * 20, 650 + i * 18, 160 + i * 40, 18); }
      [[730, 650, 18], [800, 668, 22], [880, 686, 16]].forEach(([x, y, r], i) => P.pumpkin(c, x, y, r, { lit: 1, t: t + i * 2, amb: 0.4, seed: i * 4 }));
      v = S.layer(0.9);
      c.fillStyle = '#0a0a0e'; c.fillRect(v.x0, 720, v.x1 - v.x0, 300);
      c.fillStyle = '#1a1a1e'; c.fillRect(v.x0, 760, v.x1 - v.x0, 60);
      c.fillStyle = '#060608'; c.fillRect(230, 420, 10, 340); c.fillRect(214, 410, 42, 16);
      P.glow(c, 235, 400, 160, '#ffcf86', 0.5); c.fillStyle = '#ffe0a0'; c.fillRect(224, 390, 22, 20);
      v = S.layer(1.15);
      const wk = t * 2;
      P.fig(c, 980, 800, 150, 'child', { col: '#020203', hat: 'witch', bag: true });
      P.fig(c, 1080, 800, 160, 'ghost', { col: 'rgba(230,230,240,0.85)', t });
      P.fig(c, 1170 + Math.sin(wk) * 4, 800, 140, 'child', { col: '#020203', bag: true });
      P.parts(c, st, 'leaves', 'leaves', 18, v, dt, t, { col: '#6a2a08', wind: 0.05 });
    },
    lights(st) { return [{ x: 800, y: 560, r: 500, i: 0.8, c: '#ffb860', d: 0.5, g: 0.15 }, { x: 800, y: 670, r: 260, i: 0.8, c: '#ff8a1e', d: 0.5 }, { x: 235, y: 420, r: 400, i: 0.8, c: '#ffcf86', d: 0.9 }, { x: 1040, y: 375, r: 160, i: st.bath * 0.8, c: '#ff9a40', d: 0.5 }, { x: 1240, y: 150, r: 900, i: 0.35, c: '#e0dcd0', d: 0.05 }]; }
  };

  SC['bm-bath'] = {
    focus: [800, 400], dark: 0.9, darkCol: '#010102', desat: 0.2,
    init(st) { st.candle = 0; st.calls = 0; st.gap = 0.15; st.mary = 0; st.crack = 0; st.write = 0; },
    hot: { door: { x: 700, y: 380, r: 100 } },
    draw(S, st, t) {
      const c = S.ctx; let v = S.layer(0.6);
      c.fillStyle = '#5a5e60'; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2;
      for (let x = Math.floor(v.x0 / 60) * 60; x < v.x1; x += 60) { c.beginPath(); c.moveTo(x, v.y0); c.lineTo(x, v.y1); c.stroke(); }
      for (let y = Math.floor(v.y0 / 60) * 60; y < v.y1; y += 60) { c.beginPath(); c.moveTo(v.x0, y); c.lineTo(v.x1, y); c.stroke(); }
      S.layer(0.85);
      c.fillStyle = '#2a2a2c'; c.fillRect(540, 120, 520, 460);
      c.save(); c.beginPath(); c.rect(560, 140, 480, 420); c.clip();
      c.fillStyle = '#3a3c3e'; c.fillRect(560, 140, 480, 420);
      c.strokeStyle = 'rgba(0,0,0,0.35)'; for (let x = 560; x < 1040; x += 40) { c.beginPath(); c.moveTo(x, 140); c.lineTo(x, 560); c.stroke(); } for (let y = 140; y < 560; y += 40) { c.beginPath(); c.moveTo(560, y); c.lineTo(1040, y); c.stroke(); }
      c.fillStyle = '#d8d6d0'; c.fillRect(620, 220, 150, 340);
      c.fillStyle = '#000'; c.fillRect(620, 220, 150 * C.clamp(st.gap, 0, 1), 340);
      c.strokeStyle = '#1a1a1a'; c.lineWidth = 6; c.strokeRect(620, 220, 150, 340);
      if (st.mary > 0.01) {
        c.globalAlpha = st.mary;
        P.fig(c, 920, 600, 380, 'woman', { col: '#0a0a0a', hair: true });
        const fg = c.createRadialGradient(920, 600 - 380 * 0.88, 2, 920, 600 - 380 * 0.88, 30); fg.addColorStop(0, '#e8e4dc'); fg.addColorStop(1, '#8a8680');
        c.fillStyle = fg; c.beginPath(); c.ellipse(920, 600 - 380 * 0.88, 18, 24, 0, 0, TAU); c.fill();
        c.fillStyle = '#000'; c.beginPath(); c.ellipse(913, 600 - 380 * 0.89, 5, 4, 0, 0, TAU); c.ellipse(927, 600 - 380 * 0.89, 5, 4, 0, 0, TAU); c.ellipse(920, 600 - 380 * 0.83, 4, 7 * st.mary, 0, 0, TAU); c.fill();
        c.fillStyle = '#050505'; c.beginPath(); c.moveTo(898, 600 - 380 * 0.95); c.quadraticCurveTo(880, 600 - 380 * 0.6, 890, 600 - 380 * 0.45); c.lineTo(900, 600 - 380 * 0.7); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(942, 600 - 380 * 0.95); c.quadraticCurveTo(960, 600 - 380 * 0.6, 950, 600 - 380 * 0.45); c.lineTo(940, 600 - 380 * 0.7); c.closePath(); c.fill();
        c.globalAlpha = 1;
      }
      c.fillStyle = '#060606'; c.beginPath(); c.arc(800, 470, 70, 0, TAU); c.fill(); c.beginPath(); c.moveTo(640, 600); c.quadraticCurveTo(660, 540, 740, 530); c.lineTo(860, 530); c.quadraticCurveTo(940, 540, 960, 600); c.fill();
      if (st.candle > 0) { P.flame(c, 870, 556, 26, t * (1 + st.calls * 0.6), st.candle * 0.8, 2); }
      if (st.write > 0.01) {
        c.save(); c.beginPath(); c.rect(560, 140, 480 * st.write + 30, 420); c.clip();
        c.font = 'italic 64px "IM Fell Double Pica", Georgia, serif'; c.textAlign = 'center'; c.fillStyle = '#8a0a10'; c.fillText('À TON TOUR', 800, 300);
        c.strokeStyle = '#8a0a10'; c.lineWidth = 3; const r = C.seeded(9); for (let i = 0; i < 12; i++) { const x = 600 + i * 34 + r() * 10; c.beginPath(); c.moveTo(x, 305); c.lineTo(x, 305 + 10 + r() * 50 * st.write); c.stroke(); }
        c.restore();
      }
      const sh = c.createLinearGradient(560, 140, 1040, 560); sh.addColorStop(0, 'rgba(255,255,255,0.08)'); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); c.fillStyle = sh; c.fillRect(560, 140, 480, 420);
      c.restore();
      if (st.crack > 0.01) {
        const r = C.seeded(23); c.strokeStyle = 'rgba(230,235,240,0.85)'; c.lineWidth = 1.6;
        for (let i = 0; i < 18; i++) { const a = r() * TAU, L = (80 + r() * 300) * C.clamp(st.crack, 0, 1); let x = 800, y = 330; c.beginPath(); c.moveTo(x, y); for (let k = 1; k <= 4; k++) { x = 800 + Math.cos(a + (r() - 0.5) * 0.3) * L * k / 4; y = 330 + Math.sin(a + (r() - 0.5) * 0.3) * L * k / 4; c.lineTo(C.clamp(x, 560, 1040), C.clamp(y, 140, 560)); } c.stroke(); }
        c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(800 + 30 * (k + 1), 330); c.arc(800, 330, 30 * (k + 1) * st.crack, 0, TAU); } c.stroke();
      }
      c.strokeStyle = '#141414'; c.lineWidth = 16; c.strokeRect(552, 132, 496, 436);
      S.layer(1.1);
      c.fillStyle = '#c8c8c4'; c.beginPath(); c.moveTo(580, 620); c.lineTo(1020, 620); c.quadraticCurveTo(1010, 700, 800, 710); c.quadraticCurveTo(590, 700, 580, 620); c.fill();
      c.fillStyle = '#e0e0dc'; c.fillRect(570, 606, 460, 18);
      c.fillStyle = '#9a9a9e'; c.fillRect(790, 570, 20, 40); c.fillRect(790, 570, 50, 12);
      const dp = (t * 0.7) % 1; c.fillStyle = 'rgba(200,220,240,0.7)'; c.beginPath(); c.ellipse(834, 590 + dp * 40, 3, 4 + dp * 3, 0, 0, TAU); c.fill();
      P.candle(c, 930, 610, 70, t * (1 + st.calls * 0.8), st.candle, 5);
    },
    lights(st, S) { const fl = st.candle * (1 - (st.calls >= 2 ? Math.random() * 0.3 : 0)); return [{ x: 930, y: 530, r: 720, i: fl, c: '#ffcf86', d: 1.1, g: 0.22 }, { x: 870, y: 540, r: 300, i: fl * 0.4, c: '#ffcf86', d: 0.85 }]; }
  };
})();
