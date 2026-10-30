/* Seal — cadenas et chaînes qui scellent les histoires jusqu'à la fin du décompte. */
window.Seal = (function () {
  'use strict';
  const C = window.Crypte, $ = C.$, $$ = C.$$;
  /* Ouverture : minuit pile, la nuit d'Halloween 2026 (heure locale du visiteur) */
  const UNLOCK = new Date(2026, 9, 31, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  const vaults = [];
  let opened = false;

  const LOCK_SVG =
    '<svg class="pl-svg" viewBox="0 0 120 160" aria-hidden="true"><defs>' +
    '<linearGradient id="plMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6d9de"/><stop offset=".45" stop-color="#7d838b"/><stop offset="1" stop-color="#2c2f34"/></linearGradient>' +
    '<linearGradient id="plBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a5a3c"/><stop offset=".5" stop-color="#3a2f1e"/><stop offset="1" stop-color="#1a140c"/></linearGradient></defs>' +
    '<g class="pl-shackle"><path d="M32 78 V48 a28 28 0 0 1 56 0 V78" fill="none" stroke="url(#plMetal)" stroke-width="13" stroke-linecap="round"/></g>' +
    '<rect x="10" y="70" width="100" height="84" rx="14" fill="url(#plBody)" stroke="#0d0a06" stroke-width="3"/>' +
    '<rect x="16" y="76" width="88" height="6" rx="3" fill="rgba(255,230,180,.18)"/>' +
    '<circle cx="24" cy="92" r="3" fill="#8a7a58"/><circle cx="96" cy="92" r="3" fill="#8a7a58"/><circle cx="24" cy="140" r="3" fill="#8a7a58"/><circle cx="96" cy="140" r="3" fill="#8a7a58"/>' +
    '<circle cx="60" cy="108" r="9" fill="#050403"/><path d="M55 112 h10 l-2 22 h-6 z" fill="#050403"/>' +
    '<path d="M60 70 v84" stroke="rgba(0,0,0,.25)" stroke-width="1"/></svg>';

  function isLocked() { return !opened && !C.T.unseal && Date.now() < UNLOCK.getTime(); }
  function chainHTML(len, ang, top) {
    const n = Math.ceil(len / 27) + 2;
    let s = '<div class="chain" style="width:' + Math.round(len) + 'px;top:' + Math.round(top) + 'px;transform:translate(-50%,-50%) rotate(' + ang.toFixed(1) + 'deg)">';
    for (let i = 0; i < n; i++) s += '<i></i>';
    return s + '</div>';
  }
  function layout(v) {
    const r = v.el.getBoundingClientRect();
    const w = r.width, h = Math.max(r.height, 260);
    const seg = Math.min(h, 640), N = Math.max(1, Math.round(h / seg)), sh = h / N;
    let html = '';
    for (let k = 0; k < N; k++) {
      const cy = sh * (k + 0.5), ang = Math.atan2(sh * 0.8, w) * 180 / Math.PI;
      const len = Math.hypot(w, sh * 0.8) + 80;
      html += chainHTML(len, ang, cy) + chainHTML(len, -ang, cy);
    }
    html += chainHTML(w + 80, 0, 26) + chainHTML(w + 80, 0, h - 26);
    v.chains.innerHTML = html;
    if (v.lk) v.lk.resize();
  }
  function build(host) {
    const wrap = document.createElement('div'); wrap.className = 'vault locked';
    host.parentNode.insertBefore(wrap, host); wrap.appendChild(host);
    const ov = document.createElement('div'); ov.className = 'seal';
    ov.innerHTML = '<canvas class="seal-deep" aria-hidden="true"></canvas><div class="seal-chains" aria-hidden="true"></div>' +
      '<div class="seal-lock"><button class="pl" aria-label="Archives scellées">' + LOCK_SVG.replace(/pl(Metal|Body)/g, 'pl$1' + vaults.length) + '</button>' +
      '<p class="seal-k">Archives scellées</p>' +
      '<p class="seal-t" aria-live="off"><b data-u="d">--</b><small>j</small><b data-u="h">--</b><small>h</small><b data-u="m">--</b><small>min</small><b data-u="s">--</b><small>s</small></p>' +
      '<p class="seal-n">Les chaînes tomberont à minuit, la nuit d\'Halloween.</p></div>';
    wrap.appendChild(ov);
    const v = { el: wrap, chains: ov.querySelector('.seal-chains'), lock: ov.querySelector('.pl'), note: ov.querySelector('.seal-n'), t: ov };
    ov.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); rattle(v); });
    if (window.Lurkers) {
      const cv = ov.querySelector('.seal-deep');
      v.lk = Lurkers.make(cv);
      const pt = (e) => { const r = cv.getBoundingClientRect(); v.lk.point(e.clientX - r.left, e.clientY - r.top); };
      ov.addEventListener('pointermove', pt); ov.addEventListener('pointerdown', pt);
      ov.addEventListener('pointerleave', () => v.lk.point(-9999, -9999));
      v.vis = false;
      new IntersectionObserver((en) => { v.vis = en[0].isIntersecting; syncLk(v); }).observe(wrap);
    }
    vaults.push(v);
    return v;
  }
  function syncLk(v) {
    if (!v.lk) return;
    if (v.vis && !document.hidden && v.el.classList.contains('locked') && v.el.offsetParent) v.lk.start(); else v.lk.stop();
  }
  document.addEventListener('visibilitychange', () => vaults.forEach(syncLk));
  function rattle(v) {
    if (v.lk) v.lk.wake();
    v.lock.classList.remove('shake'); void v.lock.offsetWidth; v.lock.classList.add('shake');
    $$('.chain', v.el).forEach((c) => { c.classList.remove('jolt'); void c.offsetWidth; c.classList.add('jolt'); });
    if (window.Sound) { Sound.cue('chains'); Sound.cue('clang', { f: 180 }); }
    C.vibrate([30, 30, 60]);
    v.note.textContent = 'Pas encore. Reviens quand le décompte touchera zéro.';
    clearTimeout(v.nt); v.nt = setTimeout(() => { v.note.textContent = 'Les chaînes tomberont à minuit, la nuit d\'Halloween.'; }, 3200);
  }
  function tick() {
    if (!vaults.length) return;
    if (!isLocked()) { if (vaults.some((v) => v.el.classList.contains('locked'))) breakOpen(!document.hidden); return; }
    const s = Math.max(0, Math.floor((UNLOCK - Date.now()) / 1000));
    const val = { d: pad(Math.floor(s / 86400)), h: pad(Math.floor(s % 86400 / 3600)), m: pad(Math.floor(s % 3600 / 60)), s: pad(s % 60) };
    vaults.forEach((v) => $$('[data-u]', v.t).forEach((b) => { b.textContent = val[b.dataset.u]; }));
  }
  function breakOpen(animate) {
    const live = vaults.filter((v) => v.el.classList.contains('locked'));
    if (!live.length) return;
    if (!animate) { live.forEach((v) => { v.el.classList.remove('locked'); v.el.classList.add('open'); if (v.lk) v.lk.stop(); }); return; }
    if (window.Sound) { Sound.cue('chains'); Sound.cue('clang', { f: 140 }); Sound.cue('chains', { delay: 0.35 }); Sound.cue('hit', { delay: 0.5 }); Sound.cue('laugh', { f: 110, delay: 0.9 }); }
    C.vibrate([60, 40, 120]);
    live.forEach((v) => {
      v.el.classList.add('breaking');
      if (v.lk) { v.lk.flee(); setTimeout(() => v.lk.stop(), 1700); }
      $$('.chain i', v.el).forEach((l) => {
        l.style.transitionDelay = (Math.random() * 0.35).toFixed(2) + 's';
        l.style.transform = 'translate(' + C.rnd(-140, 140).toFixed(0) + 'px,' + C.rnd(180, 520).toFixed(0) + 'px) rotate(' + C.rnd(-540, 540).toFixed(0) + 'deg)';
      });
      setTimeout(() => { v.el.classList.remove('locked', 'breaking'); v.el.classList.add('open'); }, 1700);
    });
  }
  function refresh() {
    if (isLocked()) {
      vaults.forEach((v) => { if (!v.el.classList.contains('locked')) { v.el.classList.remove('open', 'breaking'); v.el.classList.add('locked'); layout(v); } syncLk(v); });
      tick();
    } else breakOpen(false);
  }
  function init() {
    ['#homeStories', '#storyGrid'].forEach((sel) => { const h = $(sel); if (h) build(h); });
    if (!isLocked()) { breakOpen(false); return; }
    vaults.forEach(layout); tick();
    setInterval(tick, 1000);
    let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => vaults.forEach((v) => { if (v.el.classList.contains('locked')) layout(v); }), 200); });
    if (window.Theatre) {
      const launch = Theatre.launch;
      Theatre.launch = (id) => { if (isLocked()) { const v = vaults.find((x) => x.el.offsetParent) || vaults[0]; if (v) rattle(v); return; } launch(id); };
    }
  }
  /* Démo de l'ouverture depuis l'Atelier, sans lever le vrai verrou */
  function demo() {
    vaults.forEach((v) => { v.el.classList.remove('open'); v.el.classList.add('locked'); layout(v); });
    setTimeout(() => breakOpen(true), 400);
    setTimeout(refresh, 4200);
  }
  C.on('seal:layout', () => vaults.forEach((v) => { if (v.el.classList.contains('locked')) layout(v); syncLk(v); }));
  C.on('theatre', () => vaults.forEach(syncLk));
  return { init, refresh, isLocked, demo, UNLOCK };
})();
