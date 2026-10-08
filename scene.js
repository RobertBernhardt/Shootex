(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1376, H = 768;
  const art = document.getElementById('art');
  const layers = [document.getElementById('bg'), art];
  const scene = document.getElementById('scene');
  const stage = document.querySelector('.stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (/[?&]clean\b/.test(location.search)) document.documentElement.classList.add('clean');

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const $ = id => document.getElementById(id);
  const f2 = v => v.toFixed(2);

  /* ---------- responsive framing (from the template) ----------
     Wide screens: cover the viewport. Portrait phones: fit the subject
     box (data-focus) into the space above the headline/CTA. */
  let view = [0, 0, W, H];
  const FOCUS = (scene.dataset.focus || `0 0 ${W} ${H}`).split(/\s+/).map(Number);
  const hero = document.querySelector('.hero');
  function frame() {
    const box = scene.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const sw = box.width, sh = box.height, a = sw / sh;
    const portrait = a < 0.9;
    document.documentElement.classList.toggle('portrait', portrait);
    let vb;
    if (portrait) {
      const [fx, , fw] = FOCUS;
      const clean = document.documentElement.classList.contains('clean');
      const ui = hero && !clean ? hero.getBoundingClientRect().height + 20 : 0;
      const areaH = sh - ui * 0.8;
      let s = areaH / H;
      s = Math.min(s, sw / (fw * 0.85));
      s = Math.max(s, sw / W);
      const w = sw / s, h = sh / s;
      vb = [clamp(fx + fw / 2 - w / 2, 0, W - w), 0, w, h];
      scene.style.setProperty('--art-bottom', (H * s) + 'px');
    } else if (a < W / H) {
      const w = H * a;
      vb = [clamp(FOCUS[0] + FOCUS[2] / 2 - w / 2, 0, W - w), 0, w, H];
    } else {
      const h = W / a;
      vb = [0, clamp(360 - h / 2, 0, H - h), W, h];
    }
    view = vb;
    layers.forEach(s => s.setAttribute('viewBox', vb.join(' ')));
    sizeFog();
  }

  /* ---------- procedural pallet stack ---------- */
  const rows = $('palletRows');
  const BLOCKS = [[470, 560], [826, 916], [1182, 1272]];
  [[522, 0], [618, -8], [714, 6]].forEach(([y0, dx], i) => {
    const g = el('g', { transform: `translate(${dx} 0)` }, rows);
    el('rect', { x: 470, y: y0, width: 802, height: 96, fill: '#07040e' }, g);       // gaps
    const strip = (y, h) => {
      el('rect', { x: 470, y, width: 802, height: h, fill: 'url(#gWood)' }, g);
      el('line', { x1: 470, y1: y + 1, x2: 1272, y2: y + 1, stroke: '#e8c078', 'stroke-width': 1.2, opacity: .3 }, g);
      for (let k = 0; k < 4; k++) {
        const gy = y + rand(5, h - 4), gx = rand(480, 1100);
        el('path', { d: `M${gx.toFixed(0)} ${gy.toFixed(1)} q 60 -2 120 0 t 120 1`, fill: 'none', stroke: '#2e1a0c', 'stroke-width': 1, opacity: .7 }, g);
      }
    };
    strip(y0, 22);
    for (const [x1, x2] of BLOCKS) {
      el('rect', { x: x1, y: y0 + 22, width: x2 - x1, height: 52, fill: 'url(#gWood)' }, g);
      el('rect', { x: x1, y: y0 + 22, width: x2 - x1, height: 52, fill: '#000', opacity: .18 }, g);
      el('line', { x1: x1 + 1, y1: y0 + 22, x2: x1 + 1, y2: y0 + 74, stroke: '#e8c078', 'stroke-width': 1, opacity: .25 }, g);
      for (let n = 0; n < 2; n++) el('circle', { cx: x1 + 18 + n * (x2 - x1 - 36), cy: y0 + 11, r: 2, fill: '#2a1a14' }, g);
    }
    strip(y0 + 74, 22);
    if (i > 0) el('rect', { x: 470, y: y0, width: 802, height: 96, fill: '#03021a', opacity: .18 * i }, g);
  });

  /* ---------- smoke: tileable fbm noise, drifted on two canvases (template) ---------- */
  const fogBack = $('fogBack'), fogFront = $('fogFront');
  const fbCtx = fogBack.getContext('2d'), ffCtx = fogFront.getContext('2d');
  function noiseTile(size, cell, octaves, seed, color, gamma) {
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const grids = [];
    for (let o = 0; o < octaves; o++) {
      const n = cell << o, g = new Float32Array(n * n);
      for (let i = 0; i < g.length; i++) g[i] = rnd();
      grids.push({ n, g });
    }
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const sm = t => t * t * (3 - 2 * t);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let v = 0, amp = 1, tot = 0;
      for (const { n, g } of grids) {
        const fx = x / size * n, fy = y / size * n;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = sm(fx - x0), ty = sm(fy - y0);
        const x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
        const a = g[y0 * n + x0], b = g[y0 * n + x1], c2 = g[y1 * n + x0], d = g[y1 * n + x1];
        v += amp * lerp(lerp(a, b, tx), lerp(c2, d, tx), ty);
        tot += amp; amp *= 0.5;
      }
      v = Math.pow(clamp((v / tot - 0.35) / 0.5, 0, 1), gamma);
      const i = (y * size + x) * 4;
      img.data[i] = color[0]; img.data[i + 1] = color[1]; img.data[i + 2] = color[2];
      img.data[i + 3] = v * 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  let patLight = null, patDark = null, patLight2 = null;
  const buildSmoke = () => {
    const smokeLight = noiseTile(128, 4, 4, 1234, [110, 90, 170], 1.6);  // violet wisps
    const smokeDark = noiseTile(128, 3, 4, 777, [2, 1, 12], 1.1);        // black smoke
    patLight = fbCtx.createPattern(smokeLight, 'repeat');
    patDark = ffCtx.createPattern(smokeDark, 'repeat');
    patLight2 = ffCtx.createPattern(smokeLight, 'repeat');
  };
  (window.requestIdleCallback || (f => setTimeout(f, 200)))(buildSmoke, { timeout: 1500 });
  let fogW = 0, fogH = 0, fogMask = null;
  function sizeFog() {
    const r = scene.getBoundingClientRect();
    if (!r.width || !r.height) return;
    fogW = Math.max(2, Math.round(r.width / 2));
    fogH = Math.max(2, Math.round(r.height / 2));
    for (const c of [fogBack, fogFront]) { c.width = fogW; c.height = fogH; }
    // front smoke hugs the edges and the ground, keeps the face clear
    fogMask = document.createElement('canvas');
    fogMask.width = fogW; fogMask.height = fogH;
    const m = fogMask.getContext('2d');
    const g = m.createRadialGradient(fogW * .58, fogH * .4, fogH * .3, fogW * .55, fogH * .45, Math.max(fogW, fogH) * .7);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(.55, 'rgba(0,0,0,.5)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    m.fillStyle = g; m.fillRect(0, 0, fogW, fogH);
    const b = m.createLinearGradient(0, fogH * .7, 0, fogH);
    b.addColorStop(0, 'rgba(0,0,0,0)'); b.addColorStop(1, 'rgba(0,0,0,.6)');
    m.fillStyle = b; m.fillRect(0, 0, fogW, fogH);
  }
  function drawPattern(ctx, pat, scale, ox, oy, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.setTransform(scale, 0, 0, scale, ox % (128 * scale), oy % (128 * scale));
    ctx.fillStyle = pat;
    ctx.fillRect(-128, -128, fogW / scale + 256, fogH / scale + 256);
    ctx.restore();
  }
  function drawFog(t) {
    if (!fogMask || !patLight) return;
    const k = fogW / 350;
    fbCtx.clearRect(0, 0, fogW, fogH);
    drawPattern(fbCtx, patLight, 2.6 * k, t * 9, -t * 4, .5);
    drawPattern(fbCtx, patLight, 1.7 * k, -t * 6 + 90, t * 3 + 40, .3);
    ffCtx.clearRect(0, 0, fogW, fogH);
    drawPattern(ffCtx, patDark, 2.2 * k, -t * 7, t * 2, .9);
    drawPattern(ffCtx, patDark, 3.4 * k, t * 5 + 60, -t * 3, .75);
    drawPattern(ffCtx, patLight2, 2.4 * k, t * 11 + 30, -t * 5, .22);
    ffCtx.globalCompositeOperation = 'destination-in';
    ffCtx.drawImage(fogMask, 0, 0);
    ffCtx.globalCompositeOperation = 'source-over';
  }

  frame();
  addEventListener('resize', frame);
  new ResizeObserver(frame).observe(scene);

  /* ---------- enemy sensors: they peek out from cover, you tag them ---------- */
  const tLayer = $('targets');
  // where opponents hide: barn loft, roof, wall edges, tree line, barrels, tyres
  const SLOTS = [
    { x: 322, y: 314 }, { x: 250, y: 290 }, { x: 470, y: 300 }, { x: 200, y: 352 },
    { x: 510, y: 372 }, { x: 70, y: 330 }, { x: 410, y: 466 }, { x: 180, y: 484 }, { x: 120, y: 410 },
    { x: 478, y: 304 }, { x: 492, y: 446 }
  ];
  const targets = [];
  function makeTarget() {
    const g = el('g', { opacity: 0 }, tLayer);
    const halo = el('ellipse', { cx: 0, cy: 0, rx: 40, ry: 28, fill: 'url(#gSensor)' }, g);
    el('ellipse', { cx: 0, cy: 0, rx: 10, ry: 6.5, fill: '#1a0820' }, g);
    const core = el('ellipse', { cx: 0, cy: -1, rx: 5.5, ry: 3.6, fill: '#fff' }, g);
    el('circle', { cx: 0, cy: 0, r: 16, fill: 'none', stroke: '#ff4fd8', 'stroke-width': 1.4, opacity: .55, 'stroke-dasharray': '4 5', class: 'spin' }, g);
    const ring = el('circle', { cx: 0, cy: 0, r: 8, fill: 'none', stroke: '#ff4fd8', 'stroke-width': 2.4, opacity: 0 }, g);
    return { g, halo, core, ring, slot: null, state: 'off', t: 0, next: 0, phase: rand(0, 6) };
  }
  for (let i = 0; i < 3; i++) targets.push(makeTarget());
  function freeSlot() {
    const used = new Set(targets.map(t => t.slot));
    const free = SLOTS.filter(s => !used.has(s));
    const [vx, vy, vw, vh] = view;
    const seen = free.filter(s => s.x > vx + 24 && s.x < vx + vw - 24 && s.y > vy + 24 && s.y < vy + vh - 24);
    return pick(seen.length ? seen : free);
  }
  function show(t, now) {
    t.slot = freeSlot();
    t.g.setAttribute('transform', `translate(${t.slot.x} ${t.slot.y})`);
    t.state = 'in'; t.t = now;
  }
  const active = () => targets.filter(t => t.state === 'on' || t.state === 'in');

  /* ---------- the player: gaze, gestures, tagger ---------- */
  const head = $('head'), rig = $('rig'), fx = $('fx');
  const irisL = $('irisL'), irisR = $('irisR');
  const browL = $('browL'), browR = $('browR');
  const lidL = $('lidL'), lidR = $('lidR');
  const lashL = $('lashL'), lashR = $('lashR');
  const mouth = $('mouth'), mouthCorner = $('mouthCorner');
  const muzzleGlow = $('muzzleGlow'), headSensor = $('headSensor');
  const tagScore = $('tagScore'), hintScore = $('hintScore');

  const EYES = { x: 850, y: 252 };
  const PIVOT = { x: 860, y: 508 };            // rear grip: the tagger swings around it
  const MUZZLE = { x: 520, y: 489 };
  const TILT = 10;                              // default pose: tagger raised toward the barn
  const BASE_ANG = Math.atan2(MUZZLE.y - PIVOT.y, MUZZLE.x - PIVOT.x) + TILT * Math.PI / 180;
  const REST = { px: -1.5, py: 0.5, rot: -1, tx: 0, ty: 0, brow: 0, furrow: 0.6, smirk: 0.3, squint: 0.1, aim: 0, duck: 0 };
  const want = { ...REST };
  const cur = { ...REST };
  let holdUntil = 0;
  let kick = { x: 0, y: 0 };
  let blink = 0, blinkT = -1, nextBlink = performance.now() + rand(1500, 3500), doubleBlink = false;
  let saccade = { x: 0, y: 0 }, nextSaccade = 0;
  let nextIdle = performance.now() + 2500;
  let nextEnemy = performance.now() + 6000;
  let duckUntil = 0, flashT = -1e9, headHitT = -1e9;
  let score = 0;
  const beams = [], sparks = [];

  const toArt = (cx, cy) => {
    const pt = art.createSVGPoint();
    pt.x = cx; pt.y = cy;
    return pt.matrixTransform(art.getScreenCTM().inverse());
  };
  const onFace = p => Math.hypot(p.x - 855, p.y - 275) < 85;

  function aim(p) {
    const dx = p.x - EYES.x, dy = p.y - EYES.y;
    const d = Math.hypot(dx, dy) || 1;
    const k = clamp(d / 220, 0, 1);
    want.px = (dx / d) * 4.2 * k;
    want.py = (dy / d) * 2.6 * k;
    want.rot = clamp(dx / 650, -1, 1) * 4.5;
    want.tx = clamp(dx / 700, -1, 1) * 6;
    want.ty = clamp(dy / 500, -1, 1) * 5;
    want.brow = dy < -60 ? clamp(-dy / 60, 0, 3) : 0;
    want.furrow = 1.4; want.squint = 0.25; want.smirk = 0.1;
    // swing the tagger toward the point (left side only, within a few degrees)
    if (p.x < PIVOT.x - 120) {
      let da = Math.atan2(p.y - PIVOT.y, p.x - PIVOT.x) - BASE_ANG;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      want.aim = clamp(da * 180 / Math.PI, -8, 8);
    }
  }

  function muzzleNow() {
    const a = (TILT + cur.aim) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const dx = MUZZLE.x - PIVOT.x, dy = MUZZLE.y - PIVOT.y;
    return { x: PIVOT.x + dx * c - dy * s, y: PIVOT.y + dx * s + dy * c + cur.duck * 0.4 };
  }

  function beam(from, to, color, now, onArrive) {
    const glow = el('line', { x1: from.x, y1: from.y, x2: from.x, y2: from.y, stroke: color, 'stroke-width': 10, 'stroke-linecap': 'round', opacity: .3 }, fx);
    const core = el('line', { x1: from.x, y1: from.y, x2: from.x, y2: from.y, stroke: color === '#ff4fd8' ? '#ffd6f4' : '#f4ffd0', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, fx);
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    beams.push({ glow, core, from, to, t0: now, travel: Math.max(60, len / 3.2), onArrive, done: false });
  }

  function burst(p, color, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(60, 260);
      const node = el('line', { stroke: color, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, fx);
      sparks.push({ node, x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: rand(.3, .6) });
    }
  }

  function setScore(n) {
    score = n;
    const s = String(n).padStart(2, '0');
    tagScore.textContent = s;
    hintScore.textContent = s;
  }

  // the player fires at a point; returns true if a sensor is hit
  function fire(p, now) {
    const tgt = active().filter(t => t.state === 'on' || t.state === 'in')
      .map(t => ({ t, d: Math.hypot(p.x - t.slot.x, p.y - t.slot.y) }))
      .sort((a, b) => a.d - b.d)[0];
    const hit = tgt && tgt.d < 48 ? tgt.t : null;
    const to = hit ? { x: hit.slot.x, y: hit.slot.y } : p;
    flashT = now;
    beam(muzzleNow(), to, '#c6ff3a', now, () => {
      if (hit && hit.state !== 'hit') {
        hit.state = 'hit'; hit.t = performance.now();
        burst(to, '#ff4fd8', 16);
        setScore(score + 1);
        want.smirk = 1.1; want.furrow = 0; want.squint = 0.15; want.brow = 0.6;
        holdUntil = performance.now() + 1600;
      } else {
        burst(to, '#c6ff3a', 6);
      }
    });
    return !!hit;
  }

  function react(p, now) {
    holdUntil = now + 3600;
    if (onFace(p)) {                       // poked: flinch, squint, frown
      const dx = 855 - p.x, dy = 275 - p.y, d = Math.hypot(dx, dy) || 1;
      kick = { x: (dx / d) * 9 - 3, y: (dy / d) * 6 - 5 };
      want.px = 0; want.py = 0.5;
      want.furrow = 3; want.brow = -1; want.smirk = -0.8; want.squint = 0.5;
      startBlink(now, true);
      holdUntil = now + 2400;
      return false;
    }
    aim(p);
    if (p.x < PIVOT.x - 120) {
      setTimeout(() => fire(p, performance.now()), reduced ? 0 : 110);
      return active().some(t => Math.hypot(p.x - t.slot.x, p.y - t.slot.y) < 48);
    }
    // something behind him: quick check over the shoulder
    want.brow = 2; want.smirk = 0.4;
    return false;
  }

  function startBlink(now, twice) { blinkT = now; doubleBlink = twice; }

  function idle(now) {
    const live = active().filter(t => t.state === 'on');
    if (live.length && Math.random() < 0.75) {
      const t = pick(live);
      const p = { x: t.slot.x + rand(-30, 30), y: t.slot.y + rand(-20, 20) };
      aim(p);
      holdUntil = now + 1800;
      if (Math.random() < 0.7) setTimeout(() => fire(p, performance.now()), 420);
    } else {
      Object.assign(want, REST); want.smirk = 0.9; want.squint = 0.2;   // a glance at the viewer
      aim({ x: 900, y: 600 }); want.px = 0.8; want.py = 0.4; want.aim = cur.aim;
      holdUntil = now + 1600;
    }
    nextIdle = now + rand(2600, 4800);
  }

  // incoming fire from the other team: mostly the pallets, now and then his head sensor
  function enemyShot(now) {
    const live = active().filter(t => t.state === 'on');
    if (!live.length) { nextEnemy = now + 2000; return; }
    const src = pick(live);
    const onHead = Math.random() < 0.25;
    const to = onHead ? { x: 853, y: 198 + cur.ty + cur.duck } : { x: rand(560, 1000), y: rand(506, 516) };
    beam({ x: src.slot.x, y: src.slot.y }, to, '#ff4fd8', now, () => {
      const t = performance.now();
      burst(to, '#ff4fd8', onHead ? 14 : 9);
      duckUntil = t + 900;
      want.squint = 0.7; want.furrow = 2.4; want.smirk = -0.4;
      holdUntil = t + 1200;
      if (onHead) { headHitT = t; startBlink(t, true); kick = { x: 4, y: -2 }; }
    });
    nextEnemy = now + rand(4500, 8000);
  }

  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('a, button, .hero, .nav')) return;
    const now = performance.now();
    const hit = react(toArt(e.clientX, e.clientY), now);
    nextIdle = now + 7000;
    const r = document.createElement('div');
    r.className = 'ripple' + (hit ? ' hit' : '');
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 850);
  });

  /* ---------- main loop ---------- */
  let last = performance.now(), running = false, inView = true;
  const now0 = performance.now();
  targets.forEach((t, i) => { t.next = now0 + 300 + i * 700; });

  function tick() {
    if (!running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (now > holdUntil) Object.assign(want, REST, { aim: want.aim * 0.98 });
    if (!reduced && now > nextIdle && now > holdUntil) idle(now);
    if (!reduced && now > nextEnemy) enemyShot(now);
    want.duck = now < duckUntil ? 16 : 0;

    if (now > nextSaccade) {
      saccade = { x: rand(-0.6, 0.6), y: rand(-0.35, 0.35) };
      nextSaccade = now + rand(700, 2200);
    }

    const fe = 1 - Math.pow(0.0005, dt), fh = 1 - Math.pow(0.04, dt), fa = 1 - Math.pow(0.001, dt), fd = 1 - Math.pow(0.0002, dt);
    cur.px = lerp(cur.px, want.px + saccade.x, fe);
    cur.py = lerp(cur.py, want.py + saccade.y, fe);
    for (const k of ['rot', 'tx', 'ty', 'brow', 'furrow', 'smirk', 'squint']) cur[k] = lerp(cur[k], want[k], fh);
    cur.aim = lerp(cur.aim, want.aim, fa);
    cur.duck = lerp(cur.duck, want.duck, fd);
    kick.x *= Math.pow(0.02, dt); kick.y *= Math.pow(0.02, dt);

    const sway = Math.sin(now / 1900) * 0.5;
    head.setAttribute('transform',
      `translate(${f2(cur.tx + kick.x)} ${f2(cur.ty + kick.y + cur.duck)}) rotate(${f2(cur.rot + sway - kick.x * 0.25)} 855 390)`);
    rig.setAttribute('transform', `translate(0 ${f2(cur.duck * 0.4)}) rotate(${f2(TILT + cur.aim)} ${PIVOT.x} ${PIVOT.y})`);

    const iris = `translate(${f2(cur.px)} ${f2(cur.py)})`;
    irisL.setAttribute('transform', iris);
    irisR.setAttribute('transform', iris);

    const fu = cur.furrow;
    browL.setAttribute('transform', `translate(${f2(fu * 0.8)} ${f2(-cur.brow + fu * 0.8)}) rotate(${f2(fu * 2.2)} 842 244)`);
    browR.setAttribute('transform', `translate(${f2(-fu * 0.8)} ${f2(-cur.brow + fu * 0.8)}) rotate(${f2(-fu * 2.2)} 858 244)`);

    const sm = cur.smirk;
    mouth.setAttribute('d', `M828 ${f2(328 - sm * 0.6)} C840 ${f2(333 + sm * 0.8)} 858 ${f2(333 + sm * 0.4)} 874 ${f2(326 - sm * 2)}`);
    mouthCorner.setAttribute('d', `M874 ${f2(326 - sm * 2)} C877 ${f2(324 - sm * 2.6)} 879 ${f2(322 - sm * 3)} 880 ${f2(318 - sm * 3.6)}`);

    // blinking + squint
    if (blinkT < 0 && now > nextBlink) startBlink(now, Math.random() < 0.15);
    if (blinkT >= 0) {
      const t = Math.max(0, now - blinkT) / 130;
      const total = doubleBlink ? 4 : 2;
      if (t >= total) { blinkT = -1; blink = 0; nextBlink = now + rand(2200, 5200); }
      else { const ph = t % 2; blink = ph < 1 ? ph : 2 - ph; }
    }
    const lid = clamp(Math.max(blink, cur.squint), 0, 1);
    lidL.setAttribute('height', f2(lid * 18));
    lidR.setAttribute('height', f2(lid * 18));
    lashL.setAttribute('transform', `translate(0 ${f2(lid * 6)})`);
    lashR.setAttribute('transform', `translate(0 ${f2(lid * 6)})`);

    // muzzle flare + head sensor hit flash
    const fl = Math.max(0, 1 - (now - flashT) / 260);
    muzzleGlow.setAttribute('opacity', f2(0.55 + 0.15 * Math.sin(now / 300) + fl * 0.45));
    const hh = Math.max(0, 1 - (now - headHitT) / 1400);
    headSensor.setAttribute('fill', hh > 0 && Math.sin(now / 45) > 0 ? '#ffffff' : 'url(#gSensorG)');

    // targets
    for (const t of targets) {
      if (t.state === 'off') { if (now > t.next) show(t, now); continue; }
      const age = (now - t.t) / 1000;
      if (t.state === 'in') {
        t.g.setAttribute('opacity', f2(Math.min(1, age / 0.5)));
        if (age > 0.5) t.state = 'on';
      } else if (t.state === 'on') {
        const p = 0.75 + 0.25 * Math.sin(now / 260 + t.phase);
        t.g.setAttribute('opacity', f2(p));
        if (age > 9) { t.state = 'out'; t.t = now; }
      } else if (t.state === 'hit') {
        const k = age / 0.6;
        t.ring.setAttribute('r', f2(8 + k * 40));
        t.ring.setAttribute('opacity', f2(Math.max(0, 1 - k)));
        t.core.setAttribute('rx', f2(5.5 + (k < .3 ? k * 24 : 0)));
        t.g.setAttribute('opacity', f2(Math.max(0, 1 - k * 0.8)));
        if (k >= 1) { t.state = 'off'; t.next = now + rand(1200, 3000); t.slot = null; t.ring.setAttribute('opacity', 0); t.core.setAttribute('rx', 5.5); }
      } else if (t.state === 'out') {
        const k = age / 0.5;
        t.g.setAttribute('opacity', f2(Math.max(0, 1 - k)));
        if (k >= 1) { t.state = 'off'; t.next = now + rand(400, 1500); t.slot = null; }
      }
    }

    // beams
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i];
      const age = now - b.t0;
      const prog = Math.min(1, age / b.travel);
      const hx = lerp(b.from.x, b.to.x, prog), hy = lerp(b.from.y, b.to.y, prog);
      if (prog >= 1 && !b.done) { b.done = true; b.onArrive && b.onArrive(); }
      const fade = prog < 1 ? 1 : Math.max(0, 1 - (age - b.travel) / 320);
      const tail = prog < 1 ? 0 : Math.min(1, (age - b.travel) / 320) * 0.9;
      const sx = lerp(b.from.x, b.to.x, tail), sy = lerp(b.from.y, b.to.y, tail);
      for (const ln of [b.glow, b.core]) {
        ln.setAttribute('x1', f2(sx)); ln.setAttribute('y1', f2(sy));
        ln.setAttribute('x2', f2(hx)); ln.setAttribute('y2', f2(hy));
      }
      b.glow.setAttribute('opacity', f2(0.3 * fade));
      b.core.setAttribute('opacity', f2(fade));
      if (fade <= 0) { b.glow.remove(); b.core.remove(); beams.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      s.vy += 520 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      const k = s.life / s.max;
      s.node.setAttribute('x1', f2(s.x)); s.node.setAttribute('y1', f2(s.y));
      s.node.setAttribute('x2', f2(s.x - s.vx * 0.025)); s.node.setAttribute('y2', f2(s.y - s.vy * 0.025));
      s.node.setAttribute('opacity', f2(Math.max(0, 1 - k)));
      if (k >= 1) { s.node.remove(); sparks.splice(i, 1); }
    }

    drawFog(reduced ? 0 : now / 1000);
    requestAnimationFrame(tick);
  }

  function start() {
    if (running || !inView || document.hidden) return;
    running = true; last = performance.now();
    requestAnimationFrame(tick);
  }
  function stop() { running = false; }
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; inView ? start() : stop(); }).observe(stage);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();

  /* ---------- nav turns solid once the hero scrolls away ---------- */
  const nav = document.getElementById('nav');
  const solid = () => nav.classList.toggle('solid', scrollY > stage.offsetHeight - 80);
  addEventListener('scroll', solid, { passive: true });
  solid();
})();
