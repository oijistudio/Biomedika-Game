import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import {
  createGrandchildRakaModel,
  createProfessorHumanModel,
  ProfessorHumanRig,
  RakaHumanRig,
} from './models';
import { ANUS_EXIT_Z } from './types';

export interface BloodCellBody {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  angVel: THREE.Vector3;
  scale: number;
  radius: number;
}

export interface SynapticPulse {
  curve: THREE.CatmullRomCurve3;
  t: number;
  speed: number;
  mesh: THREE.Mesh;
}

export interface WorldController {
  group: THREE.Group;
  bloodCells: BloodCellBody[];
  bloodInstanced: THREE.InstancedMesh;
  heartValves: THREE.Mesh[];
  vitalCoreMesh: THREE.Mesh;
  anusPortalMesh: THREE.Mesh;
  zoneLights: THREE.PointLight[];
  update: (dt: number, elapsed: number, heartBeatPhase: number, playerZ: number) => void;
  dispose: () => void;
}

export interface LabEndingController {
  group: THREE.Group;
  profRig: ProfessorHumanRig;
  rakaRig: RakaHumanRig;
  padBeam: THREE.Mesh;
  padRing: THREE.Mesh;
  celebrationMotes: THREE.InstancedMesh;
  padPosition: THREE.Vector3;
  update: (dt: number, elapsed: number, endingTime: number) => void;
  dispose: () => void;
}

const CHUNK_LEN = 40;
const CHUNK_POOL_SIZE = 8; // Covers 320 units smoothly around player
const CHUNK_LENGTH_SEGS = 20;
const CHUNK_RADIAL_SEGS = 28;

// Deterministic parametric centerline of the anatomical journey (z from +20 down to -2640)
export function getTunnelCenterAtZ(z: number, out = new THREE.Vector3()): THREE.Vector3 {
  if (z > -20) {
    return out.set(0, 0, z);
  }
  const negZ = -z;
  const s = negZ - 20;

  // Story organs S-curves (Mouth -> Blood -> CNS -> Heart Chamber at -560..-740)
  const heartDamp = 1.0 - THREE.MathUtils.smoothstep(negZ, 510, 575);
  const storyX = (Math.sin(s * 0.026) * 5.6 + Math.cos(s * 0.013) * 2.5) * heartDamp;
  const storyY = (Math.cos(s * 0.022) * 3.5 - Math.sin(s * 0.016) * 1.8) * heartDamp;

  // Endless Intestinal Corridor sweeping bends (-750..-2480), straightening at Anal Exit (-2500..-2620)
  const gutAmp =
    THREE.MathUtils.smoothstep(negZ, 735, 810) *
    (1.0 - THREE.MathUtils.smoothstep(negZ, 2420, 2525));
  const gs = Math.max(0, negZ - 735);
  const gutX = (Math.sin(gs * 0.021) * 9.5 + Math.cos(gs * 0.009) * 4.4) * gutAmp;
  const gutY = (Math.cos(gs * 0.018) * 6.2 - Math.sin(gs * 0.011) * 2.8) * gutAmp;

  return out.set(storyX + gutX, storyY + gutY, z);
}

// Parametric radius at Z across all 6 zones down to Anal Exit (-2585)
export function getTunnelRadiusAtZ(z: number): number {
  const negZ = -z;
  let r = 10.6;

  // Narrowing at Pharynx/Throat (-85..-135)
  const throat =
    THREE.MathUtils.smoothstep(negZ, 75, 110) * (1 - THREE.MathUtils.smoothstep(negZ, 125, 160));
  r -= throat * 2.8;

  // Bloodstream moderate width (-140..-330)
  const blood =
    THREE.MathUtils.smoothstep(negZ, 130, 175) * (1 - THREE.MathUtils.smoothstep(negZ, 305, 345));
  r += blood * 1.2;

  // CNS neural cavern (-330..-540)
  const cns =
    THREE.MathUtils.smoothstep(negZ, 320, 365) * (1 - THREE.MathUtils.smoothstep(negZ, 515, 555));
  r += cns * 2.4;

  // Monumental Heart Chamber expansion (-550..-740)
  const heart =
    THREE.MathUtils.smoothstep(negZ, 540, 595) * (1 - THREE.MathUtils.smoothstep(negZ, 710, 775));
  r += heart * 11.2;

  // Endless Intestinal Corridor haustral rhythmic ridges (-760..-2480)
  const gutFactor =
    THREE.MathUtils.smoothstep(negZ, 755, 815) * (1 - THREE.MathUtils.smoothstep(negZ, 2450, 2515));
  const haustra = Math.sin(negZ * 0.13) * 1.15 - 0.8;
  r += gutFactor * haustra;

  // Anal Sphincter pinch near -2585, opening outward right past it
  const sphincterPinch =
    THREE.MathUtils.smoothstep(negZ, 2510, 2575) * (1 - THREE.MathUtils.smoothstep(negZ, 2585, 2615));
  r -= sphincterPinch * 3.4;

  const postExitFlare = THREE.MathUtils.smoothstep(negZ, 2585, 2630);
  r += postExitFlare * 4.5;

  return Math.max(4.5, r);
}

