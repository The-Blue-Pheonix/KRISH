import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

// ─── Noise ───────────────────────────────────────────────────────────────────
function smoothNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const rand = (a, b) => Math.abs(Math.sin(a * 127.1 + b * 311.7) * 43758.5453 % 1);
  return (
    rand(xi, zi) * (1 - u) * (1 - v) +
    rand(xi + 1, zi) * u * (1 - v) +
    rand(xi, zi + 1) * (1 - u) * v +
    rand(xi + 1, zi + 1) * u * v
  );
}
function fbm(x, z, oct = 4) {
  let val = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < oct; i++) {
    val += smoothNoise(x * freq, z * freq) * amp;
    max += amp; amp *= 0.5; freq *= 2;
  }
  return val / max;
}

// ─── Indian Season Config ─────────────────────────────────────────────────────
// Indian seasons: Rabi (winter crop), Kharif (monsoon crop), Zaid (summer)
const SEASON_CFG = {
  rabi: {
    // North Indian winter: cool dry air, golden hazy mornings, mustard fields
    skyTop: 0x7fb3d3, skyBot: 0xd4b896, fog: 0xc9b07a, fogDensity: 0.018,
    sunColor: 0xffd580, sunIntensity: 1.2, ambColor: 0xffe4b5, ambIntensity: 0.5,
    groundTint: 0x6b4f2a, grassColor: 0x8b7355,
    label: '❄️ Rabi (Winter)', hazeColor: 0xd4b896,
  },
  kharif: {
    // Monsoon: lush deep green, heavy humid air, dramatic clouds
    skyTop: 0x2d6a9f, skyBot: 0x6aab8e, fog: 0x7abf8a, fogDensity: 0.010,
    sunColor: 0xfff0c0, sunIntensity: 1.5, ambColor: 0xb8ddb0, ambIntensity: 0.55,
    groundTint: 0x1a3a1a, grassColor: 0x2e7d32,
    label: '🌧️ Kharif (Monsoon)', hazeColor: 0x7abf8a,
  },
  zaid: {
    // Hot dry summer: bleached sky, parched earth, harsh sun
    skyTop: 0x5b9bd5, skyBot: 0xf5c97a, fog: 0xe8c87a, fogDensity: 0.008,
    sunColor: 0xffffff, sunIntensity: 2.2, ambColor: 0xffe8a0, ambIntensity: 0.6,
    groundTint: 0x8a6030, grassColor: 0x9e8040,
    label: '☀️ Zaid (Summer)', hazeColor: 0xf0c870,
  },
  harvest: {
    // Post-monsoon harvest: golden stubble, clear azure sky, mild weather
    skyTop: 0x2d8ab0, skyBot: 0xf0d080, fog: 0xe8d5a0, fogDensity: 0.012,
    sunColor: 0xffc060, sunIntensity: 1.6, ambColor: 0xffd580, ambIntensity: 0.5,
    groundTint: 0x5a3d1a, grassColor: 0xb8860b,
    label: '🌾 Harvest (Sharad)', hazeColor: 0xf0d080,
  },
};

// ─── Indian Crops ─────────────────────────────────────────────────────────────
const CROP_CFG = {
  rice: {
    name: 'Paddy Rice (Dhan)',
    // Realistic: thin culms, flooded paddy, panicle droops heavily when ripe
    young: 0x5fa833, mature: 0xc8b820, head: 0xe8a020, headShape: 'panicle',
    stalks: 4, maxH: 1.05, water: true, underground: false,
    season: 'kharif',
  },
  wheat: {
    name: 'Wheat (Gehun)',
    young: 0x8db84a, mature: 0xe8c840, head: 0xf0d040, headShape: 'spike',
    stalks: 5, maxH: 1.1, water: false, underground: false,
    season: 'rabi',
  },
  mustard: {
    name: 'Mustard (Sarson)',
    young: 0x7ab840, mature: 0xd4c820, head: 0xf5e030, headShape: 'raceme',
    stalks: 1, maxH: 1.4, water: false, underground: false,
    season: 'rabi',
  },
  sugarcane: {
    name: 'Sugarcane (Ganna)',
    young: 0x4aa830, mature: 0x2d7020, head: 0xa8c870, headShape: 'tassel',
    stalks: 1, maxH: 3.0, water: false, underground: false,
    season: 'zaid',
  },
  cotton: {
    name: 'Cotton (Kapas)',
    young: 0x60b040, mature: 0x3a7030, head: 0xf8f8f8, headShape: 'boll',
    stalks: 1, maxH: 1.2, water: false, underground: false,
    season: 'kharif',
  },
  chickpea: {
    name: 'Chickpea (Chana)',
    young: 0x78a840, mature: 0x5a8030, head: 0xf0f0e8, headShape: 'pod',
    stalks: 3, maxH: 0.6, water: false, underground: false,
    season: 'rabi',
  },
};

const GROWTH_LABELS = [
  'अंकुरण – Germination (0–20%)',
  'कायिक – Vegetative (20–40%)',
  'पुष्पन – Flowering (40–60%)',
  'दाना भरना – Grain Filling (60–80%)',
  'परिपक्व – Mature / Harvest (80–100%)',
];

