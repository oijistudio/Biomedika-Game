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

export interface ForkSeptumBody {
  pos: THREE.Vector3;
  radius: number;
}

export interface BranchDef {
  z: number;
  side: -1 | 1;
  yOffset: number;
}

export interface WorldController {
  group: THREE.Group;
  bloodCells: BloodCellBody[];
  bloodInstanced: THREE.InstancedMesh;
  heartValves: THREE.Mesh[];
  vitalCoreMesh: THREE.Mesh;
  anusPortalMesh: THREE.Mesh;
  zoneLights: THREE.PointLight[];
  activeForkSepta: ForkSeptumBody[];
  update: (dt: number, elapsed: number, heartBeatPhase: number, playerZ: number) => void;
  dispose: () => void;
}

export interface LabEndingController {
  group: THREE.Group;
  profRig: ProfessorHumanRig;
  rakaRig: RakaHumanRig;
  profShadow: THREE.Mesh;
  monScreen: THREE.Mesh;
  padBeam: THREE.Mesh;
  padRing: THREE.Mesh;
  celebrationMotes: THREE.InstancedMesh;
  padPosition: THREE.Vector3;
  bedPosition: THREE.Vector3;
  update: (
    dt: number,
    elapsed: number,
    phaseTime: number,
    mode?: 'title' | 'intro' | 'ending'
  ) => void;
  dispose: () => void;
}

export interface ForkNodeDef {
  z: number;
  xOffset: number;
}

// 40 major multi-lane bifurcation septum junctions splitting wide organs into 2- and 3-lane branches
export const FORK_NODES: readonly ForkNodeDef[] = [
  { z: -195, xOffset: 0 },
  { z: -265, xOffset: -4.2 },
  { z: -265, xOffset: 4.2 },
  { z: -345, xOffset: 0 },
  { z: -425, xOffset: 0 },
  { z: -535, xOffset: -4.0 },
  { z: -535, xOffset: 4.0 },
  { z: -630, xOffset: 0 },
  { z: -740, xOffset: 0 },
  { z: -850, xOffset: -3.8 },
  { z: -850, xOffset: 3.8 },
  { z: -990, xOffset: 0 },
  { z: -1120, xOffset: -4.5 },
  { z: -1120, xOffset: 4.5 },
  { z: -1255, xOffset: 0 },
  { z: -1360, xOffset: 0 },
  { z: -1860, xOffset: 0 },
  { z: -1995, xOffset: -4.4 },
  { z: -1995, xOffset: 4.4 },
  { z: -2145, xOffset: 0 },
  { z: -2295, xOffset: 0 },
  { z: -2490, xOffset: -4.2 },
  { z: -2490, xOffset: 4.2 },
  { z: -2655, xOffset: 0 },
  { z: -2820, xOffset: 0 },
  { z: -2995, xOffset: -4.4 },
  { z: -2995, xOffset: 4.4 },
  { z: -3220, xOffset: 0 },
  { z: -3420, xOffset: 0 },
  { z: -3650, xOffset: -4.5 },
  { z: -3650, xOffset: 4.5 },
  { z: -3890, xOffset: 0 },
  { z: -4120, xOffset: 0 },
  { z: -4340, xOffset: -4.5 },
  { z: -4340, xOffset: 4.5 },
  { z: -4590, xOffset: 0 },
  { z: -4840, xOffset: 0 },
  { z: -5110, xOffset: -4.4 },
  { z: -5110, xOffset: 4.4 },
  { z: -5390, xOffset: 0 },
  { z: -5660, xOffset: 0 },
  { z: -5910, xOffset: 0 },
];

export const FORK_Z_LIST: readonly number[] = Array.from(
  new Set(FORK_NODES.map((n) => n.z))
);

