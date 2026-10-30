/* Sound — tout est synthétisé avec WebAudio : ambiances, musiques, bruitages, sursauts. */
window.Sound = (function () {
  'use strict';
  let ctx = null, master = null, rev = null, revIn = null, white = null, brown = null, musicBus = null;
  let on = false, vol = 0.8;
  let amb = null, ambCfg = null, ambLvl = 0;
  let heart = null, music = null;
  const api = { onBeat: null };
  const R = (a, b) => a + Math.random() * (b - a);
  const LOW = !!(window.Crypte && Crypte.lowPower);
  const N = (x) => Math.max(1, Math.round(x * (LOW ? 0.5 : 1)));
  let live = 0, cg = 1, unlocked = false;
  const LIMIT = LOW ? 70 : 240;
  const IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const PRIO = { scare: 1, sting: 1, hit: 1, beat: 1, thunder: 1, howl: 1, growl: 1, wail: 1, moan: 1, weep: 1, swish: 1, cart: 1, bell: 1 };
  const track = (n) => { live++; n.onended = () => { live = Math.max(0, live - 1); }; return n; };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC({ latencyHint: LOW ? 'playback' : 'interactive' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return false; } }
    master = ctx.createGain(); master.gain.value = on ? vol : 0;
    /* Compresseur doux, gain, puis limiteur dur : rien ne dépasse 0 dB, donc pas de saturation qui crache */
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.knee.value = 14; comp.ratio.value = 3.5; comp.attack.value = 0.012; comp.release.value = 0.35;
    const mk = ctx.createGain(); mk.gain.value = LOW ? 1.25 : 1.1;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.004; lim.release.value = 0.25;
    const safe = ctx.createGain(); safe.gain.value = 0.85;
    master.connect(mk); mk.connect(lim); lim.connect(safe); safe.connect(ctx.destination); api._tap = safe; api._lim = lim; api._comp = comp;
    revIn = ctx.createGain(); revIn.gain.value = 1;
    const rg = ctx.createGain(); rg.gain.value = LOW ? 0.55 : 0.8;
    if (LOW) {
      /* Réverbération légère pour téléphone : deux lignes à retard filtrées au lieu d'une convolution */
      [[0.067, 0.42], [0.113, 0.38]].forEach(([d, fb]) => {
        const dl = ctx.createDelay(1); dl.delayTime.value = d; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; const g = ctx.createGain(); g.gain.value = fb;
        revIn.connect(dl); dl.connect(lp); lp.connect(g); g.connect(dl); lp.connect(rg);
      });
    } else {
      rev = ctx.createConvolver(); rev.buffer = impulse(3.4, 2.6);
      revIn.connect(rev); rev.connect(rg);
    }
    rg.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.0001; musicBus.connect(master);
    const ms = ctx.createGain(); ms.gain.value = 0.35; musicBus.connect(ms); ms.connect(revIn);
    const len = ctx.sampleRate * 4;
    white = ctx.createBuffer(1, len, ctx.sampleRate); brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const w = white.getChannelData(0), b = brown.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const x = Math.random() * 2 - 1; w[i] = x; last = (last + 0.02 * x) / 1.02; b[i] = last * 3.5; }
    return true;
  }
  function impulse(sec, decay) {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  /* Sortie : panoramique + envoi en réverbération */
  function out(node, wet, pan, dest) {
    let n = node;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); n.connect(p); n = p; }
    if (cg !== 1 && !dest) { const gg = ctx.createGain(); gg.gain.value = cg; n.connect(gg); n = gg; }
    n.connect(dest || master);
    if (wet > 0) { const g = ctx.createGain(); g.gain.value = wet; n.connect(g); g.connect(revIn); }
    return n;
  }
  function env(g, t, a, d, peak) {
    const p = g.gain; p.cancelScheduledValues(t); p.setValueAtTime(0.0001, t);
    p.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); p.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function osc(type, f, t, dur) { const o = track(ctx.createOscillator()); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + 0.2); return o; }
  function gain(v) { const g = ctx.createGain(); g.gain.value = v == null ? 1 : v; return g; }
  function filt(type, f, q) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
  function src(buf, t, dur, loop) { const s = dur != null ? track(ctx.createBufferSource()) : ctx.createBufferSource(); s.buffer = buf || white; s.loop = loop !== false; s.start(t, Math.random() * 3); if (dur != null) s.stop(t + dur + 0.2); return s; }
  /* Rafale de bruit filtrée */
  function burst(t, dur, o) {
    o = o || {};
    const s = src(o.brown ? brown : white, t, (o.a || 0.01) + dur);
    const f = filt(o.ft || 'bandpass', o.from || o.f || 1000, o.q == null ? 1 : o.q);
    if (o.from) f.frequency.exponentialRampToValueAtTime(o.f || 1000, t + dur);
    const g = gain(0); env(g, t, o.a || 0.01, dur, o.v == null ? 0.3 : o.v);
    s.connect(f); f.connect(g); out(g, o.wet == null ? 0.2 : o.wet, o.pan);
  }
  function thump(t, f, v, wet, pan) {
    const o = osc('sine', f, t, 0.5); o.frequency.exponentialRampToValueAtTime(f * 0.4, t + 0.18);
    const g = gain(0); env(g, t, 0.004, 0.3, v); o.connect(g); out(g, wet == null ? 0.15 : wet, pan);
  }
  /* Synthèse à formants (voix, hurlements, rires) */
  const VOW = { a: [800, 1150, 2900], o: [450, 800, 2830], u: [325, 700, 2530], e: [400, 1600, 2700], i: [270, 2200, 3000] };
  function formant(input, vowel, q) {
    const g = gain(1); const fs = VOW[vowel] || VOW.a;
    fs.forEach((f, i) => { const b = filt('bandpass', f, q || 9); const gg = gain([1, 0.55, 0.25][i]); input.connect(b); b.connect(gg); gg.connect(g); });
    return g;
  }
  function shaper(k) { const ws = ctx.createWaveShaper(); const n = 1024, cur = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; cur[i] = Math.tanh(x * k) / Math.tanh(k); } ws.curve = cur; ws.oversample = LOW ? 'none' : '2x'; return ws; }

  /* Grincement par adhérence-glissement (porte, bois, roue) */
  function creakBuf(dur, r0, r1, r2) {
    const sr = ctx.sampleRate, n = Math.floor(sr * dur), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    let ph = 0, dec = 0;
    for (let i = 0; i < n; i++) {
      const k = i / n; const rate = (k < 0.5 ? r0 + (r1 - r0) * (k / 0.5) : r1 + (r2 - r1) * ((k - 0.5) / 0.5)) * (1 + (Math.random() - 0.5) * 0.35);
      ph += rate / sr; if (ph >= 1) { ph -= 1; dec = 1; }
      dec *= 0.985; d[i] = dec * (Math.random() * 0.4 + 0.8) * Math.sin(Math.PI * k);
    }
    return b;
  }

  const CUES = {
    thunder: (t, o) => {
      if (o.near !== false) { burst(t, 0.25, { ft: 'highpass', f: 2200, v: 0.28, a: 0.003, wet: 0.3 }); thump(t, 70, 0.55, 0.5); }
      for (let i = 0; i < N(4); i++) burst(t + 0.05 + i * R(0.25, 0.6), R(1.6, 3.2), { brown: true, ft: 'lowpass', f: R(90, 180), from: R(500, 900), v: R(0.38, 0.65), a: R(0.05, 0.3), wet: 0.8, pan: R(-0.5, 0.5) });
    },
    rumble: (t) => { burst(t, 4, { brown: true, ft: 'lowpass', f: 110, v: 0.9, a: 0.8, wet: 0.9 }); },
    creak: (t, o) => {
      const s = ctx.createBufferSource(); s.buffer = creakBuf(o.dur || 1.5, R(25, 40), R(55, 90), R(20, 35)); s.start(t);
      const b1 = filt('bandpass', o.f || 620, 7), b2 = filt('bandpass', (o.f || 620) * 2.1, 6), g = gain(0); env(g, t, 0.05, (o.dur || 1.5), o.v || 0.9);
      s.connect(b1); s.connect(b2); b1.connect(g); b2.connect(g); out(g, 0.4, o.pan);
    },
    door: (t, o) => { thump(t, 55, 0.75, 0.7, o.pan); burst(t, 0.35, { brown: true, ft: 'lowpass', f: 600, v: 0.5, a: 0.002, wet: 0.7, pan: o.pan }); burst(t, 0.06, { f: 1800, q: 2, v: 0.4, a: 0.001, wet: 0.4 }); },
    slam: (t, o) => CUES.door(t, o),
    knock: (t, o) => { const n = o.n || 3; for (let i = 0; i < n; i++) { const d = i * (o.gap || 0.32); thump(t + d, 130, 1, 0.35, o.pan); burst(t + d, 0.05, { f: 800, q: 2, v: 0.45, a: 0.002, wet: 0.2, pan: o.pan }); } },
    steps: (t, o) => { const n = o.n || 4; for (let i = 0; i < n; i++) { const d = i * (o.gap || 0.55); thump(t + d, 90, 0.5, 0.3); burst(t + d, 0.08, { f: 500, q: 1.5, v: 0.25, a: 0.003, wet: 0.3 }); if (Math.random() < 0.5) CUES.creak(t + d, { dur: 0.4, v: 0.25 }); } },
    beat: (t, o) => { const v = o.v == null ? 1 : o.v; thump(t, 62, 0.8 * v, 0.1, o.pan); burst(t, 0.09, { brown: true, ft: 'lowpass', f: 160, v: 0.6 * v, a: 0.004, wet: 0.05, pan: o.pan }); thump(t + 0.17, 74, 0.7 * v, 0.1, o.pan); },
    whisper: (t, o) => {
      const dur = o.dur || 2.6;
      const s = src(white, t, dur); const fs = [filt('bandpass', 900, 6), filt('bandpass', 2100, 7), filt('bandpass', 5200, 3)];
      const g = gain(0); g.gain.setValueAtTime(0.0001, t);
      for (let i = 1; i <= dur * 7; i++) g.gain.linearRampToValueAtTime(Math.random() < 0.25 ? 0.01 : R(0.1, 0.45), t + i / 7);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      fs.forEach((f, i) => { s.connect(f); f.connect(g); for (let k = 0; k < dur * 3; k++) f.frequency.setValueAtTime([R(400, 900), R(1100, 2400), R(4000, 6500)][i], t + k / 3); });
      out(g, 0.8, o.pan == null ? R(-0.8, 0.8) : o.pan);
    },
    howl: (t, o) => {
      const p = o.p || 1, dur = 3.6;
      const a = osc('sawtooth', 300 * p, t, dur), b = osc('triangle', 300 * p, t, dur);
      [a, b].forEach((x) => { x.frequency.linearRampToValueAtTime(560 * p, t + 0.9); x.frequency.linearRampToValueAtTime(500 * p, t + 2.2); x.frequency.exponentialRampToValueAtTime(260 * p, t + dur); });
      const v = osc('sine', 5.2, t, dur), vg = gain(10 * p); v.connect(vg); vg.connect(a.frequency); vg.connect(b.frequency);
      const mx = gain(1); a.connect(gain(0.25)).connect(mx); b.connect(mx);
      const f = formant(mx, 'u', 6); const g = gain(0); env(g, t, 0.8, dur - 0.9, 1.1);
      f.connect(g); out(g, 0.85, o.pan);
    },
    wolves: (t) => { CUES.howl(t, { p: 1, pan: -0.6 }); CUES.howl(t + 1.1, { p: 1.18, pan: 0.5 }); CUES.howl(t + 2.4, { p: 0.9, pan: 0 }); },
    owl: (t, o) => {
      [0, 0.5, 1.25, 1.5].forEach((d, i) => {
        const o1 = osc('sine', i < 2 ? 410 : 380, t + d, 0.5); o1.frequency.exponentialRampToValueAtTime(i < 2 ? 320 : 300, t + d + (i === 3 ? 0.55 : 0.3));
        const g = gain(0); env(g, t + d, 0.05, i === 3 ? 0.55 : 0.28, 0.25); o1.connect(g); out(g, 0.7, o.pan == null ? -0.4 : o.pan);
      });
    },
    crow: (t, o) => {
      const n = o.n || 3;
      for (let i = 0; i < n; i++) {
        const tt = t + i * R(0.38, 0.55), f0 = R(480, 560);
        const s = osc('sawtooth', f0, tt, 0.35); s.frequency.exponentialRampToValueAtTime(f0 * 0.7, tt + 0.3);
        const vb = osc('sine', 32, tt, 0.35), vg = gain(40); vb.connect(vg); vg.connect(s.frequency);
        const f = filt('bandpass', 1300, 3), g = gain(0); env(g, tt, 0.02, 0.3, 0.32);
        s.connect(f); f.connect(g); out(g, 0.6, o.pan == null ? R(-0.7, 0.7) : o.pan);
        burst(tt, 0.3, { f: 1600, q: 2, v: 0.12, a: 0.02, wet: 0.5 });
      }
    },
    bats: (t, o) => {
      for (let i = 0; i < 18; i++) { const tt = t + i * 0.05 + Math.random() * 0.04; const s = osc('sine', R(5500, 8500), tt, 0.05); s.frequency.exponentialRampToValueAtTime(R(3000, 4500), tt + 0.04); const g = gain(0); env(g, tt, 0.003, 0.04, 0.08); s.connect(g); out(g, 0.5, R(-1, 1)); }
      CUES.flutter(t, { dur: 1.2, v: 0.35 });
    },
    flutter: (t, o) => {
      const dur = o.dur || 1.5, s = src(white, t, dur), f = filt('bandpass', 1400, 1.2), g = gain(0);
      const lfo = osc('square', R(16, 24), t, dur), lg = gain(0.5); lfo.connect(lg); lg.connect(g.gain);
      const e = gain(0); env(e, t, dur * 0.3, dur * 0.7, o.v || 0.4);
      s.connect(f); f.connect(g); g.connect(e); out(e, 0.4, o.pan == null ? R(-0.5, 0.5) : o.pan);
    },
    swarm: (t) => { for (let k = 0; k < N(6); k++) CUES.flutter(t + k * 0.18, { dur: 2.4, v: 0.5, pan: R(-1, 1) }); for (let k = 0; k < N(3); k++) CUES.bats(t + k * 0.5, {}); },
    drip: (t, o) => { const n = o.n || 3; for (let i = 0; i < n; i++) { const tt = t + i * R(0.45, 0.9); const s = osc('sine', R(1300, 1800), tt, 0.3); s.frequency.exponentialRampToValueAtTime(R(450, 600), tt + 0.08); const g = gain(0); env(g, tt, 0.002, 0.12, 0.35); s.connect(g); out(g, 0.9, o.pan); } },
    splash: (t) => { burst(t, 0.25, { ft: 'lowpass', f: 900, from: 3000, v: 1, a: 0.002, wet: 0.3 }); thump(t, 90, 0.9, 0.2); burst(t + 0.05, 0.4, { f: 600, q: 1.5, v: 0.45, a: 0.02, wet: 0.4 }); CUES.drip(t + 0.35, { n: 3 }); },
    glass: (t) => {
      burst(t, 0.3, { ft: 'highpass', f: 3000, v: 0.5, a: 0.002, wet: 0.4 });
      for (let i = 0; i < N(28); i++) { const tt = t + Math.random() * 0.7, f = R(2200, 7500); const s = osc('sine', f, tt, 0.5); const g = gain(0); env(g, tt, 0.001, R(0.05, 0.4), R(0.04, 0.14)); s.connect(g); out(g, 0.5, R(-1, 1)); }
    },
    clang: (t, o) => { const f = o.f || 220; [1, 2.76, 5.4, 8.93].forEach((m, i) => { const s = osc('sine', f * m, t, 3); const g = gain(0); env(g, t, 0.002, 2.4 / (i + 1), 0.28 / (i + 1)); s.connect(g); out(g, 0.6, o.pan); }); burst(t, 0.08, { ft: 'highpass', f: 2000, v: 0.5, a: 0.001, wet: 0.3 }); },
    hammer: (t) => { for (let i = 0; i < 3; i++) { CUES.clang(t + i * 0.55, { f: 330 }); thump(t + i * 0.55, 100, 0.8); } },
    chains: (t) => { for (let i = 0; i < N(26); i++) { const tt = t + Math.random() * 1.2; burst(tt, 0.03, { ft: 'highpass', f: R(2500, 5000), v: 0.3, a: 0.001, wet: 0.4 }); const s = osc('sine', R(1800, 3500), tt, 0.1); const g = gain(0); env(g, tt, 0.001, 0.08, 0.06); s.connect(g); out(g, 0.3); } },
    bell: (t, o) => {
      const f = o.f || 196;
      [[0.5, 0.6, 7], [1, 1, 5], [1.2, 0.5, 3.5], [1.5, 0.4, 3], [2, 0.45, 2.6], [2.5, 0.2, 1.8], [3, 0.15, 1.4], [4.2, 0.1, 1]].forEach(([m, a, d]) => {
        const s = osc('sine', f * m, t, d + 0.2); const g = gain(0); env(g, t, 0.003, d, 0.22 * a); s.connect(g); out(g, 0.7, o.pan);
      });
    },
    chime: (t) => CUES.bell(t, { f: 98 }),
    tick: (t, o) => { burst(t, 0.02, { ft: 'highpass', f: 3500, v: o.v || 0.25, a: 0.001, wet: 0.3 }); thump(t, 900, (o.v || 0.25) * 0.4, 0.2); },
    gallop: (t, o) => {
      const dur = o.dur || 5, sp = o.sp || 0.36;
      for (let b = 0; b * sp < dur; b++) {
        const fade = Math.min(1, (b * sp) / 1.2) * (o.v || 1);
        [0, 0.09, 0.19].forEach((d) => { const tt = t + b * sp + d; thump(tt, R(70, 95), 0.75 * fade, 0.3, o.pan); burst(tt, 0.04, { f: 900, q: 3, v: 0.22 * fade, a: 0.002, wet: 0.25, pan: o.pan }); });
      }
    },
    hoof: (t) => { thump(t, 85, 0.9, 0.3); burst(t, 0.04, { f: 900, q: 3, v: 0.25, a: 0.002, wet: 0.2 }); },
    zap: (t, o) => {
      const dur = o.dur || 1.3;
      for (let i = 0; i < N(26); i++) burst(t + Math.random() * dur, R(0.01, 0.05), { ft: 'highpass', f: R(2000, 6000), v: R(0.2, 0.6), a: 0.001, wet: 0.3, pan: R(-0.6, 0.6) });
      const s = osc('sawtooth', 58, t, dur), f = filt('lowpass', 500), g = gain(0); env(g, t, 0.03, dur, 0.28); s.connect(f); f.connect(g); out(g, 0.3);
      const s2 = osc('square', 117, t, dur), g2 = gain(0); env(g2, t, 0.03, dur, 0.05); s2.connect(g2); out(g2, 0.2);
    },
    fire: (t, o) => { const dur = o.dur || 4; burst(t, dur, { brown: true, ft: 'lowpass', f: 420, v: 0.5, a: 0.5, wet: 0.2 }); for (let i = 0; i < N(dur * 14); i++) burst(t + Math.random() * dur, 0.025, { f: R(2000, 6000), q: 1.5, v: R(0.1, 0.35), a: 0.001, wet: 0.1, pan: R(-0.7, 0.7) }); },
    match: (t) => { burst(t, 0.22, { ft: 'highpass', f: 6000, from: 1800, v: 0.5, a: 0.004, wet: 0.2 }); burst(t + 0.18, 0.7, { ft: 'lowpass', f: 700, from: 2400, v: 0.4, a: 0.03, wet: 0.3 }); },
    gust: (t, o) => { burst(t, o.dur || 2.6, { ft: 'bandpass', f: 380, from: 1400, q: 1.4, v: 0.6, a: 0.9, wet: 0.5, pan: R(-0.6, 0.6) }); },
    whoosh: (t, o) => {
      const s = src(white, t, 0.8), f = filt('bandpass', 300, 2); f.frequency.exponentialRampToValueAtTime(2600, t + 0.35); f.frequency.exponentialRampToValueAtTime(500, t + 0.75);
      const g = gain(0); env(g, t, 0.25, 0.5, o.v || 0.55);
      let n = g; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.setValueAtTime(-0.9, t); p.pan.linearRampToValueAtTime(0.9, t + 0.75); g.connect(p); n = p; }
      s.connect(f); f.connect(g); n.connect(master); const w = gain(0.4); n.connect(w); w.connect(revIn);
    },
    hit: (t) => { thump(t, 48, 0.85, 0.8); burst(t, 1.4, { brown: true, ft: 'lowpass', f: 140, v: 0.55, a: 0.004, wet: 0.9 }); },
    braam: (t, o) => {
      const dur = o.dur || 3.2;
      [41.2, 61.7, 82.4, 55].forEach((f, i) => {
        const s = osc('sawtooth', f, t, dur), s2 = osc('sawtooth', f * 1.006, t, dur);
        const lp = filt('lowpass', 120, 2); lp.frequency.setValueAtTime(120, t); lp.frequency.exponentialRampToValueAtTime(1600, t + 0.35); lp.frequency.exponentialRampToValueAtTime(260, t + dur);
        const ws = shaper(1.6), g = gain(0); env(g, t, 0.08, dur - 0.1, 0.14);
        s.connect(lp); s2.connect(lp); lp.connect(ws); ws.connect(g); out(g, 0.6, (i - 1.5) * 0.3);
      });
    },
    sting: (t, o) => {
      const fs = o.low ? [110, 116.5, 155.6, 164.8] : [233, 246.9, 349.2, 370];
      fs.forEach((f) => { const s = osc('sawtooth', f, t, 2.4); const fl = filt('lowpass', 2800); const g = gain(0); env(g, t, 0.008, 2, 0.12); s.connect(fl); fl.connect(g); out(g, 0.6); });
      thump(t, 55, 0.75, 0.6); burst(t, 0.6, { ft: 'highpass', f: 2400, v: 0.25, a: 0.003, wet: 0.5 });
    },
    screech: (t, o) => {
      const n = o.n || 3;
      for (let k = 0; k < n; k++) {
        const tt = t + k * 0.24;
        [1320, 1397, 1480, 1245].forEach((f) => {
          const s = osc('sawtooth', f * R(0.99, 1.01), tt, 0.3); const v = osc('sine', 9, tt, 0.3), vg = gain(18); v.connect(vg); vg.connect(s.frequency);
          const bp = filt('bandpass', 2400, 0.8), g = gain(0); env(g, tt, 0.004, 0.2, 0.09); s.connect(bp); bp.connect(g); out(g, 0.6, R(-0.4, 0.4));
        });
      }
    },
    scare: (t) => { CUES.screech(t, { n: 2 }); CUES.hit(t); burst(t, 0.5, { ft: 'highpass', f: 1500, v: 0.45, a: 0.002, wet: 0.5 }); },
    riser: (t, o) => {
      const dur = o.dur || 3;
      burst(t, dur, { ft: 'bandpass', f: 4000, from: 300, q: 1.2, v: 0.5, a: dur * 0.9, wet: 0.6 });
      [220, 233, 311].forEach((f) => { const s = osc('sawtooth', f, t, dur); s.frequency.exponentialRampToValueAtTime(f * 2.5, t + dur); const lp = filt('lowpass', 2000), g = gain(0); env(g, t, dur * 0.95, 0.08, 0.07); s.connect(lp); lp.connect(g); out(g, 0.5); });
    },
    laugh: (t, o) => {
      const n = o.n || 6, f0 = o.f || 120;
      const s = ctx.createOscillator(); s.type = 'sawtooth'; s.start(t); s.stop(t + n * 0.24 + 0.6);
      const nz = src(white, t, n * 0.24 + 0.5); const ng = gain(0.18); nz.connect(ng);
      const mix = gain(1); s.connect(mix); ng.connect(mix);
      const fm = formant(mix, 'a', 7); const ws = shaper(1.8); const g = gain(0); g.gain.setValueAtTime(0.0001, t);
      for (let i = 0; i < n; i++) {
        const tt = t + i * 0.24; s.frequency.setValueAtTime(f0 * (1.25 - i * 0.07), tt); s.frequency.exponentialRampToValueAtTime(f0 * (1.05 - i * 0.07), tt + 0.18);
        g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.55, tt + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.2);
      }
      fm.connect(ws); ws.connect(g); out(g, 0.9, o.pan);
    },
    scream: (t, o) => {
      const dur = o.dur || 1.4, f = o.f || 620;
      const s = osc('sawtooth', f, t, dur); s.frequency.linearRampToValueAtTime(f * 1.45, t + 0.25); s.frequency.linearRampToValueAtTime(f * 1.2, t + dur);
      const v = osc('sine', 7, t, dur), vg = gain(f * 0.04); v.connect(vg); vg.connect(s.frequency);
      const fm = formant(s, 'a', 5), ws = shaper(1.5), g = gain(0); env(g, t, 0.04, dur, 0.5);
      fm.connect(ws); ws.connect(g); out(g, 0.9, o.pan);
    },
    moan: (t, o) => {
      const dur = o.dur || 3.2, f = o.f || 196;
      const s = osc('triangle', f, t, dur); s.frequency.linearRampToValueAtTime(f * 1.3, t + dur * 0.4); s.frequency.linearRampToValueAtTime(f * 0.85, t + dur);
      const v = osc('sine', 4.5, t, dur), vg = gain(f * 0.03); v.connect(vg); vg.connect(s.frequency);
      const fm = formant(s, o.v || 'o', 5), g = gain(0); env(g, t, dur * 0.4, dur * 0.6, 1.2);
      fm.connect(g); out(g, 0.9, o.pan);
    },
    wail: (t, o) => { CUES.moan(t, { f: 620, v: 'i', dur: 3.6, pan: o.pan }); CUES.moan(t + 0.3, { f: 700, v: 'e', dur: 3.2, pan: -(o.pan || 0) }); },
    weep: (t) => { for (let i = 0; i < 4; i++) { const tt = t + i * 0.55; CUES.moan(tt, { f: 330 - i * 15, v: 'u', dur: 0.5 }); burst(tt + 0.45, 0.12, { f: 1800, q: 2, v: 0.1, a: 0.02, wet: 0.5 }); } },
    swish: (t, o) => {
      const dur = o.dur || 3, s = src(white, t, dur), f = filt('bandpass', 900, 0.8), g = gain(0);
      const lfo = osc('sine', 3.2, t, dur), lg = gain(0.4); lfo.connect(lg); lg.connect(g.gain);
      const e = gain(0); env(e, t, 0.4, dur - 0.4, 1.2); s.connect(f); f.connect(g); g.connect(e);
      let n = e; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); const pl = osc('sine', 1.6, t, dur); const pg = gain(0.8); pl.connect(pg); pg.connect(p.pan); e.connect(p); n = p; }
      n.connect(master); const w = gain(0.4); n.connect(w); w.connect(revIn);
    },
    cart: (t) => { for (let i = 0; i < 4; i++) { CUES.creak(t + i * 0.9, { dur: 0.7, f: 480, v: 1.1 }); thump(t + i * 0.9 + 0.4, 110, 0.8, 0.4); } },
    growl: (t, o) => {
      const dur = o.dur || 2.2;
      const s = osc('sawtooth', 70, t, dur); s.frequency.linearRampToValueAtTime(95, t + dur * 0.5); s.frequency.linearRampToValueAtTime(62, t + dur);
      const nz = src(brown, t, dur), ng = gain(0.9); nz.connect(ng);
      const am = gain(0.6), l = osc('sine', 23, t, dur), lg = gain(0.5); l.connect(lg); lg.connect(am.gain);
      const mix = gain(1); s.connect(mix); ng.connect(mix); mix.connect(am);
      const fm = formant(am, 'o', 4), ws = shaper(1.8), g = gain(0); env(g, t, 0.15, dur - 0.15, 1.1);
      fm.connect(ws); ws.connect(g); out(g, 0.5, o.pan);
    },
    quill: (t) => { burst(t, R(0.04, 0.09), { ft: 'highpass', f: R(3000, 5000), v: 0.035, a: 0.005, wet: 0.05 }); },
    page: (t) => { burst(t, 0.28, { f: 2400, from: 900, q: 0.8, v: 0.25, a: 0.02, wet: 0.2 }); },
    candy: (t) => { [72, 76, 79, 84, 88].forEach((m, i) => { const s = osc('sine', mtof(m), t + i * 0.07, 0.6); const g = gain(0); env(g, t + i * 0.07, 0.003, 0.5, 0.15); s.connect(g); out(g, 0.5); }); },
    wave: (t) => { burst(t, 2.6, { brown: true, ft: 'lowpass', f: 500, from: 200, v: 1.2, a: 0.9, wet: 0.5 }); burst(t + 0.8, 1.6, { ft: 'highpass', f: 1500, v: 0.3, a: 0.2, wet: 0.5 }); },
    neigh: (t) => {
      const s = osc('sawtooth', 600, t, 1.2); s.frequency.linearRampToValueAtTime(900, t + 0.2); s.frequency.linearRampToValueAtTime(380, t + 1.1);
      const v = osc('sine', 24, t, 1.2), vg = gain(60); v.connect(vg); vg.connect(s.frequency);
      const fm = formant(s, 'e', 4), g = gain(0); env(g, t, 0.05, 1.1, 0.35); fm.connect(g); out(g, 0.6);
    },
    pad: (t) => { [220, 261.6, 329.6, 110].forEach((f) => { const s = osc('triangle', f, t, 6); const g = gain(0); env(g, t, 1.6, 4, 0.06); s.connect(g); out(g, 0.85); }); },
    click: (t) => { burst(t, 0.02, { f: 3000, q: 4, v: 0.5, a: 0.001, wet: 0.1 }); },
    organ: (t) => playOrgan(t)
  };

  /* Toccata (Bach, domaine public) : ouverture à l'orgue */
  function organNote(t, m, dur, v) {
    const f = mtof(m);
    (LOW ? [[1, 'triangle', 0.3], [2, 'sine', 0.3], [0.5, 'sine', 0.22]] : [[1, 'square', 0.12], [2, 'sine', 0.3], [3, 'sine', 0.15], [4, 'sine', 0.12], [0.5, 'sine', 0.25]]).forEach(([k, type, a]) => {
      const s = osc(type, f * k, t, dur + 0.4); const lp = filt('lowpass', 3200); const g = gain(0);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a * (v || 1) * 0.16, t + 0.02); g.gain.setValueAtTime(a * (v || 1) * 0.16, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);
      s.connect(lp); lp.connect(g); out(g, 0.9);
    });
  }
  function playOrgan(t) {
    const ph = [[81, 0.11], [79, 0.11], [81, 1.3], [79, 0.1], [77, 0.1], [76, 0.1], [74, 0.1], [73, 0.45], [74, 1.5]];
    let x = t;
    for (const [m, d] of ph) { organNote(x, m, d, 1); organNote(x, m - 12, d, 0.9); x += d + 0.03; }
    x += 0.25;
    for (const [m, d] of ph) { organNote(x, m - 12, d * 1.05, 1); organNote(x, m - 24, d * 1.05, 0.9); x += d * 1.05 + 0.03; }
    x += 0.2;
    [38, 50, 61, 64, 67, 70].forEach((m) => organNote(x, m, 2.2, 0.8));
    [38, 50, 62, 65, 69, 74].forEach((m) => organNote(x + 2.4, m, 3.2, 0.9));
    return x + 5.6 - t;
  }

  /* ---------- Musiques en boucle ---------- */
  const SONGS = {
    box: { bpm: 64, notes: [[69, 1], [72, 1], [76, 1], [74, 1], [72, 1], [71, 1], [69, 1], [64, 1], [69, 1], [68, 3], [69, 1], [72, 1], [76, 1], [77, 1], [76, 1], [74, 1], [72, 1], [71, 1], [68, 1], [69, 3], [76, 1], [77, 1], [76, 1], [74, 1], [72, 1], [74, 1], [72, 1], [71, 1], [69, 1], [71, 3], [72, 1], [71, 1], [69, 1], [68, 1], [69, 1], [71, 1], [64, 1.5], [68, 1.5], [69, 3]], bass: [45, 50, 45, 52, 45, 50, 52, 45, 45, 50, 45, 52, 45, 52, 52, 45], bar: 3, voice: 'box', bassVoice: 'box' },
    waltz: { bpm: 138, notes: [[74, 1], [77, 1], [81, 1], [79, 1], [77, 1], [76, 1], [74, 1], [69, 1], [74, 1], [73, 3], [74, 1], [77, 1], [81, 1], [82, 1], [81, 1], [79, 1], [77, 1], [76, 1], [73, 1], [74, 3]], chords: [[50, 53, 57], [55, 58, 62], [50, 53, 57], [45, 49, 55], [50, 53, 57], [55, 58, 62], [45, 49, 55], [50, 53, 57]], bar: 3, voice: 'lead', waltz: true },
    jig: { bpm: 330, notes: [[69, 1], [74, 1], [78, 1], [81, 1], [78, 1], [74, 1], [79, 1], [76, 1], [73, 1], [69, 1], [73, 1], [76, 1], [78, 1], [74, 1], [78, 1], [76, 1], [73, 1], [76, 1], [74, 1], [69, 1], [66, 1], [62, 3], [74, 1], [76, 1], [78, 1], [79, 1], [78, 1], [76, 1], [74, 1], [73, 1], [71, 1], [69, 1], [71, 1], [73, 1], [74, 1], [78, 1], [81, 1], [79, 1], [76, 1], [73, 1], [74, 6]], drone: [50, 57], bar: 6, voice: 'fiddle', stomp: true },
    choir: { bpm: 20, chords: [[50, 53, 57, 62], [46, 50, 53, 58], [43, 46, 50, 55], [45, 49, 52, 57]], bar: 2, voice: 'choir' }
  };
  function voice(kind, t, m, dur, v, dest) {
    const f = mtof(m);
    if (kind === 'box') {
      [[1, 1], [4.2, 0.18], [2, 0.12]].forEach(([k, a]) => { const s = osc('sine', f * k * (1 + R(-0.004, 0.004)), t, 2); const g = gain(0); env(g, t, 0.002, 1.5, 0.16 * a * v); s.connect(g); g.connect(dest); });
    } else if (kind === 'lead') {
      const s = osc('triangle', f, t, dur), vb = osc('sine', 5.5, t, dur), vg = gain(f * 0.008); vb.connect(vg); vg.connect(s.frequency);
      const g = gain(0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95); s.connect(g); g.connect(dest);
    } else if (kind === 'pluck') {
      const s = osc('sawtooth', f, t, 0.5), lp = filt('lowpass', 1400), g = gain(0); env(g, t, 0.005, 0.35, 0.05 * v); s.connect(lp); lp.connect(g); g.connect(dest);
    } else if (kind === 'fiddle') {
      const s = osc('sawtooth', f, t, dur), vb = osc('sine', 6, t, dur), vg = gain(f * 0.01); vb.connect(vg); vg.connect(s.frequency);
      const bp = filt('bandpass', 1800, 0.7), lp = filt('lowpass', 4200), g = gain(0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(bp); bp.connect(lp); lp.connect(g); g.connect(dest);
    } else if (kind === 'choir') {
      (LOW ? [1] : [1, 1.004, 0.996]).forEach((k) => {
        const s = osc('sawtooth', f * k, t, dur + 2), fm = formant(s, Math.random() < 0.5 ? 'a' : 'o', 8), g = gain(0);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * v, t + dur * 0.4); g.gain.setValueAtTime(0.05 * v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.8);
        fm.connect(g); g.connect(dest);
      });
    } else if (kind === 'drone') {
      const s = osc('sawtooth', f, t, dur), lp = filt('lowpass', 700), g = gain(0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03 * v, t + 0.3); g.gain.setValueAtTime(0.03 * v, t + dur - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(lp); lp.connect(g); g.connect(dest);
    }
  }
  function startMusic(name) {
    stopMusic();
    const S = SONGS[name]; if (!S || !ensure()) return;
    const bus = gain(0); bus.connect(musicBus);
    bus.gain.setValueAtTime(0, ctx.currentTime); bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.5);
    musicBus.gain.setTargetAtTime(1, ctx.currentTime, 0.3);
    const m = { name, S, bus, i: 0, beat: 0, t: ctx.currentTime + 0.15, paused: false, bar: 0, timer: 0 };
    const spb = 60 / S.bpm;
    m.timer = setInterval(() => {
      if (!ctx || m.paused) { if (m.paused) m.t = ctx.currentTime + 0.1; return; }
      while (m.t < ctx.currentTime + (LOW ? 0.6 : 0.3)) {
        if (S.chords && !S.notes) {
          const ch = S.chords[m.i % S.chords.length]; const dur = S.bar * spb;
          ch.forEach((n) => voice(S.voice, m.t, n, dur, 1, bus)); m.i++; m.t += dur; continue;
        }
        const nt = S.notes[m.i % S.notes.length];
        const beatInBar = m.beat % S.bar;
        let slow = 1;
        if (name === 'box' && (m.i % S.notes.length) > S.notes.length - 4) slow = 1.18;
        if (beatInBar === 0 || (S.bar === 6 && beatInBar === 3)) {
          const barIdx = Math.floor(m.beat / S.bar);
          if (S.bass) voice(S.bassVoice || 'box', m.t, S.bass[barIdx % S.bass.length] - (name === 'box' ? 12 : 0), spb * S.bar, 0.8, bus);
          if (S.drone && beatInBar === 0) S.drone.forEach((n) => voice('drone', m.t, n, spb * S.bar, 1, bus));
          if (S.stomp) { const g = gain(1); g.connect(bus); const o = ctx.createOscillator(); o.frequency.setValueAtTime(90, m.t); o.frequency.exponentialRampToValueAtTime(40, m.t + 0.1); const gg = gain(0); env(gg, m.t, 0.003, 0.12, 0.35); o.connect(gg); gg.connect(g); o.start(m.t); o.stop(m.t + 0.3); }
        }
        if (S.waltz) {
          const barIdx = Math.floor(m.beat / 3), ch = S.chords[barIdx % S.chords.length];
          if (beatInBar === 0) voice('pluck', m.t, ch[0] - 12, spb, 1.4, bus);
          else ch.forEach((n) => voice('pluck', m.t, n, spb, 0.7, bus));
        }
        voice(S.voice, m.t, nt[0], nt[1] * spb * slow, 1, bus);
        m.t += nt[1] * spb * slow; m.beat += nt[1]; m.i++;
        if (S.waltz && nt[1] > 1) { for (let k = 1; k < nt[1]; k++) { const barIdx = Math.floor((m.beat - nt[1] + k) / 3), ch = S.chords[barIdx % S.chords.length]; ch.forEach((n) => voice('pluck', m.t - (nt[1] - k) * spb, n, spb, 0.7, bus)); } }
      }
    }, 60);
    music = m;
  }
  function stopMusic() {
    if (!music) return; const m = music; music = null; clearInterval(m.timer);
    try { m.bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5); } catch (e) {}
    setTimeout(() => { try { m.bus.disconnect(); } catch (e) {} }, 3000);
  }

  /* ---------- Ambiances continues ---------- */
  function killAmb() {
    if (!amb) return; const a = amb; amb = null;
    try { a.out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5); } catch (e) {}
    clearInterval(a.timer);
    setTimeout(() => a.src.forEach((s) => { try { s.stop(); } catch (e) {} }), 2500);
  }
  function buildAmb() {
    killAmb();
    if (!ambCfg || !ensure()) return;
    const cfg = ambCfg, t = ctx.currentTime;
    const o = gain(0); o.gain.setValueAtTime(0, t); o.gain.linearRampToValueAtTime(1, t + 0.45); out(o, 0.25);
    const S = []; const a = { out: o, src: S, timer: 0 };
    const loopN = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf || white; s.loop = true; s.start(t, Math.random() * 3); S.push(s); return s; };
    const lfo = (f, amt, target) => { const l = ctx.createOscillator(); l.frequency.value = f; l.start(); S.push(l); const g = gain(amt); l.connect(g); g.connect(target); };
    if (cfg.drone) {
      const f = filt('lowpass', 150, 0.8), g = gain(0.05);
      cfg.drone.forEach((hz, i) => { const x = ctx.createOscillator(); x.type = 'sawtooth'; x.frequency.value = hz; x.detune.value = i * 7 - 4; x.start(); S.push(x); x.connect(f); });
      lfo(0.07, 40, f.frequency); f.connect(g); g.connect(o); a.droneG = g; a.droneF = f;
    }
    if (cfg.wind) { const s = loopN(), f = filt('bandpass', 420, 0.8), g = gain(cfg.wind * 0.12); lfo(0.11, 260, f.frequency); lfo(0.05, cfg.wind * 0.05, g.gain); s.connect(f); f.connect(g); g.connect(o); a.windG = g; a.windB = cfg.wind; }
    if (cfg.rain) { const s = loopN(), f = filt('highpass', 2500), f2 = filt('lowpass', 9000), g = gain(cfg.rain * 0.1); s.connect(f); f.connect(f2); f2.connect(g); g.connect(o); const s2 = loopN(brown), l2 = filt('lowpass', 400), g2 = gain(cfg.rain * 0.12); s2.connect(l2); l2.connect(g2); g2.connect(o); }
    if (cfg.sea) { const s = loopN(brown), f = filt('lowpass', 500), g = gain(0); g.gain.value = cfg.sea * 0.25; lfo(0.12, cfg.sea * 0.2, g.gain); s.connect(f); f.connect(g); g.connect(o); }
    if (cfg.fire) { const s = loopN(brown), f = filt('lowpass', 380), g = gain(cfg.fire * 0.3); s.connect(f); f.connect(g); g.connect(o); }
    if (cfg.hum) { const x = ctx.createOscillator(); x.type = 'sawtooth'; x.frequency.value = 60; x.start(); S.push(x); const f = filt('lowpass', 300), g = gain(cfg.hum * 0.03); x.connect(f); f.connect(g); g.connect(o); }
    if (cfg.crickets) {
      (LOW ? [[4300, 13]] : [[4300, 13], [4750, 16], [3900, 11]]).forEach(([hz, rate]) => {
        const x = ctx.createOscillator(); x.frequency.value = hz; x.start(); S.push(x);
        const g = gain(0.004 * cfg.crickets); const l = ctx.createOscillator(); l.type = 'square'; l.frequency.value = rate; l.start(); S.push(l);
        const lg = gain(0.004 * cfg.crickets); l.connect(lg); lg.connect(g.gain); x.connect(g); g.connect(o);
      });
    }
    let n = 0;
    a.timer = setInterval(() => {
      if (!on || !ctx) return; n++;
      const tt = ctx.currentTime + 0.05;
      if (cfg.tick && n % Math.max(1, Math.round(600 / cfg.tick)) === 0) CUES.tick(tt, { v: 0.2 });
      if (cfg.birds && Math.random() < 0.08) { const s = osc('sine', R(2500, 4200), tt, 0.3); s.frequency.exponentialRampToValueAtTime(R(3000, 5200), tt + 0.12); const g = gain(0); env(g, tt, 0.01, 0.12, 0.05); s.connect(g); out(g, 0.4, R(-0.8, 0.8)); }
      if (cfg.crows && Math.random() < 0.006) CUES.crow(tt, { n: 2 });
      if (cfg.owl && Math.random() < 0.004) CUES.owl(tt, { pan: R(-0.8, 0.8) });
      if (cfg.drips && Math.random() < 0.02) CUES.drip(tt, { n: 1 });
      if (cfg.wolves && Math.random() < 0.003) CUES.howl(tt, { p: R(0.9, 1.2), pan: R(-0.8, 0.8) });
      if (cfg.creaks && Math.random() < 0.006) CUES.creak(tt, { dur: R(0.6, 1.4), v: 0.4, pan: R(-0.7, 0.7) });
      if (cfg.whispers && Math.random() < 0.01) CUES.whisper(tt, { dur: R(1.5, 3) });
      if (cfg.waves && Math.random() < 0.012) CUES.wave(tt);
    }, 100);
    amb = a; applyLevel();
  }
  function applyLevel() {
    if (!amb || !ctx) return; const t = ctx.currentTime;
    if (amb.droneG) { amb.droneG.gain.setTargetAtTime(0.04 + ambLvl * 0.2, t, 0.8); amb.droneF.frequency.setTargetAtTime(110 + ambLvl * 520, t, 0.8); }
    if (amb.windG) amb.windG.gain.setTargetAtTime(amb.windB * (0.09 + ambLvl * 0.12), t, 0.8);
  }

  function setHeart(bpm) {
    if (heart) { clearTimeout(heart.t); heart = null; }
    if (!bpm) return;
    const h = { bpm, t: 0 }; heart = h;
    const tick = () => { if (heart !== h) return; if (api.onBeat) api.onBeat(); if (on && ctx) CUES.beat(ctx.currentTime + 0.02, {}); h.t = setTimeout(tick, 60000 / h.bpm * (1 + (Math.random() - 0.5) * 0.04)); };
    tick();
  }

  /* Balise sonore : intensité et panoramique pilotés en continu (recherche à la lanterne) */
  function beacon(kind) {
    if (!on || !ensure()) return { set() {}, stop() {} };
    const t = ctx.currentTime, g = gain(0.0001), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) { g.connect(p); p.connect(master); } else g.connect(master);
    const nodes = []; let timer = 0, level = 0;
    if (kind === 'heart') {
      timer = setInterval(() => { const tt = ctx.currentTime + 0.02; const o1 = osc('sine', 62, tt, 0.4); o1.frequency.exponentialRampToValueAtTime(30, tt + 0.16); const e = gain(0); env(e, tt, 0.004, 0.25, 1); o1.connect(e); e.connect(g); const o2 = osc('sine', 72, tt + 0.17, 0.4); o2.frequency.exponentialRampToValueAtTime(34, tt + 0.33); const e2 = gain(0); env(e2, tt + 0.17, 0.004, 0.25, 0.7); o2.connect(e2); e2.connect(g); }, 60000 / (70 + level * 80));
    } else {
      const s = src(white, t, null); const f = filt('bandpass', 2000, 5); const l = osc('sine', 6, t, 600); const lg = gain(800); l.connect(lg); lg.connect(f.frequency);
      const am = gain(0.5); const l2 = osc('sine', 3.3, t, 600); const lg2 = gain(0.5); l2.connect(lg2); lg2.connect(am.gain);
      s.connect(f); f.connect(am); am.connect(g); nodes.push(s, l, l2);
    }
    return {
      set(v, pan) { level = v; g.gain.setTargetAtTime(Math.max(0.0001, v * 0.9), ctx.currentTime, 0.08); if (p) p.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan || 0)), ctx.currentTime, 0.08); },
      stop() { clearInterval(timer); g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2); setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); try { g.disconnect(); } catch (e) {} }, 800); }
    };
  }

  api.enable = (v) => {
    on = !!v;
    if (on) {
      if (!ensure()) { on = false; return false; }
      unlockMobile();
      try { ctx.resume(); } catch (e) {}
      master.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
      if (ambCfg && !amb) buildAmb();
      if (api._song && !music) startMusic(api._song);
    } else if (master) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      killAmb(); stopMusic();
    }
    return on;
  };
  api.isOn = () => on;
  api.volume = (v) => { vol = v; if (master && on) master.gain.setTargetAtTime(vol, ctx.currentTime, 0.05); };
  api.cue = (name, o) => {
    o = o || {};
    if (!on || !ensure()) return;
    if (ctx.state !== 'running') try { ctx.resume(); } catch (e) {}
    const fn = CUES[name]; if (!fn) return;
    if (live > LIMIT && !PRIO[name]) return;
    cg = o.gain || 1;
    try { fn(ctx.currentTime + (o.delay || 0) + 0.02, o); } catch (e) { console.warn(e); }
    cg = 1;
  };
  /* Baisse l'ambiance et la musique pendant un son mis en avant */
  api.duck = (sec) => {
    if (!ctx) return; const t = ctx.currentTime;
    [amb && amb.out, musicBus].forEach((g) => { if (!g) return; try { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0.2, t, 0.15); g.gain.setTargetAtTime(1, t + (sec || 4), 0.6); } catch (e) {} });
  };
  /* iPhone : le mode silencieux coupe WebAudio. Un son HTML muet bascule la session audio en lecture. */
  function unlockMobile() {
    if (unlocked || !IOS) return; unlocked = true;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try {
      const sr = 8000, n = 800, buf = new ArrayBuffer(44 + n * 2), d = new DataView(buf);
      const w = (o, s) => { for (let i = 0; i < s.length; i++) d.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); d.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
      d.setUint32(24, sr, true); d.setUint32(28, sr * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); w(36, 'data'); d.setUint32(40, n * 2, true);
      let bin = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
      const el = new Audio('data:audio/wav;base64,' + btoa(bin)); el.loop = true; el.setAttribute('playsinline', ''); el.volume = 0.01;
      const p = el.play(); if (p && p.catch) p.catch(() => {});
      api._silent = el;
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; try { if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); } catch (e) {} });
  ['touchend', 'pointerup', 'keydown'].forEach((ev) => document.addEventListener(ev, () => { if (ctx && on && ctx.state !== 'running') try { ctx.resume(); } catch (e) {} }, { passive: true }));
  api.names = Object.keys(CUES);
  api._live = () => live;
  api.ambient = (cfg) => { ambCfg = cfg || null; ambLvl = 0; if (on && cfg) buildAmb(); else killAmb(); };
  api.level = (l) => { ambLvl = l; applyLevel(); };
  api.heart = setHeart;
  api.heartBpm = (b) => { if (heart) heart.bpm = b; };
  api.music = (name) => { api._song = name || null; if (!name) { stopMusic(); return; } if (on) { if (music && music.name === name) return; startMusic(name); } };
  api.musicPause = (b) => { if (music) { music.paused = !!b; if (ctx) music.bus.gain.setTargetAtTime(b ? 0.0001 : 1, ctx.currentTime, b ? 0.05 : 0.3); } };
  api.beacon = beacon;
  api.stopAll = () => { ambCfg = null; killAmb(); setHeart(0); api._song = null; stopMusic(); };
  return api;
})();