// ─── Rice: realistic Indian paddy ─────────────────────────────────────────────
function makeRicePlant(growth) {
  const group = new THREE.Group();
  const numTillers = 3 + Math.floor(growth * 5); // tillering: more tillers as plant matures
  const stalkH = Math.max(0.05, growth) * 1.05;

  for (let t = 0; t < numTillers; t++) {
    const angle = (t / numTillers) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const r = 0.06 + Math.random() * 0.04;
    const tx = Math.cos(angle) * r, tz = Math.sin(angle) * r;

    // Tiller lean outward naturally
    const leanAngle = 0.1 + Math.random() * 0.15;

    // Color transitions: vivid green → yellowing → golden ripe
    const stalkColor = growth < 0.5
      ? new THREE.Color(0x4a9a28).lerp(new THREE.Color(0x7aba30), growth * 2)
      : new THREE.Color(0x7aba30).lerp(new THREE.Color(0xc8a020), (growth - 0.5) * 2);

    // Culm (hollow grass stem, very thin)
    for (let seg = 0; seg < 3; seg++) {
      const segH = stalkH * 0.34;
      const segGeo = new THREE.CylinderGeometry(
        0.008 - seg * 0.002, 0.012 - seg * 0.002, segH, 4
      );
      segGeo.translate(0, segH / 2, 0);
      const segMat = new THREE.MeshLambertMaterial({ color: stalkColor });
      const segMesh = new THREE.Mesh(segGeo, segMat);
      segMesh.position.set(tx, seg * segH, tz);
      segMesh.rotation.z = leanAngle * (seg + 1) * Math.cos(angle);
      segMesh.rotation.x = leanAngle * (seg + 1) * Math.sin(angle);
      segMesh.castShadow = true;
      group.add(segMesh);
    }

    // Flag leaf + 2 sheath leaves
    if (growth > 0.1) {
      const leafCount = Math.min(3, 1 + Math.floor(growth * 4));
      for (let li = 0; li < leafCount; li++) {
        const leafH = stalkH * (0.25 + li * 0.28);
        const leafLen = 0.25 + growth * 0.25;
        // Leaf blade: flat and long, droops at tip
        const leafGeo = new THREE.PlaneGeometry(0.018, leafLen, 1, 2);
        const leafMat = new THREE.MeshLambertMaterial({
          color: stalkColor, side: THREE.DoubleSide, transparent: true, opacity: 0.92,
        });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(tx, leafH, tz);
        leaf.rotation.y = angle + li * 1.5;
        leaf.rotation.z = (li % 2 === 0 ? 0.7 : -0.7) + leanAngle;
        // Droop the tip by rotating
        leaf.rotation.x = -0.3 - growth * 0.2;
        leaf.castShadow = true;
        group.add(leaf);
      }
    }

    // Panicle: forms after heading (>50% growth)
    // Realistic: drooping panicle with grain-bearing branches
    if (growth > 0.52) {
      const panicleT = Math.min(1, (growth - 0.52) / 0.48);
      const panicleBase = stalkH + 0.01;

      // Panicle rachis (main axis)
      const rachisLen = 0.22 * panicleT;
      // Droop angle increases as grains fill (heavy)
      const droopAngle = growth > 0.75 ? Math.PI * 0.45 * ((growth - 0.75) / 0.25) : 0;

      const rachisGeo = new THREE.CylinderGeometry(0.003, 0.005, rachisLen, 4);
      rachisGeo.translate(0, rachisLen / 2, 0);
      const rachisMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0xb8960a).lerp(new THREE.Color(0xe8a820), panicleT) });
      const rachis = new THREE.Mesh(rachisGeo, rachisMat);
      rachis.position.set(tx, panicleBase, tz);
      rachis.rotation.z = -droopAngle * Math.cos(angle) + leanAngle;
      rachis.rotation.x = -droopAngle * Math.sin(angle);
      rachis.castShadow = true;
      group.add(rachis);

      // Primary branches with spikelets (the actual grain)
      const numBranches = 4 + Math.floor(growth * 4);
      for (let pb = 0; pb < numBranches; pb++) {
        const branchAngleY = (pb / numBranches) * Math.PI * 2;
        const branchLen = (0.08 + Math.random() * 0.06) * panicleT;
        const branchY = panicleBase + pb * (rachisLen / numBranches);

        // Grain color: pale green → yellow → golden brown
        const grainColor = growth < 0.7
          ? new THREE.Color(0x90c840)
          : new THREE.Color(0x90c840).lerp(new THREE.Color(0xd4860a), (growth - 0.7) / 0.3);

        // Each spikelet (individual grain)
        const spikeletGeo = new THREE.SphereGeometry(0.012 * panicleT, 3, 3);
        const spikeletMat = new THREE.MeshLambertMaterial({ color: grainColor });
        const spikelet = new THREE.Mesh(spikeletGeo, spikeletMat);

        const bx = tx + Math.cos(branchAngleY) * branchLen;
        const bz = tz + Math.sin(branchAngleY) * branchLen;
        // Droop: outer grains hang lower
        const byDroop = -branchLen * (0.5 + growth * 0.8);
        spikelet.position.set(bx, branchY + byDroop - droopAngle * 0.08, bz);
        spikelet.castShadow = true;
        group.add(spikelet);
      }
    }
  }

  // Flooded paddy water layer (Kharif / early growth)
  if (growth < 0.72) {
    const wGeo = new THREE.PlaneGeometry(0.9, 0.9, 2, 2);
    wGeo.rotateX(-Math.PI / 2);
    const wMat = new THREE.MeshLambertMaterial({
      color: 0x4a9ec8, transparent: true, opacity: 0.32, side: THREE.DoubleSide,
    });
    const wMesh = new THREE.Mesh(wGeo, wMat);
    wMesh.position.y = 0.025;
    group.add(wMesh);

    // Muddy bund reflection shimmer
    const shimGeo = new THREE.PlaneGeometry(0.88, 0.88);
    shimGeo.rotateX(-Math.PI / 2);
    const shimMat = new THREE.MeshBasicMaterial({
      color: 0x88d0f0, transparent: true, opacity: 0.08,
    });
    const shim = new THREE.Mesh(shimGeo, shimMat);
    shim.position.y = 0.03;
    group.add(shim);
  }

  return group;
}

