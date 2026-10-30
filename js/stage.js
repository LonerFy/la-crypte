/* Stage — rendu d'une scène peinte : caméra, parallaxe, éclairage, éclairs, sursauts, post-traitement WebGL. */
window.Stage = (function () {
  'use strict';
  const C = window.Crypte, P = window.Paint;

  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*0.5+0.5;gl_Position=vec4(p,0.,1.);}';
  const FS = [
    'precision mediump float;',
    'uniform sampler2D t;uniform vec2 res;uniform float time,ab,warp,grain,vig,flash,desat,tintAmt;uniform vec3 tint;',
    'varying vec2 v;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
    'void main(){',
    ' vec2 c=v-0.5; float r2=dot(c,c);',
    ' vec2 uv=0.5+c*(1.0-warp*r2);',
    ' vec2 d=c*ab;',
    ' vec3 col=vec3(texture2D(t,uv+d).r,texture2D(t,uv).g,texture2D(t,uv-d).b);',
    ' float l=dot(col,vec3(.299,.587,.114));',
    ' col=mix(col,vec3(l),desat);',
    ' col=mix(col,col*tint*1.7,tintAmt);',
    ' col=pow(col,vec3(1.04));',
    ' col*=1.0-vig*smoothstep(0.08,0.75,r2*1.7);',
    ' col+=(h(v*res+fract(time)*91.0)-0.5)*grain;',
    ' col+=flash;',
    ' gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  function makePost(cv) {
    let gl = null;
    try { gl = cv.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false }) || cv.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      const pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      const U = {}; ['t', 'res', 'time', 'ab', 'warp', 'grain', 'vig', 'flash', 'desat', 'tintAmt', 'tint'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
      return { gl, U };
    } catch (e) { console.warn('post-fx off', e); return null; }
  }

  class Stage {
    constructor(canvas, opts) {
      this.out = canvas; this.o = Object.assign({ post: false, dprMax: 1.5, lightRes: 0.5 }, opts || {});
      if (C.lowPower) { this.o.dprMax = Math.min(this.o.dprMax, this.o.post ? 1 : 1.25); this.o.lightRes = Math.min(this.o.lightRes, 0.34); this.o.darkMul = (this.o.darkMul || 1) * 0.86; }
      this.lookT = 0;
      this.post = null;
      if (this.o.post) {
        this.post = makePost(canvas);
        if (this.post) { this.cv = document.createElement('canvas'); }
      }
      if (!this.post) this.cv = canvas;
      this.ctx = this.cv.getContext('2d');
      this.lm = document.createElement('canvas'); this.lc = this.lm.getContext('2d');
      this.scene = null; this.st = {};
      this.cam = { x: 800, y: 450, z: 1, tx: 800, ty: 450, tz: 1, k: 1.2 };
      this.ptr = { x: 0, y: 0, tx: 0, ty: 0 };
      this.par = { x: 0, y: 0 };
      this.lvl = 0; this.lvlT = 0;
      this.flash = 0; this.shake = 0; this.pulse = 0; this.bump = 0; this.black = 0; this.blackT = 0;
      this.bolt = null; this.nextBolt = 3;
      this.scare = null; this.torch = null; this.hint = null;
      this.tw = []; this.t = 0; this.last = 0; this.raf = 0; this.running = false;
      this.view = { x0: 0, y0: 0, x1: 1600, y1: 900 };
      this.grade = [0.59, 0.59, 0.59]; this.gradeAmt = 0.25; this.desat = 0.15;
      this.sx = 0; this.sy = 0; this.dt = 0.016;
      this.onFrame = null; this.onBolt = null;
      this.focusMobile = null;
      this.resize();
      this._rs = () => this.resize();
      window.addEventListener('resize', this._rs);
    }
    resize() {
      const r = this.out.getBoundingClientRect();
      this.w = Math.max(1, r.width || this.out.clientWidth || 300); this.h = Math.max(1, r.height || this.out.clientHeight || 200);
      this.dpr = Math.min(window.devicePixelRatio || 1, this.o.dprMax);
      const W = Math.round(this.w * this.dpr), H = Math.round(this.h * this.dpr);
      this.cv.width = W; this.cv.height = H;
      if (this.post) { this.out.width = W; this.out.height = H; this.post.gl.viewport(0, 0, W, H); }
      this.lm.width = Math.max(1, Math.round(this.w * this.o.lightRes)); this.lm.height = Math.max(1, Math.round(this.h * this.o.lightRes));
      const portrait = this.h > this.w * 1.05;
      this.portrait = portrait;
      this.s0 = Math.max(this.w / 1600, Math.min(this.h / 900, this.w / (this.o.minW || 700)));
      this.ax = this.w / 2; this.ay = this.h * (portrait ? (this.o.ayP || 0.4) : 0.5);
    }
    destroy() { this.stop(); window.removeEventListener('resize', this._rs); }

    setScene(id, set) {
      const sc = (window.SCENES || {})[id];
      if (!sc) { console.warn('scène inconnue', id); return; }
      this.scene = sc; this.sceneId = id; this.st = {};
      if (sc.init) sc.init(this.st, this);
      if (set) Object.assign(this.st, set);
      const f = sc.focus || [800, 450];
      this.cam.x = this.cam.tx = f[0]; this.cam.y = this.cam.ty = f[1]; this.cam.z = this.cam.tz = sc.zoom || 1;
      this.tw = []; this.bolt = null; this.nextBolt = this.t + 2 + Math.random() * 3;
      this.desat = sc.desat == null ? 0.12 : sc.desat;
    }
    camTo(o) {
      if (!o) return;
      if (o.x != null) this.cam.tx = o.x; if (o.y != null) this.cam.ty = o.y; if (o.z != null) this.cam.tz = o.z;
      this.cam.k = o.k || 1.2;
    }
    tween(key, to, dur, ease) { const from = this.st[key] == null ? 0 : this.st[key]; this.tw = this.tw.filter((x) => x.key !== key); this.tw.push({ key, from, to, dur: Math.max(0.01, dur), t: 0, ease: ease || C.easeIO }); }
    fx(name) {
      const [n, arg] = String(name).split(':');
      switch (n) {
        case 'flash': this.flash = 1; break;
        case 'shake': this.shake = Math.max(this.shake, arg ? +arg : 1); break;
        case 'pulse': this.pulse = 1; break;
        case 'bolt': this.strike(); break;
        case 'black': this.blackT = 1; break;
        case 'light': this.blackT = 0; break;
        case 'scare':
          if (C.T.scares) { this.scare = { kind: arg || 'face', t: 0, dur: 1.15 }; window.Sound && Sound.cue('scare'); C.vibrate([80, 40, 160]); }
          else { this.flash = 0.8; this.shake = 1; window.Sound && Sound.cue('sting'); }
          break;
      }
    }
    strike(x) {
      const sc = this.scene || {};
      const bx = x != null ? x : (sc.boltX != null ? sc.boltX + (Math.random() - 0.5) * 120 : this.view.x0 + Math.random() * (this.view.x1 - this.view.x0));
      const by = sc.boltY != null ? sc.boltY : 560;
      this.bolt = P.makeBolt(bx + (Math.random() - 0.5) * 300, this.view.y0 - 40, bx, by);
      this.flash = 1;
      if (this.onBolt) this.onBolt();
    }
    beat() { this.bump = 1; this.pulse = Math.max(this.pulse, 0.35 + this.lvl * 0.5); }

    toScreen(x, y, d) {
      const s = this.s0 * this.cam.z * (1 + this.bump * 0.012 * this.lvl);
      const dd = d == null ? 1 : d;
      return { x: this.ax + this.par.x * dd + this.sx + (x - this.cam.x) * s, y: this.ay + this.par.y * dd + this.sy + (y - this.cam.y) * s, s };
    }
    toStage(sx, sy, d) {
      const s = this.s0 * this.cam.z * (1 + this.bump * 0.012 * this.lvl);
      const dd = d == null ? 1 : d;
      return { x: this.cam.x + (sx - this.ax - this.par.x * dd - this.sx) / s, y: this.cam.y + (sy - this.ay - this.par.y * dd - this.sy) / s };
    }
    layer(d) {
      const dd = d == null ? 1 : d;
      const s = this.s0 * this.cam.z * (1 + this.bump * 0.012 * this.lvl);
      const ox = this.ax + this.par.x * dd + this.sx, oy = this.ay + this.par.y * dd + this.sy;
      this.ctx.setTransform(this.dpr * s, 0, 0, this.dpr * s, this.dpr * (ox - this.cam.x * s), this.dpr * (oy - this.cam.y * s));
      const v = this.view;
      v.x0 = this.cam.x + (0 - ox) / s; v.x1 = this.cam.x + (this.w - ox) / s;
      v.y0 = this.cam.y + (0 - oy) / s; v.y1 = this.cam.y + (this.h - oy) / s;
      v.s = s;
      return v;
    }
    screen() { this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }

    start() { if (this.running) return; this.running = true; this.last = performance.now(); const loop = (ts) => { if (!this.running) return; this.raf = requestAnimationFrame(loop); if (C.lowPower && ts - (this._lr || 0) < 30) return; this._lr = ts; this.frame(ts); }; this.raf = requestAnimationFrame(loop); }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }

    frame(ts) {
      const dt = Math.min(0.05, Math.max(0, (ts - this.last) / 1000)); this.last = ts;
      this.step(dt);
      this.render();
    }
    step(dt) {
      this.t += dt; const t = this.t;
      this.dt = dt;
      const k = 1 - Math.exp(-dt * this.cam.k);
      this.cam.x += (this.cam.tx - this.cam.x) * k; this.cam.y += (this.cam.ty - this.cam.y) * k; this.cam.z += (this.cam.tz - this.cam.z) * k;
      this.ptr.x += (this.ptr.tx - this.ptr.x) * (1 - Math.exp(-dt * 3)); this.ptr.y += (this.ptr.ty - this.ptr.y) * (1 - Math.exp(-dt * 3));
      const amp = C.T.calm ? 0 : 1;
      if (C.touch && this.lookT <= 0) { this.ptr.tx = Math.sin(t * 0.13) * 0.8; this.ptr.ty = Math.sin(t * 0.09 + 1) * 0.4; }
      this.lookT -= dt;
      this.par.x = (-this.ptr.x * 26 + Math.sin(t * 0.21) * 7) * amp; this.par.y = (-this.ptr.y * 14 + Math.sin(t * 0.17 + 1) * 5) * amp;
      this.lvl += (this.lvlT - this.lvl) * (1 - Math.exp(-dt * 0.8));
      this.flash *= Math.exp(-dt * 5); this.pulse *= Math.exp(-dt * 3.2); this.bump *= Math.exp(-dt * 7);
      this.shake *= Math.exp(-dt * 4);
      const sh = C.T.calm ? this.shake * 0.25 : this.shake;
      this.sx = (Math.random() - 0.5) * 22 * sh; this.sy = (Math.random() - 0.5) * 22 * sh;
      this.black += (this.blackT - this.black) * (1 - Math.exp(-dt * 2.2));
      for (const x of this.tw) { x.t += dt; const p = C.clamp(x.t / x.dur, 0, 1); this.st[x.key] = x.from + (x.to - x.from) * x.ease(p); }
      this.tw = this.tw.filter((x) => x.t < x.dur);
      if (this.bolt) { this.bolt.life -= dt * 2.4; if (this.bolt.life <= 0) this.bolt = null; }
      const sc = this.scene;
      if (sc && (sc.storm || this.st.storm) && !this.st.noStorm && t > this.nextBolt) {
        this.strike(); this.nextBolt = t + (4 + Math.random() * 7) / (0.6 + this.lvl);
      }
      if (this.scare) { this.scare.t += dt; if (this.scare.t > this.scare.dur) this.scare = null; }
      if (this.onFrame) this.onFrame(dt);
    }
    render() {
      const c = this.ctx, sc = this.scene;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = '#000'; c.fillRect(0, 0, this.cv.width, this.cv.height);
      if (!sc) return;
      try { sc.draw(this, this.st, this.t, this.dt || 0.016); } catch (e) { console.error(e); }
      if (this.bolt && !sc.ownBolt) { this.layer(0.3); P.drawBolt(c, this.bolt, this.bolt.life, sc.boltCol); }
      this.lighting();
      this.screen();
      if (this.hint) this.drawHint();
      if (this.pulse > 0.01) {
        const g = c.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.25, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75);
        g.addColorStop(0, 'rgba(120,0,10,0)'); g.addColorStop(1, 'rgba(160,0,14,' + (this.pulse * 0.55).toFixed(3) + ')');
        c.fillStyle = g; c.fillRect(0, 0, this.w, this.h);
      }
      if (this.flash > 0.02) { c.fillStyle = 'rgba(225,235,255,' + (this.flash * 0.28).toFixed(3) + ')'; c.fillRect(0, 0, this.w, this.h); }
      if (this.black > 0.01) { c.fillStyle = 'rgba(0,0,0,' + this.black.toFixed(3) + ')'; c.fillRect(0, 0, this.w, this.h); }
      if (this.scare) P.scare(c, this.scare.kind, this.w, this.h, this.scare.t / this.scare.dur, this.t);
      if (this.post) this.postFx();
    }
    lighting() {
      const sc = this.scene; if (!sc.lights && sc.dark == null) return;
      let dark = typeof sc.dark === 'function' ? sc.dark(this.st, this) : (sc.dark || 0);
      if (this.torch && this.torch.on) dark = Math.max(dark, this.torch.dark == null ? 0.93 : this.torch.dark);
      dark *= (1 - this.flash * 0.75) * (this.o.darkMul || 1);
      if (dark <= 0.01) return;
      const lc = this.lc, W = this.lm.width, H = this.lm.height, k = this.o.lightRes;
      lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, W, H);
      lc.fillStyle = C.rgba(sc.darkCol || '#020205', dark); lc.fillRect(0, 0, W, H);
      lc.globalCompositeOperation = 'destination-out';
      const lights = sc.lights ? sc.lights(this.st, this, this.t) || [] : [];
      const glows = [];
      for (const L of lights) {
        if (!L || !(L.i > 0)) continue;
        const p = this.toScreen(L.x, L.y, L.d);
        const r = L.r * p.s * k; if (r <= 0.5) continue;
        const x = p.x * k, y = p.y * k;
        const g = lc.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(0,0,0,' + C.clamp(L.i, 0, 1) + ')'); g.addColorStop(0.45, 'rgba(0,0,0,' + C.clamp(L.i * 0.55, 0, 1) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
        lc.fillStyle = g; lc.fillRect(x - r, y - r, r * 2, r * 2);
        if (L.c) glows.push({ x: p.x, y: p.y, r: L.r * p.s * (L.gr || 0.8), c: L.c, a: (L.g == null ? 0.18 : L.g) * L.i });
      }
      if (this.torch && this.torch.on) {
        const x = this.torch.x * k, y = this.torch.y * k, r = this.torch.r * k;
        const g = lc.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        lc.fillStyle = g; lc.fillRect(x - r, y - r, r * 2, r * 2);
        glows.push({ x: this.torch.x, y: this.torch.y, r: this.torch.r * 0.9, c: this.torch.c || '#ffd9a0', a: 0.12 });
      }
      const c = this.ctx; c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(this.lm, 0, 0, this.cv.width, this.cv.height);
      this.screen();
      for (const gl of glows) P.glow(c, gl.x, gl.y, gl.r, gl.c, gl.a);
    }
    drawHint() {
      const h = this.hint, p = this.toScreen(h.x, h.y, h.d), r = h.r * p.s, c = this.ctx;
      const a = 0.25 + 0.25 * Math.sin(this.t * 4);
      c.strokeStyle = 'rgba(255,220,160,' + a + ')'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, r * (1 + 0.1 * Math.sin(this.t * 4)), 0, P.TAU); c.stroke();
    }
    postFx() {
      const { gl, U } = this.post;
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.cv); } catch (e) { return; }
      const sEnv = this.scare ? Math.max(0, 1 - this.scare.t / this.scare.dur) : 0;
      const calm = C.T.calm ? 0.3 : 1;
      gl.uniform1i(U.t, 0);
      gl.uniform2f(U.res, this.cv.width, this.cv.height);
      gl.uniform1f(U.time, this.t);
      gl.uniform1f(U.ab, (0.0018 + this.lvl * 0.003 + this.pulse * 0.006 + sEnv * 0.03) * calm);
      gl.uniform1f(U.warp, (this.pulse * 0.12 + sEnv * 0.4) * calm);
      gl.uniform1f(U.grain, 0.05 + this.lvl * 0.05);
      gl.uniform1f(U.vig, 0.4 + this.lvl * 0.35);
      gl.uniform1f(U.flash, this.flash * 0.08);
      gl.uniform1f(U.desat, this.desat);
      gl.uniform1f(U.tintAmt, this.gradeAmt);
      gl.uniform3f(U.tint, this.grade[0], this.grade[1], this.grade[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
  return Stage;
})();
