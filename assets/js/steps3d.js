/* WS Flooring: How It Works, the real installation process in 3D
   The scroll position (0 to 1) runs the job in the order it happens on site:
     0  surface prep   concrete subfloor; the waterproofing / uncoupling membrane unrolls over it
     1  layout         chalk lines snapped on the membrane, bronze mark at the origin
     2  setting        the notched trowel spreads thinset tile by tile; each marble tile is
                       set into it and leveled with clips and wedges at the joints
     3  grout          the clips come off, grout fills the joints
     4  finish         the marble goes from honed to a polished, reflective finish
   Loaded by main.js only when the section comes near the viewport. */
import * as THREE from '../vendor/three/three.module.min.js';

const N = 4;                 // tiles per side
const T = 0.92;              // tile size
const G = 0.026;             // grout joint
const TH = 0.07;             // tile thickness
const SPAN = N * T + (N - 1) * G;
const BASE = SPAN + 0.56;    // subfloor size
const BH = 0.2;              // subfloor thickness
const MH = 0.014;            // membrane thickness
const TT = 0.018;            // thinset bed thickness

// stage boundaries on the 0..1 scroll
export const STAGES = [0, 0.16, 0.27, 0.68, 0.8];

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function loadTexture(url) {
  return new Promise((resolve, reject) => new THREE.TextureLoader().load(url, resolve, undefined, reject));
}
function canvasTexture(c, renderer, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// Concrete subfloor
function concrete(renderer) {
  const S = 1024, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#5d5a55';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 80 + Math.random() * 220;
    const m = g.createRadialGradient(x, y, 0, x, y, r);
    m.addColorStop(0, Math.random() < 0.5 ? 'rgba(150,145,138,.1)' : 'rgba(30,28,26,.12)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = Math.random() < 0.5 ? `rgba(40,38,35,${0.05 + Math.random() * 0.12})` : `rgba(235,230,220,${0.04 + Math.random() * 0.1})`;
    const r = Math.random() * 1.8 + 0.4;
    g.fillRect(Math.random() * S, Math.random() * S, r, r);
  }
  return canvasTexture(c, renderer);
}

// Orange uncoupling / waterproofing membrane: a waffle of square cavities
function membraneTextures(renderer) {
  const S = 1024, cell = 32;
  const c = document.createElement('canvas'), b = document.createElement('canvas');
  c.width = c.height = b.width = b.height = S;
  const g = c.getContext('2d'), h = b.getContext('2d');
  g.fillStyle = '#d4682a'; g.fillRect(0, 0, S, S);
  h.fillStyle = '#fff'; h.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += cell) {
    for (let x = 0; x < S; x += cell) {
      g.fillStyle = '#b9561f'; g.fillRect(x + 6, y + 6, cell - 12, cell - 12);
      g.fillStyle = 'rgba(255,180,120,.35)'; g.fillRect(x + 6, y + 6, cell - 12, 3);
      h.fillStyle = '#444'; h.fillRect(x + 6, y + 6, cell - 12, cell - 12);
    }
  }
  const map = canvasTexture(c, renderer), bump = canvasTexture(b, renderer, false);
  [map, bump].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 1.6); });
  return { map, bump };
}