// ─── Generic crop (wheat, mustard, sugarcane etc.) ────────────────────────────
function makeGenericCrop(cfg, growth) {
  const group = new THREE.Group();
  const mature = new THREE.Color(cfg.mature);
  const young = new THREE.Color(cfg.young);
  const stalkColor = young.clone().lerp(mature, growth);
  const h = cfg.maxH * Math.max(0.06, growth);
  const numS = cfg.stalks;

  for (let s = 0; s < numS; s++) {
    const angle = (s / numS) * Math.PI * 2;
    const r = numS > 1 ? 0.07 : 0;
    const sx = Math.cos(angle) * r, sz = Math.sin(angle) * r;
    const geo = new THREE.CylinderGeometry(0.02 * 0.6, 0.025, h, 5, 1);
    geo.translate(0, h / 2, 0);
    const mat = new THREE.MeshLambertMaterial({ color: stalkColor });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(sx, 0, sz);
    mesh.castShadow = true;
    mesh.rotation.z = (Math.random() - 0.5) * 0.1;
    group.add(mesh);

    if (growth > 0.15 && s % 2 === 0) {
      for (let li = 0; li < 2; li++) {
        const leafH = h * (0.3 + li * 0.3);
        const leafGeo = new THREE.PlaneGeometry(0.022, 0.3 + growth * 0.2, 1, 3);
        const leafMat = new THREE.MeshLambertMaterial({ color: stalkColor, side: THREE.DoubleSide });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(sx, leafH, sz);
        leaf.rotation.z = (li % 2 === 0 ? 0.65 : -0.65);
        leaf.rotation.y = angle + Math.random() * 0.4;
        leaf.castShadow = true;
        group.add(leaf);
      }
    }
  }

  // Crop-specific heads
  if (growth > 0.45) {
    const headT = Math.max(0, (growth - 0.45) / 0.55);
    const headColor = new THREE.Color(cfg.head);
    const topY = h;

    if (cfg.headShape === 'spike') {
      // Wheat: compact spike with awns
      const spikeLen = 0.22 * headT;
      const spikeGeo = new THREE.CylinderGeometry(0.018 * headT, 0.022 * headT, spikeLen, 5);
      const spikeMat = new THREE.MeshLambertMaterial({ color: headColor });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(0, topY + spikeLen / 2, 0);
      spike.castShadow = true;
      group.add(spike);
      // Awns
      for (let aw = 0; aw < 8; aw++) {
        const awAngle = (aw / 8) * Math.PI * 2;
        const awnGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.18 * headT, 3);
        const awm = new THREE.Mesh(awnGeo, spikeMat);
        awm.position.set(Math.cos(awAngle) * 0.015, topY + 0.05 + aw * 0.02, Math.sin(awAngle) * 0.015);
        awm.rotation.z = Math.cos(awAngle) * 0.3;
        group.add(awm);
      }
    } else if (cfg.headShape === 'raceme') {
      // Mustard: bright yellow flower clusters
      for (let fl = 0; fl < 8; fl++) {
        const fa = (fl / 8) * Math.PI * 2;
        const fGeo = new THREE.SphereGeometry(0.025 * headT, 4, 4);
        const fMat = new THREE.MeshLambertMaterial({ color: 0xffee00 });
        const fm = new THREE.Mesh(fGeo, fMat);
        fm.position.set(
          Math.cos(fa) * 0.06 * headT,
          topY + Math.random() * 0.12,
          Math.sin(fa) * 0.06 * headT
        );
        group.add(fm);
      }
    } else if (cfg.headShape === 'tassel') {
      // Sugarcane: feathery tassel on top
      for (let ts = 0; ts < 12; ts++) {
        const ta = (ts / 12) * Math.PI * 2;
        const tGeo = new THREE.CylinderGeometry(0.004, 0.002, 0.35 * headT, 3);
        const tMat = new THREE.MeshLambertMaterial({ color: 0xd0c898 });
        const tm = new THREE.Mesh(tGeo, tMat);
        tm.position.set(Math.cos(ta) * 0.05, topY + 0.1, Math.sin(ta) * 0.05);
        tm.rotation.z = Math.cos(ta) * 0.5;
        tm.rotation.x = Math.sin(ta) * 0.5;
        group.add(tm);
      }
    } else if (cfg.headShape === 'boll') {
      // Cotton: white fluffy bolls
      const bollGeo = new THREE.SphereGeometry(0.07 * headT, 5, 5);
      const bollMat = new THREE.MeshLambertMaterial({ color: growth > 0.8 ? 0xf8f8f4 : 0x88b060 });
      const boll = new THREE.Mesh(bollGeo, bollMat);
      boll.position.set(0, topY + 0.05, 0);
      group.add(boll);
    } else if (cfg.headShape === 'pod') {
      // Chickpea: small pods
      for (let pd = 0; pd < 6; pd++) {
        const pa = (pd / 6) * Math.PI * 2;
        const pGeo = new THREE.CapsuleGeometry ? new THREE.SphereGeometry(0.025, 4, 4) : new THREE.SphereGeometry(0.025, 4, 4);
        const pMat = new THREE.MeshLambertMaterial({ color: growth > 0.75 ? 0xb8a050 : 0x70a030 });
        const pm = new THREE.Mesh(pGeo, pMat);
        pm.position.set(Math.cos(pa) * 0.08, topY - 0.05 + pd * 0.03, Math.sin(pa) * 0.08);
        group.add(pm);
      }
    }
  }

  return group;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IndianFarmSimulator() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint in Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Redirect to dashboard if on mobile
  useEffect(() => {
    if (isMobile) {
      navigate('/dashboard', { replace: true });
    }
  }, [isMobile, navigate]);
  
  // Don't render the farm on mobile
  if (isMobile) {
    return null;
  }
  
  const mountRef = useRef(null);
  const stateRef = useRef({
    acres: 5, crop: 'rice', growth: 0.6,
    season: 'kharif', weather: 'clear', timeVal: 0.55,
    needsRebuild: true,
  });
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const farmGroupRef = useRef(null);
  const sunRef = useRef(null);
  const sunSphereRef = useRef(null);
  const skyRef = useRef(null);
  const rainRef = useRef(null);
  const cloudsRef = useRef([]);
  const orbitRef = useRef({
    isDown: false, button: 0, lastX: 0, lastY: 0,
    theta: 0.45, phi: 0.52, radius: 28,
    target: new THREE.Vector3(0, 1, 0),
  });
  const windRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());
  const touchRef = useRef({ touches: [] });

  const [ui, setUi] = useState({
    acres: 5, crop: 'rice', growth: 60,
    season: 'kharif', weather: 'clear', timeVal: 55,
    growthLabel: GROWTH_LABELS[2], timeLabel: 'दोपहर (Midday)',
  });

  // ── Orbit controls ──────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    orbitRef.current.isDown = true;
    orbitRef.current.button = e.button;
    orbitRef.current.lastX = e.clientX;
    orbitRef.current.lastY = e.clientY;
    e.preventDefault();
  }, []);
  const onMouseMove = useCallback((e) => {
    const o = orbitRef.current;
    if (!o.isDown) return;
    const dx = e.clientX - o.lastX, dy = e.clientY - o.lastY;
    o.lastX = e.clientX; o.lastY = e.clientY;
    if (o.button === 0) {
      o.theta -= dx * 0.006;
      o.phi = Math.max(0.08, Math.min(Math.PI / 2 - 0.04, o.phi - dy * 0.006));
    } else if (o.button === 2) {
      const cam = cameraRef.current;
      if (!cam) return;
      const right = new THREE.Vector3().crossVectors(cam.getWorldDirection(new THREE.Vector3()), cam.up).normalize();
      o.target.addScaledVector(right, -dx * 0.03).addScaledVector(cam.up, dy * 0.03);
    }
  }, []);
  const onMouseUp = useCallback(() => { orbitRef.current.isDown = false; }, []);
  const onWheel = useCallback((e) => {
    orbitRef.current.radius = Math.max(5, Math.min(80, orbitRef.current.radius + e.deltaY * 0.04));
    e.preventDefault();
  }, []);
  const onTouchStart = useCallback((e) => {
    touchRef.current.touches = Array.from(e.touches);
    orbitRef.current.isDown = true; orbitRef.current.button = 0;
    if (e.touches.length === 1) {
      orbitRef.current.lastX = e.touches[0].clientX;
      orbitRef.current.lastY = e.touches[0].clientY;
    }
  }, []);
  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const prev = touchRef.current.touches;
      if (prev.length === 2) {
        const d0 = Math.hypot(prev[0].clientX - prev[1].clientX, prev[0].clientY - prev[1].clientY);
        const d1 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        orbitRef.current.radius = Math.max(5, Math.min(80, orbitRef.current.radius - (d1 - d0) * 0.08));
      }
      touchRef.current.touches = Array.from(e.touches);
    }
    e.preventDefault();
  }, [onMouseMove]);
  const onTouchEnd = useCallback(() => {
    orbitRef.current.isDown = false;
    touchRef.current.touches = [];
  }, []);

  // ── Scene init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth, H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 800);
    cameraRef.current = camera;

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(380, 16, 8);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    skyRef.current = sky;

    // Sun directional light
    const sun = new THREE.DirectionalLight(0xffd580, 1.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
    sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45;
    sun.shadow.bias = -0.0008;
    scene.add(sun);
    sunRef.current = sun;

    const sunSphGeo = new THREE.SphereGeometry(2.2, 8, 8);
    const sunSphMat = new THREE.MeshBasicMaterial({ color: 0xfff5a0 });
    const sunSphere = new THREE.Mesh(sunSphGeo, sunSphMat);
    scene.add(sunSphere);
    sunSphereRef.current = sunSphere;

    const amb = new THREE.AmbientLight(0xffe4b5, 0.5);
    scene.add(amb);
    scene.userData.amb = amb;

    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x4a7030, 0.22);
    scene.add(hemi);
    scene.userData.hemi = hemi;

    scene.fog = new THREE.FogExp2(0xc9b07a, 0.018);

    const fg = new THREE.Group();
    scene.add(fg);
    farmGroupRef.current = fg;

    // Event listeners
    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mount.addEventListener('wheel', onWheel, { passive: false });
    mount.addEventListener('contextmenu', e => e.preventDefault());
    mount.addEventListener('touchstart', onTouchStart, { passive: false });
    mount.addEventListener('touchmove', onTouchMove, { passive: false });
    mount.addEventListener('touchend', onTouchEnd);

    const handleResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsed = clockRef.current.getElapsedTime();
      windRef.current = Math.sin(elapsed * 0.35) * 0.016 + Math.sin(elapsed * 0.9) * 0.008;

      const o = orbitRef.current;
      const cam = cameraRef.current;
      cam.position.x = o.target.x + o.radius * Math.sin(o.phi) * Math.sin(o.theta);
      cam.position.y = o.target.y + o.radius * Math.cos(o.phi);
      cam.position.z = o.target.z + o.radius * Math.sin(o.phi) * Math.cos(o.theta);
      cam.lookAt(o.target);

      if (farmGroupRef.current) {
        farmGroupRef.current.traverse(obj => {
          if (obj.isMesh && obj.userData.isCropMesh) {
            obj.rotation.z = windRef.current * (obj.userData.windFactor || 1);
            obj.rotation.x = windRef.current * 0.4 * (obj.userData.windFactor || 1);
          }
        });
      }

      const rain = rainRef.current;
      if (rain) {
        const pos = rain.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          pos.setY(i, pos.getY(i) - 0.3);
          if (pos.getY(i) < 0) pos.setY(i, 28 + Math.random() * 8);
        }
        pos.needsUpdate = true;
      }

      cloudsRef.current.forEach(c => {
        c.position.x += 0.003;
        if (c.position.x > 65) c.position.x = -65;
      });

      if (stateRef.current.needsRebuild) {
        stateRef.current.needsRebuild = false;
        rebuildFarm();
      }

      renderer.render(scene, cam);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mount.removeEventListener('wheel', onWheel);
      mount.removeEventListener('touchstart', onTouchStart);
      mount.removeEventListener('touchmove', onTouchMove);
      mount.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line
  }, []);

  // ── Rebuild farm ────────────────────────────────────────────────────────────
  const rebuildFarm = useCallback(() => {
    const scene = sceneRef.current;
    const fg = farmGroupRef.current;
    if (!scene || !fg) return;

    const s = stateRef.current;
    const cfg = SEASON_CFG[s.season];
    const cropCfg = CROP_CFG[s.crop];

    // Clear
    while (fg.children.length) {
      const c = fg.children[0];
      fg.remove(c);
      c.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose?.(); }
      });
    }
    cloudsRef.current.forEach(c => scene.remove(c));
    cloudsRef.current = [];
    if (rainRef.current) { scene.remove(rainRef.current); rainRef.current = null; }

    // Sky, fog
    skyRef.current.material.color.setHex(cfg.skyTop);
    scene.fog.color.setHex(cfg.fog);
    scene.fog.density = cfg.fogDensity;

    // Sun
    const timeAngle = (s.timeVal - 0.5) * Math.PI;
    const sunX = Math.cos(timeAngle) * 80;
    const sunY = Math.max(1, Math.sin(Math.max(0, timeAngle + Math.PI / 2)) * 55);
    const sunZ = -28;
    sunRef.current.position.set(sunX, sunY, sunZ);
    sunRef.current.color.setHex(cfg.sunColor);
    const weatherDim = s.weather === 'cloudy' ? 0.45 : s.weather === 'rain' ? 0.22 : s.weather === 'fog' ? 0.5 : 1;
    sunRef.current.intensity = cfg.sunIntensity * weatherDim;
    sunSphereRef.current.position.set(sunX * 3.0, sunY * 3.0, sunZ * 3.0);
    scene.userData.amb.color.setHex(cfg.ambColor);
    scene.userData.amb.intensity = cfg.ambIntensity * (s.weather === 'rain' ? 0.55 : 1);
    scene.userData.hemi.groundColor.setHex(cfg.grassColor);

    // Grid
    const gridSize = Math.max(3, Math.min(Math.round(Math.sqrt(s.acres) * 4.5), 26));
    const cellSpacing = 1.1;
    const fieldW = gridSize * cellSpacing;

    // ── Terrain ──────────────────────────────────────────────────────────────
    const terrainRes = 32;
    const terrainSize = fieldW * 3.5;
    const tGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainRes, terrainRes);
    tGeo.rotateX(-Math.PI / 2);
    const tPos = tGeo.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const tx = tPos.getX(i), tz = tPos.getZ(i);
      const distFromCenter = Math.sqrt(tx * tx + tz * tz) / (terrainSize * 0.5);
      const heightVal = fbm(tx * 0.055, tz * 0.055, 5) * 2.4 - 0.6;
      const flatten = 1 - Math.max(0, 1 - distFromCenter * 2.8);
      tPos.setY(i, heightVal * flatten - (distFromCenter < 0.32 ? heightVal * (1 - distFromCenter * 2.8) : 0));
    }
    tPos.needsUpdate = true;
    tGeo.computeVertexNormals();

    // Indian soil colors: red laterite, dark alluvial, sandy loam
    const soilPalette = { rabi: 0x5a3820, kharif: 0x2d1e0a, zaid: 0x8a6030, harvest: 0x4a3010 };
    const tMat = new THREE.MeshLambertMaterial({ color: soilPalette[s.season] || 0x5a3820 });
    const terrain = new THREE.Mesh(tGeo, tMat);
    terrain.receiveShadow = true;
    fg.add(terrain);

    // ── Indian dry-season ground vegetation (no snow) ─────────────────────────
    // Dried grass tufts, shrubs, dust
    const grassColors = {
      rabi: [0x8b7355, 0xa08860, 0x907848],   // dried golden-brown
      kharif: [0x2e7d32, 0x388e3c, 0x4caf50],  // lush monsoon green
      zaid: [0x9e8040, 0xb89a50, 0xc4a458],    // scorched yellow
      harvest: [0xb8860b, 0xd4a020, 0xa07818], // golden stubble
    };
    const gcArr = grassColors[s.season] || grassColors.rabi;
    for (let g = 0; g < 45; g++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = fieldW * 0.62 + Math.random() * fieldW * 0.9;
      const gx = Math.cos(angle) * dist, gz = Math.sin(angle) * dist;
      const gh = 0.12 + Math.random() * 0.3;
      const ggeo = new THREE.ConeGeometry(0.055, gh, 3);
      const gmat = new THREE.MeshLambertMaterial({ color: gcArr[Math.floor(Math.random() * gcArr.length)] });
      const gm = new THREE.Mesh(ggeo, gmat);
      gm.position.set(gx, gh / 2, gz);
      gm.rotation.y = Math.random() * Math.PI;
      gm.castShadow = true;
      fg.add(gm);
    }

    // ── Indian trees ──────────────────────────────────────────────────────────
    // Neem, Peepal, Mango, Banyan silhouettes — NOT european deciduous
    const treeTypes = [
      // Neem: spreading canopy, dark green
      { trunkColor: 0x5d3a1a, foliageColors: [0x1b5e20, 0x2e7d32], canopySpread: 1.1, trunkH: 2.2, layers: 3 },
      // Mango: dense rounded crown, deep green
      { trunkColor: 0x4a2c10, foliageColors: [0x1a4a1a, 0x255a20], canopySpread: 0.9, trunkH: 1.8, layers: 2 },
      // Peepal: tall, heart-shaped leaves implied by airy canopy
      { trunkColor: 0x6b3a20, foliageColors: [0x2d6a2d, 0x3a8030], canopySpread: 1.3, trunkH: 2.8, layers: 2 },
    ];

    for (let t = 0; t < 14; t++) {
      const angle = (t / 24) * Math.PI * 2 + Math.random() * 0.25;
      const dist = fieldW * 0.70 + Math.random() * fieldW * 0.55;
      const tx = Math.cos(angle) * dist, tz = Math.sin(angle) * dist;
      const tType = treeTypes[t % treeTypes.length];

      // Trunk — slightly tapering, textured with bumps implied by low-poly
      const trunkH = tType.trunkH + Math.random() * 0.8;
      const trunkGeo = new THREE.CylinderGeometry(0.07, 0.14, trunkH, 5);
      const trunkMat = new THREE.MeshLambertMaterial({ color: tType.trunkColor });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tx, trunkH / 2, tz);
      trunk.castShadow = true;
      fg.add(trunk);

      // Multi-layer canopy (low-poly icosahedron gives organic look)
      for (let l = 0; l < tType.layers; l++) {
        const fColor = tType.foliageColors[l % tType.foliageColors.length];
        const fR = (tType.canopySpread - l * 0.22) * (0.8 + Math.random() * 0.3);
        const fGeo = new THREE.IcosahedronGeometry(fR, 1);
        const fMat = new THREE.MeshLambertMaterial({ color: fColor });
        const fMesh = new THREE.Mesh(fGeo, fMat);
        fMesh.position.set(
          tx + (Math.random() - 0.5) * 0.3,
          trunkH + fR * 0.5 + l * 0.55,
          tz + (Math.random() - 0.5) * 0.3
        );
        fMesh.rotation.y = Math.random() * Math.PI;
        fMesh.castShadow = true;
        fg.add(fMesh);
      }

      // Occasional aerial root hints for banyan
      if (t % 8 === 0 && trunkH > 2.5) {
        for (let ar = 0; ar < 2; ar++) {
          const arGeo = new THREE.CylinderGeometry(0.012, 0.018, 1.2 + Math.random() * 0.5, 4);
          const arMat = new THREE.MeshLambertMaterial({ color: 0x7a4a20 });
          const arMesh = new THREE.Mesh(arGeo, arMat);
          arMesh.position.set(
            tx + (Math.random() - 0.5) * 0.8,
            0.7,
            tz + (Math.random() - 0.5) * 0.8
          );
          fg.add(arMesh);
        }
      }
    }

    // ── Field soil & bunds ────────────────────────────────────────────────────
    // Indian paddy has raised earthen bunds (ridges) between plots
    const soilColor = soilPalette[s.season] || 0x3e2010;
    const soilGeo = new THREE.PlaneGeometry(fieldW + 0.5, fieldW + 0.5);
    soilGeo.rotateX(-Math.PI / 2);
    const soilMat = new THREE.MeshLambertMaterial({ color: soilColor });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = 0.001;
    soilMesh.receiveShadow = true;
    fg.add(soilMesh);

    // Bunds (earthen raised ridges — Indian paddy style, wider & more mound-like than euro furrows)
    const bundColor = s.season === 'kharif' ? 0x3a2210 : 0x5a3820;
    const bMat = new THREE.MeshLambertMaterial({ color: bundColor });
    for (let r = 0; r <= gridSize; r++) {
      const rz = r * cellSpacing - fieldW / 2;
      const rGeo = new THREE.BoxGeometry(fieldW + 0.3, 0.08, 0.28);
      const ridge = new THREE.Mesh(rGeo, bMat);
      ridge.position.set(0, 0.04, rz - cellSpacing / 2);
      ridge.receiveShadow = true;
      fg.add(ridge);
    }
    for (let r = 0; r <= gridSize; r++) {
      const rx = r * cellSpacing - fieldW / 2;
      const rGeo = new THREE.BoxGeometry(0.28, 0.08, fieldW + 0.3);
      const ridge = new THREE.Mesh(rGeo, bMat);
      ridge.position.set(rx - cellSpacing / 2, 0.04, 0);
      ridge.receiveShadow = true;
      fg.add(ridge);
    }

    // Paddy water layer
    if (cropCfg.water && s.growth < 0.76) {
      const wGeo = new THREE.PlaneGeometry(fieldW + 0.15, fieldW + 0.15);
      wGeo.rotateX(-Math.PI / 2);
      const wMat = new THREE.MeshLambertMaterial({ color: 0x5a9ec8, transparent: true, opacity: 0.28 });
      const wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.position.y = 0.06;
      fg.add(wMesh);
    }

    // ── Fence: simple bamboo / wooden post style ──────────────────────────────
    const fenceMat = new THREE.MeshLambertMaterial({ color: 0x9e7a50 });
    const fRail = fieldW / 2 + 0.3;
    const makePost = (x, z) => {
      const pGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.65, 4);
      const post = new THREE.Mesh(pGeo, fenceMat);
      post.position.set(x, 0.32, z);
      post.castShadow = true;
      fg.add(post);
    };
    for (let i = 0; i <= gridSize; i++) {
      const tp = i * cellSpacing - fieldW / 2;
      makePost(tp, -fRail); makePost(tp, fRail);
      makePost(-fRail, tp); makePost(fRail, tp);
    }
    const railMat = new THREE.MeshLambertMaterial({ color: 0x7a5a38 });
    const makeRail = (x, y, z, lx, lz) => {
      const rg = new THREE.BoxGeometry(lx, 0.035, lz);
      const rm = new THREE.Mesh(rg, railMat);
      rm.position.set(x, y, z);
      fg.add(rm);
    };
    const rlen = fieldW + 0.6;
    [0.22, 0.42].forEach(y => {
      makeRail(0, y, -fRail, rlen, 0.035);
      makeRail(0, y, fRail, rlen, 0.035);
      makeRail(-fRail, y, 0, 0.035, rlen);
      makeRail(fRail, y, 0, 0.035, rlen);
    });

    // ── Indian farmhouse (kaccha / pucca style) ───────────────────────────────
    const houseX = fRail + 4.0, houseZ = -fRail;
    // Main structure
    const houseGeo = new THREE.BoxGeometry(4.0, 2.4, 3.0);
    const houseMat = new THREE.MeshLambertMaterial({ color: s.season === 'kharif' ? 0xe8d5a0 : 0xd4b880 }); // ochre plaster
    const house = new THREE.Mesh(houseGeo, houseMat);
    house.position.set(houseX, 1.2, houseZ);
    house.castShadow = true; house.receiveShadow = true;
    fg.add(house);

    // Flat roof with slight parapet (common in rural India, NOT gabled western barn)
    const roofGeo = new THREE.BoxGeometry(4.4, 0.18, 3.4);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xb8a060 });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(houseX, 2.49, houseZ);
    fg.add(roofMesh);

    // Veranda pillars
    for (let p = 0; p < 3; p++) {
      const pilGeo = new THREE.CylinderGeometry(0.08, 0.10, 2.4, 7);
      const pilMat = new THREE.MeshLambertMaterial({ color: 0xc8aa70 });
      const pil = new THREE.Mesh(pilGeo, pilMat);
      pil.position.set(houseX - 1.4 + p * 1.4, 1.2, houseZ - 1.6);
      fg.add(pil);
    }

    // Door (arched)
    const doorGeo = new THREE.BoxGeometry(0.6, 1.4, 0.06);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x5a3010 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(houseX, 0.7, houseZ - 1.52);
    fg.add(door);

    // Water pot (matka) near entrance
    const matkaGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const matkaMat = new THREE.MeshLambertMaterial({ color: 0xc87040 });
    const matka = new THREE.Mesh(matkaGeo, matkaMat);
    matka.position.set(houseX + 0.9, 0.18, houseZ - 1.4);
    matka.scale.y = 1.2;
    fg.add(matka);

    // ── Well (kuan) ───────────────────────────────────────────────────────────
    const wellX = -fRail - 2.0, wellZ = fRail + 1.5;
    const wellRingGeo = new THREE.TorusGeometry(0.38, 0.08, 6, 12);
    const wellMat = new THREE.MeshLambertMaterial({ color: 0x9e9e80 });
    const wellRing = new THREE.Mesh(wellRingGeo, wellMat);
    wellRing.position.set(wellX, 0.35, wellZ);
    wellRing.rotation.x = Math.PI / 2;
    fg.add(wellRing);
    // Well posts
    for (let wp = 0; wp < 2; wp++) {
      const wPGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.1, 4);
      const wP = new THREE.Mesh(wPGeo, new THREE.MeshLambertMaterial({ color: 0x6d4c28 }));
      wP.position.set(wellX + (wp === 0 ? -0.4 : 0.4), 0.95, wellZ);
      fg.add(wP);
    }
    const wellBeamGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 5);
    wellBeamGeo.rotateZ(Math.PI / 2);
    const wellBeam = new THREE.Mesh(wellBeamGeo, new THREE.MeshLambertMaterial({ color: 0x5a3810 }));
    wellBeam.position.set(wellX, 1.5, wellZ);
    fg.add(wellBeam);

    // ── Scarecrow (traditional Indian style) ─────────────────────────────────
    const scX = -fRail - 1.8, scZ = -1.5;
    // Post
    const scPostGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.7, 4);
    const scPostMat = new THREE.MeshLambertMaterial({ color: 0x7a5028 });
    const scPost = new THREE.Mesh(scPostGeo, scPostMat);
    scPost.position.set(scX, 0.85, scZ);
    fg.add(scPost);
    // Cross arm (like a cross)
    const scArmGeo = new THREE.BoxGeometry(1.1, 0.05, 0.05);
    const scArm = new THREE.Mesh(scArmGeo, scPostMat);
    scArm.position.set(scX, 1.4, scZ);
    fg.add(scArm);
    // Body: loose cloth (flat plane)
    const scBodyGeo = new THREE.PlaneGeometry(0.65, 0.7, 1, 1);
    const scBodyMat = new THREE.MeshLambertMaterial({ color: 0xf5d8a0, side: THREE.DoubleSide });
    const scBody = new THREE.Mesh(scBodyGeo, scBodyMat);
    scBody.position.set(scX, 1.15, scZ + 0.01);
    fg.add(scBody);
    // Head: a clay pot (ghada) or cloth bundle
    const scHeadGeo = new THREE.SphereGeometry(0.15, 5, 5);
    const scHeadMat = new THREE.MeshLambertMaterial({ color: 0xd4a060 });
    const scHead = new THREE.Mesh(scHeadGeo, scHeadMat);
    scHead.position.set(scX, 1.78, scZ);
    fg.add(scHead);
    // Turban-like cloth on head
    const turbanGeo = new THREE.TorusGeometry(0.15, 0.06, 4, 8);
    const turbanMat = new THREE.MeshLambertMaterial({ color: 0xd44020 }); // red turban
    const turban = new THREE.Mesh(turbanGeo, turbanMat);
    turban.position.set(scX, 1.85, scZ);
    turban.rotation.x = 0.2;
    fg.add(turban);

    // ── CROPS ────────────────────────────────────────────────────────────────
    const offX = (gridSize - 1) * cellSpacing / 2;
    const offZ = (gridSize - 1) * cellSpacing / 2;

    for (let ci = 0; ci < gridSize; ci++) {
      for (let cj = 0; cj < gridSize; cj++) {
        const cx = ci * cellSpacing - offX + (Math.random() - 0.5) * 0.05;
        const cz = cj * cellSpacing - offZ + (Math.random() - 0.5) * 0.05;

        let plantGroup;
        if (s.crop === 'rice') {
          plantGroup = makeRicePlant(s.growth);
        } else {
          plantGroup = makeGenericCrop(cropCfg, s.growth);
        }

        plantGroup.position.set(cx, 0, cz);
        plantGroup.rotation.y = Math.random() * Math.PI * 2;
        plantGroup.traverse(o => {
          if (o.isMesh) {
            o.userData.isCropMesh = true;
            o.userData.windFactor = 0.7 + Math.random() * 0.6;
            o.receiveShadow = true;
          }
        });
        fg.add(plantGroup);
      }
    }

    // ── Winter Rabi: morning mist haze ────────────────────────────────────────
    // Indian winter has no snow. Instead: cool fog, mustard fields, dry haze
    if (s.season === 'rabi') {
      // Morning mist plane near ground
      const mistGeo = new THREE.PlaneGeometry(terrainSize * 0.7, terrainSize * 0.7);
      mistGeo.rotateX(-Math.PI / 2);
      const mistMat = new THREE.MeshBasicMaterial({
        color: 0xe8d8b0, transparent: true, opacity: 0.18, side: THREE.DoubleSide,
      });
      const mist = new THREE.Mesh(mistGeo, mistMat);
      mist.position.y = 0.6;
      fg.add(mist);

      // Dry stubble patches around field
      for (let st = 0; st < 40; st++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = fieldW * 0.6 + Math.random() * fieldW * 0.7;
        const stGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.2 + Math.random() * 0.2, 3);
        const stMat = new THREE.MeshLambertMaterial({ color: 0xc0a060 });
        const stMesh = new THREE.Mesh(stGeo, stMat);
        stMesh.position.set(Math.cos(angle) * dist, 0.12, Math.sin(angle) * dist);
        stMesh.rotation.z = (Math.random() - 0.5) * 0.3;
        fg.add(stMesh);
      }
    }

    // ── Weather effects ───────────────────────────────────────────────────────
    if (['rain', 'cloudy', 'fog'].includes(s.weather)) {
      const numClouds = s.weather === 'fog' ? 4 : s.weather === 'cloudy' ? 8 : 6;
      for (let cl = 0; cl < numClouds; cl++) {
        const cloudGroup = new THREE.Group();
        const numPuffs = 3 + Math.floor(Math.random() * 3);
        // Indian monsoon clouds: dark base, white tops
        const cloudBaseColor = s.weather === 'rain' ? 0x546e7a : (s.weather === 'fog' ? 0xd0c8b0 : 0xe8e8e8);
        const cloudMat = new THREE.MeshLambertMaterial({
          color: cloudBaseColor, transparent: true, opacity: s.weather === 'fog' ? 0.5 : 0.82,
        });
        for (let p = 0; p < numPuffs; p++) {
          const pr = 1.2 + Math.random() * 1.3;
          const pGeo = new THREE.SphereGeometry(pr, 5, 5);
          const pm = new THREE.Mesh(pGeo, cloudMat);
          pm.position.set(p * 1.6 - numPuffs * 0.65, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.7);
          cloudGroup.add(pm);
        }
        const cy = s.weather === 'fog' ? 3 + Math.random() * 3.5 : 14 + Math.random() * 12;
        cloudGroup.position.set((Math.random() - 0.5) * 110, cy, (Math.random() - 0.5) * 80);
        scene.add(cloudGroup);
        cloudsRef.current.push(cloudGroup);
      }
    }

    if (s.weather === 'rain') {
      // Indian monsoon rain: heavier, near-vertical
      const count = 2000;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = Math.random() * 38;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      }
      const rGeo = new THREE.BufferGeometry();
      rGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const rMat = new THREE.PointsMaterial({ color: 0x90c8e8, size: 0.06, transparent: true, opacity: 0.5 });
      const rain = new THREE.Points(rGeo, rMat);
      scene.add(rain);
      rainRef.current = rain;
    }

    if (s.weather === 'fog') {
      // Indian winter fog: very dense ground fog (like Punjab/UP winter)
      scene.fog.density = 0.048;
    }

  }, []);

  // ── Trigger rebuild ─────────────────────────────────────────────────────────
  const triggerRebuild = useCallback((patch) => {
    Object.assign(stateRef.current, patch, { needsRebuild: true });
  }, []);

  const handleAcres = (e) => {
    const v = parseInt(e.target.value);
    setUi(u => ({ ...u, acres: v }));
    triggerRebuild({ acres: v });
  };
  const handleCrop = (e) => {
    setUi(u => ({ ...u, crop: e.target.value }));
    triggerRebuild({ crop: e.target.value });
  };
  const handleGrowth = (e) => {
    const v = parseInt(e.target.value);
    const label = GROWTH_LABELS[Math.min(4, Math.floor(v / 20))];
    setUi(u => ({ ...u, growth: v, growthLabel: label }));
    triggerRebuild({ growth: v / 100 });
  };
  const handleTime = (e) => {
    const v = parseInt(e.target.value);
    const timeLabels = ['रात (Night)', 'भोर (Pre-dawn)', 'सूर्योदय (Sunrise)', 'सुबह (Morning)', 'दोपहर (Midday)', 'शाम (Afternoon)', 'सूर्यास्त (Sunset)', 'संध्या (Dusk)'];
    const label = timeLabels[Math.min(7, Math.floor(v / 12.5))];
    setUi(u => ({ ...u, timeVal: v, timeLabel: label }));
    triggerRebuild({ timeVal: v / 100 });
  };
  const handleSeason = (season) => {
    setUi(u => ({ ...u, season }));
    triggerRebuild({ season });
  };
  const handleWeather = (weather) => {
    setUi(u => ({ ...u, weather }));
    triggerRebuild({ weather });
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", width: '100%', color: '#1a1a1a', background: '#faf6ee' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px 6px', background: '#faf6ee', borderBottom: '1px solid #e8dcc8' }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#5a3810', letterSpacing: '-0.02em' }}>
          🌾 Indian Farm Simulator — <span style={{ fontWeight: 400, fontSize: 14, color: '#8a6030' }}>भारतीय कृषि</span>
        </h2>
      </div>

      {/* 3D Viewport */}
      <div
        ref={mountRef}
        style={{
          width: '100%', height: 500, overflow: 'hidden', position: 'relative',
          background: '#c9b07a', cursor: 'grab', userSelect: 'none',
        }}
      >
        {/* Info chips */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'none', zIndex: 10 }}>
          <Chip>{SEASON_CFG[ui.season].label}</Chip>
          <Chip>{{ clear: '☀️ Clear', cloudy: '⛅ Cloudy', rain: '🌧️ Monsoon Rain', fog: '🌫️ Winter Fog' }[ui.weather]}</Chip>
          <Chip>🕐 {ui.timeLabel}</Chip>
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 10 }}>
          <Chip small>Drag: Rotate · Scroll: Zoom · Right-drag: Pan</Chip>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '12px 14px', background: '#faf6ee' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
          <CtrlGroup label={`खेत का आकार — ${ui.acres} एकड़`}>
            <Slider min={1} max={30} value={ui.acres} onChange={handleAcres} />
          </CtrlGroup>
          <CtrlGroup label="फसल — Crop">
            <select value={ui.crop} onChange={handleCrop} style={selectStyle}>
              {Object.entries(CROP_CFG).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </CtrlGroup>
          <CtrlGroup label={`विकास — ${ui.growth}%`}>
            <Slider min={0} max={100} value={ui.growth} onChange={handleGrowth} accent="#2e7d32" />
            <span style={{ fontSize: 11, color: '#6a4820', marginTop: 2 }}>{ui.growthLabel}</span>
          </CtrlGroup>
          <CtrlGroup label={`समय — ${ui.timeLabel}`}>
            <Slider min={0} max={100} value={ui.timeVal} onChange={handleTime} accent="#e08020" />
          </CtrlGroup>
        </div>

        {/* Season buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12, alignItems: 'center' }}>
          <span style={labelStyle}>ऋतु (Season):</span>
          {Object.entries(SEASON_CFG).map(([k, v]) => (
            <SeasonBtn key={k} active={ui.season === k} onClick={() => handleSeason(k)}>
              {v.label}
            </SeasonBtn>
          ))}
          <div style={{ width: 1, background: '#ddd', alignSelf: 'stretch', margin: '0 4px' }} />
          <span style={labelStyle}>मौसम (Weather):</span>
          {[
            ['clear', '☀️ Clear'],
            ['cloudy', '⛅ Cloudy'],
            ['rain', '🌧️ Rain'],
            ['fog', '🌫️ Fog'],
          ].map(([k, label]) => (
            <SeasonBtn key={k} active={ui.weather === k} onClick={() => handleWeather(k)}>
              {label}
            </SeasonBtn>
          ))}
        </div>

        {/* Crop info */}
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f5edd8', borderRadius: 8, border: '1px solid #e0cc98', fontSize: 12, color: '#6a4820' }}>
          <strong>{CROP_CFG[ui.crop].name}</strong>
          {' · '}
          {ui.crop === 'rice' ? 'Paddy — Kharif crop · Requires flooded bunds · Panicles droop at maturity' :
           ui.crop === 'wheat' ? 'Rabi crop · Sown after monsoon · Harvested in March–April' :
           ui.crop === 'mustard' ? 'Rabi crop · Bright yellow flowers in winter · North India staple' :
           ui.crop === 'sugarcane' ? 'Year-round · Tall monocot grass · UP & Maharashtra' :
           ui.crop === 'cotton' ? 'Kharif crop · Deccan Plateau · White bolls at maturity' :
           'Rabi crop · Protein-rich legume · Central India'}
          {' · Season: '}
          <strong>{SEASON_CFG[CROP_CFG[ui.crop].season]?.label || ''}</strong>
        </div>
      </div>
    </div>
  );
}

