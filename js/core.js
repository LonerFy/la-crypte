/* Crypte — utilitaires, réglages partagés, bus d'événements. */
window.Crypte = (function () {
  'use strict';
  const C = {};
  C.$ = (s, r) => (r || document).querySelector(s);
  C.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  C.rnd = (a, b) => a + Math.random() * (b - a);
  C.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  C.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  C.lerp = (a, b, k) => a + (b - a) * k;
  C.sstep = (a, b, x) => { const t = C.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  C.easeIn = (t) => t * t * t;
  C.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  C.easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  C.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  C.seeded = (seed) => {
    let s = Math.abs(Math.floor(seed * 9301 + 49297)) % 233280 || 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  };

  /* Couleurs */
  C.hex2rgb = (hex) => {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
  };
  C.rgba = (hex, a) => { const c = C.hex2rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (+a).toFixed(3) + ')'; };
  const h2 = (v) => ('0' + Math.round(C.clamp(v, 0, 255)).toString(16)).slice(-2);
  C.mix = (a, b, k) => { const x = C.hex2rgb(a), y = C.hex2rgb(b); return '#' + h2(x[0] + (y[0] - x[0]) * k) + h2(x[1] + (y[1] - x[1]) * k) + h2(x[2] + (y[2] - x[2]) * k); };
  C.shade = (hex, k) => { const x = C.hex2rgb(hex); return '#' + h2(x[0] * k) + h2(x[1] * k) + h2(x[2] * k); };

  /* Stockage local, toujours protégé */
  C.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* Réglages de l'Atelier */
  C.DEFAULT = {
    pal: { ink: '#0b0809', bone: '#dccfb6', blood: '#b3121d', ember: '#e8731c', mold: '#2d3b33' },
    grain: 0.14, vig: 0.62, flicker: 0.6, scan: false,
    trans: 'sang', vol: 0.8, sound: false,
    scares: true, cursor: true, calm: false, intro: 'toujours', speed: 1, unseal: false
  };
  const saved = C.store.get('crypte2.tweaks', {});
  C.T = Object.assign(JSON.parse(JSON.stringify(C.DEFAULT)), saved);
  C.T.pal = Object.assign({}, C.DEFAULT.pal, saved.pal || {});
  C.T.sound = false;
  C.save = () => { const o = JSON.parse(JSON.stringify(C.T)); o.sound = false; C.store.set('crypte2.tweaks', o); };

  /* Bus */
  const subs = {};
  C.on = (e, fn) => { (subs[e] = subs[e] || []).push(fn); };
  C.emit = (e, d) => { (subs[e] || []).forEach((fn) => { try { fn(d); } catch (err) { console.error(err); } }); };

  C.touch = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
  C.lowPower = C.touch || ((navigator.hardwareConcurrency || 8) <= 4) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  C.Q = C.lowPower ? 0.5 : 1;
  C.osReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  C.vibrate = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
  return C;
})();