interface TunnelChunk {
  chunkIndex: number;
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
}

function createTunnelChunkGeometry(): THREE.BufferGeometry {
  const vertexCount = (CHUNK_LENGTH_SEGS + 1) * (CHUNK_RADIAL_SEGS + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  for (let i = 0; i < CHUNK_LENGTH_SEGS; i++) {
    for (let j = 0; j < CHUNK_RADIAL_SEGS; j++) {
      const a = i * (CHUNK_RADIAL_SEGS + 1) + j;
      const b = (i + 1) * (CHUNK_RADIAL_SEGS + 1) + j;
      const c = (i + 1) * (CHUNK_RADIAL_SEGS + 1) + (j + 1);
      const d = i * (CHUNK_RADIAL_SEGS + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

const _chunkCenter = new THREE.Vector3();

function populateTunnelChunk(chunk: TunnelChunk, chunkIndex: number): void {
  chunk.chunkIndex = chunkIndex;
  const zStart = 20 - chunkIndex * CHUNK_LEN;
  const zEnd = zStart - CHUNK_LEN;

  const posAttr = chunk.geometry.getAttribute('position') as THREE.BufferAttribute;
  const uvAttr = chunk.geometry.getAttribute('uv') as THREE.BufferAttribute;

  for (let i = 0; i <= CHUNK_LENGTH_SEGS; i++) {
    const t = i / CHUNK_LENGTH_SEGS;
    const z = THREE.MathUtils.lerp(zStart, zEnd, t);
    getTunnelCenterAtZ(z, _chunkCenter);
    const baseR = getTunnelRadiusAtZ(z);

    for (let j = 0; j <= CHUNK_RADIAL_SEGS; j++) {
      const u = j / CHUNK_RADIAL_SEGS;
      const theta = u * Math.PI * 2;
      const ridge =
        1.0 +
        0.055 * Math.sin(theta * 5 + z * 0.08) +
        0.032 * Math.cos(theta * 3 - z * 0.12);
      const r = baseR * ridge;

      const idx = i * (CHUNK_RADIAL_SEGS + 1) + j;
      posAttr.setXYZ(
        idx,
        _chunkCenter.x + Math.cos(theta) * r,
        _chunkCenter.y + Math.sin(theta) * r,
        z
      );
      uvAttr.setXY(idx, u, (chunkIndex + t) * 0.16);
    }
  }

  posAttr.needsUpdate = true;
  uvAttr.needsUpdate = true;
  chunk.geometry.computeVertexNormals();
  chunk.geometry.computeTangents();
  chunk.geometry.computeBoundingSphere();
}

function createBiconcaveCellGeometry(): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * Math.PI;
    const r = Math.sin(u) * 0.85;
    const pinch = 0.14 + 0.24 * Math.pow(Math.sin(u), 2);
    const y = Math.cos(u) * pinch;
    pts.push(new THREE.Vector2(Math.max(0.001, r), y));
  }
  const geo = new THREE.LatheGeometry(pts, 18);
  geo.computeVertexNormals();
  return geo;
}

export function createAnatomicalWorld(mats: MaterialLibrary): WorldController {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  // 1. Streaming Chunked Anatomical Tunnel (supports 2,600+ units smoothly at 60fps)
  const chunks: TunnelChunk[] = [];
  for (let i = 0; i < CHUNK_POOL_SIZE; i++) {
    const geo = createTunnelChunkGeometry();
    disposables.push(geo);
    const mesh = new THREE.Mesh(geo, mats.mucosaWall);
    mesh.receiveShadow = true;
    group.add(mesh);
    const chunk: TunnelChunk = { chunkIndex: -999, mesh, geometry: geo };
    populateTunnelChunk(chunk, i);
    chunks.push(chunk);
  }

  // 2. ZONA 1: RONGGA MULUT (Teeth Arches & Uvula)
  const mouthGroup = new THREE.Group();
  group.add(mouthGroup);

  const toothCrownGeo = new THREE.CylinderGeometry(0.95, 1.15, 2.5, 12);
  toothCrownGeo.scale(1.0, 1.0, 0.85);
  disposables.push(toothCrownGeo);

  const centerTmp = new THREE.Vector3();
  for (let row = 0; row < 12; row++) {
    const z = 4 - row * 5.2;
    getTunnelCenterAtZ(z, centerTmp);
    const rad = getTunnelRadiusAtZ(z) - 0.8;

    for (const side of [-1, 1]) {
      const angUpper = Math.PI * 0.5 + side * (0.42 + row * 0.025);
      const upperTooth = new THREE.Mesh(toothCrownGeo, mats.toothEnamel);
      upperTooth.position.set(
        centerTmp.x + Math.cos(angUpper) * rad,
        centerTmp.y + Math.sin(angUpper) * rad,
        z
      );
      upperTooth.lookAt(centerTmp.x, centerTmp.y, z);
      upperTooth.rotateX(Math.PI / 2);
      upperTooth.castShadow = true;
      upperTooth.receiveShadow = true;
      mouthGroup.add(upperTooth);

      const angLower = -Math.PI * 0.5 + side * (0.45 + row * 0.02);
      const lowerTooth = new THREE.Mesh(toothCrownGeo, mats.toothEnamel);
      lowerTooth.position.set(
        centerTmp.x + Math.cos(angLower) * rad,
        centerTmp.y + Math.sin(angLower) * rad,
        z
      );
      lowerTooth.lookAt(centerTmp.x, centerTmp.y, z);
      lowerTooth.rotateX(Math.PI / 2);
      lowerTooth.castShadow = true;
      lowerTooth.receiveShadow = true;
      mouthGroup.add(lowerTooth);
    }
  }

  getTunnelCenterAtZ(-82, centerTmp);
  const uvulaGeo = new THREE.ConeGeometry(1.4, 4.4, 16);
  uvulaGeo.rotateX(Math.PI);
  disposables.push(uvulaGeo);
  const uvulaMat = mats.heartValve.clone();
  disposables.push(uvulaMat);
  const uvula = new THREE.Mesh(uvulaGeo, uvulaMat);
  uvula.position.set(centerTmp.x, centerTmp.y + 4.8, -82);
  mouthGroup.add(uvula);

  // 3. ZONA 2: TRAKEA CARTILAGE RINGS & INSTANCED RED BLOOD CELLS
  const tracheaGroup = new THREE.Group();
  group.add(tracheaGroup);

  const ringGeo = new THREE.TorusGeometry(8.2, 0.42, 10, 28);
  const ringMat = new THREE.MeshPhysicalMaterial({
    color: 0xfecdd3,
    roughness: 0.3,
    clearcoat: 0.8,
    transparent: true,
    opacity: 0.65,
  });
  disposables.push(ringGeo, ringMat);
  for (let z = -115; z >= -205; z -= 10) {
    getTunnelCenterAtZ(z, centerTmp);
    const cRing = new THREE.Mesh(ringGeo, ringMat);
    const scale = getTunnelRadiusAtZ(z) / 8.6;
    cRing.scale.setScalar(scale);
    cRing.position.copy(centerTmp);
    tracheaGroup.add(cRing);
  }

  // Instanced Red Blood Cells (140 physics bodies that stream cleanly around player)
  const cellCount = 140;
  const cellGeo = createBiconcaveCellGeometry();
  disposables.push(cellGeo);
  const bloodInstanced = new THREE.InstancedMesh(cellGeo, mats.redBloodCell, cellCount);
  bloodInstanced.frustumCulled = false;
  bloodInstanced.castShadow = true;
  bloodInstanced.receiveShadow = true;

  const bloodCells: BloodCellBody[] = [];
  const dummy = new THREE.Object3D();
  const cColor = new THREE.Color();

  for (let i = 0; i < cellCount; i++) {
    const z = THREE.MathUtils.lerp(-130, -330, Math.random());
    getTunnelCenterAtZ(z, centerTmp);
    const maxR = getTunnelRadiusAtZ(z) * 0.72;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * maxR;
    const scale = 0.8 + Math.random() * 0.55;

    const pos = new THREE.Vector3(
      centerTmp.x + Math.cos(angle) * dist,
      centerTmp.y + Math.sin(angle) * dist,
      z
    );
    const rot = new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    bloodCells.push({
      pos,
      vel: new THREE.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, -3.8 - Math.random() * 2.5),
      rot,
      angVel: new THREE.Vector3((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6),
      scale,
      radius: 0.8 * scale,
    });

    dummy.position.copy(pos);
    dummy.rotation.copy(rot);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    bloodInstanced.setMatrixAt(i, dummy.matrix);

    cColor.setHSL(0.98 + (Math.random() - 0.5) * 0.03, 0.78, 0.4 + Math.random() * 0.14);
    bloodInstanced.setColorAt(i, cColor);
  }
  bloodInstanced.instanceMatrix.needsUpdate = true;
  if (bloodInstanced.instanceColor) bloodInstanced.instanceColor.needsUpdate = true;
  bloodInstanced.computeBoundingSphere();
  group.add(bloodInstanced);

  // 4. ZONA 3: SISTEM SARAF PUSAT (Branching Myelin Axons & Synaptic Pulses)
  const cnsGroup = new THREE.Group();
  group.add(cnsGroup);
  const synapticPulses: SynapticPulse[] = [];
  const pulseGeo = new THREE.SphereGeometry(0.3, 10, 10);
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
  disposables.push(pulseGeo, pulseMat);

  for (let n = 0; n < 30; n++) {
    const zBase = -335 - n * 6.5;
    getTunnelCenterAtZ(zBase, centerTmp);
    const rad = getTunnelRadiusAtZ(zBase);
    const ang = (n * 1.37) % (Math.PI * 2);
    const p1 = new THREE.Vector3(
      centerTmp.x + Math.cos(ang) * (rad * 0.92),
      centerTmp.y + Math.sin(ang) * (rad * 0.92),
      zBase
    );
    const p2 = new THREE.Vector3(
      centerTmp.x + Math.cos(ang + 0.45) * (rad * 0.65),
      centerTmp.y + Math.sin(ang + 0.45) * (rad * 0.65),
      zBase - 5.5
    );
    const p3 = new THREE.Vector3(
      centerTmp.x + Math.cos(ang + 0.95) * (rad * 0.88),
      centerTmp.y + Math.sin(ang + 0.95) * (rad * 0.88),
      zBase - 11.5
    );

    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    const axonGeo = new THREE.TubeGeometry(curve, 14, 0.18, 8, false);
    disposables.push(axonGeo);
    const axonMesh = new THREE.Mesh(axonGeo, mats.myelinSheath);
    cnsGroup.add(axonMesh);

    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    cnsGroup.add(pulseMesh);
    synapticPulses.push({
      curve,
      t: Math.random(),
      speed: 0.45 + Math.random() * 0.45,
      mesh: pulseMesh,
    });
  }

  // 5. ZONA 4: RUANG JANTUNG & ORGAN VITAL (z = -540 .. -760)
  const heartGroup = new THREE.Group();
  group.add(heartGroup);

  const heartValves: THREE.Mesh[] = [];
  const valveShape = new THREE.Shape();
  valveShape.moveTo(0, 0);
  valveShape.quadraticCurveTo(3.5, 2.2, 6.2, 0.6);
  valveShape.quadraticCurveTo(3.5, -1.6, 0, 0);
  const valveGeo = new THREE.ExtrudeGeometry(valveShape, {
    depth: 0.45,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: 0.18,
    bevelSegments: 2,
  });
  disposables.push(valveGeo);

  getTunnelCenterAtZ(-560, centerTmp);
  for (let v = 0; v < 4; v++) {
    const ang = (v / 4) * Math.PI * 2;
    const valve = new THREE.Mesh(valveGeo, mats.heartValve);
    valve.position.set(
      centerTmp.x + Math.cos(ang) * 11.5,
      centerTmp.y + Math.sin(ang) * 11.5,
      -560
    );
    valve.rotation.z = ang + Math.PI;
    heartGroup.add(valve);
    heartValves.push(valve);
  }

  // Vital Sinoatrial Core in Cardiac Chamber
  getTunnelCenterAtZ(-728, centerTmp);
  const coreGeo = new THREE.SphereGeometry(4.2, 24, 24);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xfb7185,
    emissive: 0xe11d48,
    emissiveIntensity: 1.6,
    roughness: 0.18,
    clearcoat: 1.0,
  });
  disposables.push(coreGeo, coreMat);
  const vitalCoreMesh = new THREE.Mesh(coreGeo, coreMat);
  vitalCoreMesh.position.set(centerTmp.x, centerTmp.y + 5.2, -728);
  heartGroup.add(vitalCoreMesh);

  // 6. ZONA 5: ENDLESS INTESTINAL VILLI RINGS (InstancedMesh sliding with player)
  const villiRingCount = 26;
  const villiRingGeo = new THREE.TorusGeometry(8.6, 0.55, 10, 26);
  const villiRingMat = new THREE.MeshPhysicalMaterial({
    color: 0xfb923c,
    emissive: 0x7c2d12,
    emissiveIntensity: 0.35,
    roughness: 0.35,
    clearcoat: 0.75,
    transparent: true,
    opacity: 0.72,
  });
  disposables.push(villiRingGeo, villiRingMat);
  const villiInstanced = new THREE.InstancedMesh(villiRingGeo, villiRingMat, villiRingCount);
  villiInstanced.frustumCulled = false;
  group.add(villiInstanced);

  // 7. ZONA 6: ANAL SPHINCTER EXIT GATE & RADIANT LAB PORTAL (z = -2585)
  const exitGroup = new THREE.Group();
  group.add(exitGroup);
  getTunnelCenterAtZ(ANUS_EXIT_Z, centerTmp);

  const sphincterPetalGeo = new THREE.CapsuleGeometry(1.15, 3.8, 6, 12);
  const sphincterMat = new THREE.MeshPhysicalMaterial({
    color: 0xfda4af,
    emissive: 0x9f1239,
    emissiveIntensity: 0.45,
    roughness: 0.32,
    clearcoat: 0.9,
  });
  disposables.push(sphincterPetalGeo, sphincterMat);

  const sphincterPetals: { mesh: THREE.Mesh; angle: number }[] = [];
  for (let p = 0; p < 10; p++) {
    const angle = (p / 10) * Math.PI * 2;
    const petal = new THREE.Mesh(sphincterPetalGeo, sphincterMat);
    petal.position.set(
      centerTmp.x + Math.cos(angle) * 6.2,
      centerTmp.y + Math.sin(angle) * 6.2,
      ANUS_EXIT_Z
    );
    petal.rotation.z = angle + Math.PI / 2;
    exitGroup.add(petal);
    sphincterPetals.push({ mesh: petal, angle });
  }

  // Radiant External World Light Portal right past the sphincter
  const portalGeo = new THREE.CircleGeometry(12.5, 32);
  disposables.push(portalGeo);
  const anusPortalMesh = new THREE.Mesh(portalGeo, mats.portalGlow);
  anusPortalMesh.position.set(centerTmp.x, centerTmp.y, ANUS_EXIT_Z - 14);
  exitGroup.add(anusPortalMesh);

  // 8. Travelling Atmospheric Tunnel PointLights (follow player & illuminate curves)
  const zoneLights: THREE.PointLight[] = [];
  for (let i = 0; i < 4; i++) {
    const pt = new THREE.PointLight(0xffb3c6, 28, 85, 1.2);
    group.add(pt);
    zoneLights.push(pt);
  }

  const dummyObj = new THREE.Object3D();
  const cTmp = new THREE.Vector3();
  const sTmp = new THREE.Vector3();
  const lightColor = new THREE.Color();

  const update = (dt: number, elapsed: number, heartBeatPhase: number, playerZ: number) => {
    mats.tunnelTimeUniform.value = elapsed;

    // 1. Stream tunnel chunks around playerZ
    const baseChunkIdx = Math.max(0, Math.floor((20 - playerZ) / CHUNK_LEN) - 1);
    for (let i = 0; i < CHUNK_POOL_SIZE; i++) {
      const targetIdx = baseChunkIdx + i;
      const chunk = chunks[i];
      if (chunk.chunkIndex !== targetIdx) {
        populateTunnelChunk(chunk, targetIdx);
      }
    }

    // Toggle far-away static organ landmark groups for speed
    mouthGroup.visible = playerZ > -220;
    tracheaGroup.visible = playerZ < -30 && playerZ > -360;
    cnsGroup.visible = playerZ < -220 && playerZ > -680;
    heartGroup.visible = playerZ < -420 && playerZ > -920;
    exitGroup.visible = playerZ < -2340;
    villiInstanced.visible = playerZ < -720 && playerZ > -2560;

    // 2. Wrap Red Blood Cells dynamically around player in Bloodstream & Endless corridor
    const rbcMinZ = playerZ - 135;
    const rbcMaxZ = playerZ + 38;
    const showRbc = playerZ < -85 && playerZ > -2560;
    bloodInstanced.visible = showRbc;

    if (showRbc) {
      for (let i = 0; i < bloodCells.length; i++) {
        const cell = bloodCells[i];
        cell.pos.addScaledVector(cell.vel, dt);
        cell.rot.x += cell.angVel.x * dt;
        cell.rot.y += cell.angVel.y * dt;
        cell.rot.z += cell.angVel.z * dt;

        if (cell.pos.z < rbcMinZ || cell.pos.z > rbcMaxZ + 12) {
          cell.pos.z =
            cell.pos.z < rbcMinZ
              ? THREE.MathUtils.lerp(playerZ + 10, playerZ + 36, Math.random())
              : THREE.MathUtils.lerp(rbcMinZ, playerZ - 20, Math.random());
          getTunnelCenterAtZ(cell.pos.z, cTmp);
          const r = getTunnelRadiusAtZ(cell.pos.z) * 0.68;
          const a = Math.random() * Math.PI * 2;
          cell.pos.x = cTmp.x + Math.cos(a) * r;
          cell.pos.y = cTmp.y + Math.sin(a) * r;
          cell.vel.set((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, -4.5 - Math.random() * 2.5);
        }

        getTunnelCenterAtZ(cell.pos.z, cTmp);
        const maxR = getTunnelRadiusAtZ(cell.pos.z) - cell.radius - 0.4;
        const dx = cell.pos.x - cTmp.x;
        const dy = cell.pos.y - cTmp.y;
        const dist = Math.hypot(dx, dy);
        if (dist > maxR && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          cell.pos.x = cTmp.x + nx * maxR;
          cell.pos.y = cTmp.y + ny * maxR;
          const dot = cell.vel.x * nx + cell.vel.y * ny;
          if (dot > 0) {
            cell.vel.x -= 1.7 * dot * nx;
            cell.vel.y -= 1.7 * dot * ny;
          }
        }

        cell.vel.z = THREE.MathUtils.lerp(cell.vel.z, -5.0, dt * 1.2);

        dummyObj.position.copy(cell.pos);
        dummyObj.rotation.copy(cell.rot);
        dummyObj.scale.setScalar(cell.scale);
        dummyObj.updateMatrix();
        bloodInstanced.setMatrixAt(i, dummyObj.matrix);
      }
      bloodInstanced.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Neural Synaptic Pulses when near CNS
    if (cnsGroup.visible) {
      for (let i = 0; i < synapticPulses.length; i++) {
        const sp = synapticPulses[i];
        sp.t = (sp.t + sp.speed * dt) % 1;
        sp.curve.getPointAt(sp.t, sTmp);
        sp.mesh.position.copy(sTmp);
      }
    }

    // 4. Update Heart Valves & Vital Core pulse
    const beatScale = 1.0 + Math.pow(Math.max(0, Math.sin(heartBeatPhase)), 6) * 0.16;
    if (heartGroup.visible) {
      vitalCoreMesh.scale.setScalar(beatScale);
      const valveOpen = Math.sin(heartBeatPhase) * 0.35;
      for (let v = 0; v < heartValves.length; v++) {
        heartValves[v].rotation.y = valveOpen;
      }
    }

    // 5. Endless Intestinal Haustral Rings sliding along Z
    if (villiInstanced.visible) {
      const startRingIdx = Math.floor(Math.max(760, -playerZ - 25) / 14);
      for (let i = 0; i < villiRingCount; i++) {
        const ringZ = -(startRingIdx + i) * 14;
        if (ringZ < -2475) {
          dummyObj.scale.setScalar(0.001);
        } else {
          getTunnelCenterAtZ(ringZ, cTmp);
          const rad = getTunnelRadiusAtZ(ringZ) / 8.8;
          dummyObj.position.copy(cTmp);
          dummyObj.rotation.set(Math.sin(ringZ * 0.05) * 0.08, Math.cos(ringZ * 0.04) * 0.08, elapsed * 0.25 + i);
          dummyObj.scale.setScalar(rad);
        }
        dummyObj.updateMatrix();
        villiInstanced.setMatrixAt(i, dummyObj.matrix);
      }
      villiInstanced.instanceMatrix.needsUpdate = true;
    }

    // 6. Animate Anal Sphincter Gate dilating open as player nears exit
    if (exitGroup.visible) {
      getTunnelCenterAtZ(ANUS_EXIT_Z, cTmp);
      const openFactor = THREE.MathUtils.smoothstep(-playerZ, 2450, 2555);
      const petalRadius = 4.0 + openFactor * 4.4;
      for (let p = 0; p < sphincterPetals.length; p++) {
        const sp = sphincterPetals[p];
        sp.mesh.position.set(
          cTmp.x + Math.cos(sp.angle) * petalRadius,
          cTmp.y + Math.sin(sp.angle) * petalRadius,
          ANUS_EXIT_Z
        );
      }
      anusPortalMesh.scale.setScalar(0.85 + openFactor * 0.45 + Math.sin(elapsed * 4) * 0.05);
    }

    // 7. Reposition 4 traveling PointLights along tunnel ahead/around player
    const negZ = -playerZ;
    if (negZ < 130) lightColor.setHex(0xffb3c6);
    else if (negZ < 330) lightColor.setHex(0xef4444);
    else if (negZ < 540) lightColor.setHex(0x38bdf8);
    else if (negZ < 760) lightColor.setHex(0xf43f5e);
    else if (negZ < 2480) lightColor.setHex(0xfb923c);
    else lightColor.setHex(0xfef08a);

    for (let i = 0; i < zoneLights.length; i++) {
      const lz = playerZ + 12 - i * 32;
      getTunnelCenterAtZ(lz, cTmp);
      zoneLights[i].position.copy(cTmp);
      zoneLights[i].color.copy(lightColor);
      zoneLights[i].intensity = i === 1 && negZ >= 540 && negZ < 760 ? 36 + (beatScale - 1) * 130 : 28;
    }
  };

  return {
    group,
    bloodCells,
    bloodInstanced,
    heartValves,
    vitalCoreMesh,
    anusPortalMesh,
    zoneLights,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rg = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  rg.addColorStop(0, 'rgba(15, 23, 42, 0.48)');
  rg.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLabEndingWorld(mats: MaterialLibrary): LabEndingController {
  const group = new THREE.Group();
  group.visible = false;
  const disposables: { dispose: () => void }[] = [];

  // 1. Tiled Clinic Laboratory Floor & Walls
  const floorGeo = new THREE.PlaneGeometry(24, 24);
  floorGeo.rotateX(-Math.PI / 2);
  disposables.push(floorGeo);
  const floor = new THREE.Mesh(floorGeo, mats.labFloor);
  floor.receiveShadow = true;
  group.add(floor);

  const backWallGeo = new THREE.PlaneGeometry(24, 9);
  disposables.push(backWallGeo);
  const backWall = new THREE.Mesh(backWallGeo, mats.labWall);
  backWall.position.set(0, 4.5, -5.5);
  backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(backWallGeo, mats.labWall);
  leftWall.position.set(-10, 4.5, 0);
  leftWall.rotation.y = Math.PI / 2;
  group.add(leftWall);

  // Sky-Blue Laboratory Window with Mullions on Back Wall (non-glaring sky tone)
  const windowFrameGeo = new THREE.BoxGeometry(5.6, 3.2, 0.14);
  const windowPaneGeo = new THREE.PlaneGeometry(5.2, 2.8);
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const trimGeo = new THREE.BoxGeometry(24, 1.35, 0.08);
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
  const mullionVGeo = new THREE.BoxGeometry(0.12, 2.8, 0.08);
  const mullionHGeo = new THREE.BoxGeometry(5.2, 0.12, 0.08);
  disposables.push(windowFrameGeo, windowPaneGeo, windowMat, trimGeo, trimMat, mullionVGeo, mullionHGeo);

  const wainscotBack = new THREE.Mesh(trimGeo, trimMat);
  wainscotBack.position.set(0, 0.68, -5.45);
  group.add(wainscotBack);

  const winFrame = new THREE.Mesh(windowFrameGeo, mats.darkChassis);
  winFrame.position.set(-2.2, 3.2, -5.42);
  const winPane = new THREE.Mesh(windowPaneGeo, windowMat);
  winPane.position.set(-2.2, 3.2, -5.34);
  const mulV = new THREE.Mesh(mullionVGeo, mats.darkChassis);
  mulV.position.set(-2.2, 3.2, -5.3);
  const mulH = new THREE.Mesh(mullionHGeo, mats.darkChassis);
  mulH.position.set(-2.2, 3.2, -5.3);
  group.add(winFrame, winPane, mulV, mulH);

  // 2. Bio-Expansion / De-Shrink Pad (left-center at x = -2.2, z = 0.2)
  const padPosition = new THREE.Vector3(-2.2, 0, 0.2);
  const padGroup = new THREE.Group();
  padGroup.position.copy(padPosition);
  group.add(padGroup);

  const padBaseGeo = new THREE.CylinderGeometry(1.55, 1.75, 0.16, 28);
  const padBase = new THREE.Mesh(padBaseGeo, mats.titaniumHull);
  padBase.position.y = 0.08;
  padBase.receiveShadow = true;
  padGroup.add(padBase);

  const padRingGeo = new THREE.TorusGeometry(1.38, 0.06, 10, 32);
  padRingGeo.rotateX(Math.PI / 2);
  const padRingMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const padRing = new THREE.Mesh(padRingGeo, padRingMat);
  padRing.position.y = 0.18;
  padGroup.add(padRing);

  const beamGeo = new THREE.CylinderGeometry(1.25, 1.25, 3.6, 24, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const padBeam = new THREE.Mesh(beamGeo, beamMat);
  padBeam.position.y = 1.9;
  padGroup.add(padBeam);
  disposables.push(padBaseGeo, padRingGeo, padRingMat, beamGeo, beamMat);

  // 3. Stainless Steel Lab Desk + Healthy Bio-Monitor Display (back-right)
  const deskGroup = new THREE.Group();
  deskGroup.position.set(2.4, 0, -3.9);
  group.add(deskGroup);

  const deskTopGeo = new THREE.BoxGeometry(3.4, 0.12, 1.3);
  const deskTop = new THREE.Mesh(deskTopGeo, mats.labDesk);
  deskTop.position.y = 1.05;
  deskTop.castShadow = true;
  deskGroup.add(deskTop);

  const deskLegGeo = new THREE.BoxGeometry(0.12, 1.05, 1.1);
  const dLegL = new THREE.Mesh(deskLegGeo, mats.darkChassis);
  dLegL.position.set(-1.5, 0.525, 0);
  const dLegR = dLegL.clone();
  dLegR.position.x = 1.5;
  deskGroup.add(dLegL, dLegR);

  // Vital Monitor showing "RAKA · STATUS: SEHAT 100%"
  const monBodyGeo = new THREE.BoxGeometry(2.1, 1.15, 0.14);
  const monStandGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.35, 12);
  const monScreenGeo = new THREE.PlaneGeometry(1.92, 0.96);
  const monStand = new THREE.Mesh(monStandGeo, mats.darkChassis);
  monStand.position.set(0, 1.25, 0);
  const monBody = new THREE.Mesh(monBodyGeo, mats.darkChassis);
  monBody.position.set(0, 1.92, 0);
  const monScreen = new THREE.Mesh(monScreenGeo, mats.labMonitorScreen);
  monScreen.position.set(0, 1.92, 0.08);
  deskGroup.add(monStand, monBody, monScreen);
  disposables.push(deskTopGeo, deskLegGeo, monBodyGeo, monStandGeo, monScreenGeo);

  // 4. Pediatric Recovery Bed (right at x = 2.4, z = -0.1)
  const bedGroup = new THREE.Group();
  bedGroup.position.set(2.4, 0, -0.1);
  bedGroup.rotation.y = -0.35; // Angled warmly toward Profesor Aris
  group.add(bedGroup);

  const bedFrameGeo = new THREE.BoxGeometry(1.65, 0.38, 2.5);
  const bedMattressGeo = new THREE.BoxGeometry(1.52, 0.24, 2.36);
  const pillowGeo = new THREE.BoxGeometry(0.95, 0.22, 0.52);
  const blanketGeo = new THREE.BoxGeometry(1.56, 0.18, 1.28);
  const headboardGeo = new THREE.BoxGeometry(1.65, 0.95, 0.14);
  disposables.push(bedFrameGeo, bedMattressGeo, pillowGeo, blanketGeo, headboardGeo);

  const bedFrame = new THREE.Mesh(bedFrameGeo, mats.labDesk);
  bedFrame.position.y = 0.28;
  bedFrame.castShadow = true;
  bedFrame.receiveShadow = true;
  const mattress = new THREE.Mesh(bedMattressGeo, mats.labCoat);
  mattress.position.y = 0.56;
  const headboard = new THREE.Mesh(headboardGeo, mats.titaniumHull);
  headboard.position.set(0, 0.72, -1.2);
  const pillow = new THREE.Mesh(pillowGeo, mats.labCoat);
  pillow.position.set(0, 0.74, -0.82);
  const blanket = new THREE.Mesh(blanketGeo, mats.blanketTeal);
  blanket.position.set(0, 0.64, 0.48);
  bedGroup.add(bedFrame, mattress, headboard, pillow, blanket);

  // 5. Full-Size Profesor Aris & Healthy Grandchild Raka
  const profRig = createProfessorHumanModel(mats);
  profRig.root.position.copy(padPosition);
  profRig.root.rotation.y = Math.PI * 0.44; // Facing Raka on the right
  profRig.root.visible = false;
  group.add(profRig.root);

  const rakaRig = createGrandchildRakaModel(mats);
  rakaRig.root.position.set(0, 0.68, -0.35);
  bedGroup.add(rakaRig.root);

  // Soft Contact Shadows
  const shadowTex = createContactShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(2.2, 2.2);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  disposables.push(shadowTex, shadowGeo, shadowMat);

  const profShadow = new THREE.Mesh(shadowGeo, shadowMat);
  profShadow.position.set(padPosition.x, 0.02, padPosition.z);
  const bedShadow = new THREE.Mesh(shadowGeo, shadowMat);
  bedShadow.position.set(2.4, 0.02, -0.1);
  bedShadow.scale.set(1.6, 1, 1.9);
  group.add(profShadow, bedShadow);

  // 6. Celebration Healing Motes (InstancedMesh)
  const moteCount = 36;
  const moteGeo = new THREE.OctahedronGeometry(0.08, 0);
  const moteMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  disposables.push(moteGeo, moteMat);
  const celebrationMotes = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
  celebrationMotes.frustumCulled = false;
  group.add(celebrationMotes);

  const moteDummy = new THREE.Object3D();

  const update = (_dt: number, elapsed: number, endingTime: number) => {
    padRing.rotation.z = elapsed * 1.4;
    const beamPhase = Math.max(0, 1 - Math.max(0, endingTime - 2.6) * 0.9);
    padBeam.visible = beamPhase > 0.02;
    (padBeam.material as THREE.MeshBasicMaterial).opacity = beamPhase * 0.25;
    padBeam.scale.set(1 + Math.sin(elapsed * 8) * 0.05, 1, 1 + Math.sin(elapsed * 8) * 0.05);

    // Animate Raka happily waving & bouncing on recovery bed
    rakaRig.rightArm.rotation.z = -0.5 + Math.sin(elapsed * 5.8) * 0.42;
    rakaRig.head.rotation.y = -0.35 + Math.sin(elapsed * 2.1) * 0.12;
    rakaRig.head.rotation.z = Math.sin(elapsed * 2.6) * 0.07;
    rakaRig.root.position.y = 0.68 + Math.abs(Math.sin(elapsed * 3.2)) * 0.04;

    // Animate Profesor Aris: walks from De-Shrink Pad toward Raka's bed (3.6s..6.2s), then waves warmly!
    if (profRig.root.visible) {
      const walkT = THREE.MathUtils.clamp((endingTime - 3.6) / 2.4, 0, 1);
      const smoothWalk = walkT * walkT * (3 - 2 * walkT);
      const px = THREE.MathUtils.lerp(padPosition.x, 0.05, smoothWalk);
      const pz = THREE.MathUtils.lerp(padPosition.z, 0.35, smoothWalk);
      const isWalking = walkT > 0.02 && walkT < 0.98;
      const stride = isWalking ? Math.sin(elapsed * 8.5) : 0;

      profRig.root.position.set(px, isWalking ? Math.abs(stride) * 0.045 : 0, pz);
      profShadow.position.set(px, 0.02, pz);

      profRig.leftLeg.rotation.x = stride * 0.45;
      profRig.rightLeg.rotation.x = -stride * 0.45;
      profRig.leftArm.rotation.x = -stride * 0.38;

      if (walkT >= 0.98) {
        // Warmly waves right hand and nods happily at grandson Raka
        profRig.rightArm.rotation.z = 2.45 + Math.sin(elapsed * 5.0) * 0.22;
        profRig.rightArm.rotation.x = -0.25;
      } else {
        profRig.rightArm.rotation.z = 0.14;
        profRig.rightArm.rotation.x = stride * 0.38;
      }
      profRig.head.rotation.x = Math.sin(elapsed * 2.4) * 0.08;
      profRig.head.rotation.y = Math.sin(elapsed * 1.4) * 0.06;
    }

    // Floating celebratory healing motes
    for (let i = 0; i < moteCount; i++) {
      const a = elapsed * 0.8 + i * 1.7;
      const rx = Math.sin(a * 0.9 + i) * 4.2;
      const rz = Math.cos(a * 0.7 + i * 0.5) * 2.6;
      const ry = 0.4 + ((elapsed * 0.55 + i * 0.19) % 3.2);
      moteDummy.position.set(rx, ry, rz);
      moteDummy.rotation.set(elapsed * 2 + i, elapsed * 1.6, 0);
      moteDummy.scale.setScalar(0.6 + Math.sin(elapsed * 4 + i) * 0.35);
      moteDummy.updateMatrix();
      celebrationMotes.setMatrixAt(i, moteDummy.matrix);
    }
    celebrationMotes.instanceMatrix.needsUpdate = true;
  };

  return {
    group,
    profRig,
    rakaRig,
    padBeam,
    padRing,
    celebrationMotes,
    padPosition,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