// ── UI helpers ─────────────────────────────────────────────────────────────────
function Chip({ children, small }) {
  return (
    <span style={{
      fontSize: small ? 10 : 12, fontWeight: 500,
      background: 'rgba(20,10,0,0.48)', backdropFilter: 'blur(4px)',
      color: '#fff', padding: small ? '3px 10px' : '4px 12px',
      borderRadius: 999, display: 'inline-block', width: 'fit-content',
    }}>
      {children}
    </span>
  );
}
function CtrlGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}
function Slider({ min, max, value, onChange, accent = '#7a5028' }) {
  return (
    <input type="range" min={min} max={max} value={value} onChange={onChange}
      style={{ width: '100%', accentColor: accent }} />
  );
}
function SeasonBtn({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, padding: '4px 11px', borderRadius: 999,
      background: active ? '#5a3010' : '#f0e8d0',
      border: `1px solid ${active ? '#5a3010' : '#d4b880'}`,
      color: active ? '#fff' : '#6a4820',
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

const labelStyle = {
  fontSize: 10, fontWeight: 700, color: '#8a6030',
  textTransform: 'uppercase', letterSpacing: '0.06em',
};
const selectStyle = {
  width: '100%', padding: '5px 8px', borderRadius: 7,
  border: '1px solid #d4b880', background: '#fffbf0',
  color: '#3a2010', fontSize: 12,
};