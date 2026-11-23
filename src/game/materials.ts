import * as THREE from 'three';

export interface MaterialLibrary {
  titaniumHull: THREE.MeshPhysicalMaterial;
  goldAccent: THREE.MeshPhysicalMaterial;
  darkChassis: THREE.MeshStandardMaterial;
  cockpitGlass: THREE.MeshPhysicalMaterial;
  labCoat: THREE.MeshStandardMaterial;
  skinTone: THREE.MeshStandardMaterial;
  goggleLens: THREE.MeshPhysicalMaterial;
  robotShell: THREE.MeshPhysicalMaterial;
  robotVisor: THREE.MeshStandardMaterial;
  toothEnamel: THREE.MeshPhysicalMaterial;
  mucosaWall: THREE.MeshPhysicalMaterial;
  redBloodCell: THREE.MeshPhysicalMaterial;
  myelinSheath: THREE.MeshPhysicalMaterial;
  virusRhino: THREE.MeshPhysicalMaterial;
  virusSpore: THREE.MeshPhysicalMaterial;
  virusNeuro: THREE.MeshPhysicalMaterial;
  virusBossCore: THREE.MeshPhysicalMaterial;
  shieldNode: THREE.MeshPhysicalMaterial;
  heartValve: THREE.MeshPhysicalMaterial;
  labFloor: THREE.MeshStandardMaterial;
  labWall: THREE.MeshStandardMaterial;
  labDesk: THREE.MeshPhysicalMaterial;
  labMonitorScreen: THREE.MeshStandardMaterial;
  labMonitorSickScreen: THREE.MeshStandardMaterial;
  rakaShirt: THREE.MeshStandardMaterial;
  darkHair: THREE.MeshStandardMaterial;
  labPants: THREE.MeshStandardMaterial;
  blanketTeal: THREE.MeshStandardMaterial;
  portalGlow: THREE.MeshBasicMaterial;
  tunnelTimeUniform: { value: number };
  dispose: () => void;
}

