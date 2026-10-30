/* La Crypte — navigation, pages, réglages de l'Atelier, démarrage. */
(function () {
  'use strict';
  const C = window.Crypte, P = window.Paint, $ = C.$, $$ = C.$$, T = () => C.T;

  /* ================= Données des pages ================= */
  const BEASTS = [
    { name: "L'Ankou", origin: "Bretagne", kind: "Le passeur", fear: 4, snd: [['cart', {}], ['bell', { f: 110, delay: 2.6 }]],
      text: "Le dernier mort de l'année devient son serviteur pour les douze mois suivants. Il parcourt les routes dans une charrette dont l'essieu grince, une faux à la main, et il compte ceux qui restent.",
      care: "Quand tu entends le grincement, ne demande pas qui il vient chercher." },
    { name: "La Banshee", origin: "Irlande", kind: "La pleureuse", fear: 3, snd: [['wail', {}], ['wail', { delay: 2.2, pan: 0.5 }]],
      text: "Elle se tient près des maisons de certaines vieilles familles et se lamente dans la nuit. Son cri n'annonce rien de bon : il précède un deuil, il ne le cause jamais.",
      care: "Si tu l'entends, c'est déjà elle qui t'a trouvé." },
    { name: "La Dame blanche", origin: "Europe", kind: "L'auto-stoppeuse", fear: 3, snd: [['gust', {}], ['moan', { f: 260, v: 'u', delay: 0.6 }]],
      text: "Robe pâle, regard fixe, elle attend au bord des routes ou au pied des vieux châteaux. Elle monte dans la voiture, puis disparaît du siège arrière, en laissant parfois un souffle glacé.",
      care: "Ne ralentis pas pour une inconnue en robe blanche, à trois heures du matin." },
    { name: "La Llorona", origin: "Mexique et Amérique latine", kind: "La femme en pleurs", fear: 4, snd: [['weep', {}]],
      text: "Elle cherche ses enfants le long des rivières et des canaux, et on l'entend de loin. Les parents racontent son histoire pour que les enfants rentrent avant la nuit.",
      care: "Rentre avant que la lumière tombe sur l'eau." },
    { name: "Les Yūrei", origin: "Japon", kind: "Les âmes sans repos", fear: 3, snd: [['whisper', {}], ['moan', { f: 220, v: 'o', delay: 0.8 }]],
      text: "Kimono blanc, longs cheveux noirs, pas de pieds. Ce sont des morts retenus par une émotion trop forte : un secret, une injustice, un amour. Le bon rituel peut les apaiser.",
      care: "Écoute ce qu'ils ont à dire. Ils n'ont qu'une seule chose à dire." },
    { name: "Le Zangbeto", origin: "Bénin, tradition vodoun", kind: "Le veilleur", fear: 2, snd: [['swish', {}]],
      text: "Gardien de la nuit chez les Gun et les Fon : une silhouette conique de raphia qui tournoie sur elle-même. Il protège la ville des voleurs. Ce n'est pas un monstre, c'est une veille.",
      care: "On ne demande pas ce qu'il y a dessous." },
    { name: "Le Loup-garou", origin: "Europe", kind: "L'homme-bête", fear: 4, snd: [['growl', {}], ['howl', { delay: 1.6 }], ['howl', { delay: 2.8, p: 1.15, pan: 0.6 }]],
      text: "Homme le jour, bête les nuits de pleine lune. On le reconnaît à une cicatrice, à un regard qui s'attarde un peu trop sur la lune. Le récit change d'un village à l'autre.",
      care: "Méfie-toi de celui qui évite les soirs clairs." }
  ];
  const YEAR = [
    { when: "31 octobre – 1er novembre", name: "Samain", where: "Monde celtique, à l'origine d'Halloween", text: "La fin de la saison claire, le début de la saison sombre. On croyait que la frontière avec l'autre monde s'amincissait cette nuit-là, d'où les grands feux et les déguisements." },
    { when: "1er novembre", name: "La Toussaint", where: "France et pays catholiques", text: "Les familles fleurissent les tombes, souvent de chrysanthèmes. Un jour de silence, de cimetières pleins et de bougies." },
    { when: "1er – 2 novembre", name: "Día de Muertos", where: "Mexique", text: "Pas de deuil triste : les familles dressent des autels, les ofrendas, les couvrent de soucis orange, de bougies et des plats préférés de leurs disparus, pour les accueillir." },
    { when: "Mi-août, ou juillet selon les régions", name: "Obon", where: "Japon", text: "On allume des lanternes pour guider les esprits des ancêtres jusqu'à la maison, on danse le bon-odori, puis on les raccompagne vers l'autre rive." },
    { when: "7e mois lunaire", name: "La fête des fantômes affamés", where: "Chine et Asie de l'Est", text: "Pendant ce mois, les portes de l'autre monde s'ouvrent. On offre de la nourriture et on brûle du papier pour les âmes qui n'ont plus personne pour les nourrir." },
    { when: "Chaque année, à des dates variables", name: "Egungun", where: "Pays yoruba, Nigéria et Bénin", text: "Des masques de tissu multicolore incarnent les ancêtres. Quand ils dansent, on ne regarde pas un déguisement : on accueille les morts revenus parmi les vivants." }
  ];

  $('#beasts').innerHTML = BEASTS.map((b, i) =>
    '<article class="beast"><h2 class="b-name">' + b.name + '</h2>' +
    '<p class="b-meta">' + b.kind + ' · ' + b.origin + '</p>' +
    '<p class="b-text">' + b.text + '</p><p class="b-care">' + b.care + '</p>' +
    '<div class="b-row"><button class="b-listen" data-beast="' + i + '">Écouter</button>' +
    '<div class="b-fear" aria-label="Effroi : ' + b.fear + ' sur 5">Effroi ' + [1, 2, 3, 4, 5].map((n) => '<i class="' + (n <= b.fear ? 'on' : '') + '"></i>').join('') + '</div></div></article>').join('');
  $('#beasts').addEventListener('click', (e) => {
    const b = e.target.closest('[data-beast]'); if (!b) return;
    if (!T().sound) setSound(true);
    const bs = BEASTS[+b.dataset.beast]; Sound.duck(5); bs.snd.forEach((q) => Sound.cue(q[0], Object.assign({ gain: 1.9 }, q[1])));
    const art = b.closest('.beast'); art.classList.add('play'); setTimeout(() => art.classList.remove('play'), 3200);
  });
  const lit = C.store.get('crypte2.candles', {});
  $('#year').innerHTML = YEAR.map((y, i) =>
    '<li><div class="y-when">' + y.when + '</div><h2 class="y-name">' + y.name + '</h2><div class="y-where">' + y.where + '</div><p>' + y.text + '</p>' +
    '<button class="candle' + (lit[i] ? ' lit' : '') + '" data-c="' + i + '" aria-pressed="' + (lit[i] ? 'true' : 'false') + '"><span class="wax" aria-hidden="true"></span><span class="lbl">' + (lit[i] ? 'Bougie allumée' : 'Allumer une bougie') + '</span></button></li>').join('');
  $('#year').addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    const i = b.dataset.c; lit[i] = !lit[i]; C.store.set('crypte2.candles', lit);
    b.classList.toggle('lit', !!lit[i]); b.setAttribute('aria-pressed', lit[i] ? 'true' : 'false'); b.querySelector('.lbl').textContent = lit[i] ? 'Bougie allumée' : 'Allumer une bougie';
    Sound.cue(lit[i] ? 'match' : 'gust', { dur: 0.5 });
  });

  /* ================= Effets globaux ================= */
  (function grain() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 180;
      const g = cv.getContext('2d'), id = g.createImageData(180, 180);
      for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      g.putImageData(id, 0, 0); frames.push('url(' + cv.toDataURL('image/png') + ')');
    }
    const el = $('#grain'); let k = 0; el.style.backgroundImage = frames[0];
    setInterval(() => { if (T().calm) return; k = (k + 1) % frames.length; el.style.backgroundImage = frames[k]; }, 110);
  })();
  (function boil() { const t = $('#bleedTurb'); let s = 1; if (!t) return; setInterval(() => { if (T().calm) return; s = (s % 8) + 1; t.setAttribute('seed', s); }, 170); })();
  (function blinkLoop() {
    const el = $('#blink');
    const blink = () => { el.classList.add('on'); setTimeout(() => { el.classList.remove('on'); if (Math.random() < 0.5) setTimeout(() => { el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 60); }, 90); }, 70 + Math.random() * 90); };
    (function next() { const f = T().flicker; setTimeout(() => { if (f > 0 && !T().calm && Intro.isDone()) blink(); next(); }, f > 0 ? C.rnd(2500, 9000) / f : 4000); })();
  })();
  (function titleLetters() {
    const h = $('#heroTitle'); h.setAttribute('aria-label', h.textContent);
    h.innerHTML = Array.from(h.textContent).map((ch) => ch === ' ' ? ' ' : '<span class="fl" aria-hidden="true" style="--fd:' + C.rnd(5, 11).toFixed(1) + 's;--fdel:-' + C.rnd(0, 8).toFixed(1) + 's">' + ch + '</span>').join('');
  })();
  (function drips() {
    const box = $('#drips'); const r = C.seeded(5); let html = '';
    [[6, 18], [17, 10], [29, 14], [44, 22], [57, 9], [66, 16], [79, 12], [91, 20]].forEach(([left, wd]) => {
      html += '<i style="left:' + left + '%;--dw:' + (wd / 160).toFixed(3) + 'em;--dl:' + (0.3 + r() * 0.6).toFixed(2) + 'em;--dd:' + (5 + r() * 6).toFixed(1) + 's;--ddel:-' + (r() * 6).toFixed(1) + 's"></i>';
    });
    box.innerHTML = html;
  })();
  (function countdown() {
    const box = $('#count'), pad = (n) => String(n).padStart(2, '0');
    const keep = box.innerHTML;
    let state = '';
    function tick() {
      const now = new Date(), y = now.getFullYear();
      const start = new Date(y, 9, 31, 0, 0, 0), end = new Date(y, 10, 1, 0, 0, 0);
      if (now >= start && now < end) { if (state !== 'now') { box.innerHTML = '<span class="lbl">31 octobre</span><span class="now">C\'est Halloween. La nuit est là.</span>'; state = 'now'; } return; }
      if (state === 'now') { box.innerHTML = keep; }
      state = 'count';
      const target = now < start ? start : new Date(y + 1, 9, 31, 0, 0, 0);
      const s = Math.floor((target - now) / 1000);
      $('#cD').textContent = pad(Math.floor(s / 86400)); $('#cH').textContent = pad(Math.floor(s % 86400 / 3600));
      $('#cM').textContent = pad(Math.floor(s % 3600 / 60)); $('#cS').textContent = pad(s % 60);
      box.classList.toggle('soon', s < 86400 * 3);
    }
    tick(); setInterval(tick, 1000);
  })();

  /* ================= Son global ================= */
  const AMB = {
    accueil: { amb: { wind: 0.45, crickets: 0.7, crows: 1, owl: 1, drone: [36.7, 55] }, music: 'box' },
    histoires: { amb: { wind: 0.35, drone: [41.2, 43.7], creaks: 1, drips: 1 }, music: null },
    bestiaire: { amb: { wind: 0.5, drone: [32.7, 49], wolves: 1, owl: 1 }, music: null },
    veillee: { amb: { wind: 0.25, crickets: 0.5 }, music: 'choir' }
  };
  function pageSound(name) {
    if (window.Theatre && Theatre.isOpen()) return;
    const a = AMB[name] || AMB.accueil; Sound.ambient(a.amb); Sound.music(a.music);
  }
  function setSound(on) {
    T().sound = !!on; Sound.enable(T().sound); C.emit('sound', T().sound);
    if (on) pageSound(Router.cur || 'accueil');
  }
  function updHdr() { const b = $('#hdrSound'); b.setAttribute('aria-pressed', T().sound ? 'true' : 'false'); b.title = T().sound ? 'Couper le son' : 'Activer le son'; const c2 = $('#c-sound'); if (c2) c2.checked = !!T().sound; }
  C.on('sound', updHdr);
  $('#hdrSound').addEventListener('click', () => setSound(!T().sound));

  /* ================= Navigation ================= */
  const VIEWS = ['accueil', 'histoires', 'bestiaire', 'veillee'];
  const Router = {
    cur: null,
    show(name) {
      this.cur = name;
      $$('.view').forEach((el) => { const p = el.id.slice(2); el.hidden = p !== name; if (p === name) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); } });
      $$('.top nav button').forEach((b) => { if (b.dataset.go === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      window.scrollTo(0, 0);
      $('#tint').style.opacity = 0;
      try { history.replaceState(null, '', '#' + name); } catch (e) {}
      pageSound(name);
      Home.sync();
      setTimeout(Home.refreshThumbs, 60);
    },
    go(name) {
      if (Veil.isBusy() || VIEWS.indexOf(name) < 0) return;
      if (name === this.cur) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      Veil.run(T().trans, () => this.show(name));
    }
  };
  window.Router = Router;
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); Router.go(g.dataset.go); return; }
    const s = e.target.closest('.card[data-story]'); if (s) { Theatre.launch(s.dataset.story); }
  });
  Theatre.onExit = (to) => { Home.sync(); Router.show(to || Router.cur || 'histoires'); };
  $('#trick').addEventListener('click', (e) => Home.trickOrTreat(e.currentTarget));
  $('#trickTop').addEventListener('click', () => { $('#tot').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => Home.trickOrTreat($('#trick')), 700); });
  (function tint() {
    const tint = $('#tint');
    document.addEventListener('pointerover', (e) => { const b = e.target.closest && e.target.closest('.card'); if (!b) return; tint.style.setProperty('--tint', 'color-mix(in srgb, ' + b.style.getPropertyValue('--sc') + ' 26%, transparent)'); tint.style.opacity = 1; });
    document.addEventListener('pointerout', (e) => { if (e.target.closest && e.target.closest('.card')) tint.style.opacity = 0; });
  })();

  /* ================= Atelier ================= */
  const PRESETS = [
    { n: 'Sang', pal: C.DEFAULT.pal },
    { n: 'Citrouille', pal: { ink: '#0c0705', bone: '#f0dcb8', blood: '#c2410c', ember: '#ff9a1f', mold: '#3a2410' } },
    { n: 'Spectre', pal: { ink: '#05090c', bone: '#cfe0dc', blood: '#2aa596', ember: '#9ad6ff', mold: '#1c3238' } },
    { n: 'Poison', pal: { ink: '#090a06', bone: '#d8dcb8', blood: '#7bb31a', ember: '#d6ea4a', mold: '#2a3818' } },
    { n: 'Velours', pal: { ink: '#0a050c', bone: '#e2d4e8', blood: '#9a1a6a', ember: '#d07af0', mold: '#2a1a3a' } }
  ];
  const APPROVALS = [['intro', "Cinématique d'entrée"], ['palette', 'Palette de couleurs'], ['typo', 'Typographie'], ['transitions', 'Transitions de pages'], ['accueil', 'Accueil : cimetière, citrouilles, curseur'], ['tot', 'Bonbon ou sort'], ['cartes', 'Cartes des histoires']]
    .concat(window.STORIES.map((s) => ['h-' + s.id, 'Histoire : ' + s.title]))
    .concat([['bestiaire', 'Bestiaire'], ['veillee', 'Veillée'], ['sons', 'Sons et musiques']]);
  let A = C.store.get('crypte2.approvals', {});
  const panel = $('#atelier'), btn = $('#atelierBtn');
  const root = document.documentElement;

  function apply() {
    const t = T();
    for (const k in t.pal) root.style.setProperty('--' + k, t.pal[k]);
    root.style.setProperty('--grain', t.grain); root.style.setProperty('--vig', t.vig);
    document.body.classList.toggle('scan', !!t.scan);
    document.body.classList.toggle('calm', !!t.calm || t.flicker === 0);
    P.pal = Object.assign({}, t.pal);
    Sound.volume(t.vol);
    Home.applyCursor();
    C.save();
  }
  const slider = (label, key, min, max, step) => '<div class="a-row"><label for="t-' + key + '">' + label + '</label><input id="t-' + key + '" type="range" data-t="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + T()[key] + '"></div>';
  const check = (label, key) => '<div class="a-row"><label for="c-' + key + '">' + label + '</label><input id="c-' + key + '" type="checkbox" data-c="' + key + '"' + (T()[key] ? ' checked' : '') + '></div>';
  const TEST = ['thunder', 'wolves', 'crow', 'bats', 'creak', 'door', 'glass', 'bell', 'laugh', 'scream', 'screech', 'braam', 'organ', 'beat', 'whisper', 'splash'];
  const SONGS = [['box', 'Boîte à musique'], ['waltz', 'Valse'], ['jig', 'Gigue'], ['choir', 'Chœur']];
  function renderPanel() {
    const t = T();
    const pal = [['ink', 'Fond'], ['bone', 'Texte'], ['blood', 'Accent sang'], ['ember', 'Lueur'], ['mold', 'Ombre']];
    panel.innerHTML =
      '<div class="a-top"><h2>Atelier</h2><button id="aClose">Fermer</button></div>' +
      '<p class="a-hint">Tout ce que tu changes ici s\'applique tout de suite, sur tout le site.</p>' +
      '<h3>Palette</h3><div class="a-btns">' + PRESETS.map((p, k) => '<button data-preset="' + k + '">' + p.n + '</button>').join('') + '</div><div style="height:.8rem"></div>' +
      pal.map(([k, l]) => '<div class="a-row"><label for="p-' + k + '">' + l + '</label><input id="p-' + k + '" type="color" data-pal="' + k + '" value="' + t.pal[k] + '"></div>').join('') +
      '<h3>Ambiance</h3>' + slider('Grain', 'grain', 0, 0.4, 0.01) + slider('Vignette', 'vig', 0, 1, 0.01) + slider('Scintillement', 'flicker', 0, 1, 0.05) + check('Lignes VHS', 'scan') +
      '<h3>Transition entre les pages</h3><div class="a-btns">' + Object.keys(Veil.names).map((k) => '<button data-trans="' + k + '" class="' + (t.trans === k ? 'on' : '') + '">' + Veil.names[k] + '</button>').join('') + '<button data-test="1">Tester</button></div>' +
      '<h3>Expérience</h3>' + check('Sursauts (jumpscares)', 'scares') + check('Curseur bougie', 'cursor') + check('Animations réduites', 'calm') +
      (C.osReduce ? '<p class="a-warn">Ton système demande moins d\'animations. Le site les garde actives ; coche « Animations réduites » si tu préfères.</p>' : '') +
      slider('Vitesse du texte', 'speed', 0.6, 1.8, 0.1) +
      '<div class="a-row"><label>Cinématique d\'entrée</label><div class="seg" data-intro="1"><button data-iv="toujours" class="' + (t.intro === 'toujours' ? 'on' : '') + '">Toujours</button><button data-iv="une fois" class="' + (t.intro === 'une fois' ? 'on' : '') + '">Une fois</button></div></div>' +
      '<div class="a-btns"><button id="aReplay">Rejouer la cinématique</button></div>' +
      '<h3>Son</h3>' + check('Son activé', 'sound') + slider('Volume', 'vol', 0, 1, 0.05) +
      '<div class="a-btns">' + TEST.map((n) => '<button data-cue="' + n + '">' + n + '</button>').join('') + '</div><div style="height:.6rem"></div>' +
      '<div class="a-btns">' + SONGS.map(([k, l]) => '<button data-song="' + k + '">' + l + '</button>').join('') + '<button data-song="">Stop</button></div>' +
      '<h3>Validation des choix</h3>' +
      APPROVALS.map(([k, l]) => {
        const a = A[k] || {};
        return '<div class="ap"><div class="ap-h"><span>' + l + '</span><div class="seg" data-ap="' + k + '"><button data-s="ok" class="ok' + (a.s === 'ok' ? ' on' : '') + '">Validé</button><button data-s="redo" class="redo' + (a.s === 'redo' ? ' on' : '') + '">À revoir</button></div></div>' +
          '<input type="text" id="n-' + k + '" data-note="' + k + '" placeholder="Note pour ce point…" value="' + (a.n || '').replace(/"/g, '&quot;') + '"></div>';
      }).join('') +
      '<div class="a-btns" style="margin-top:1rem"><button id="aCopy">Copier le bilan</button><button id="aReset">Réglages d\'origine</button></div>' +
      '<p class="a-hint" id="aMsg"></p><textarea class="a-out" id="aOut" hidden readonly></textarea>';
  }
  function summary() {
    const t = T(), L = ['LA CRYPTE · bilan du prototype v0.2', ''];
    APPROVALS.forEach(([k, l]) => { const a = A[k] || {}; L.push('- ' + l + ' : ' + (a.s === 'ok' ? 'VALIDÉ' : a.s === 'redo' ? 'À REVOIR' : 'pas encore vu') + (a.n ? ' — ' + a.n : '')); });
    L.push('', 'Réglages', 'Palette : ' + Object.keys(t.pal).map((k) => k + ' ' + t.pal[k]).join(', '));
    L.push('Grain ' + t.grain + ', vignette ' + t.vig + ', scintillement ' + t.flicker + ', VHS ' + (t.scan ? 'oui' : 'non'));
    L.push('Transition : ' + t.trans + ' · Sursauts : ' + (t.scares ? 'oui' : 'non') + ' · Curseur bougie : ' + (t.cursor ? 'oui' : 'non') + ' · Animations réduites : ' + (t.calm ? 'oui' : 'non') + ' · Vitesse du texte : ' + t.speed + ' · Cinématique : ' + t.intro);
    return L.join('\n');
  }
  panel.addEventListener('input', (e) => {
    const x = e.target;
    if (x.dataset.pal) { T().pal[x.dataset.pal] = x.value; apply(); }
    else if (x.dataset.t) { T()[x.dataset.t] = parseFloat(x.value); apply(); }
    else if (x.dataset.note) { A[x.dataset.note] = Object.assign(A[x.dataset.note] || {}, { n: x.value }); C.store.set('crypte2.approvals', A); }
  });
  panel.addEventListener('change', (e) => {
    const x = e.target;
    if (x.dataset.c === 'sound') setSound(x.checked);
    else if (x.dataset.c) { T()[x.dataset.c] = x.checked; apply(); }
  });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'aClose') { setOpen(false); return; }
    if (b.dataset.preset != null) { T().pal = Object.assign({}, PRESETS[+b.dataset.preset].pal); apply(); renderPanel(); Home.refreshThumbs(); return; }
    if (b.dataset.trans) { T().trans = b.dataset.trans; apply(); $$('[data-trans]', panel).forEach((x) => x.classList.toggle('on', x === b)); return; }
    if (b.dataset.test) { Veil.run(T().trans, () => {}); return; }
    if (b.dataset.iv) { T().intro = b.dataset.iv; apply(); $$('[data-iv]', panel).forEach((x) => x.classList.toggle('on', x === b)); return; }
    if (b.id === 'aReplay') { setOpen(false); Intro.replay(); return; }
    if (b.dataset.cue) { if (!T().sound) setSound(true); Sound.cue(b.dataset.cue, { f: 196 }); return; }
    if (b.dataset.song != null) { if (!T().sound) setSound(true); Sound.music(b.dataset.song || null); return; }
    if (b.dataset.s) {
      const k = b.parentNode.dataset.ap, cur = A[k] || {};
      A[k] = Object.assign(cur, { s: cur.s === b.dataset.s ? null : b.dataset.s }); C.store.set('crypte2.approvals', A);
      $$('button', b.parentNode).forEach((x) => x.classList.toggle('on', A[k].s === x.dataset.s));
      return;
    }
    if (b.id === 'aCopy') {
      const text = summary(), out = $('#aOut'), msg = $('#aMsg');
      out.value = text; out.hidden = false;
      const fb = () => { out.focus(); out.select(); msg.textContent = 'Sélectionne le texte ci-dessous et copie-le.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => { msg.textContent = 'Bilan copié. Colle-le dans la conversation.'; }).catch(fb); else fb();
      return;
    }
    if (b.id === 'aReset') { const snd = T().sound; Object.assign(C.T, JSON.parse(JSON.stringify(C.DEFAULT))); C.T.sound = snd; apply(); renderPanel(); $('#aMsg').textContent = "Réglages d'origine rétablis."; }
  });
  function setOpen(v) { panel.classList.toggle('open', v); btn.setAttribute('aria-expanded', v ? 'true' : 'false'); btn.textContent = v ? 'Fermer' : 'Atelier'; }
  btn.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) setOpen(false); });

  /* ================= Démarrage ================= */
  Home.buildCards();
  Home.init();
  renderPanel(); apply(); updHdr();
  const hash = (location.hash || '').slice(1);
  const first = VIEWS.indexOf(hash) >= 0 ? hash : 'accueil';
  Router.show(first);
  Intro.start(() => {
    pageSound(Router.cur);
    Home.sync();
    const sid = (window.STORIES || []).find((s) => s.id === hash);
    if (sid) setTimeout(() => Theatre.launch(sid.id), 900);
  });
})();
