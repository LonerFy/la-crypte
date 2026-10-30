/* Veil — transitions de pages : sang liquide (WebGL), griffes, VHS, brouillard, coupure. */
window.Veil = (function () {
  'use strict';
  const C = window.Crypte;
  const root = C.$('#veil'), cv = C.$('#veilCv'), dom = C.$('#veilDom');
  const ND = C.lowPower ? 16 : 26, NS = C.lowPower ? 5 : 7;
  const names = { sang: 'Sang', griffes: 'Griffes', vhs: 'Parasites VHS', brouillard: 'Brouillard', coupure: 'Coupure' };

  /* ---------- Shader de sang ---------- */
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*0.5+0.5;gl_Position=vec4(p,0.,1.);}';
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uP; uniform float uD; uniform float uSeed; uniform vec3 uCol;
uniform vec4 uDr[${ND}]; uniform vec4 uSp[${NS}];
varying vec2 v;
float smin(float a,float b,float k){float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0);return mix(b,a,h)-k*h*(1.0-h);}
float cap(vec2 p,vec2 a,vec2 b,float ra,float rb){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return length(pa-ba*h)-mix(ra,rb,h);}
float wob(float x){return 0.024*sin(x*6.0+uSeed)+0.015*sin(x*15.0+uSeed*2.3)+0.008*sin(x*37.0+uSeed*4.1);}
float field(vec2 p){
  float d;
  if(uD<=0.0){
    float base=-0.2+1.45*uP;
    d=p.y-(base+wob(p.x));
    for(int i=0;i<${ND};i++){
      vec4 q=uDr[i];
      float lead=q.y*clamp(uP*q.w*1.7,0.0,1.0);
      float len=base+wob(q.x)+lead;
      float r=q.z;
      vec2 a=vec2(q.x,-0.2);
      vec2 b=vec2(q.x+0.006*sin(q.x*21.0),len);
      float c=cap(p,a,b,r*0.6,r*0.75);
      float bulb=length((p-b-vec2(0.0,r*0.5))*vec2(1.0,0.82))-r*1.15;
      d=smin(d,min(c,bulb),0.03);
    }
    for(int j=0;j<${NS};j++){
      vec4 s=uSp[j];
      float g=clamp((uP-s.w)*16.0,0.0,1.0);
      if(g>0.0){
        float sd=length(p-s.xy)-s.z*g;
        float s1=length(p-s.xy-vec2(s.z*1.6,s.z*0.4))-s.z*0.28*g;
        float s2=length(p-s.xy-vec2(-s.z*1.3,s.z*1.1))-s.z*0.2*g;
        float tr=cap(p,s.xy,s.xy+vec2(0.0,s.z*2.6*g*clamp((uP-s.w)*3.0,0.0,1.0)),s.z*0.35,s.z*0.18);
        d=smin(d,min(min(sd,tr),min(s1,s2)),0.015);
      }
    }
  } else {
    float sh=uD*uD*1.55;
    float top=-0.03+sh+wob(p.x*1.3)*1.3;
    d=top-p.y;
    for(int i=0;i<${ND};i++){
      vec4 q=uDr[i];
      float lag=sh*(0.62+0.33*fract(q.w*3.7));
      vec2 a=vec2(q.x,lag-0.04);
      vec2 b=vec2(q.x,top+0.05);
      float c=cap(p,a,b,q.z*0.14,q.z*0.5);
      float drop=length(p-a)-q.z*0.38;
      d=smin(d,min(c,drop),0.025);
    }
  }
  return d;
}
void main(){
  float asp=uRes.x/uRes.y;
  vec2 p=vec2(v.x*asp,1.0-v.y);
  float d=field(p);
  float e=1.5/uRes.y;
  if(d>e*3.0){gl_FragColor=vec4(0.0);return;}
  float h0=smoothstep(0.0,-0.045,d);
  float hx=smoothstep(0.0,-0.045,field(p+vec2(e,0.0)));
  float hy=smoothstep(0.0,-0.045,field(p+vec2(0.0,e)));
  vec3 n=normalize(vec3(-(hx-h0)/e*0.05,-(hy-h0)/e*0.05,1.0));
  n.xy+=0.04*vec2(sin(p.y*40.0+p.x*7.0),cos(p.x*33.0-p.y*9.0))*h0;
  n=normalize(n);
  vec3 L=normalize(vec3(-0.45,-0.6,0.66));
  float dif=0.55+0.45*max(dot(n,L),0.0);
  vec3 H=normalize(L+vec3(0.0,0.0,1.0));
  float sp=pow(max(dot(n,H),0.0),80.0);
  float rim=pow(1.0-n.z,2.0);
  vec3 deep=vec3(0.24,0.0,0.015), thin=mix(vec3(0.72,0.04,0.06),uCol,0.35);
  vec3 col=mix(thin,deep,h0)*dif;
  col+=vec3(1.0,0.86,0.86)*sp*1.1+vec3(0.6,0.1,0.1)*rim*0.4;
  float a=smoothstep(e,-e,d);
  gl_FragColor=vec4(col*a,a);
}`;

  let gl = null, U = null, scaleK = 1;
  function initGL() {
    if (gl !== null) return gl;
    try {
      const g = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
      if (!g) { gl = false; return false; }
      const sh = (type, src) => { const s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; };
      const pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr);
      if (!g.getProgramParameter(pr, g.LINK_STATUS)) throw new Error('link');
      g.useProgram(pr);
      const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
      const loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
      U = {}; ['uRes', 'uP', 'uD', 'uSeed', 'uCol', 'uDr', 'uSp'].forEach((n) => { U[n] = g.getUniformLocation(pr, n); });
      gl = g;
    } catch (e) { console.warn('sang 2D', e); gl = false; }
    return gl;
  }
  function sizeCanvas(webgl) {
    const w = window.innerWidth, h = window.innerHeight;
    scaleK = webgl ? Math.min(C.lowPower ? 0.6 : 1, (C.lowPower ? 760 : 1500) / Math.max(w, h)) : Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(w * scaleK); cv.height = Math.round(h * scaleK);
    return { w, h };
  }
  function makeDrips(asp) {
    const dr = new Float32Array(ND * 4), sp = new Float32Array(NS * 4);
    for (let i = 0; i < ND; i++) {
      const x = (i + 0.2 + Math.random() * 0.6) / ND * asp;
      const fat = Math.random() < 0.25;
      dr[i * 4] = x; dr[i * 4 + 1] = 0.05 + Math.random() * (fat ? 0.45 : 0.32);
      dr[i * 4 + 2] = fat ? 0.022 + Math.random() * 0.016 : 0.007 + Math.random() * 0.012;
      dr[i * 4 + 3] = 0.6 + Math.random() * 1.1;
    }
    for (let j = 0; j < NS; j++) {
      sp[j * 4] = Math.random() * asp; sp[j * 4 + 1] = 0.15 + Math.random() * 0.6;
      sp[j * 4 + 2] = 0.018 + Math.random() * 0.05; sp[j * 4 + 3] = Math.random() * 0.3;
    }
    return { dr, sp };
  }
  function anim(dur, fn) {
    return new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => { const p = Math.min(1, (now - t0) / dur); fn(p); if (p < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step);
    });
  }

  /* Repli 2D quand WebGL est indisponible */
  function draw2D(c, w, h, P, D, dr, sp) {
    c.setTransform(scaleK, 0, 0, scaleK, 0, 0); c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5a0008'); g.addColorStop(1, '#8e0710');
    c.fillStyle = g; c.beginPath();
    if (D <= 0) {
      const base = (-0.2 + 1.45 * P) * h;
      c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, base);
      for (let x = w; x >= 0; x -= 10) c.lineTo(x, base + Math.sin(x * 0.02) * 12);
      c.closePath(); c.fill();
      for (let i = 0; i < ND; i++) {
        const x = dr[i * 4] / (w / h) * w, r = dr[i * 4 + 2] * h, len = base + dr[i * 4 + 1] * h * Math.min(1, P * dr[i * 4 + 3] * 1.7);
        c.fillRect(x - r * 0.65, 0, r * 1.3, len); c.beginPath(); c.arc(x, len + r * 0.4, r * 1.1, 0, 6.283); c.fill();
      }
    } else {
      const top = (-0.03 + D * D * 1.55) * h;
      c.fillRect(0, top, w, h);
    }
  }

  async function sang(mid) {
    const webgl = initGL();
    const { w, h } = sizeCanvas(webgl);
    const asp = w / h, { dr, sp } = makeDrips(asp);
    cv.style.display = 'block';
    window.Sound && Sound.cue('splash');
    window.Sound && Sound.cue('whoosh', { delay: 0.1, v: 0.35 });
    const render = (P, D) => {
      if (webgl) {
        const g = gl; g.viewport(0, 0, cv.width, cv.height); g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
        g.uniform2f(U.uRes, cv.width, cv.height); g.uniform1f(U.uP, P); g.uniform1f(U.uD, D); g.uniform1f(U.uSeed, seed);
        const col = C.hex2rgb(C.T.pal.blood); g.uniform3f(U.uCol, col[0] / 255, col[1] / 255, col[2] / 255);
        g.uniform4fv(U.uDr, dr); g.uniform4fv(U.uSp, sp);
        g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
      } else draw2D(cv.getContext('2d'), w, h, P, D, dr, sp);
    };
    const seed = Math.random() * 10;
    const sp2 = C.T.speed || 1;
    await anim(1050 / sp2, (p) => render(p < 0.12 ? p * 0.6 : 0.072 + (p - 0.12) / 0.88 * 0.928 * (0.6 + 0.4 * p), 0));
    render(1.05, 0);
    mid();
    window.Sound && Sound.cue('drip', { n: 2 });
    await C.sleep(140);
    await anim(1000 / sp2, (p) => render(1, Math.max(0.0001, p)));
    if (webgl) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } else cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
  }

  async function griffes(mid) {
    sizeCanvas(false); const w = window.innerWidth, h = window.innerHeight;
    const c = cv.getContext('2d'); cv.style.display = 'block';
    const slashes = [0, 1, 2].map((i) => ({ x0: w * (0.12 + i * 0.18) + C.rnd(-30, 30), y0: -h * 0.05, x1: w * (0.48 + i * 0.2) + C.rnd(-30, 30), y1: h * 1.05, bend: C.rnd(-0.12, 0.12) }));
    const drawSlash = (s, wd, k) => {
      const mx = (s.x0 + s.x1) / 2 + s.bend * w, my = (s.y0 + s.y1) / 2;
      const nx = s.y1 - s.y0, ny = -(s.x1 - s.x0), L = Math.hypot(nx, ny), ux = nx / L, uy = ny / L;
      const ex = s.x0 + (s.x1 - s.x0) * k, ey = s.y0 + (s.y1 - s.y0) * k;
      c.beginPath(); c.moveTo(s.x0, s.y0);
      c.quadraticCurveTo(mx + ux * wd, my + uy * wd, ex, ey);
      c.quadraticCurveTo(mx - ux * wd, my - uy * wd, s.x0, s.y0);
      c.fill(); c.stroke();
    };
    c.setTransform(scaleK, 0, 0, scaleK, 0, 0);
    for (let i = 0; i < 3; i++) {
      window.Sound && Sound.cue('whoosh', { v: 0.5 }); window.Sound && Sound.cue('screech', { n: 1 });
      await anim(150, (p) => {
        c.clearRect(0, 0, w, h); c.fillStyle = '#000'; c.strokeStyle = '#ff2a1a'; c.lineWidth = 3; c.shadowColor = '#ff2010'; c.shadowBlur = 24;
        for (let j = 0; j < i; j++) drawSlash(slashes[j], 18, 1);
        drawSlash(slashes[i], 18 * p, p);
      });
      await C.sleep(60);
    }
    await anim(420, (p) => {
      c.clearRect(0, 0, w, h); c.fillStyle = '#000'; c.strokeStyle = '#ff2a1a'; c.lineWidth = 3; c.shadowBlur = 30;
      slashes.forEach((s) => drawSlash(s, 18 + C.easeIn(p) * w * 1.2, 1));
      if (p > 0.8) { c.shadowBlur = 0; c.fillRect(0, 0, w, h); }
    });
    c.shadowBlur = 0; c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    mid(); await C.sleep(160);
    window.Sound && Sound.cue('hit');
    await anim(650, (p) => {
      const e = C.easeIO(p) * Math.max(w, h) * 0.9;
      c.clearRect(0, 0, w, h); c.fillStyle = '#000'; c.strokeStyle = '#ff2a1a'; c.lineWidth = 4; c.shadowColor = '#ff2010'; c.shadowBlur = 30 * (1 - p);
      c.beginPath(); c.moveTo(-e, -e * 0.4); c.lineTo(w - e, -e * 0.4); c.lineTo(-e, h - e * 0.4); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(w + e, h + e * 0.4); c.lineTo(e, h + e * 0.4); c.lineTo(w + e, e * 0.4); c.closePath(); c.fill(); c.stroke();
    });
    c.clearRect(0, 0, w, h);
  }

  async function vhs(mid) {
    dom.innerHTML = '';
    const base = document.createElement('div'); base.className = 'black'; dom.appendChild(base);
    const nz = document.createElement('canvas'); nz.width = 160; nz.height = 90; nz.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;image-rendering:pixelated';
    dom.appendChild(nz);
    const g = nz.getContext('2d'), img = g.createImageData(160, 90);
    const strips = [];
    const cols = ['var(--blood)', 'var(--bone)', 'var(--ember)', '#0a0', '#00a', 'var(--ink)'];
    for (let i = 0; i < 16; i++) { const s = document.createElement('div'); s.className = 'strip'; s.style.top = (i * 100 / 16) + '%'; s.style.height = (100 / 16 + 0.5) + '%'; s.style.background = C.pick(cols); dom.appendChild(s); strips.push(s); }
    window.Sound && Sound.cue('zap', { dur: 0.6 });
    let run = true;
    const noise = () => { if (!run) return; for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); requestAnimationFrame(noise); };
    noise();
    const phase = (inn) => Promise.all(strips.map((s) => s.animate([{ opacity: inn ? 0 : 1, transform: 'translateX(0)' }, { opacity: 1, transform: 'translateX(' + C.rnd(-20, 20) + '%)' }, { opacity: inn ? 1 : 0, transform: 'translateX(' + C.rnd(-5, 5) + '%)' }], { duration: 320, delay: Math.random() * 220, easing: 'steps(4)', fill: 'forwards' }).finished));
    base.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, fill: 'forwards' });
    nz.animate([{ opacity: 0 }, { opacity: 0.5 }], { duration: 380, fill: 'forwards' });
    await phase(true); mid(); await C.sleep(120);
    window.Sound && Sound.cue('zap', { dur: 0.4 });
    base.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' });
    nz.animate([{ opacity: 0.5 }, { opacity: 0 }], { duration: 380, fill: 'forwards' });
    await phase(false); run = false;
  }
  async function brouillard(mid) {
    dom.innerHTML = '<div class="mist"></div>'; const m = dom.firstChild;
    window.Sound && Sound.cue('gust', { dur: 2 });
    await m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: 'forwards' }).finished;
    mid(); await C.sleep(180);
    await m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1000, fill: 'forwards' }).finished;
  }
  async function coupure(mid) {
    dom.innerHTML = '<div class="black"></div>'; const b = dom.firstChild;
    window.Sound && Sound.cue('hit');
    await b.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.15, offset: 0.4 }, { opacity: 1, offset: 0.6 }, { opacity: 0.5, offset: 0.8 }, { opacity: 1 }], { duration: 520, fill: 'forwards' }).finished;
    mid(); await C.sleep(260);
    await b.animate([{ opacity: 1 }, { opacity: 0.1, offset: 0.25 }, { opacity: 1, offset: 0.45 }, { opacity: 0.3, offset: 0.7 }, { opacity: 0 }], { duration: 620, fill: 'forwards' }).finished;
  }

  const KINDS = { sang, griffes, vhs, brouillard, coupure };
  let busy = false;
  async function run(kind, mid) {
    let done = false; const m = () => { if (!done) { done = true; try { mid(); } catch (e) { console.error(e); } } };
    if (busy) { m(); return; }
    busy = true;
    const k = C.T.calm ? 'coupure' : kind;
    root.classList.add('on');
    try { await (KINDS[k] || sang)(m); } catch (e) { console.error(e); m(); }
    dom.innerHTML = ''; cv.style.display = 'none'; root.classList.remove('on');
    busy = false;
  }
  return { run, names, isBusy: () => busy };
})();