// Chalk layout on a transparent sheet, with the bronze origin mark
function chalk(renderer) {
  const S = 1024, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const px = S / SPAN;
  g.strokeStyle = 'rgba(252,250,245,.95)';
  g.lineWidth = 4.5;
  for (let i = 1; i < N; i++) {
    const p = (i * (T + G) - G / 2) * px;
    g.beginPath(); g.moveTo(p + (Math.random() - 0.5) * 2, 4); g.lineTo(p + (Math.random() - 0.5) * 2, S - 4); g.stroke();
    g.beginPath(); g.moveTo(4, p + (Math.random() - 0.5) * 2); g.lineTo(S - 4, p + (Math.random() - 0.5) * 2); g.stroke();
  }
  g.strokeRect(3, 3, S - 6, S - 6);
  g.strokeStyle = '#2b2018'; g.lineWidth = 7;
  g.beginPath(); g.arc(S / 2, S / 2, 18, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(S / 2 - 40, S / 2); g.lineTo(S / 2 + 40, S / 2); g.moveTo(S / 2, S / 2 - 40); g.lineTo(S / 2, S / 2 + 40); g.stroke();
  return canvasTexture(c, renderer);
}

// Thinset bed combed by a notched trowel: ridges and valleys
function thinsetTextures(renderer) {
  const S = 256, c = document.createElement('canvas'), b = document.createElement('canvas');
  c.width = c.height = b.width = b.height = S;
  const g = c.getContext('2d'), h = b.getContext('2d');
  for (let y = 0; y < S; y++) {
    const ridge = 0.5 + 0.5 * Math.cos((y / S) * Math.PI * 2 * 11);
    const v = Math.round(118 + ridge * 52);
    g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(0, y, S, 1);
    const k = Math.round(ridge * 255);
    h.fillStyle = `rgb(${k},${k},${k})`; h.fillRect(0, y, S, 1);
  }
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(60,58,54,${Math.random() * 0.25})`;
    g.fillRect(Math.random() * S, Math.random() * S, 1.4, 1.4);
  }
  return { map: canvasTexture(c, renderer), bump: canvasTexture(b, renderer, false) };
}

// A small studio of soft boxes so the polished floor has something to reflect
function studio(renderer) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x0b0c0d);
  const box = (w, h, x, y, z, power) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power * 0.98, power * 0.94), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  box(10, 3, 0, 9, -2, 5);
  box(14, 3.2, -7, 4.2, -7, 4.5);
  box(3, 8, -9, 3, 3, 2.2);
  box(6, 2, 7, 4, 6, 1.2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(s, 0.03).texture;
  pmrem.dispose();
  return env;
}

export async function mount(canvas, opts) {
  const small = window.matchMedia('(max-width: 980px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.still });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.84;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;

  const marble = await loadTexture(opts.texture);
  marble.colorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.environment = studio(renderer);

  scene.add(new THREE.HemisphereLight(0xfffaf2, 0x1a1b1c, 0.55));
  const key = new THREE.DirectionalLight(0xfff1df, 2.1);
  key.position.set(-4, 9, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 22 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.015;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe7ff, 0.7);
  rim.position.set(6, 3, -5);
  scene.add(rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.42 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -BH;
  ground.receiveShadow = true;
  scene.add(ground);

  const floor = new THREE.Group();
  scene.add(floor);

  // 0. subfloor
  const concreteSide = new THREE.MeshStandardMaterial({ color: 0x6d6a65, roughness: 0.95 });
  const concreteTop = new THREE.MeshStandardMaterial({ map: concrete(renderer), roughness: 0.92 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(BASE, BH, BASE), [concreteSide, concreteSide, concreteTop, concreteSide, concreteSide, concreteSide]);
  base.position.y = -BH / 2;
  base.receiveShadow = base.castShadow = true;
  floor.add(base);

  // 0. membrane, unrolled from the back edge toward the viewer; the roll travels with the cut
  const ML = SPAN + 0.18;
  const cut = new THREE.Plane(new THREE.Vector3(0, 0, -1), -ML / 2);
  const mem = membraneTextures(renderer);
  const memMat = new THREE.MeshStandardMaterial({ map: mem.map, bumpMap: mem.bump, bumpScale: 0.6, roughness: 0.62, clippingPlanes: [cut] });
  const membrane = new THREE.Mesh(new THREE.BoxGeometry(ML, MH, ML), memMat);
  membrane.position.y = MH / 2;
  membrane.receiveShadow = true;
  floor.add(membrane);
  const rollMat = new THREE.MeshStandardMaterial({ color: 0xcf6328, roughness: 0.6 });
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, ML + 0.06, 40), rollMat);
  roll.rotation.z = Math.PI / 2;
  roll.castShadow = true;
  floor.add(roll);

  // 1. chalk layout
  const chalkMat = new THREE.MeshBasicMaterial({ map: chalk(renderer), transparent: true, opacity: 0, depthWrite: false });
  const lines = new THREE.Mesh(new THREE.PlaneGeometry(SPAN, SPAN), chalkMat);
  lines.rotation.x = -Math.PI / 2;
  lines.position.y = MH + 0.002;
  floor.add(lines);

  // 2. thinset beds, tiles, leveling clips
  const thin = thinsetTextures(renderer);
  const thinGeo = new THREE.BoxGeometry(T - 0.03, TT, T - 0.03);
  thinGeo.translate((T - 0.03) / 2, 0, 0);          // grows from its left edge, along the ridges
  const img = marble.image;
  const crop = Math.min(1, img.height / img.width);
  const ox = (1 - crop) * 0.42;
  const edge = new THREE.MeshPhysicalMaterial({ color: 0xece8e0, roughness: 0.4, clearcoat: 0.4 });
  const tileGeo = new THREE.BoxGeometry(T, TH, T);
  const clipCap = new THREE.MeshStandardMaterial({ color: 0xc8382b, roughness: 0.45 });
  const clipWedge = new THREE.MeshStandardMaterial({ color: 0xe8bd36, roughness: 0.45 });
  const capGeo = new THREE.BoxGeometry(0.03, 0.09, 0.13);
  const wedgeGeo = new THREE.BoxGeometry(0.16, 0.034, 0.036);
  const restY = MH + TT + TH / 2;

  function makeClip(x, z, across) {
    const g = new THREE.Group();
    const cap = new THREE.Mesh(capGeo, clipCap);
    cap.position.y = 0.045;
    const wedge = new THREE.Mesh(wedgeGeo, clipWedge);
    wedge.position.y = 0.075;
    g.add(cap, wedge);
    g.position.set(x, restY + TH / 2 - 0.03, z);
    if (across) g.rotation.y = Math.PI / 2;
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    g.visible = false;
    floor.add(g);
    return g;
  }

  const tiles = [];
  const SET_A = STAGES[2] + 0.01, SET_B = STAGES[3] - 0.05;   // setting window
  const slot = (SET_B - SET_A) / (N * N);
  let k = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      // laid row by row from the back, alternating direction, like a setter working out of the room
      const cc = r % 2 ? N - 1 - c : c;
      const x = -SPAN / 2 + T / 2 + cc * (T + G);
      const z = -SPAN / 2 + T / 2 + r * (T + G);
      const bedMat = new THREE.MeshStandardMaterial({ map: thin.map, bumpMap: thin.bump, bumpScale: 1.4, roughness: 0.96 });
      const bed = new THREE.Mesh(thinGeo, bedMat);
      bed.position.set(x - (T - 0.03) / 2, MH + TT / 2, z);
      bed.receiveShadow = true;
      bed.visible = false;
      floor.add(bed);

      const map = marble.clone();
      map.needsUpdate = true;
      map.repeat.set(crop / N, 1 / N);
      map.offset.set(ox + cc * crop / N, (N - 1 - r) / N);
      map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const top = new THREE.MeshPhysicalMaterial({ map, roughness: 0.55, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.5, envMapIntensity: 0.6 });
      const mesh = new THREE.Mesh(tileGeo, [edge, edge, top, edge, edge, edge]);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.visible = false;
      floor.add(mesh);

      const clips = [];
      if (cc < N - 1) clips.push(makeClip(x + T / 2 + G / 2, z - T * 0.25, false), makeClip(x + T / 2 + G / 2, z + T * 0.25, false));
      if (r < N - 1) clips.push(makeClip(x - T * 0.25, z + T / 2 + G / 2, true), makeClip(x + T * 0.25, z + T / 2 + G / 2, true));

      const t0 = SET_A + k * slot;
      tiles.push({ bed, mesh, top, clips, x, z, spread: [t0, t0 + slot * 0.55], drop: [t0 + slot * 0.45, t0 + slot * 1.25], spin: (c + r) % 2 ? 1 : -1 });
      k++;
    }
  }

  // notched trowel: steel blade with a toothed edge, an arched post and a wooden handle
  const trowel = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xd3d6da, metalness: 1, roughness: 0.22 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.2), steel);
  trowel.add(blade);
  for (let i = 0; i < 10; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.01, 0.03), steel);
    tooth.position.set(-0.234 + i * 0.052, 0, 0.114);
    trowel.add(tooth);
  }
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2b2c2e, metalness: 0.6, roughness: 0.4 });
  [-0.12, 0.12].forEach(x => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.11, 0.024), postMat);
    post.position.set(x, 0.058, -0.01);
    trowel.add(post);
  });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.04, 0.46, 24), new THREE.MeshStandardMaterial({ color: 0xb07a45, roughness: 0.5 }));
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 0.13, -0.01);
  trowel.add(handle);
  trowel.traverse(m => { if (m.isMesh) m.castShadow = true; });
  trowel.rotation.x = 0.7;                           // tilted so the teeth comb the bed
  trowel.scale.setScalar(1.55);
  trowel.visible = false;
  floor.add(trowel);
  // 3. grout
  const groutMat = new THREE.MeshStandardMaterial({ color: 0xcdc7bd, roughness: 0.85, transparent: true, opacity: 0 });
  const grout = new THREE.Mesh(new THREE.BoxGeometry(SPAN, TH * 0.9 + TT, SPAN), groutMat);
  grout.position.y = MH + (TH * 0.9 + TT) / 2;
  grout.receiveShadow = true;
  grout.visible = false;
  floor.add(grout);

  // camera
  const FOV = 26;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);
  const target = new THREE.Vector3(0, -0.02, 0);

  let p = 0, pv = 0, px = 0, pxv = 0, stage = -1;
  let visible = false, raf = 0, last = 0, aspect = 1;

  function place(polish) {
    const elev = mix(0.98, 0.62, polish);
    const azim = mix(0.78, 0.56, pv) + pxv * 0.12;
    const dir = new THREE.Vector3(Math.sin(azim), elev, Math.cos(azim)).normalize();
    const v = THREE.MathUtils.degToRad(FOV);
    const hFov = 2 * Math.atan(Math.tan(v / 2) * aspect);
    const dist = (BASE * 0.7) / Math.sin(Math.min(v, hFov) / 2);
    camera.position.copy(dir).multiplyScalar(dist).add(target);
    camera.lookAt(target);
  }

  function update() {
    // prep: membrane unrolls from the back edge
    const un = smooth(0.03, STAGES[1] - 0.01, pv);
    const front = -ML / 2 + un * ML;
    cut.constant = front;                             // keeps z < front
    membrane.visible = un > 0.001;
    const rr = mix(0.13, 0.025, un);
    roll.scale.set(rr, 1, rr);
    roll.position.set(0, MH + rr, front + rr * 0.6);
    roll.visible = un < 0.995;

    // layout
    chalkMat.opacity = smooth(STAGES[1], STAGES[1] + 0.06, pv) * (1 - smooth(STAGES[2] + 0.04, STAGES[3], pv) * 0.8);

    // setting
    let active = null;
    tiles.forEach(t => {
      const s = smooth(t.spread[0], t.spread[1], pv);
      t.bed.visible = s > 0.001;
      t.bed.scale.x = Math.max(0.001, s);
      if (s > 0.001 && s < 0.999) active = { t, s };
      const f = smooth(t.drop[0], t.drop[1], pv);
      const fall = 1 - f;
      t.mesh.visible = f > 0.001;
      t.mesh.position.set(t.x, restY + fall * fall * 1.6, t.z);
      t.mesh.rotation.y = fall * 0.35 * t.spin;
      t.mesh.rotation.x = fall * 0.1 * t.spin;
      const off = smooth(STAGES[3] + 0.005, STAGES[3] + 0.05, pv);   // clips come off at grout
      t.clips.forEach(cl => {
        cl.visible = f > 0.98 && off < 0.999;
        cl.position.y = restY + TH / 2 - 0.03 + off * 0.35;
        cl.scale.setScalar(Math.max(0.001, 1 - off));
      });
    });
    if (active) {
      trowel.visible = true;
      const { t, s } = active;
      trowel.position.set(t.x - T / 2 + s * T, MH + TT + 0.1, t.z + 0.12);
    } else trowel.visible = false;

    // grout and finish
    const fill = smooth(STAGES[3] + 0.03, STAGES[4], pv);
    grout.visible = fill > 0.001;
    groutMat.opacity = fill;
    const polish = smooth(STAGES[4], 0.97, pv);
    tiles.forEach(t => {
      t.top.roughness = mix(0.55, 0.12, polish);
      t.top.clearcoatRoughness = mix(0.5, 0.025, polish);
      t.top.envMapIntensity = mix(0.6, 1.05, polish);
    });
    key.intensity = mix(2.1, 2.4, polish);
    place(polish);

    let st = 0;
    STAGES.forEach((b, i) => { if (pv >= b) st = i; });
    if (st !== stage) { stage = st; if (opts.onStage) opts.onStage(st); }
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const kk = 1 - Math.exp(-dt * 4);
    pv += (p - pv) * kk;
    pxv += (px - pxv) * kk;
    update();
    renderer.render(scene, camera);
    if (visible && (Math.abs(p - pv) > 0.0004 || Math.abs(px - pxv) > 0.0004)) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    update();
    renderer.render(scene, camera);
  }
  new ResizeObserver(resize).observe(canvas);

  const host = canvas.closest('section') || canvas;
  host.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = host.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - 0.5;
    kick();
  });

  resize();

  return {
    setStep() {},
    setProgress(v) { p = clamp(v); kick(); },
    setVisible(v) { visible = v; if (v) kick(); },
    freeze(v) { p = pv = clamp(v); px = pxv = 0; update(); renderer.render(scene, camera); }
  };
}