// 70 anatomical side-branch ducts (including twin left+right Y-crossroads) across Zones 0..8
export const BRANCH_LOCATIONS: readonly BranchDef[] = [
  { z: -72, side: -1, yOffset: 0.2 },
  { z: -102, side: 1, yOffset: -0.2 },
  { z: -162, side: -1, yOffset: 0.4 },
  { z: -162, side: 1, yOffset: -0.4 },
  { z: -215, side: -1, yOffset: 0.3 },
  { z: -245, side: 1, yOffset: -0.5 },
  { z: -305, side: -1, yOffset: 0.2 },
  { z: -305, side: 1, yOffset: 0.4 },
  { z: -375, side: -1, yOffset: -0.3 },
  { z: -410, side: 1, yOffset: 0.5 },
  { z: -455, side: -1, yOffset: 0.3 },
  { z: -510, side: -1, yOffset: -0.3 },
  { z: -510, side: 1, yOffset: 0.4 },
  { z: -580, side: 1, yOffset: 0.5 },
  { z: -615, side: -1, yOffset: -0.4 },
  { z: -675, side: 1, yOffset: 0.3 },
  { z: -725, side: -1, yOffset: -0.6 },
  { z: -790, side: 1, yOffset: 0.4 },
  { z: -835, side: -1, yOffset: 0.2 },
  { z: -885, side: 1, yOffset: -0.4 },
  { z: -955, side: -1, yOffset: 0.5 },
  { z: -955, side: 1, yOffset: -0.5 },
  { z: -1045, side: 1, yOffset: -0.4 },
  { z: -1105, side: -1, yOffset: 0.3 },
  { z: -1185, side: -1, yOffset: 0.2 },
  { z: -1245, side: 1, yOffset: -0.3 },
  { z: -1325, side: -1, yOffset: 0.5 },
  { z: -1325, side: 1, yOffset: -0.5 },
  { z: -1820, side: -1, yOffset: 0.4 },
  { z: -1885, side: 1, yOffset: -0.3 },
  { z: -1955, side: -1, yOffset: 0.5 },
  { z: -1955, side: 1, yOffset: -0.4 },
  { z: -2065, side: -1, yOffset: 0.6 },
  { z: -2140, side: 1, yOffset: -0.4 },
  { z: -2225, side: -1, yOffset: 0.2 },
  { z: -2315, side: 1, yOffset: -0.4 },
  { z: -2385, side: -1, yOffset: 0.5 },
  { z: -2465, side: -1, yOffset: 0.3 },
  { z: -2465, side: 1, yOffset: -0.3 },
  { z: -2575, side: 1, yOffset: -0.6 },
  { z: -2685, side: -1, yOffset: 0.4 },
  { z: -2785, side: 1, yOffset: -0.3 },
  { z: -2865, side: -1, yOffset: 0.5 },
  { z: -2965, side: 1, yOffset: -0.2 },
  { z: -3055, side: -1, yOffset: 0.3 },
  { z: -3175, side: -1, yOffset: 0.4 },
  { z: -3175, side: 1, yOffset: -0.4 },
  { z: -3310, side: 1, yOffset: -0.5 },
  { z: -3460, side: -1, yOffset: 0.3 },
  { z: -3580, side: 1, yOffset: 0.5 },
  { z: -3710, side: -1, yOffset: -0.3 },
  { z: -3850, side: -1, yOffset: 0.5 },
  { z: -3850, side: 1, yOffset: 0.6 },
  { z: -4010, side: -1, yOffset: -0.4 },
  { z: -4185, side: 1, yOffset: 0.3 },
  { z: -4310, side: -1, yOffset: 0.4 },
  { z: -4465, side: -1, yOffset: 0.5 },
  { z: -4465, side: 1, yOffset: -0.5 },
  { z: -4635, side: 1, yOffset: -0.4 },
  { z: -4795, side: -1, yOffset: 0.3 },
  { z: -4960, side: 1, yOffset: -0.3 },
  { z: -5085, side: -1, yOffset: 0.4 },
  { z: -5225, side: -1, yOffset: -0.3 },
  { z: -5225, side: 1, yOffset: -0.3 },
  { z: -5395, side: 1, yOffset: 0.5 },
  { z: -5520, side: -1, yOffset: 0.6 },
  { z: -5680, side: 1, yOffset: -0.4 },
  { z: -5790, side: -1, yOffset: 0.2 },
  { z: -5895, side: 1, yOffset: -0.3 },
  { z: -5980, side: -1, yOffset: 0.2 },
  { z: -5980, side: 1, yOffset: -0.2 },
];

const CHUNK_LEN = 40;
const CHUNK_POOL_SIZE = 8;
const CHUNK_LENGTH_SEGS = 20;
const CHUNK_RADIAL_SEGS = 28;

// Parametric centerline of the 6,200-unit anatomical journey (z from +20 down to -6260)
export function getTunnelCenterAtZ(z: number, out = new THREE.Vector3()): THREE.Vector3 {
  if (z > -20) {
    return out.set(0, 0, z);
  }
  const negZ = -z;
  const s = negZ - 20;

  // Story organs S-curves (Mouth -> Bronchus -> Bloodstream -> CNS -> damping before Heart Chamber at -1420..-1780)
  const heartDamp =
    (1.0 - THREE.MathUtils.smoothstep(negZ, 1340, 1435)) +
    THREE.MathUtils.smoothstep(negZ, 1755, 1840) * 0;
  const storyActive = 1.0 - THREE.MathUtils.smoothstep(negZ, 1350, 1440);
  const storyX = (Math.sin(s * 0.017) * 6.2 + Math.cos(s * 0.008) * 2.8) * storyActive;
  const storyY = (Math.cos(s * 0.014) * 3.8 - Math.sin(s * 0.01) * 2.0) * storyActive;

  // Deep Abdominal & Endless Intestinal Corridor (-1780..-6040), straightening at Anal Exit (-6040..-6240)
  const deepAmp =
    THREE.MathUtils.smoothstep(negZ, 1760, 1875) *
    (1.0 - THREE.MathUtils.smoothstep(negZ, 6010, 6135));
  const ds = Math.max(0, negZ - 1760);
  const deepX = (Math.sin(ds * 0.014) * 10.5 + Math.cos(ds * 0.0065) * 4.8) * deepAmp;
  const deepY = (Math.cos(ds * 0.012) * 6.8 - Math.sin(ds * 0.0075) * 3.1) * deepAmp;

  void heartDamp;
  return out.set(storyX + deepX, storyY + deepY, z);
}