function createOrganicTissueTextures(maxAniso: number): {
  albedo: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
} {
  const size = 512;

  // 1. Albedo / Color texture (cellular vascular network)
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#8f2438');
  grad.addColorStop(0.5, '#b0344b');
  grad.addColorStop(1, '#781b2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Organic cellular blotches
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 10 + Math.random() * 38;
    const rg = ctx.createRadialGradient(x, y, 2, x, y, r);
    rg.addColorStop(0, 'rgba(220, 88, 112, 0.28)');
    rg.addColorStop(1, 'rgba(120, 20, 40, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Capillary vessels
  ctx.lineCap = 'round';
  for (let v = 0; v < 46; v++) {
    let cx = Math.random() * size;
    let cy = Math.random() * size;
    ctx.strokeStyle = v % 3 === 0 ? 'rgba(65, 140, 210, 0.28)' : 'rgba(180, 20, 45, 0.42)';
    ctx.lineWidth = 1.2 + Math.random() * 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) {
      cx += (Math.random() - 0.5) * 85;
      cy += (Math.random() - 0.5) * 85;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const albedo = new THREE.CanvasTexture(colorCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(6, 28);
  albedo.anisotropy = maxAniso;

  // 2. Height-to-Normal canvas (linear NoColorSpace)
  const heightData = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * Math.PI * 8;
      const ny = (y / size) * Math.PI * 8;
      const ridge =
        Math.sin(nx) * Math.cos(ny) * 0.45 +
        Math.sin(nx * 2.3 + ny * 1.7) * 0.3 +
        Math.cos(nx * 4.1 - ny * 3.2) * 0.15;
      heightData[y * size + x] = ridge;
    }
  }

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const nCtx = normalCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(size, size);
  const strength = 2.6;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const ym = (y - 1 + size) % size;
      const yp = (y + 1) % size;
      const dx = (heightData[y * size + xp] - heightData[y * size + xm]) * strength;
      const dy = (heightData[yp * size + x] - heightData[ym * size + x]) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const idx = (y * size + x) * 4;
      nImg.data[idx] = ((-dx / len) * 0.5 + 0.5) * 255;
      nImg.data[idx + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      nImg.data[idx + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      nImg.data[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);

  const normal = new THREE.CanvasTexture(normalCanvas);
  normal.colorSpace = THREE.NoColorSpace;
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(6, 28);
  normal.anisotropy = maxAniso;

  // 3. Roughness variation canvas (wet streaks)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#383838'; // ~0.22 glossy wet base
  rCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const rad = 8 + Math.random() * 26;
    const g = rCtx.createRadialGradient(x, y, 1, x, y, rad);
    g.addColorStop(0, 'rgba(115, 115, 115, 0.38)');
    g.addColorStop(1, 'rgba(40, 40, 40, 0)');
    rCtx.fillStyle = g;
    rCtx.beginPath();
    rCtx.arc(x, y, rad, 0, Math.PI * 2);
    rCtx.fill();
  }
  const roughness = new THREE.CanvasTexture(roughCanvas);
  roughness.colorSpace = THREE.NoColorSpace;
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(6, 28);
  roughness.anisotropy = maxAniso;

  return { albedo, normal, roughness };
}

function createBrushedMetalTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#d4dce6';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y++) {
    const lum = 180 + Math.floor(Math.random() * 55);
    ctx.fillStyle = `rgb(${lum}, ${lum + 4}, ${lum + 10})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

function createLabFloorTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, size, size);

  const step = 128;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Subtle tile sheen dots
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      ctx.fillRect(x + 8, y + 8, step - 18, 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = maxAniso;
  return tex;
}

function createHealthyMonitorTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#061523';
  ctx.fillRect(0, 0, 512, 256);

  // Grid
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Header text
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('RAKA · STATUS: SEHAT 100%', 24, 42);

  ctx.fillStyle = '#67e8f9';
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText('HR: 78 BPM   PATOGEN: 0%   PEMULIHAN OPTIMAL', 24, 74);

  // Healthy sinus ECG waveform
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = 16; x <= 496; x += 4) {
    const phase = ((x - 16) % 120) / 120;
    let y = 165;
    if (phase > 0.2 && phase < 0.3) y -= 12 * Math.sin(((phase - 0.2) / 0.1) * Math.PI);
    else if (phase >= 0.38 && phase < 0.43) y += 16;
    else if (phase >= 0.43 && phase < 0.5) y -= 72 * Math.sin(((phase - 0.43) / 0.07) * Math.PI);
    else if (phase >= 0.5 && phase < 0.55) y += 22;
    else if (phase >= 0.65 && phase < 0.8) y -= 18 * Math.sin(((phase - 0.65) / 0.15) * Math.PI);
    if (x === 16) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createSickMonitorTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1f0710';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = 'rgba(244, 63, 94, 0.16)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#fb7185';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('RAKA · STATUS: PATOGEN KRITIS', 24, 42);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText('SUHU: 39.4°C   INFEKSI JANTUNG & ORGAN', 24, 74);

  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  for (let x = 16; x <= 496; x += 6) {
    const jitter = Math.sin(x * 0.25) * 18 + Math.cos(x * 0.6) * 14;
    const y = 165 + jitter;
    if (x === 16) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createMaterialLibrary(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): MaterialLibrary {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const tissueTex = createOrganicTissueTextures(maxAniso);
  const metalTex = createBrushedMetalTexture(maxAniso);
  const labFloorTex = createLabFloorTexture(maxAniso);
  const monitorTex = createHealthyMonitorTexture(maxAniso);
  const monitorSickTex = createSickMonitorTexture(maxAniso);
  const tunnelTimeUniform = { value: 0 };

  const titaniumHull = new THREE.MeshPhysicalMaterial({
    color: 0xdce7f3,
    map: metalTex,
    metalness: 0.94,
    roughness: 0.18,
    anisotropy: 0.85,
    clearcoat: 0.45,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.5,
  });

  const goldAccent = new THREE.MeshPhysicalMaterial({
    color: 0xf4b942,
    metalness: 0.95,
    roughness: 0.2,
    anisotropy: 0.75,
    envMapIntensity: 1.4,
  });

  const darkChassis = new THREE.MeshStandardMaterial({
    color: 0x16202e,
    metalness: 0.55,
    roughness: 0.62,
    envMapIntensity: 1.1,
  });

  const cockpitGlass = new THREE.MeshPhysicalMaterial({
    color: 0xbef5ff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.9,
    transparent: true,
    opacity: isSoftwareGl ? 0.34 : 1.0,
    ior: 1.58,
    thickness: 1.1,
    attenuationColor: new THREE.Color(0x38bdf8),
    attenuationDistance: 2.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    iridescence: 0.55,
    depthWrite: false,
    envMapIntensity: 1.8,
  });

  const labCoat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.78,
    metalness: 0.02,
  });

  const skinTone = new THREE.MeshStandardMaterial({
    color: 0xf3c6a5,
    roughness: 0.58,
    metalness: 0.0,
  });

  const goggleLens = new THREE.MeshPhysicalMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.8,
    metalness: 0.2,
    roughness: 0.1,
    clearcoat: 1.0,
  });

  const robotShell = new THREE.MeshPhysicalMaterial({
    color: 0xe2e8f0,
    metalness: 0.88,
    roughness: 0.22,
    clearcoat: 0.65,
    envMapIntensity: 1.4,
  });

  const robotVisor = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.2,
    roughness: 0.15,
    metalness: 0.1,
  });

  const toothEnamel = new THREE.MeshPhysicalMaterial({
    color: 0xf7f0e2,
    roughness: 0.16,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    sheen: 0.2,
    envMapIntensity: 1.25,
  });

  // Organic anatomical tunnel material with peristalsis wave + wet subsurface sheen via onBeforeCompile
  const mucosaWall = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: tissueTex.albedo,
    normalMap: tissueTex.normal,
    normalScale: new THREE.Vector2(1.25, 1.25),
    roughnessMap: tissueTex.roughness,
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.92,
    clearcoatRoughness: 0.14,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xff9eb5),
    side: THREE.BackSide,
    envMapIntensity: 1.35,
  });

  mucosaWall.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = tunnelTimeUniform;
    shader.vertexShader =
      `uniform float uTime;\nvarying vec3 vWorldPosCustom;\n` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float wave = sin(position.z * 0.18 + uTime * 2.2) * 0.42
                 + cos(position.x * 0.25 - uTime * 1.6) * 0.18;
      transformed += normalize(vec3(position.x, position.y, 0.0) + vec3(0.0001)) * wave;
      vWorldPosCustom = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader =
      `uniform float uTime;\nvarying vec3 vWorldPosCustom;\n` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      float depth = -vWorldPosCustom.z;
      // Ascending smoothstep thresholds across all 10 anatomical zones (0..6240):
      float tBronch = smoothstep(125.0, 155.0, depth);
      float tBlood  = smoothstep(465.0, 500.0, depth);
      float tNerve  = smoothstep(905.0, 940.0, depth);
      float tHeart  = smoothstep(1405.0, 1440.0, depth);
      float tLiver  = smoothstep(1765.0, 1805.0, depth);
      float tKidney = smoothstep(2405.0, 2445.0, depth);
      float tGut    = smoothstep(3105.0, 3145.0, depth);
      float tColon  = smoothstep(4405.0, 4445.0, depth);
      float tExit   = smoothstep(6020.0, 6160.0, depth);

      vec3 cMouth  = vec3(1.08, 0.85, 0.90);
      vec3 cBronch = vec3(1.12, 0.72, 0.78);
      vec3 cBlood  = vec3(1.18, 0.34, 0.38);
      vec3 cNerve  = vec3(0.34, 0.48, 1.15);
      vec3 cHeart  = vec3(1.14, 0.26, 0.46);
      vec3 cLiver  = vec3(1.08, 0.64, 0.28);
      vec3 cKidney = vec3(0.45, 0.88, 0.72);
      vec3 cGut    = vec3(1.06, 0.60, 0.42);
      vec3 cColon  = vec3(0.95, 0.56, 0.32);
      vec3 cExit   = vec3(1.34, 0.96, 0.74);

      vec3 zoneTint = mix(cMouth, cBronch, tBronch);
      zoneTint = mix(zoneTint, cBlood, tBlood);
      zoneTint = mix(zoneTint, cNerve, tNerve);
      zoneTint = mix(zoneTint, cHeart, tHeart);
      zoneTint = mix(zoneTint, cLiver, tLiver);
      zoneTint = mix(zoneTint, cKidney, tKidney);
      zoneTint = mix(zoneTint, cGut, tGut);
      zoneTint = mix(zoneTint, cColon, tColon);
      zoneTint = mix(zoneTint, cExit, tExit);

      diffuseColor.rgb *= zoneTint;

      // Bio-electric synaptic glow lines in Zone 4 (CNS)
      float nervePulse = pow(max(0.0, sin(vWorldPosCustom.z * 0.45 - uTime * 4.5 + vWorldPosCustom.x * 0.35)), 10.0);
      diffuseColor.rgb += vec3(0.15, 0.85, 1.0) * nervePulse * tNerve * (1.0 - tHeart) * 0.75;

      // Cardiac heartbeat shimmer in Zone 5 (Heart)
      float beat = pow(max(0.0, sin(uTime * 3.8 + vWorldPosCustom.z * 0.08)), 6.0);
      diffuseColor.rgb += vec3(0.9, 0.25, 0.35) * beat * tHeart * (1.0 - tLiver) * 0.45;

      // Nephron emerald filtration shimmer in Zone 7 (Kidney)
      float renalPulse = pow(max(0.0, sin(vWorldPosCustom.z * 0.3 - uTime * 3.0)), 8.0);
      diffuseColor.rgb += vec3(0.15, 0.9, 0.62) * renalPulse * tKidney * (1.0 - tGut) * 0.32;

      // Peristaltic bio-luminous bands along small intestine & colon (Zones 8 & 9)
      float gutWave = pow(max(0.0, sin(vWorldPosCustom.z * 0.22 + uTime * 3.2)), 8.0);
      diffuseColor.rgb += vec3(0.95, 0.55, 0.22) * gutWave * tGut * (1.0 - tExit) * 0.32;

      // Bright external daylight leak near Anal Exit (Zone 10)
      float exitGlow = smoothstep(6110.0, 6210.0, depth);
      diffuseColor.rgb += vec3(1.0, 0.92, 0.72) * exitGlow * 0.85;
      `
    );
  };

  const redBloodCell = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    roughness: 0.26,
    metalness: 0.02,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xff8a8a),
    envMapIntensity: 1.2,
  });

  const myelinSheath = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.65,
    roughness: 0.22,
    metalness: 0.15,
    clearcoat: 0.9,
    iridescence: 0.75,
  });

  const virusRhino = new THREE.MeshPhysicalMaterial({
    color: 0x84cc16,
    emissive: 0x3f6212,
    emissiveIntensity: 0.55,
    roughness: 0.2,
    metalness: 0.15,
    clearcoat: 1.0,
    iridescence: 0.85,
  });

  const virusSpore = new THREE.MeshPhysicalMaterial({
    color: 0xf97316,
    emissive: 0x9a3412,
    emissiveIntensity: 0.6,
    roughness: 0.24,
    metalness: 0.2,
    clearcoat: 0.9,
    iridescence: 0.65,
  });

  const virusNeuro = new THREE.MeshPhysicalMaterial({
    color: 0xa855f7,
    emissive: 0x6b21a8,
    emissiveIntensity: 0.85,
    roughness: 0.14,
    metalness: 0.3,
    clearcoat: 1.0,
    iridescence: 1.0,
  });

  const virusBossCore = new THREE.MeshPhysicalMaterial({
    color: 0xf43f5e,
    emissive: 0xbe123c,
    emissiveIntensity: 1.15,
    roughness: 0.12,
    metalness: 0.35,
    clearcoat: 1.0,
    iridescence: 1.0,
    envMapIntensity: 1.6,
  });

  const shieldNode = new THREE.MeshPhysicalMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.95,
    roughness: 0.16,
    metalness: 0.6,
    clearcoat: 1.0,
  });

  const heartValve = new THREE.MeshPhysicalMaterial({
    color: 0xfb7185,
    roughness: 0.28,
    metalness: 0.05,
    clearcoat: 0.95,
    clearcoatRoughness: 0.12,
  });

  // Laboratory Ending Scene Materials (balanced mid-tone slate contrast so highlights stay crisp)
  const labFloor = new THREE.MeshStandardMaterial({
    map: labFloorTex,
    roughness: 0.48,
    metalness: 0.08,
    envMapIntensity: 0.55,
  });

  const labWall = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
    metalness: 0.02,
    envMapIntensity: 0.45,
  });

  const labDesk = new THREE.MeshPhysicalMaterial({
    color: 0x94a3b8,
    roughness: 0.24,
    metalness: 0.78,
    clearcoat: 0.4,
    envMapIntensity: 1.3,
  });

  const labMonitorScreen = new THREE.MeshStandardMaterial({
    map: monitorTex,
    emissiveMap: monitorTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.9,
    roughness: 0.15,
    metalness: 0.1,
  });

  const labMonitorSickScreen = new THREE.MeshStandardMaterial({
    map: monitorSickTex,
    emissiveMap: monitorSickTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.95,
    roughness: 0.15,
    metalness: 0.1,
  });

  const rakaShirt = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.72,
    metalness: 0.0,
  });

  const darkHair = new THREE.MeshStandardMaterial({
    color: 0x1e1b18,
    roughness: 0.82,
    metalness: 0.02,
  });

  const labPants = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.76,
    metalness: 0.04,
  });

  const blanketTeal = new THREE.MeshStandardMaterial({
    color: 0x14b8a6,
    roughness: 0.85,
    metalness: 0.0,
  });

  const portalGlow = new THREE.MeshBasicMaterial({
    color: 0xfef9c3,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });

  const allMaterials: THREE.Material[] = [
    titaniumHull,
    goldAccent,
    darkChassis,
    cockpitGlass,
    labCoat,
    skinTone,
    goggleLens,
    robotShell,
    robotVisor,
    toothEnamel,
    mucosaWall,
    redBloodCell,
    myelinSheath,
    virusRhino,
    virusSpore,
    virusNeuro,
    virusBossCore,
    shieldNode,
    heartValve,
    labFloor,
    labWall,
    labDesk,
    labMonitorScreen,
    labMonitorSickScreen,
    rakaShirt,
    darkHair,
    labPants,
    blanketTeal,
    portalGlow,
  ];

  const allTextures: THREE.Texture[] = [
    tissueTex.albedo,
    tissueTex.normal,
    tissueTex.roughness,
    metalTex,
    labFloorTex,
    monitorTex,
    monitorSickTex,
  ];

  return {
    titaniumHull,
    goldAccent,
    darkChassis,
    cockpitGlass,
    labCoat,
    skinTone,
    goggleLens,
    robotShell,
    robotVisor,
    toothEnamel,
    mucosaWall,
    redBloodCell,
    myelinSheath,
    virusRhino,
    virusSpore,
    virusNeuro,
    virusBossCore,
    shieldNode,
    heartValve,
    labFloor,
    labWall,
    labDesk,
    labMonitorScreen,
    labMonitorSickScreen,
    rakaShirt,
    darkHair,
    labPants,
    blanketTeal,
    portalGlow,
    tunnelTimeUniform,
    dispose: () => {
      allMaterials.forEach((m) => m.dispose());
      allTextures.forEach((t) => t.dispose());
    },
  };
}
