/* Theatre — lecteur d'histoire : texte révélé mot à mot, chapitres, journal, presse, dialogues, interactions, sursauts. */
window.Theatre = (function () {
  'use strict';
  const C = window.Crypte, $ = C.$;
  const el = {
    root: $('#story'), cv: $('#scene'), fade: $('#sFade'), chap: $('#sChap'), chapT: $('#sChapT'), prog: $('#sProg'),
    layer: $('#sLayer'), narr: $('#sNarr'), say: $('#sSay'), journal: $('#sJournal'), news: $('#sNews'), big: $('#sBig'),
    whisper: $('#sWhisper'), caption: $('#sCaption'), next: $('#sNext'), act: $('#sAct'), intro: $('#sIntro'), outro: $('#sOutro'), sBtn: $('#sSound')
  };
  const TEXT = ['narr', 'say', 'journal', 'news', 'big'];
  let stage = null, story = null, bi = -1, active = false, mode = 'idle';
  let revealing = false, revealDone = () => {}, revealTimer = 0, tapResolve = null;
  let actCtl = null, timers = [], chapN = 0, quillT = [];
  const api = { onExit: null, onDone: null };
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const sleep = (ms) => new Promise((r) => later(r, ms));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const roman = (n) => { const m = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; };

  function ensureStage() {
    if (stage) return stage;
    stage = new Stage(el.cv, { post: true, dprMax: C.touch ? 1.25 : 1.5, ayP: 0.34 });
    stage.onBolt = () => Sound.cue('thunder', { delay: C.rnd(0.2, 1.3), near: Math.random() < 0.4 });
    return stage;
  }
  function fx(name) {
    const [n, d] = String(name).split('@');
    if (d) later(() => stage && stage.fx(n), +d); else stage.fx(n);
  }
  function cues(list) { (list || []).forEach((q) => Sound.cue(q[0], q[1])); }
  function tweens(o) { if (o) for (const k in o) stage.tween(k, o[k][0], o[k][1]); }

  /* ---------- Texte ---------- */
  function hideText() { TEXT.forEach((k) => { el[k].hidden = true; }); el.next.classList.remove('on'); quillT.forEach(clearTimeout); quillT = []; }
  function words(p, text, step) {
    p.classList.remove('all'); p.textContent = '';
    const frag = document.createDocumentFragment(); let delay = 0;
    const sp = step / (C.T.speed || 1);
    String(text).split(/(\*[^*]+\*)/).forEach((seg) => {
      if (!seg) return;
      const em = seg.length > 2 && seg[0] === '*' && seg[seg.length - 1] === '*';
      (em ? seg.slice(1, -1) : seg).split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span'); s.className = 'w' + (em ? ' em' : ''); s.textContent = w; s.style.animationDelay = Math.round(delay) + 'ms';
        frag.appendChild(s);
        delay += sp + (/[.!?…»]$/.test(w) ? 240 : /[,;:]$/.test(w) ? 100 : 0);
      });
    });
    p.appendChild(frag);
    return delay + 750;
  }
  function showText(kind, b, text) {
    hideText();
    const box = el[kind] || el.narr; box.hidden = false;
    box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
    const p = box.querySelector('p');
    if (kind === 'say') box.querySelector('.who').textContent = b.who || '';
    if (kind === 'journal') { box.querySelector('.who').textContent = b.who || ''; box.querySelector('.date').textContent = b.date || ''; Sound.cue('page'); }
    if (kind === 'news') { box.querySelector('.mast').textContent = b.mast || ''; box.querySelector('.dl').textContent = b.dl || ''; box.querySelector('h3').textContent = b.head || ''; Sound.cue('page'); }
    const dur = words(p, text, kind === 'big' ? 150 : kind === 'journal' ? 62 : kind === 'news' ? 45 : 56);
    if (kind === 'journal') for (let k = 0; k < dur - 700; k += 110) quillT.push(setTimeout(() => Sound.cue('quill'), k));
    mode = 'text'; revealing = true;
    return new Promise((res) => {
      revealDone = () => { if (!revealing) return; revealing = false; clearTimeout(revealTimer); p.classList.add('all'); quillT.forEach(clearTimeout); quillT = []; res(); };
      revealTimer = setTimeout(revealDone, dur);
    });
  }
  function kindOf(b) { return b.t === 'whisper' ? 'narr' : (b.t || 'narr'); }
  function whisper(lines) {
    el.whisper.innerHTML = '';
    lines.forEach((l, i) => {
      const s = document.createElement('span'); s.textContent = l;
      s.style.left = C.rnd(3, 62) + '%'; s.style.top = C.rnd(10, 58) + '%';
      s.style.fontSize = C.rnd(1.1, 2.6).toFixed(2) + 'rem';
      s.style.setProperty('--wd', C.rnd(3.5, 6).toFixed(1) + 's'); s.style.setProperty('--wdl', (i * 0.5).toFixed(1) + 's'); s.style.setProperty('--wo', C.rnd(0.35, 0.8).toFixed(2));
      el.whisper.appendChild(s);
    });
  }
  function caption(txt, num) {
    el.caption.hidden = false; el.caption.textContent = txt; el.caption.classList.toggle('num', !!num);
    el.caption.style.animation = 'none'; void el.caption.offsetWidth; el.caption.style.animation = '';
  }
  function chapter(title) {
    chapN++;
    el.chap.hidden = false; el.chap.querySelector('.n').textContent = 'Chapitre ' + roman(chapN); el.chap.querySelector('.t').textContent = title;
    el.chap.style.animation = 'none'; void el.chap.offsetWidth; el.chap.style.animation = '';
    el.chapT.textContent = roman(chapN) + ' · ' + title;
    Sound.cue('whoosh', { v: 0.25 });
    later(() => { el.chap.hidden = true; }, 2400);
  }
  function waitTap() { mode = 'wait'; el.next.classList.add('on'); return new Promise((r) => { tapResolve = r; }); }
  function ready() { mode = 'ready'; el.next.classList.add('on'); }
  function progress() { Array.from(el.prog.children).forEach((x, k) => x.classList.toggle('on', k <= bi)); }

  async function changeScene(id, tr, set) {
    stage.scare = null;
    if (tr === 'cut') { stage.setScene(id, set); stage.flash = 0.7; Sound.cue('hit'); return; }
    el.fade.classList.add('on'); await sleep(720);
    if (!active) return;
    stage.setScene(id, set);
    el.fade.classList.remove('on'); await sleep(260);
  }
  function runBells(o) {
    Sound.musicPause(true); stage.st.freeze = 1;
    return new Promise((res) => {
      let k = 0;
      const ring = () => {
        if (!active) return res();
        k++; Sound.cue('bell', { f: o.f || 98 }); stage.shake = Math.max(stage.shake, 0.18); stage.pulse = 0.35;
        if (o.count) caption(roman(k), true);
        if (k < o.n) later(ring, o.gap || 1200);
        else later(() => { if (!o.hold) { Sound.musicPause(false); stage.st.freeze = 0; } if (o.count) el.caption.hidden = true; res(); }, 1400);
      };
      later(ring, 500);
    });
  }

  async function runBeat(i) {
    if (!active) return;
    bi = i; const b = story.beats[i]; mode = 'busy';
    el.layer.classList.add('locked'); progress();
    hideText(); el.caption.hidden = true; el.whisper.innerHTML = '';
    if (b.sc && b.sc !== stage.sceneId) await changeScene(b.sc, b.tr, b.set);
    else if (b.set) Object.assign(stage.st, b.set);
    if (!active) return;
    if (b.ch) { chapter(b.ch); await sleep(2000); if (!active) return; }
    if (b.amb !== undefined) Sound.ambient(b.amb);
    if (b.music !== undefined) Sound.music(b.music);
    if (b.lvl != null) { stage.lvlT = b.lvl; Sound.level(b.lvl); }
    if (b.heart != null) Sound.heart(b.heart);
    if (b.cam) stage.camTo(b.cam);
    tweens(b.tw); cues(b.cues); (b.fx || []).forEach(fx);
    if (b.caption) caption(b.caption);
    const bells = b.bells ? runBells(b.bells) : null;
    if (b.t === 'whisper') whisper(b.lines || []);
    el.layer.classList.remove('locked');
    if (b.text) await showText(kindOf(b), b, b.text);
    if (!active || bi !== i) return;
    if (b.act) { await runAct(b.act); return; }
    if (bells) { mode = 'busy'; await bells; }
    if (!active || bi !== i) return;
    ready();
  }
  function next() { if (bi >= story.beats.length - 1) finish(); else runBeat(bi + 1); }
  function advance() {
    if (!active) return;
    if (mode === 'text' && revealing) { revealDone(); return; }
    if (mode === 'wait' && tapResolve) { const r = tapResolve; tapResolve = null; el.next.classList.remove('on'); r(); return; }
    if (mode === 'ready') { el.next.classList.remove('on'); next(); }
  }

  /* ---------- Interactions ---------- */
  function openAct(type, html) {
    el.act.hidden = false; el.act.className = 's-act t-' + type; el.act.innerHTML = html;
    el.layer.classList.add('locked');
    return el.act;
  }
  function closeAct() {
    if (actCtl && actCtl.cleanup) try { actCtl.cleanup(); } catch (e) {}
    actCtl = null; stage.onFrame = null; el.act.hidden = true; el.act.innerHTML = '';
  }
  function keyAct(down, up) {
    const kd = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) down(e); } };
    const ku = (e) => { if ((e.key === ' ' || e.key === 'Enter') && up) { e.preventDefault(); up(e); } };
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    return () => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }
  const ACTS = {
    hold(a) {
      return new Promise((res) => {
        const box = openAct('hold', '<p class="ask">' + esc(a.ask) + '</p><button class="a-hold" aria-label="' + esc(a.label || 'Maintenir') + '"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bg" cx="50" cy="50" r="46"/><circle class="fg" cx="50" cy="50" r="46" stroke-dasharray="289" stroke-dashoffset="289"/></svg><span>' + esc(a.label || 'Tenir') + '</span></button><p class="tip">' + esc(a.tip || '') + '</p><p class="fb"></p>');
        const btn = box.querySelector('.a-hold'), fg = box.querySelector('.fg'), fb = box.querySelector('.fb');
        let p = 0, on = false, fails = 0, done = false; const dur = a.dur || 5;
        if (a.set) Object.assign(stage.st, a.set);
        if (a.heart) Sound.heart(a.heart[0]);
        const down = (e) => { if (e && e.preventDefault) e.preventDefault(); on = true; btn.classList.add('on'); if (e && e.pointerId != null) try { btn.setPointerCapture(e.pointerId); } catch (_) {} };
        const up = () => { if (!on || done) return; on = false; btn.classList.remove('on'); if (p > 0.05) { fails++; fb.textContent = a.failMsg || 'Recommence.'; if (a.failCue) Sound.cue(a.failCue); stage.shake = Math.max(stage.shake, 0.5); } };
        btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('lostpointercapture', up);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
        const unkey = keyAct(down, up);
        stage.onFrame = (dt) => {
          if (done) return;
          p = on ? Math.min(1, p + dt / dur) : Math.max(0, p - dt * 0.6);
          fg.style.strokeDashoffset = (289 * (1 - p)).toFixed(1);
          if (a.heart) Sound.heartBpm(C.lerp(a.heart[0], a.heart[1], p));
          if (a.bind) stage.st[a.bind] = (a.bindFrom || 0) + ((a.bindTo == null ? 1 : a.bindTo) - (a.bindFrom || 0)) * p;
          stage.lvlT = Math.max(stage.lvlT, 0.3 + p * 0.5);
          if (p >= 1) { done = true; stage.onFrame = null; Sound.cue('hit'); if (a.heart) Sound.heart(0); res({ win: fails === 0 }); }
        };
        actCtl = { force: () => { on = true; p = 1; }, cleanup: unkey };
      });
    },
    mash(a) {
      return new Promise((res) => {
        const box = openAct('mash', '<p class="ask">' + esc(a.ask) + '</p><button class="a-mash">' + esc(a.label || 'Vite !') + '</button><div class="a-bars"><small>Avance</small><div class="a-bar"><i></i></div><small>Temps</small><div class="a-bar time"><i></i></div></div><p class="tip">' + esc(a.tip || '') + '</p>');
        const btn = box.querySelector('.a-mash'), [pb, tb] = box.querySelectorAll('.a-bar i');
        let prog = 0, t = 0, done = false; const N = a.n || 15, T = a.time || 5;
        if (a.set) Object.assign(stage.st, a.set);
        const hit = (e) => { if (e && e.preventDefault) e.preventDefault(); if (done) return; prog = Math.min(1, prog + 1 / N); btn.classList.add('hit'); setTimeout(() => btn.classList.remove('hit'), 70); if (a.tapCue) Sound.cue(a.tapCue); stage.shake = Math.max(stage.shake, 0.25); C.vibrate(12); };
        btn.addEventListener('pointerdown', hit);
        const unkey = keyAct(hit);
        const fin = (w) => { if (done) return; done = true; stage.onFrame = null; res({ win: w }); };
        stage.onFrame = (dt) => {
          if (done) return; t += dt;
          if (a.decay) prog = Math.max(0, prog - a.decay * dt);
          pb.style.transform = 'scaleX(' + prog.toFixed(3) + ')'; tb.style.transform = 'scaleX(' + Math.min(1, t / T).toFixed(3) + ')';
          if (a.bind) stage.st[a.bind] = (a.bindFrom || 0) + ((a.bindTo == null ? 1 : a.bindTo) - (a.bindFrom || 0)) * prog;
          if (prog >= 1) fin(true); else if (t >= T) fin(false);
        };
        actCtl = { force: () => { prog = 1; }, cleanup: unkey };
      });
    },
    search(a) {
      return new Promise((res) => {
        openAct('search', '<div class="torch-tip"><p class="ask">' + esc(a.ask) + '</p><p class="tip">' + esc(a.tip || 'Promène la lumière') + '</p></div>');
        const hs = stage.scene && stage.scene.hot && stage.scene.hot[a.spot];
        if (!hs) { res({ win: true }); return; }
        const T = stage.torch = { on: true, x: stage.w * 0.5, y: stage.h * 0.82, r: Math.min(stage.w, stage.h) * 0.17 + 50, dark: 0.95, tx: null, ty: null };
        let dwell = 0, t = 0, done = false;
        const bc = a.beacon ? Sound.beacon(a.beacon) : null;
        const move = (e) => { const r = el.root.getBoundingClientRect(); T.tx = e.clientX - r.left; T.ty = e.clientY - r.top; };
        el.root.addEventListener('pointermove', move); el.root.addEventListener('pointerdown', move);
        const kd = (e) => { const s = 40; if (e.key === 'ArrowLeft') T.tx = (T.tx == null ? T.x : T.tx) - s; else if (e.key === 'ArrowRight') T.tx = (T.tx == null ? T.x : T.tx) + s; else if (e.key === 'ArrowUp') T.ty = (T.ty == null ? T.y : T.ty) - s; else if (e.key === 'ArrowDown') T.ty = (T.ty == null ? T.y : T.ty) + s; else return; e.preventDefault(); };
        document.addEventListener('keydown', kd);
        const cleanup = () => { el.root.removeEventListener('pointermove', move); el.root.removeEventListener('pointerdown', move); document.removeEventListener('keydown', kd); if (bc) bc.stop(); stage.hint = null; };
        const found = () => {
          if (done) return; done = true; stage.onFrame = null; cleanup();
          if (a.set) Object.assign(stage.st, a.set); cues(a.cues);
          let k = 0; const fadeT = setInterval(() => { k += 0.08; T.r *= 1.12; T.dark = 0.95 * (1 - k); if (k >= 1) { clearInterval(fadeT); if (stage.torch === T) stage.torch = null; } }, 30);
          res({ win: true });
        };
        stage.onFrame = (dt) => {
          if (done) return; t += dt;
          if (T.tx != null) { const k = 1 - Math.exp(-dt * 10); T.x += (T.tx - T.x) * k; T.y += (T.ty - T.y) * k; }
          const p = stage.toScreen(hs.x, hs.y, hs.d), R = hs.r * p.s;
          const d = Math.hypot(T.x - p.x, T.y - p.y);
          const prox = C.clamp(1 - d / (Math.max(stage.w, stage.h) * 0.55), 0, 1);
          if (bc) bc.set(prox * prox, (p.x - T.x) / stage.w * 2);
          if (d < R + T.r * 0.3) { dwell += dt; if (dwell > 0.7) found(); } else dwell = Math.max(0, dwell - dt * 0.5);
          if (t > 15 && !stage.hint) stage.hint = hs;
        };
        actCtl = { force: found, cleanup: () => { cleanup(); stage.torch = null; } };
      });
    },
    drag(a) {
      return new Promise((res) => {
        const v = a.dir === 'v';
        const box = openAct('drag', '<p class="ask">' + esc(a.ask) + '</p><div class="a-track' + (v ? ' v' : '') + '"><div class="fill"></div><div class="a-knob" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="' + esc(a.ask) + '"></div></div><p class="tip">' + esc(a.tip || '') + '</p><p class="fb"></p>');
        const track = box.querySelector('.a-track'), knob = box.querySelector('.a-knob'), fill = box.querySelector('.fill'), fb = box.querySelector('.fb');
        let val = 0, drag = false, lastX = 0, lastT = 0, spd = 0, fails = 0, done = false;
        if (a.set) Object.assign(stage.st, a.set);
        const setVal = (x) => {
          val = C.clamp(x, 0, 1);
          if (v) { knob.style.top = 'calc(' + (val * 100) + '% - ' + (val * 50) + 'px)'; fill.style.height = (val * 100) + '%'; }
          else { knob.style.left = 'calc(' + (val * 100) + '% - ' + (val * 50) + 'px)'; fill.style.width = (val * 100) + '%'; }
          knob.setAttribute('aria-valuenow', Math.round(val * 100));
          if (a.bind) stage.st[a.bind] = val;
          if (val >= 0.98 && !done) { done = true; Sound.cue('hit'); res({ win: fails === 0 }); }
        };
        const pos = (e) => { const r = track.getBoundingClientRect(); return v ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width; };
        const fail = () => { fails++; drag = false; spd = 0; if (a.failCue) Sound.cue(a.failCue, { dur: 0.9 }); fb.textContent = a.failMsg || 'Trop vite !'; stage.shake = Math.max(stage.shake, 0.5); setVal(Math.max(0, val - 0.22)); };
        const down = (e) => { e.preventDefault(); drag = true; lastX = pos(e); lastT = performance.now(); try { track.setPointerCapture(e.pointerId); } catch (_) {} };
        const move = (e) => {
          if (!drag || done) return;
          const now = performance.now(), x = pos(e), dt = Math.max(1, now - lastT) / 1000;
          const nv = C.clamp(Math.max(val, x), 0, 1);
          const inst = (nv - val) / dt; spd = spd * 0.75 + inst * 0.25; lastT = now;
          if (a.max && spd > a.max * 2.2) { fail(); return; }
          setVal(nv);
        };
        const up = () => { drag = false; };
        track.addEventListener('pointerdown', down); track.addEventListener('pointermove', move); track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
        knob.addEventListener('keydown', (e) => { if (['ArrowRight', 'ArrowDown', 'ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); setVal(val + 0.05); } });
        setTimeout(() => knob.focus({ preventScroll: true }), 50);
        actCtl = { force: () => setVal(1) };
      });
    },
    choice(a) {
      return new Promise((res) => {
        const box = openAct('choice', '<p class="ask">' + esc(a.ask) + '</p><div class="a-opts">' + a.opts.map((o, i) => '<button class="btn" data-i="' + i + '">' + esc(o.label) + '</button>').join('') + '</div>');
        let done = false;
        box.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (!b || done) return; done = true; Sound.cue('click'); res({ win: true, opt: +b.dataset.i }); });
        actCtl = { force: () => { if (!done) { done = true; res({ win: true, opt: 0 }); } } };
      });
    },
    seq(a) {
      return new Promise((res) => {
        const box = openAct('seq', '<p class="ask">' + esc(a.ask) + '</p><button class="btn primary a-seq"></button><p class="tip">' + esc(a.tip || '') + '</p>');
        const btn = box.querySelector('.a-seq'); let k = 0, busy = false, hadText = false, finished = false;
        const label = () => { btn.textContent = a.steps[k].label; btn.disabled = false; };
        label();
        const run = async () => {
          if (busy || finished) return; busy = true; btn.disabled = true;
          const s = a.steps[k];
          if (s.set) Object.assign(stage.st, s.set); tweens(s.tw); cues(s.cues); (s.fx || []).forEach(fx);
          if (s.cam) stage.camTo(s.cam); if (s.heart != null) Sound.heart(s.heart);
          if (s.cap) caption(s.cap);
          hadText = false;
          if (s.text || s.then) {
            el.act.hidden = true;
            if (s.text) { await showText('narr', {}, s.text); await sleep(s.wait || 800); }
            if (s.then) { await showText('narr', {}, s.then); }
            hadText = true;
            if (k < a.steps.length - 1) { await waitTap(); hideText(); }
          } else await sleep(s.wait || 800);
          if (!active || finished) return;
          k++;
          if (k >= a.steps.length) { finished = true; res({ win: true, auto: hadText }); return; }
          el.caption.hidden = true; el.act.hidden = false; mode = 'act'; label(); busy = false;
        };
        btn.addEventListener('click', run);
        const unkey = keyAct(() => { if (!el.act.hidden) run(); });
        setTimeout(() => btn.focus({ preventScroll: true }), 50);
        actCtl = { force: () => { if (finished) return; finished = true; for (let j = k; j < a.steps.length; j++) { const s = a.steps[j]; if (s.set) Object.assign(stage.st, s.set); tweens(s.tw); } res({ win: true }); }, cleanup: unkey };
      });
    }
  };
  async function runAct(a) {
    mode = 'act'; el.next.classList.remove('on');
    cues(a.startCues);
    let r;
    try { r = await ACTS[a.type](a); } catch (e) { console.error(e); r = { win: true }; }
    const i = bi;
    closeAct();
    el.layer.classList.remove('locked');
    if (!active) return;
    let text, set, cs, fs, tw;
    if (a.type === 'choice') { const o = a.opts[r.opt] || a.opts[0]; text = o.text; set = o.set; cs = o.cues; fs = o.fx; }
    else { text = r.win ? a.win : (a.fail || a.win); set = r.win ? a.winSet : (a.failSet || a.winSet); cs = r.win ? a.winCues : (a.failCues || a.winCues); fs = r.win ? a.winFx : (a.failFx || a.winFx); tw = a.winTw; }
    if (set) Object.assign(stage.st, set);
    tweens(tw); cues(cs); (fs || []).forEach(fx);
    if (a.type === 'seq' && a.winSet) Object.assign(stage.st, a.winSet);
    if (text) await showText('narr', {}, text);
    if (!active || bi !== i) return;
    ready();
  }

  /* ---------- Ouverture, début, fin ---------- */
  function updSound() { el.sBtn.textContent = 'Son : ' + (C.T.sound ? 'on' : 'off'); el.sBtn.setAttribute('aria-pressed', C.T.sound ? 'true' : 'false'); }
  function open(id) {
    story = (window.STORIES || []).find((s) => s.id === id);
    if (!story) return false;
    active = true; mode = 'intro'; bi = -1; chapN = 0; timers.forEach(clearTimeout); timers = [];
    el.root.hidden = false; el.root.classList.remove('cine'); el.root.style.setProperty('--sa', story.accent);
    hideText(); el.whisper.innerHTML = ''; el.caption.hidden = true; el.act.hidden = true; el.outro.hidden = true; el.chap.hidden = true; el.fade.classList.remove('on');
    el.prog.innerHTML = story.beats.map(() => '<i></i>').join('');
    el.chapT.textContent = story.title;
    $('#iKicker').textContent = 'Dossier · ' + story.year;
    $('#iTitle').textContent = story.title;
    $('#iBy').textContent = story.author + ' · environ ' + story.dur;
    $('#iAdv').textContent = story.adv;
    $('#iBadges').innerHTML = (story.badges || []).map((b) => '<span>' + esc(b) + '</span>').join('');
    el.intro.hidden = false;
    document.body.classList.add('lock');
    ensureStage(); stage.resize();
    stage.grade = story.grade || [0.59, 0.59, 0.59];
    const b0 = story.beats[0];
    stage.setScene(b0.sc, b0.set); stage.lvlT = 0.1; stage.lvl = 0.1; stage.black = stage.blackT = 0;
    stage.scare = null; stage.torch = null; stage.hint = null;
    stage.start();
    Sound.stopAll(); Sound.onBeat = () => stage && stage.beat();
    updSound();
    setTimeout(() => { const b = $('#iSound'); if (b && !el.intro.hidden) b.focus({ preventScroll: true }); }, 60);
    C.emit('theatre', true);
    return true;
  }
  function begin(withSound) {
    if (mode !== 'intro') return;
    C.T.sound = !!withSound; Sound.enable(C.T.sound); updSound(); C.emit('sound', C.T.sound);
    el.intro.hidden = true; el.root.classList.add('cine');
    Sound.cue('braam', { dur: 2.4 });
    runBeat(0);
  }
  function finish() {
    mode = 'outro'; Sound.heart(0); Sound.music(null);
    stage.lvlT = 0.25; Sound.level(0.25);
    hideText(); el.caption.hidden = true; el.whisper.innerHTML = '';
    el.outro.hidden = false;
    $('#oTitle').textContent = story.title; $('#oLine').textContent = story.outro || '';
    const list = window.STORIES, nx = list[(list.indexOf(story) + 1) % list.length];
    $('#oNext').textContent = 'Suivant : ' + nx.title; $('#oNext').dataset.id = nx.id;
    C.emit('story:done', story.id);
  }
  function close() {
    active = false; mode = 'idle'; timers.forEach(clearTimeout); timers = []; clearTimeout(revealTimer); revealing = false; tapResolve = null;
    if (actCtl && actCtl.cleanup) try { actCtl.cleanup(); } catch (e) {}
    actCtl = null; el.act.hidden = true; el.act.innerHTML = '';
    if (stage) { stage.onFrame = null; stage.torch = null; stage.hint = null; stage.scare = null; stage.stop(); }
    Sound.stopAll(); Sound.onBeat = null;
    hideText(); el.root.hidden = true; el.root.classList.remove('cine');
    document.body.classList.remove('lock');
    C.emit('theatre', false);
  }
  function exit(to) {
    if (!active && el.root.hidden) return;
    Veil.run(C.T.trans, () => { close(); if (api.onExit) api.onExit(to); });
  }
  function launch(id) {
    Veil.run(C.T.trans, () => { open(id); });
  }

  el.layer.addEventListener('click', advance);
  $('#iSound').addEventListener('click', () => begin(true));
  $('#iSilent').addEventListener('click', () => begin(false));
  $('#sExit').addEventListener('click', () => exit());
  $('#oBack').addEventListener('click', () => exit('histoires'));
  $('#oAgain').addEventListener('click', () => Veil.run(C.T.trans, () => { const id = story.id; close(); open(id); }));
  $('#oNext').addEventListener('click', (e) => { const id = e.currentTarget.dataset.id; Veil.run(C.T.trans, () => { close(); open(id); }); });
  el.sBtn.addEventListener('click', () => { C.T.sound = !C.T.sound; Sound.enable(C.T.sound); updSound(); C.emit('sound', C.T.sound); });
  document.addEventListener('keydown', (e) => {
    if (!active) return;
    if (e.key === 'Escape') { e.preventDefault(); exit(); return; }
    if (mode === 'act' || mode === 'intro' || mode === 'outro') return;
    const tag = document.activeElement && document.activeElement.tagName;
    if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') && tag !== 'BUTTON' && tag !== 'INPUT') { e.preventDefault(); advance(); }
  });
  el.root.addEventListener('pointermove', (e) => { if (!stage) return; if (e.pointerType === 'touch') stage.lookT = 3; stage.ptr.tx = (e.clientX / window.innerWidth) * 2 - 1; stage.ptr.ty = (e.clientY / window.innerHeight) * 2 - 1; });
  C.on('sound', updSound);

  window.__crypte = {
    mode: () => mode, beat: () => bi, story: () => story && story.id,
    step() { if (mode === 'intro') begin(false); else if (mode === 'act' && actCtl) actCtl.force(); else if (mode === 'wait' || mode === 'text' || mode === 'ready') advance(); }
  };

  api.open = open; api.launch = launch; api.exit = exit; api.close = close; api.isOpen = () => active;
  api.updSound = updSound;
  return api;
})();