// Parametric radius at Z across all 10 zones down to Anal Exit (-6200) — super-wide cavernous body corridors!
export function getTunnelRadiusAtZ(z: number): number {
  const negZ = -z;
  let r = 15.2;

  // Pharynx narrowing (-90..-155)
  const throat =
    THREE.MathUtils.smoothstep(negZ, 80, 115) * (1 - THREE.MathUtils.smoothstep(negZ, 135, 170));
  r -= throat * 3.0;

  // Bronchus & Bloodstream wider conduits (-150..-920)
  const respBlood =
    THREE.MathUtils.smoothstep(negZ, 145, 200) * (1 - THREE.MathUtils.smoothstep(negZ, 880, 935));
  r += respBlood * 2.4;

  // CNS neural cavern (-920..-1420)
  const cns =
    THREE.MathUtils.smoothstep(negZ, 910, 960) * (1 - THREE.MathUtils.smoothstep(negZ, 1385, 1430));
  r += cns * 3.8;

  // Monumental Heart Chamber expansion (-1420..-1780)
  const heart =
    THREE.MathUtils.smoothstep(negZ, 1410, 1475) *
    (1 - THREE.MathUtils.smoothstep(negZ, 1735, 1805));
  r += heart * 14.2;

  // Liver & Kidney sinusoidal corridors (-1780..-3120)
  const hepatoRenal =
    THREE.MathUtils.smoothstep(negZ, 1785, 1860) *
    (1 - THREE.MathUtils.smoothstep(negZ, 3070, 3140));
  r += hepatoRenal * (3.4 + Math.sin(negZ * 0.06) * 1.4);

  // Endless Small Intestine & Colon haustral ridges (-3120..-6040)
  const gutFactor =
    THREE.MathUtils.smoothstep(negZ, 3110, 3190) *
    (1 - THREE.MathUtils.smoothstep(negZ, 5990, 6080));
  const haustra = Math.sin(negZ * 0.11) * 1.45 - 0.35;
  r += gutFactor * haustra;

  // Extra-wide bifurcation chambers around each multi-lane junction
  for (let i = 0; i < FORK_Z_LIST.length; i++) {
    const dz = Math.abs(z - FORK_Z_LIST[i]);
    if (dz < 34) {
      r += 5.4 * (1 - THREE.MathUtils.smoothstep(dz, 10, 34));
    }
  }

  // Anal Sphincter pinch near -6200, flaring open past -6200
  const sphincterPinch =
    THREE.MathUtils.smoothstep(negZ, 6115, 6190) *
    (1 - THREE.MathUtils.smoothstep(negZ, 6200, 6235));
  r -= sphincterPinch * 3.8;

  const postExitFlare = THREE.MathUtils.smoothstep(negZ, 6200, 6245);
  r += postExitFlare * 5.8;

  return Math.max(6.2, r);
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

  // 1. Streaming Chunked Anatomical Tunnel (covers full 6,260-unit journey smoothly at 60fps)
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

  // 1B. Pooled Multi-Lane Bifurcation Septum Pillars (2-lane & 3-lane corridors)
  const FORK_POOL_SIZE = 7;
  const forkGeo = new THREE.CylinderGeometry(2.15, 2.65, 42, 16);
  const forkRingGeo = new THREE.TorusGeometry(2.75, 0.28, 8, 22);
  forkRingGeo.rotateX(Math.PI / 2);
  const forkRingMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.42,
  });
  disposables.push(forkGeo, forkRingGeo, forkRingMat);

  const forkMeshes: THREE.Group[] = [];
  const activeForkSepta: ForkSeptumBody[] = [];
  for (let i = 0; i < FORK_POOL_SIZE; i++) {
    const fg = new THREE.Group();
    const pillar = new THREE.Mesh(forkGeo, mats.heartValve);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    const ring = new THREE.Mesh(forkRingGeo, forkRingMat);
    fg.add(pillar, ring);
    fg.visible = false;
    group.add(fg);
    forkMeshes.push(fg);
    activeForkSepta.push({ pos: new THREE.Vector3(0, 0, 9999), radius: 2.5 });
  }

  // 1C. Pooled Large 3D Side-Branch Ducts (Lorong Cabang Kiri & Kanan)
  const BRANCH_POOL_SIZE = 14;
  const branchTubeGeo = new THREE.CylinderGeometry(5.8, 7.0, 32, 18, 1, true);
  branchTubeGeo.rotateZ(Math.PI / 2);
  const branchMat = mats.mucosaWall.clone();
  branchMat.side = THREE.DoubleSide;
  const branchRimGeo = new THREE.TorusGeometry(6.6, 0.48, 10, 24);
  branchRimGeo.rotateY(Math.PI / 2);
  const branchGlowGeo = new THREE.CircleGeometry(5.6, 20);
  branchGlowGeo.rotateY(Math.PI / 2);
  const branchGlowMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  disposables.push(branchTubeGeo, branchMat, branchRimGeo, branchGlowGeo, branchGlowMat);

  const branchMeshes: THREE.Group[] = [];
  for (let i = 0; i < BRANCH_POOL_SIZE; i++) {
    const bg = new THREE.Group();
    const tube = new THREE.Mesh(branchTubeGeo, branchMat);
    const rim = new THREE.Mesh(branchRimGeo, mats.heartValve);
    rim.position.x = -15.2;
    const voidDisk = new THREE.Mesh(branchGlowGeo, branchGlowMat);
    voidDisk.position.x = 15.4;
    bg.add(tube, rim, voidDisk);
    bg.visible = false;
    group.add(bg);
    branchMeshes.push(bg);
  }

  // 2. ZONA 1: RONGGA MULUT (Teeth Arches & Uvula)
  const mouthGroup = new THREE.Group();
  group.add(mouthGroup);

  const toothCrownGeo = new THREE.CylinderGeometry(0.95, 1.15, 2.5, 12);
  toothCrownGeo.scale(1.0, 1.0, 0.85);
  disposables.push(toothCrownGeo);

  const centerTmp = new THREE.Vector3();
  for (let row = 0; row < 14; row++) {
    const z = 4 - row * 5.2;
    getTunnelCenterAtZ(z, centerTmp);
    const rad = getTunnelRadiusAtZ(z) - 0.8;

    for (const side of [-1, 1]) {
      const angUpper = Math.PI * 0.5 + side * (0.42 + row * 0.024);
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

  getTunnelCenterAtZ(-84, centerTmp);
  const uvulaGeo = new THREE.ConeGeometry(1.4, 4.4, 16);
  uvulaGeo.rotateX(Math.PI);
  disposables.push(uvulaGeo);
  const uvulaMat = mats.heartValve.clone();
  disposables.push(uvulaMat);
  const uvula = new THREE.Mesh(uvulaGeo, uvulaMat);
  uvula.position.set(centerTmp.x, centerTmp.y + 4.8, -84);
  mouthGroup.add(uvula);

  // 3. ZONA 2: ESOFAGUS & CABANG BRONKUS CARTILAGE RINGS
  const tracheaGroup = new THREE.Group();
  group.add(tracheaGroup);

  const ringGeo = new THREE.TorusGeometry(8.2, 0.42, 10, 28);
  const ringMat = new THREE.MeshPhysicalMaterial({
    color: 0xfecdd3,
    roughness: 0.3,
    clearcoat: 0.8,
    transparent: true,
    opacity: 0.62,
  });
  disposables.push(ringGeo, ringMat);
  for (let z = -150; z >= -450; z -= 14) {
    getTunnelCenterAtZ(z, centerTmp);
    const cRing = new THREE.Mesh(ringGeo, ringMat);
    const scale = getTunnelRadiusAtZ(z) / 8.8;
    cRing.scale.setScalar(scale);
    cRing.position.copy(centerTmp);
    tracheaGroup.add(cRing);
  }

  // Instanced Red Blood Cells (140 physics bodies streaming through vessels & deep organs)
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
    const z = THREE.MathUtils.lerp(-480, -920, Math.random());
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
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2,
        -4.0 - Math.random() * 2.5
      ),
      rot,
      angVel: new THREE.Vector3(
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6
      ),
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

  // 4. ZONA 4: SISTEM SARAF PUSAT (Branching Myelin Axons & Synaptic Pulses at z = -930 .. -1395)
  const cnsGroup = new THREE.Group();
  group.add(cnsGroup);
  const synapticPulses: SynapticPulse[] = [];
  const pulseGeo = new THREE.SphereGeometry(0.32, 10, 10);
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
  disposables.push(pulseGeo, pulseMat);

  for (let n = 0; n < 38; n++) {
    const zBase = -930 - n * 12;
    getTunnelCenterAtZ(zBase, centerTmp);
    const rad = getTunnelRadiusAtZ(zBase);
    const ang = (n * 1.37) % (Math.PI * 2);
    const p1 = new THREE.Vector3(
      centerTmp.x + Math.cos(ang) * (rad * 0.92),
      centerTmp.y + Math.sin(ang) * (rad * 0.92),
      zBase
    );
    const p2 = new THREE.Vector3(
      centerTmp.x + Math.cos(ang + 0.48) * (rad * 0.65),
      centerTmp.y + Math.sin(ang + 0.48) * (rad * 0.65),
      zBase - 9
    );
    const p3 = new THREE.Vector3(
      centerTmp.x + Math.cos(ang + 0.96) * (rad * 0.88),
      centerTmp.y + Math.sin(ang + 0.96) * (rad * 0.88),
      zBase - 18
    );

    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    const axonGeo = new THREE.TubeGeometry(curve, 14, 0.2, 8, false);
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

  // 5. ZONA 5: RUANG JANTUNG & ORGAN VITAL (z = -1420 .. -1780)
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

  getTunnelCenterAtZ(-1465, centerTmp);
  for (let v = 0; v < 4; v++) {
    const ang = (v / 4) * Math.PI * 2;
    const valve = new THREE.Mesh(valveGeo, mats.heartValve);
    valve.position.set(
      centerTmp.x + Math.cos(ang) * 11.5,
      centerTmp.y + Math.sin(ang) * 11.5,
      -1465
    );
    valve.rotation.z = ang + Math.PI;
    heartGroup.add(valve);
    heartValves.push(valve);
  }

  getTunnelCenterAtZ(-1725, centerTmp);
  const coreGeo = new THREE.SphereGeometry(4.4, 24, 24);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xfb7185,
    emissive: 0xe11d48,
    emissiveIntensity: 1.6,
    roughness: 0.18,
    clearcoat: 1.0,
  });
  disposables.push(coreGeo, coreMat);
  const vitalCoreMesh = new THREE.Mesh(coreGeo, coreMat);
  vitalCoreMesh.position.set(centerTmp.x, centerTmp.y + 5.2, -1725);
  heartGroup.add(vitalCoreMesh);

  // 6. ZONA 8-9: USUS HALUS & KOLON HAUSTRAL VILLI RINGS (InstancedMesh sliding with player)
  const villiRingCount = 26;
  const villiRingGeo = new THREE.TorusGeometry(8.8, 0.56, 10, 26);
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

  // 7. ZONA 10: ANAL SPHINCTER EXIT GATE & RADIANT LAB PORTAL (z = -6200)
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

  const portalGeo = new THREE.CircleGeometry(12.8, 32);
  disposables.push(portalGeo);
  const anusPortalMesh = new THREE.Mesh(portalGeo, mats.portalGlow);
  anusPortalMesh.position.set(centerTmp.x, centerTmp.y, ANUS_EXIT_Z - 14);
  exitGroup.add(anusPortalMesh);

  // 8. Travelling Atmospheric Tunnel PointLights
  const zoneLights: THREE.PointLight[] = [];
  for (let i = 0; i < 4; i++) {
    const pt = new THREE.PointLight(0xffb3c6, 28, 92, 1.2);
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

    // 1B. Assign ForkSeptum pillars to the closest multi-lane bifurcations near playerZ
    let forkSlot = 0;
    for (let i = 0; i < FORK_NODES.length && forkSlot < FORK_POOL_SIZE; i++) {
      const fn = FORK_NODES[i];
      if (fn.z < playerZ + 55 && fn.z > playerZ - 210) {
        getTunnelCenterAtZ(fn.z, cTmp);
        const fg = forkMeshes[forkSlot];
        fg.visible = true;
        fg.position.set(cTmp.x + fn.xOffset, cTmp.y, fn.z);
        fg.rotation.z = Math.sin(elapsed * 0.8 + i) * 0.04;
        activeForkSepta[forkSlot].pos.set(cTmp.x + fn.xOffset, cTmp.y, fn.z);
        forkSlot++;
      }
    }
    for (let s = forkSlot; s < FORK_POOL_SIZE; s++) {
      forkMeshes[s].visible = false;
      activeForkSepta[s].pos.set(0, 0, 9999);
    }

    // 1C. Assign Side-Branch tubular ducts to nearest BRANCH_LOCATIONS around playerZ
    let branchSlot = 0;
    for (let i = 0; i < BRANCH_LOCATIONS.length && branchSlot < BRANCH_POOL_SIZE; i++) {
      const b = BRANCH_LOCATIONS[i];
      if (b.z < playerZ + 55 && b.z > playerZ - 220) {
        getTunnelCenterAtZ(b.z, cTmp);
        const rad = getTunnelRadiusAtZ(b.z);
        const bg = branchMeshes[branchSlot];
        bg.visible = true;
        bg.position.set(
          cTmp.x + b.side * (rad + 9.2),
          cTmp.y + b.yOffset * 2.5,
          b.z
        );
        bg.rotation.set(0, b.side > 0 ? 0.52 : Math.PI - 0.52, b.side * 0.14);
        branchSlot++;
      }
    }
    for (let s = branchSlot; s < BRANCH_POOL_SIZE; s++) {
      branchMeshes[s].visible = false;
    }

    // Toggle far-away static organ landmark groups for speed
    mouthGroup.visible = playerZ > -230;
    tracheaGroup.visible = playerZ < -60 && playerZ > -520;
    cnsGroup.visible = playerZ < -820 && playerZ > -1540;
    heartGroup.visible = playerZ < -1260 && playerZ > -1920;
    exitGroup.visible = playerZ < -5920;
    villiInstanced.visible = playerZ < -3040 && playerZ > -6120;

    // 2. Wrap Red Blood Cells dynamically around player in Bloodstream & deep organs
    const rbcMinZ = playerZ - 140;
    const rbcMaxZ = playerZ + 40;
    const showRbc = playerZ < -420 && playerZ > -6140;
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
          cell.vel.set(
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.2,
            -4.5 - Math.random() * 2.5
          );
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

    // 5. Long Digestive Haustral Villi Rings sliding along Z (-3120..-6040)
    if (villiInstanced.visible) {
      const startRingIdx = Math.floor(Math.max(3120, -playerZ - 28) / 14);
      for (let i = 0; i < villiRingCount; i++) {
        const ringZ = -(startRingIdx + i) * 14;
        if (ringZ < -6035) {
          dummyObj.scale.setScalar(0.001);
        } else {
          getTunnelCenterAtZ(ringZ, cTmp);
          const rad = getTunnelRadiusAtZ(ringZ) / 9.0;
          dummyObj.position.copy(cTmp);
          dummyObj.rotation.set(
            Math.sin(ringZ * 0.05) * 0.08,
            Math.cos(ringZ * 0.04) * 0.08,
            elapsed * 0.25 + i
          );
          dummyObj.scale.setScalar(rad);
        }
        dummyObj.updateMatrix();
        villiInstanced.setMatrixAt(i, dummyObj.matrix);
      }
      villiInstanced.instanceMatrix.needsUpdate = true;
    }

    // 6. Animate Anal Sphincter Gate dilating open near -6200
    if (exitGroup.visible) {
      getTunnelCenterAtZ(ANUS_EXIT_Z, cTmp);
      const openFactor = THREE.MathUtils.smoothstep(-playerZ, 6060, 6170);
      const petalRadius = 4.0 + openFactor * 4.5;
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

    // 7. Reposition 4 traveling PointLights across 10 zones
    const negZ = -playerZ;
    if (negZ < 140) lightColor.setHex(0xffb3c6);
    else if (negZ < 480) lightColor.setHex(0xfda4af);
    else if (negZ < 920) lightColor.setHex(0xef4444);
    else if (negZ < 1420) lightColor.setHex(0x38bdf8);
    else if (negZ < 1780) lightColor.setHex(0xf43f5e);
    else if (negZ < 2420) lightColor.setHex(0xfbbf24);
    else if (negZ < 3120) lightColor.setHex(0x34d399);
    else if (negZ < 6040) lightColor.setHex(0xfb923c);
    else lightColor.setHex(0xfef08a);

    for (let i = 0; i < zoneLights.length; i++) {
      const lz = playerZ + 12 - i * 32;
      getTunnelCenterAtZ(lz, cTmp);
      zoneLights[i].position.copy(cTmp);
      zoneLights[i].color.copy(lightColor);
      zoneLights[i].intensity =
        i === 1 && negZ >= 1420 && negZ < 1780 ? 36 + (beatScale - 1) * 130 : 28;
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
    activeForkSepta,
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

  // Sky-Blue Laboratory Window with Mullions on Back Wall
  const windowFrameGeo = new THREE.BoxGeometry(5.6, 3.2, 0.14);
  const windowPaneGeo = new THREE.PlaneGeometry(5.2, 2.8);
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const trimGeo = new THREE.BoxGeometry(24, 1.35, 0.08);
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
  const mullionVGeo = new THREE.BoxGeometry(0.12, 2.8, 0.08);
  const mullionHGeo = new THREE.BoxGeometry(5.2, 0.12, 0.08);
  disposables.push(
    windowFrameGeo,
    windowPaneGeo,
    windowMat,
    trimGeo,
    trimMat,
    mullionVGeo,
    mullionHGeo
  );

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

  // 2. Bio-Shrink / Re-Expansion Pad (x = -2.2, z = 0.2)
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

  // 3. Stainless Steel Lab Desk + Vital Bio-Monitor
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

  const monBodyGeo = new THREE.BoxGeometry(2.1, 1.15, 0.14);
  const monStandGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.35, 12);
  const monScreenGeo = new THREE.PlaneGeometry(1.92, 0.96);
  const monStand = new THREE.Mesh(monStandGeo, mats.darkChassis);
  monStand.position.set(0, 1.25, 0);
  const monBody = new THREE.Mesh(monBodyGeo, mats.darkChassis);
  monBody.position.set(0, 1.92, 0);
  const monScreen = new THREE.Mesh(monScreenGeo, mats.labMonitorSickScreen);
  monScreen.position.set(0, 1.92, 0.08);
  deskGroup.add(monStand, monBody, monScreen);
  disposables.push(deskTopGeo, deskLegGeo, monBodyGeo, monStandGeo, monScreenGeo);

  // 4. Pediatric Recovery Bed (right at x = 2.4, z = -0.1)
  const bedPosition = new THREE.Vector3(2.4, 0, -0.1);
  const bedGroup = new THREE.Group();
  bedGroup.position.copy(bedPosition);
  bedGroup.rotation.y = -0.35;
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

  // 5. Full-Size Profesor Aris & Grandchild Raka
  const profRig = createProfessorHumanModel(mats);
  profRig.root.position.copy(padPosition);
  profRig.root.rotation.y = Math.PI * 0.44;
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

  // 6. Bio-Particles / Celebration Motes (InstancedMesh)
  const moteCount = 36;
  const moteGeo = new THREE.OctahedronGeometry(0.08, 0);
  const moteMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  disposables.push(moteGeo, moteMat);
  const celebrationMotes = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
  celebrationMotes.frustumCulled = false;
  group.add(celebrationMotes);

  const moteDummy = new THREE.Object3D();

  const update = (
    _dt: number,
    elapsed: number,
    phaseTime: number,
    mode: 'title' | 'intro' | 'ending' = 'ending'
  ) => {
    padRing.rotation.z = elapsed * 1.4;

    if (mode === 'title') {
      // Title Menu Showcase: Raka resting sick on bed, Pod waiting on Shrink Pad, Professor inspecting nearby
      monScreen.material = mats.labMonitorSickScreen;
      (padBeam.material as THREE.MeshBasicMaterial).color.setHex(0x0ea5e9);
      (padBeam.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(elapsed * 3.0) * 0.05;
      padBeam.visible = true;
      padBeam.scale.setScalar(1.0);

      // Raka reclined sick resting on bed
      rakaRig.root.position.set(0, 0.72 + Math.sin(elapsed * 2.2) * 0.015, -0.15);
      rakaRig.root.rotation.x = 1.24; // Lying down toward pillow (-Z head when reclined back -> +1.24 tilts torso back onto bed)
      rakaRig.root.rotation.x = -1.24; // Tilts head back onto pillow (-Z)
      rakaRig.rightArm.rotation.z = -0.12;
      rakaRig.head.rotation.y = Math.sin(elapsed * 0.9) * 0.08;
      rakaRig.head.rotation.z = Math.sin(elapsed * 5.0) * 0.03;

      // Profesor standing calmly beside Shrink Pad looking toward Pad / Pod
      profRig.root.visible = true;
      profRig.root.scale.setScalar(1);
      profRig.root.position.set(padPosition.x + 1.45, 0, padPosition.z + 0.45);
      profRig.root.rotation.y = -Math.PI * 0.36;
      profShadow.visible = true;
      profShadow.position.set(padPosition.x + 1.45, 0.02, padPosition.z + 0.45);
      profRig.leftLeg.rotation.x = 0;
      profRig.rightLeg.rotation.x = 0;
      profRig.leftArm.rotation.x = -0.18;
      profRig.rightArm.rotation.z = 0.14;
      profRig.rightArm.rotation.x = -0.35 + Math.sin(elapsed * 1.8) * 0.08;
      profRig.head.rotation.y = Math.sin(elapsed * 1.1) * 0.15;
    } else if (mode === 'intro') {
      // Opening Story Cutscene: Sick Raka -> Prof checks him -> walks to Pod -> Shrink Ray activates!
      monScreen.material = mats.labMonitorSickScreen;
      const shrinkBeamPower =
        phaseTime >= 4.9 ? Math.max(0.18, 0.42 + Math.sin(elapsed * 16) * 0.12) : 0.14;
      (padBeam.material as THREE.MeshBasicMaterial).color.setHex(
        phaseTime >= 4.9 ? 0x22d3ee : 0x0ea5e9
      );
      (padBeam.material as THREE.MeshBasicMaterial).opacity = shrinkBeamPower;
      padBeam.visible = true;
      padBeam.scale.set(
        1 + Math.sin(elapsed * 10) * 0.05,
        1,
        1 + Math.sin(elapsed * 10) * 0.05
      );

      // Raka resting / shivering on pediatric bed
      rakaRig.root.position.set(0, 0.72 + Math.sin(elapsed * 2.5) * 0.015, -0.15);
      rakaRig.root.rotation.x = -1.24;
      rakaRig.rightArm.rotation.z = -0.1;
      rakaRig.head.rotation.y = Math.sin(elapsed * 1.5) * 0.1;
      rakaRig.head.rotation.z = Math.sin(elapsed * 8.0) * 0.04;

      if (phaseTime < 2.8) {
        // Stage 0: Professor stands beside Raka's bed, checking vitals gently
        profRig.root.visible = true;
        profShadow.visible = true;
        profRig.root.scale.setScalar(1);
        profRig.root.position.set(0.95, 0, 0.25);
        profRig.root.rotation.y = Math.PI * 0.42;
        profShadow.position.set(0.95, 0.02, 0.25);
        profRig.leftLeg.rotation.x = 0;
        profRig.rightLeg.rotation.x = 0;
        profRig.leftArm.rotation.x = -0.35;
        profRig.rightArm.rotation.z = 0.25;
        profRig.rightArm.rotation.x = -0.65 + Math.sin(elapsed * 3.5) * 0.12;
        profRig.head.rotation.x = 0.18;
        profRig.head.rotation.y = Math.sin(elapsed * 1.8) * 0.12;
      } else if (phaseTime < 5.0) {
        // Stage 1A: Professor walks briskly from bed back to Shrink Pad to board Nano-Pod
        profRig.root.visible = true;
        profShadow.visible = true;
        profRig.root.scale.setScalar(1);
        const walkT = THREE.MathUtils.clamp((phaseTime - 2.8) / 2.1, 0, 1);
        const smooth = walkT * walkT * (3 - 2 * walkT);
        const px = THREE.MathUtils.lerp(0.95, padPosition.x + 0.55, smooth);
        const pz = THREE.MathUtils.lerp(0.25, padPosition.z + 0.2, smooth);
        const stride = Math.sin(elapsed * 9.5);
        profRig.root.position.set(px, Math.abs(stride) * 0.045, pz);
        profRig.root.rotation.y = -Math.PI * 0.48;
        profShadow.position.set(px, 0.02, pz);
        profRig.leftLeg.rotation.x = stride * 0.48;
        profRig.rightLeg.rotation.x = -stride * 0.48;
        profRig.leftArm.rotation.x = -stride * 0.42;
        profRig.rightArm.rotation.x = stride * 0.42;
        profRig.rightArm.rotation.z = 0.14;
        profRig.head.rotation.x = 0.05;
      } else {
        // Stage 1B & 2: Profesor climbed inside Nano-Pod!
        profRig.root.visible = false;
        profShadow.visible = false;
      }
    } else {
      // Ending Cutscene: Healthy Monitor, Sitting/Waving Raka, Re-expanded Profesor!
      monScreen.material = mats.labMonitorScreen;
      const beamPhase = Math.max(0, 1 - Math.max(0, phaseTime - 2.6) * 0.9);
      padBeam.visible = beamPhase > 0.02;
      (padBeam.material as THREE.MeshBasicMaterial).color.setHex(0x0ea5e9);
      (padBeam.material as THREE.MeshBasicMaterial).opacity = beamPhase * 0.25;
      padBeam.scale.set(
        1 + Math.sin(elapsed * 8) * 0.05,
        1,
        1 + Math.sin(elapsed * 8) * 0.05
      );

      // Raka sits upright happily waving & bouncing
      rakaRig.root.rotation.x = 0;
      rakaRig.rightArm.rotation.z = -0.5 + Math.sin(elapsed * 5.8) * 0.42;
      rakaRig.head.rotation.y = -0.35 + Math.sin(elapsed * 2.1) * 0.12;
      rakaRig.head.rotation.z = Math.sin(elapsed * 2.6) * 0.07;
      rakaRig.root.position.set(0, 0.68 + Math.abs(Math.sin(elapsed * 3.2)) * 0.04, -0.35);

      if (profRig.root.visible) {
        profShadow.visible = true;
        const walkT = THREE.MathUtils.clamp((phaseTime - 3.6) / 2.4, 0, 1);
        const smoothWalk = walkT * walkT * (3 - 2 * walkT);
        const px = THREE.MathUtils.lerp(padPosition.x, 0.05, smoothWalk);
        const pz = THREE.MathUtils.lerp(padPosition.z, 0.35, smoothWalk);
        const isWalking = walkT > 0.02 && walkT < 0.98;
        const stride = isWalking ? Math.sin(elapsed * 8.5) : 0;

        profRig.root.position.set(px, isWalking ? Math.abs(stride) * 0.045 : 0, pz);
        profRig.root.rotation.y = Math.PI * 0.44;
        profShadow.position.set(px, 0.02, pz);

        profRig.leftLeg.rotation.x = stride * 0.45;
        profRig.rightLeg.rotation.x = -stride * 0.45;
        profRig.leftArm.rotation.x = -stride * 0.38;

        if (walkT >= 0.98) {
          profRig.rightArm.rotation.z = 2.45 + Math.sin(elapsed * 5.0) * 0.22;
          profRig.rightArm.rotation.x = -0.25;
        } else {
          profRig.rightArm.rotation.z = 0.14;
          profRig.rightArm.rotation.x = stride * 0.38;
        }
        profRig.head.rotation.x = Math.sin(elapsed * 2.4) * 0.08;
        profRig.head.rotation.y = Math.sin(elapsed * 1.4) * 0.06;
      }
    }

    // Floating bio/healing motes
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
    profShadow,
    monScreen,
    padBeam,
    padRing,
    celebrationMotes,
    padPosition,
    bedPosition,
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
