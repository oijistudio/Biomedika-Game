import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BioAudioEngine } from './audio';
import { createMaterialLibrary, MaterialLibrary } from './materials';
import {
  createProfessorPod,
  createAssistantRobot,
  createVirusModel,
  createBioPickup,
  ProfessorPodRig,
  AssistantRobotRig,
  VirusKind,
} from './models';
import {
  createAnatomicalWorld,
  createLabEndingWorld,
  getTunnelCenterAtZ,
  getTunnelRadiusAtZ,
  LabEndingController,
  WorldController,
} from './world';
import { createRayTracingPipeline, RayTracingPipeline } from './raytracing';
import { stepPodPhysics, getZoneIndexAtZ, PodPhysicsState } from './physics';
import { saveRunProgress } from './storage';
import {
  ANUS_EXIT_Z,
  GamePhase,
  HudSnapshot,
  MinimapEnemyBlip,
  WeaponId,
  WEAPONS,
  ZONES,
  ZoneIndex,
} from './types';

interface EnemyEntity {
  id: number;
  kind: VirusKind;
  zone: ZoneIndex;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  homePos: THREE.Vector3;
  hp: number;
  maxHp: number;
  radius: number;
  hitFlash: number;
  frozenTimer: number;
  attackTimer: number;
  windupTimer: number;
  isBossShieldNode?: boolean;
  shieldOrbitAngle?: number;
  shieldDestroyed?: boolean;
}

interface ProjectileEntity {
  active: boolean;
  fromPlayer: boolean;
  kind: 'laser' | 'cryo' | 'nova' | 'bioAssist' | 'enemyOrb';
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  radius: number;
  damage: number;
  life: number;
}

interface ParticleEntity {
  active: boolean;
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
}

interface PickupEntity {
  active: boolean;
  kind: 'heal' | 'energy';
  mesh: THREE.Group;
  pos: THREE.Vector3;
  life: number;
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3();
const _thrust = new THREE.Vector3();
const _aimTarget = new THREE.Vector3();
const _camGoal = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _lightUv = new THREE.Vector2(0.5, 0.5);
const _bgColor = new THREE.Color();
const _fogColor = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();

export class NanoMedikaEngine {
  private container: HTMLElement;
  private onHudUpdate: (snapshot: HudSnapshot) => void;

  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private materials: MaterialLibrary;
  private world: WorldController;
  private labWorld: LabEndingController;
  private rtPipeline: RayTracingPipeline;
  public audio: BioAudioEngine;

  private podRig: ProfessorPodRig;
  private robotRig: AssistantRobotRig;
  private podState: PodPhysicsState;
  private robotPos = new THREE.Vector3(2.2, 1.2, 2);
  private robotVel = new THREE.Vector3();

  private hemiLight: THREE.HemisphereLight;
  private keyLight: THREE.DirectionalLight;
  private fog: THREE.FogExp2;

  private phase: GamePhase = 'title';
  private rayTracingEnabled = true;
  private activeWeapon: WeaponId = 1;

  private hull = 100;
  private maxHull = 100;
  private energy = 100;
  private maxEnergy = 100;
  private patientVitality = 58; // Rises to 100 as viruses are purged
  private score = 0;
  private kills = 0;
  private savedKillsCheckpoint = 0;
  private combo = 0;
  private comboTimer = 0;
  private elapsedSeconds = 0;

  private fireCooldown = 0;
  private boostCooldown = 0;
  private boostActiveTimer = 0;
  private bioAssistCooldown = 0;
  private invulnTimer = 0;
  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private cannonRecoil = 0;
  private heartBeatPhase = 0;
  private lastHeartBeatPulse = false;

  private currentZone: ZoneIndex = 0;
  private bioMessage = ZONES[0].bioTip;
  private bioMessageTimer = 8;

  private bossDefeated = false;
  private nextEndlessWaveZ = -810;
  private endingTime = 0;
  private endingStage = 0;
  private endingSubtitle = '';
  private endingReadyForSummary = false;
  private endingTransformFlashed = false;

  private enemies: EnemyEntity[] = [];
  private bossShieldNodes: EnemyEntity[] = [];
  private bossEntity: EnemyEntity | null = null;
  private gateMeshes: { zone: ZoneIndex; z: number; mesh: THREE.Mesh; open: boolean }[] = [];

  private projectiles: ProjectileEntity[] = [];
  private particles: ParticleEntity[] = [];
  private pickups: PickupEntity[] = [];

  // Input state: separated held vs justPressed
  private heldKeys = new Set<string>();
  private justPressedKeys = new Set<string>();
  private mouseNdc = new THREE.Vector2(0, 0);
  private mouseDown = false;
  private rightMouseDown = false;

  // Shared projectile/particle geometries & materials
  private sharedDisposables: { dispose: () => void }[] = [];
  private laserGeo: THREE.SphereGeometry;
  private laserMat: THREE.MeshBasicMaterial;
  private cryoMat: THREE.MeshBasicMaterial;
  private novaMat: THREE.MeshBasicMaterial;
  private enemyOrbMat: THREE.MeshBasicMaterial;
  private particleGeo: THREE.OctahedronGeometry;

  private clock = new THREE.Clock();
  private animTime = 0;
  private hudSyncTimer = 0;
  private frameId = 0;
  private disposed = false;
  private nextEnemyId = 1;

  constructor(container: HTMLElement, onHudUpdate: (snapshot: HudSnapshot) => void) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;
    this.audio = new BioAudioEngine();

    // 1. Software WebGL Guard (detect from GPU renderer string only)
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. WebGLRenderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Scene, Camera, Fog & RoomEnvironment IBL
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(ZONES[0].fogColor);
    this.fog = new THREE.FogExp2(ZONES[0].fogColor, 0.0155);
    this.scene.fog = this.fog;

    const aspect = (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(64, aspect, 0.2, 220);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig (<= 3 shadow casters: 1 Key DirectionalLight)
    this.hemiLight = new THREE.HemisphereLight(ZONES[0].ambientSky, ZONES[0].ambientGround, 0.9);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff1e6, 1.55);
    this.keyLight.position.set(8, 14, 12);
    if (!this.isSoftwareGl) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.set(1024, 1024);
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 65;
      const d = 18;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    // 5. Materials, World, Lab Ending Scene, Hero Pod, Assistant Robot, Ray Tracing Pipeline
    this.materials = createMaterialLibrary(this.renderer, this.isSoftwareGl);
    this.world = createAnatomicalWorld(this.materials);
    this.scene.add(this.world.group);

    this.labWorld = createLabEndingWorld(this.materials);
    this.scene.add(this.labWorld.group);

    this.podRig = createProfessorPod(this.materials);
    this.scene.add(this.podRig.root);

    this.robotRig = createAssistantRobot(this.materials);
    this.scene.add(this.robotRig.root);

    this.podState = {
      pos: new THREE.Vector3(0, 0, 2),
      vel: new THREE.Vector3(),
      radius: 1.05,
      pitch: 0,
      yaw: 0,
      roll: 0,
    };

    this.rtPipeline = createRayTracingPipeline(
      this.renderer,
      this.scene,
      this.camera,
      this.isSoftwareGl
    );

    // 6. Initialize Object Pools (Projectiles & Particles)
    this.laserGeo = new THREE.SphereGeometry(0.24, 10, 10);
    this.laserGeo.scale(1, 1, 2.8);
    this.laserMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    this.cryoMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
    this.novaMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.78 });
    this.enemyOrbMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    this.particleGeo = new THREE.OctahedronGeometry(0.22, 0);
    this.sharedDisposables.push(
      this.laserGeo,
      this.laserMat,
      this.cryoMat,
      this.novaMat,
      this.enemyOrbMat,
      this.particleGeo
    );

    for (let i = 0; i < 90; i++) {
      const m = new THREE.Mesh(this.laserGeo, this.laserMat);
      m.visible = false;
      this.scene.add(m);
      this.projectiles.push({
        active: false,
        fromPlayer: true,
        kind: 'laser',
        mesh: m,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        radius: 0.35,
        damage: 25,
        life: 0,
      });
    }

    for (let i = 0; i < 120; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
      this.sharedDisposables.push(mat);
      const m = new THREE.Mesh(this.particleGeo, mat);
      m.visible = false;
      this.scene.add(m);
      this.particles.push({
        active: false,
        mesh: m,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.5,
        scale: 1,
      });
    }

    // Build initial world encounter & gates for Title showcase
    this.setupRunEntities();
    this.bindEvents();

    // Pre-warm shaders on GPU
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.emitHudSnapshot();
    this.startLoop();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  private unbindEvents(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousemove', this.handleMouseMove);
    canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.rtPipeline.setSize(w, h);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.heldKeys.has(e.code)) {
      this.justPressedKeys.add(e.code);
    }
    this.heldKeys.add(e.code);

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.phase === 'playing') {
        this.setPhase('paused');
      } else if (this.phase === 'paused') {
        this.setPhase('playing');
      }
    } else if (e.code === 'Digit1') {
      this.selectWeapon(1);
    } else if (e.code === 'Digit2') {
      this.selectWeapon(2);
    } else if (e.code === 'Digit3') {
      this.selectWeapon(3);
    } else if (e.code === 'KeyR') {
      this.toggleRayTracing();
    } else if ((e.code === 'Enter' || e.code === 'Space') && this.phase === 'title') {
      e.preventDefault();
      this.startMission();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  private handleWindowBlur = (): void => {
    this.heldKeys.clear();
    this.justPressedKeys.clear();
    this.mouseDown = false;
    this.rightMouseDown = false;
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private handleMouseDown = (e: MouseEvent): void => {
    this.audio.init();
    if (e.button === 0) this.mouseDown = true;
    if (e.button === 2) this.rightMouseDown = true;
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.mouseDown = false;
    if (e.button === 2) this.rightMouseDown = false;
  };

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  public startMission(startZone: ZoneIndex = 0): void {
    this.audio.init();
    this.audio.playBioChirp();
    this.resetRunState(startZone);
    this.phase = 'playing';
    this.emitHudSnapshot();
  }

  public setPhase(phase: GamePhase): void {
    this.phase = phase;
    if (phase === 'paused') {
      this.heldKeys.clear();
      this.mouseDown = false;
    }
    this.emitHudSnapshot();
  }

  public selectWeapon(id: WeaponId): void {
    this.activeWeapon = id;
    this.audio.playBioChirp();
    this.emitHudSnapshot();
  }

  public toggleRayTracing(): void {
    this.rayTracingEnabled = !this.rayTracingEnabled;
    this.bioMessage = this.rayTracingEnabled
      ? 'B.I.O.-7: "Ray Tracing AKTIF — Refleksi optik & god-rays penuh."'
      : 'B.I.O.-7: "Mode Performa Standar aktif."';
    this.bioMessageTimer = 4.5;
    this.emitHudSnapshot();
  }

  public toggleMute(): void {
    this.audio.init();
    this.audio.setMuted(!this.audio.isMuted());
    this.emitHudSnapshot();
  }

  private clearRunEntities(): void {
    for (const e of this.enemies) {
      this.scene.remove(e.mesh);
    }
    this.enemies = [];
    this.bossShieldNodes = [];
    this.bossEntity = null;

    for (const g of this.gateMeshes) {
      this.scene.remove(g.mesh);
      g.mesh.geometry.dispose();
      (g.mesh.material as THREE.Material).dispose();
    }
    this.gateMeshes = [];

    for (const p of this.projectiles) {
      p.active = false;
      p.mesh.visible = false;
    }
    for (const pk of this.pickups) {
      this.scene.remove(pk.mesh);
    }
    this.pickups = [];
  }

  private setupRunEntities(): void {
    this.clearRunEntities();

    const c = new THREE.Vector3();

    // Spawn Zona 1: Rongga Mulut (6 Rhinovirus-Alpha)
    const z1Positions = [-24, -42, -60, -78, -96, -114];
    z1Positions.forEach((z, idx) => {
      getTunnelCenterAtZ(z, c);
      const ang = idx * 1.4;
      const offset = new THREE.Vector3(Math.cos(ang) * 3.8, Math.sin(ang) * 2.5, 0);
      this.spawnEnemy('rhino', 0, c.clone().add(offset));
    });

    // Spawn Zona 2: Aliran Darah (7 Bakteri Spore-Drifter)
    const z2Positions = [-150, -174, -198, -222, -246, -270, -298];
    z2Positions.forEach((z, idx) => {
      getTunnelCenterAtZ(z, c);
      const ang = idx * 1.8;
      const offset = new THREE.Vector3(Math.cos(ang) * 4.2, Math.sin(ang) * 2.8, 0);
      this.spawnEnemy('spore', 1, c.clone().add(offset));
    });

    // Spawn Zona 3: Sistem Saraf Pusat (7 Neuro-Parasit Vektor)
    const z3Positions = [-355, -382, -408, -434, -460, -488, -512];
    z3Positions.forEach((z, idx) => {
      getTunnelCenterAtZ(z, c);
      const ang = idx * 1.65;
      const offset = new THREE.Vector3(Math.cos(ang) * 4.6, Math.sin(ang) * 3.2, 0);
      this.spawnEnemy('neuro', 2, c.clone().add(offset));
    });

    // Spawn Zona 4: Boss "Chrono-Virus Omega" & 3 Shield Nodes in Cardiac Chamber
    getTunnelCenterAtZ(-665, c);
    const boss = this.spawnEnemy('boss', 3, c.clone());
    this.bossEntity = boss;

    for (let i = 0; i < 3; i++) {
      const nodeMesh = new THREE.Group();
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 1), this.materials.shieldNode);
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(1.45, 0.1, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      nodeMesh.add(orb, halo);
      this.scene.add(nodeMesh);

      const angle = (i / 3) * Math.PI * 2;
      const nodePos = c.clone().add(new THREE.Vector3(Math.cos(angle) * 7.2, Math.sin(angle) * 5.2, 3));
      nodeMesh.position.copy(nodePos);

      const nodeEntity: EnemyEntity = {
        id: this.nextEnemyId++,
        kind: 'neuro',
        zone: 3,
        mesh: nodeMesh,
        pos: nodePos.clone(),
        vel: new THREE.Vector3(),
        homePos: c.clone(),
        hp: 110,
        maxHp: 110,
        radius: 1.5,
        hitFlash: 0,
        frozenTimer: 0,
        attackTimer: 2.5 + i,
        windupTimer: 0,
        isBossShieldNode: true,
        shieldOrbitAngle: angle,
        shieldDestroyed: false,
      };
      this.enemies.push(nodeEntity);
      this.bossShieldNodes.push(nodeEntity);
    }

    // Zone Membrane Gates (Zones 0..2 block until pathogens cleared; Zone 3 Heart gate opens after Boss defeat!)
    const gateZList: { zone: ZoneIndex; z: number; color: number }[] = [
      { zone: 0, z: -126, color: 0x84cc16 },
      { zone: 1, z: -324, color: 0xf97316 },
      { zone: 2, z: -534, color: 0xa855f7 },
      { zone: 3, z: -754, color: 0xf43f5e },
    ];

    gateZList.forEach(({ zone, z, color }) => {
      getTunnelCenterAtZ(z, c);
      const rad = getTunnelRadiusAtZ(z) + 0.5;
      const gateGeo = new THREE.CircleGeometry(rad, 28);
      const gateMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
      });
      const gateMesh = new THREE.Mesh(gateGeo, gateMat);
      gateMesh.position.copy(c);
      this.scene.add(gateMesh);
      this.gateMeshes.push({ zone, z, mesh: gateMesh, open: false });
    });
  }

  private spawnEnemy(kind: VirusKind, zone: ZoneIndex, pos: THREE.Vector3): EnemyEntity {
    const mesh = createVirusModel(kind, this.materials);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    const stats: Record<VirusKind, { hp: number; r: number }> = {
      rhino: { hp: 70, r: 1.35 },
      spore: { hp: 115, r: 1.45 },
      neuro: { hp: 145, r: 1.65 },
      boss: { hp: 720, r: 3.8 },
    };

    const entity: EnemyEntity = {
      id: this.nextEnemyId++,
      kind,
      zone,
      mesh,
      pos: pos.clone(),
      vel: new THREE.Vector3(),
      homePos: pos.clone(),
      hp: stats[kind].hp,
      maxHp: stats[kind].hp,
      radius: stats[kind].r,
      hitFlash: 0,
      frozenTimer: 0,
      attackTimer: 1.5 + Math.random() * 2.0,
      windupTimer: 0,
    };
    this.enemies.push(entity);
    return entity;
  }

  private resetRunState(startZone: ZoneIndex = 0): void {
    const startZMap: Record<ZoneIndex, number> = {
      0: 2,
      1: -136,
      2: -336,
      3: -546,
      4: -768,
      5: -2485,
    };
    const startZ = startZMap[startZone];
    getTunnelCenterAtZ(startZ, _v1);

    // Restore Anatomical Tunnel View & Reset Lab Ending World
    this.world.group.visible = true;
    this.labWorld.group.visible = false;
    this.labWorld.profRig.root.visible = false;
    this.podRig.root.visible = true;
    this.podRig.root.scale.setScalar(1);
    this.robotRig.root.visible = true;
    this.robotRig.root.scale.setScalar(1);

    const zSpec = ZONES[startZone];
    this.fog.density = 0.0155;
    this.fog.color.setHex(zSpec.fogColor);
    (this.scene.background as THREE.Color).setHex(zSpec.fogColor);
    this.hemiLight.color.setHex(zSpec.ambientSky);
    this.hemiLight.groundColor.setHex(zSpec.ambientGround);
    this.hemiLight.intensity = 0.9;
    this.keyLight.intensity = 1.55;

    this.podState.pos.set(_v1.x, _v1.y, startZ);
    this.podState.vel.set(0, 0, 0);
    this.podState.pitch = 0;
    this.podState.yaw = 0;
    this.podState.roll = 0;

    this.robotPos.set(_v1.x + 2.4, _v1.y + 1.2, startZ);
    this.robotVel.set(0, 0, 0);

    this.hull = 100;
    this.energy = 100;
    this.patientVitality =
      startZone === 0
        ? 58
        : startZone === 1
        ? 68
        : startZone === 2
        ? 78
        : startZone === 3
        ? 86
        : 96;
    this.score = 0;
    this.kills = 0;
    this.savedKillsCheckpoint = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.elapsedSeconds = 0;
    this.activeWeapon = 1;
    this.currentZone = startZone;
    this.fireCooldown = 0;
    this.boostCooldown = 0;
    this.boostActiveTimer = 0;
    this.bioAssistCooldown = 0;
    this.invulnTimer = 0;
    this.hitstopTimer = 0;
    this.shakeIntensity = 0;
    this.bossDefeated = startZone >= 4;
    this.nextEndlessWaveZ = startZone >= 4 ? Math.min(-810, startZ - 65) : -810;
    this.endingTime = 0;
    this.endingStage = 0;
    this.endingSubtitle = '';
    this.endingReadyForSummary = false;
    this.endingTransformFlashed = false;
    this.bioMessage = ZONES[startZone].bioTip;
    this.bioMessageTimer = 8;

    this.setupRunEntities();

    // If starting from a saved zone checkpoint, open prior gates and clear prior enemies
    if (startZone > 0) {
      for (const e of this.enemies) {
        if (e.zone < startZone) {
          e.hp = 0;
          this.scene.remove(e.mesh);
        }
      }
      for (const gate of this.gateMeshes) {
        if (gate.zone < startZone) {
          gate.open = true;
          this.scene.remove(gate.mesh);
        }
      }
    }
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamp frame delta time

      this.update(dt);
      this.render();

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private update(dt: number): void {
    this.animTime += dt;

    // Heartbeat cadence (~72 bpm -> ~1.2 Hz)
    this.heartBeatPhase += dt * 3.8;
    const hbWave = Math.pow(Math.max(0, Math.sin(this.heartBeatPhase)), 6);

    // Always animate organic world (for title showcase + active play)
    if (this.phase === 'ending' || this.phase === 'victory') {
      this.updateEndingCutscene(dt);
      this.justPressedKeys.clear();
      return;
    }

    this.world.update(dt, this.animTime, this.heartBeatPhase, this.podState.pos.z);

    if (this.phase === 'title') {
      this.updateTitleShowcase(dt);
      this.justPressedKeys.clear();
      return;
    }

    if (this.phase !== 'playing') {
      this.justPressedKeys.clear();
      return;
    }

    // Simulation hitstop on heavy impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.2);
      this.justPressedKeys.clear();
      return;
    }

    this.elapsedSeconds += dt;
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.boostCooldown = Math.max(0, this.boostCooldown - dt);
    this.boostActiveTimer = Math.max(0, this.boostActiveTimer - dt);
    this.bioAssistCooldown = Math.max(0, this.bioAssistCooldown - dt);
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.cannonRecoil = THREE.MathUtils.damp(this.cannonRecoil, 0, 14, dt);
    this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.4);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.bioMessageTimer > 0) {
      this.bioMessageTimer -= dt;
    }

    // Regenerate energy smoothly
    this.energy = Math.min(this.maxEnergy, this.energy + 11.5 * dt);

    // Heartbeat sound in Zone 4
    if (this.currentZone === 3) {
      if (hbWave > 0.82 && !this.lastHeartBeatPulse) {
        this.lastHeartBeatPulse = true;
        this.audio.playHeartbeat();
      } else if (hbWave < 0.3) {
        this.lastHeartBeatPulse = false;
      }
    }

    // 1. Gather Movement Inputs
    _thrust.set(0, 0, 0);
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) _thrust.z -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) _thrust.z += 1;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) _thrust.x -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) _thrust.x += 1;
    if (this.heldKeys.has('KeyQ')) _thrust.y += 1;
    if (this.heldKeys.has('KeyE')) _thrust.y -= 1;

    // Gentle mouse steering assist so vertical & lateral flight feels natural
    _thrust.x += this.mouseNdc.x * 0.25;
    _thrust.y += this.mouseNdc.y * 0.35;

    if (_thrust.lengthSq() > 1) _thrust.normalize();

    // Dash / Boost on Space
    if (this.justPressedKeys.has('Space') && this.boostCooldown <= 0) {
      this.boostCooldown = 2.4;
      this.boostActiveTimer = 0.28;
      this.invulnTimer = Math.max(this.invulnTimer, 0.35);
      _v1.copy(_thrust);
      if (_v1.lengthSq() < 0.05) _v1.set(0, 0, -1);
      _v1.normalize().multiplyScalar(28);
      this.podState.vel.add(_v1);
      this.audio.playCryoBurst();
      this.spawnParticleBurst(this.podState.pos, 0x38bdf8, 12, 7);
    }

    this.audio.setThrustIntensity(Math.min(1, _thrust.length() + (this.boostActiveTimer > 0 ? 0.8 : 0)));

    // 2. Step Rigid-Body + Fluid Physics
    const physRes = stepPodPhysics(
      this.podState,
      _thrust,
      dt,
      hbWave,
      this.world.bloodCells
    );

    if (physRes.wallImpactSpeed > 6.5) {
      this.audio.playBounce();
      this.shakeIntensity = Math.min(0.45, physRes.wallImpactSpeed * 0.025);
    }
    if (physRes.cellBumps > 0 && Math.random() < 0.35) {
      this.audio.playBounce();
    }

    // Enforce closed zone gates (cannot pass beyond closed gate)
    for (const gate of this.gateMeshes) {
      if (!gate.open && this.podState.pos.z < gate.z + 1.6) {
        this.podState.pos.z = gate.z + 1.6;
        if (this.podState.vel.z < 0) this.podState.vel.z *= -0.35;
      }
    }

    // 3. Smooth Damped Pod Banking & Visual Rig Update
    const targetRoll = THREE.MathUtils.clamp(-this.podState.vel.x * 0.042 - this.mouseNdc.x * 0.22, -0.55, 0.55);
    const targetPitch = THREE.MathUtils.clamp(this.podState.vel.y * 0.032 + this.mouseNdc.y * 0.28, -0.45, 0.45);
    const targetYaw = THREE.MathUtils.clamp(-this.mouseNdc.x * 0.28, -0.45, 0.45);

    this.podState.roll = THREE.MathUtils.damp(this.podState.roll, targetRoll, 9, dt);
    this.podState.pitch = THREE.MathUtils.damp(this.podState.pitch, targetPitch, 9, dt);
    this.podState.yaw = THREE.MathUtils.damp(this.podState.yaw, targetYaw, 9, dt);

    this.podRig.root.position.copy(this.podState.pos);
    this.podRig.root.rotation.set(this.podState.pitch, this.podState.yaw, this.podState.roll, 'YXZ');

    // Recoil cannons & pulse thrusters
    this.podRig.cannonLeft.position.z = -1.05 + this.cannonRecoil * 0.28;
    this.podRig.cannonRight.position.z = -1.05 + this.cannonRecoil * 0.28;
    const thrustScale = 0.75 + Math.min(1.4, this.podState.vel.length() * 0.05) + (this.boostActiveTimer > 0 ? 0.9 : 0);
    this.podRig.thrusterGlowLeft.scale.set(1, 1, thrustScale);
    this.podRig.thrusterGlowRight.scale.set(1, 1, thrustScale);
    this.podRig.professorHead.rotation.y = THREE.MathUtils.damp(
      this.podRig.professorHead.rotation.y,
      -this.mouseNdc.x * 0.35,
      8,
      dt
    );

    // 4. Update Assistant Robot B.I.O.-7 Spring Orbit
    _v1.set(
      this.podState.pos.x + 2.1 + Math.cos(this.animTime * 1.8) * 0.45,
      this.podState.pos.y + 1.15 + Math.sin(this.animTime * 2.4) * 0.35,
      this.podState.pos.z - 0.8
    );
    // Keep robot inside tunnel wall
    getTunnelCenterAtZ(_v1.z, _v2);
    const robMaxR = getTunnelRadiusAtZ(_v1.z) - 1.2;
    const rdx = _v1.x - _v2.x;
    const rdy = _v1.y - _v2.y;
    const rDist = Math.hypot(rdx, rdy);
    if (rDist > robMaxR && rDist > 0.001) {
      _v1.x = _v2.x + (rdx / rDist) * robMaxR;
      _v1.y = _v2.y + (rdy / rDist) * robMaxR;
    }

    this.robotPos.x = THREE.MathUtils.damp(this.robotPos.x, _v1.x, 6.5, dt);
    this.robotPos.y = THREE.MathUtils.damp(this.robotPos.y, _v1.y, 6.5, dt);
    this.robotPos.z = THREE.MathUtils.damp(this.robotPos.z, _v1.z, 6.5, dt);
    this.robotRig.root.position.copy(this.robotPos);
    this.robotRig.scannerRing.rotation.z += dt * 2.8;
    this.robotRig.wingLeft.rotation.z = 0.22 + Math.sin(this.animTime * 6) * 0.12;
    this.robotRig.wingRight.rotation.z = -0.22 - Math.sin(this.animTime * 6) * 0.12;

    // 5. Weapons & B.I.O.-7 Assist Firing
    if ((this.mouseDown || this.heldKeys.has('KeyJ')) && this.fireCooldown <= 0) {
      this.firePlayerWeapon();
    }
    if ((this.rightMouseDown || this.justPressedKeys.has('KeyF')) && this.bioAssistCooldown <= 0) {
      this.triggerBioAssist();
    }

    // 6. Update Zone Atmosphere & Check Gates
    const newZone = getZoneIndexAtZ(this.podState.pos.z);
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      this.bioMessage = ZONES[newZone].bioTip;
      this.bioMessageTimer = 8;
      this.audio.playBioChirp();
      this.persistProgress(false);
    }

    const zSpec = ZONES[this.currentZone];
    _fogColor.setHex(zSpec.fogColor);
    this.fog.color.lerp(_fogColor, 1 - Math.exp(-3.2 * dt));
    _bgColor.copy(this.fog.color);
    (this.scene.background as THREE.Color).copy(_bgColor);
    _bgColor.setHex(zSpec.ambientSky);
    this.hemiLight.color.lerp(_bgColor, 1 - Math.exp(-3.2 * dt));
    _bgColor.setHex(zSpec.ambientGround);
    this.hemiLight.groundColor.lerp(_bgColor, 1 - Math.exp(-3.2 * dt));

    // 7. Update Enemies, Endless Stream Spawner, Projectiles, Particles, Pickups
    this.updateEndlessSpawner();
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updatePickups(dt);
    this.checkZoneGates();

    // Check Anal Exit Gate trigger -> Live 3D Laboratory Ending Scene!
    if (this.podState.pos.z <= ANUS_EXIT_Z) {
      this.enterEndingCutscene();
      this.justPressedKeys.clear();
      return;
    }

    // 8. Update Follow Camera + Shake
    getTunnelCenterAtZ(this.podState.pos.z - 12, _v2);
    _camGoal.set(
      this.podState.pos.x * 0.72 + _v2.x * 0.28,
      this.podState.pos.y * 0.72 + _v2.y * 0.28 + 1.85,
      this.podState.pos.z + 6.8
    );
    // Keep camera inside tunnel
    getTunnelCenterAtZ(_camGoal.z, _v3);
    const camMaxR = getTunnelRadiusAtZ(_camGoal.z) - 1.2;
    const cdx = _camGoal.x - _v3.x;
    const cdy = _camGoal.y - _v3.y;
    const cDist = Math.hypot(cdx, cdy);
    if (cDist > camMaxR && cDist > 0.001) {
      _camGoal.x = _v3.x + (cdx / cDist) * camMaxR;
      _camGoal.y = _v3.y + (cdy / cDist) * camMaxR;
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camGoal.x, 8.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camGoal.y, 8.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camGoal.z, 10.5, dt);

    if (this.shakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
    }

    _camLook.set(
      this.podState.pos.x + this.mouseNdc.x * 5.5,
      this.podState.pos.y + this.mouseNdc.y * 4.0 + 0.35,
      this.podState.pos.z - 18
    );
    this.camera.lookAt(_camLook);

    // Move keyLight along with Pod
    this.keyLight.position.set(this.podState.pos.x + 8, this.podState.pos.y + 12, this.podState.pos.z + 10);
    this.keyLight.target.position.copy(this.podState.pos);

    // 9. Throttled HUD Sync (12 Hz)
    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.08) {
      this.hudSyncTimer = 0;
      this.emitHudSnapshot();
    }

    this.justPressedKeys.clear();
  }

  private updateTitleShowcase(dt: number): void {
    // Cinematic orbital pan around Nano-Pod & B.I.O.-7 at the Oral Entry
    const t = this.animTime;
    this.podRig.root.position.set(0, Math.sin(t * 1.4) * 0.28, 2);
    this.podRig.root.rotation.set(Math.sin(t * 0.9) * 0.06, Math.sin(t * 0.5) * 0.14, Math.cos(t * 1.1) * 0.08);
    this.podRig.thrusterGlowLeft.scale.set(1, 1, 1.0 + Math.sin(t * 10) * 0.15);
    this.podRig.thrusterGlowRight.scale.set(1, 1, 1.0 + Math.sin(t * 10) * 0.15);

    this.robotRig.root.position.set(2.1, 1.1 + Math.cos(t * 2.1) * 0.25, 1.2);
    this.robotRig.scannerRing.rotation.z += dt * 2.2;

    const orbitAngle = Math.sin(t * 0.32) * 0.55;
    _camGoal.set(Math.sin(orbitAngle) * 5.8, 1.6 + Math.cos(t * 0.4) * 0.65, 2 + Math.cos(orbitAngle) * 5.8);
    this.camera.position.lerp(_camGoal, 1 - Math.exp(-3 * dt));
    this.camera.lookAt(0, 0.2, -3.5);
  }

  private getAimWorldPoint(out: THREE.Vector3): THREE.Vector3 {
    _ndc.copy(this.mouseNdc);
    _raycaster.setFromCamera(_ndc, this.camera);
    out.copy(_raycaster.ray.origin).addScaledVector(_raycaster.ray.direction, 42);
    return out;
  }

  private firePlayerWeapon(): void {
    const spec = WEAPONS[this.activeWeapon];
    if (this.energy < spec.energyCost) {
      // Fallback to Weapon 1 if out of energy
      this.activeWeapon = 1;
    }

    const activeSpec = WEAPONS[this.activeWeapon];
    this.energy = Math.max(0, this.energy - activeSpec.energyCost);
    this.fireCooldown = activeSpec.cooldown;
    this.cannonRecoil = 1.0;

    this.getAimWorldPoint(_aimTarget);

    if (this.activeWeapon === 1) {
      // Dual UV-C Pulse Lasers
      this.audio.playLaser();
      for (const side of [-0.68, 0.68]) {
        _v1.set(side, -0.14, -1.55).applyEuler(this.podRig.root.rotation).add(this.podState.pos);
        _v2.subVectors(_aimTarget, _v1).normalize().multiplyScalar(78);
        this.spawnProjectile(true, 'laser', _v1, _v2, 0.42, 26, 1.3);
      }
    } else if (this.activeWeapon === 2) {
      // Cryo-Antibodi 3-orb Spread
      this.audio.playCryoBurst();
      _v1.set(0, 0, -1.6).applyEuler(this.podRig.root.rotation).add(this.podState.pos);
      const baseDir = _v2.subVectors(_aimTarget, _v1).normalize();
      for (const spread of [-0.11, 0, 0.11]) {
        _v3.copy(baseDir);
        _v3.x += spread;
        _v3.normalize().multiplyScalar(58);
        this.spawnProjectile(true, 'cryo', _v1, _v3, 0.68, 32, 1.5);
      }
    } else {
      // Weapon 3: Nano-Nova Shockwave Blast (immediate area pulse + forward wave orb)
      this.audio.playNanoNova();
      this.shakeIntensity = 0.35;
      this.spawnParticleBurst(this.podState.pos, 0x34d399, 26, 18);

      // Area shockwave damages nearby enemies & clears enemy projectiles
      for (const proj of this.projectiles) {
        if (proj.active && !proj.fromPlayer && proj.pos.distanceTo(this.podState.pos) < 22) {
          proj.active = false;
          proj.mesh.visible = false;
        }
      }
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const dist = enemy.pos.distanceTo(this.podState.pos);
        if (dist < 22) {
          this.damageEnemy(enemy, 75, true);
        }
      }

      // Also launch heavy penetrating Nova orb forward
      _v1.set(0, 0, -1.8).applyEuler(this.podRig.root.rotation).add(this.podState.pos);
      _v2.subVectors(_aimTarget, _v1).normalize().multiplyScalar(48);
      this.spawnProjectile(true, 'nova', _v1, _v2, 1.45, 95, 1.6);
    }
  }

  private triggerBioAssist(): void {
    this.bioAssistCooldown = 6.5;
    this.audio.playBioChirp();

    // Find closest active enemy ahead
    let target: EnemyEntity | null = null;
    let bestDist = 85;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = e.pos.distanceTo(this.robotPos);
      if (d < bestDist) {
        bestDist = d;
        target = e;
      }
    }

    if (target) {
      _v1.subVectors(target.pos, this.robotPos).normalize().multiplyScalar(72);
      this.spawnProjectile(true, 'bioAssist', this.robotPos, _v1, 0.75, 65, 1.4);
      this.bioMessage = 'B.I.O.-7: "Tembakan bantu Cryo-Beam diluncurkan! Perisai mikro diisi ulang."';
    } else {
      this.bioMessage = 'B.I.O.-7: "Pemindaian bio-energi selesai! Integritas Pod dipulihkan +12%."';
    }
    this.hull = Math.min(this.maxHull, this.hull + 12);
    this.bioMessageTimer = 4.5;
    this.spawnParticleBurst(this.robotPos, 0x22d3ee, 14, 6);
  }

  private spawnProjectile(
    fromPlayer: boolean,
    kind: ProjectileEntity['kind'],
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    radius: number,
    damage: number,
    life: number
  ): void {
    const slot = this.projectiles.find((p) => !p.active);
    if (!slot) return;

    slot.active = true;
    slot.fromPlayer = fromPlayer;
    slot.kind = kind;
    slot.pos.copy(pos);
    slot.vel.copy(vel);
    slot.radius = radius;
    slot.damage = damage;
    slot.life = life;

    slot.mesh.position.copy(pos);
    slot.mesh.lookAt(_v4.copy(pos).add(vel));

    if (kind === 'laser') {
      slot.mesh.material = this.laserMat;
      slot.mesh.scale.set(1, 1, 1);
    } else if (kind === 'cryo' || kind === 'bioAssist') {
      slot.mesh.material = this.cryoMat;
      slot.mesh.scale.set(1.6, 1.6, 1.2);
    } else if (kind === 'nova') {
      slot.mesh.material = this.novaMat;
      slot.mesh.scale.set(3.4, 3.4, 2.2);
    } else {
      slot.mesh.material = this.enemyOrbMat;
      slot.mesh.scale.set(2.1, 2.1, 1.0);
    }
    slot.mesh.visible = true;
  }

  private spawnParticleBurst(pos: THREE.Vector3, colorHex: number, count: number, speed: number): void {
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (p.active) continue;
      p.active = true;
      p.pos.copy(pos);
      p.vel.set(
        (Math.random() - 0.5) * speed * 2,
        (Math.random() - 0.5) * speed * 2,
        (Math.random() - 0.5) * speed * 2
      );
      p.maxLife = 0.35 + Math.random() * 0.35;
      p.life = p.maxLife;
      p.scale = 0.7 + Math.random() * 1.1;
      (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
      p.mesh.position.copy(pos);
      p.mesh.visible = true;
      spawned++;
    }
  }

  private updateEndlessSpawner(): void {
    // Stream fresh pathogen squads ahead of player throughout Endless Zone 5 (-760 .. -2480)
    if (this.podState.pos.z > -690 || this.nextEndlessWaveZ < -2440) return;

    while (this.podState.pos.z - 155 < this.nextEndlessWaveZ && this.nextEndlessWaveZ >= -2440) {
      const waveZ = this.nextEndlessWaveZ;
      getTunnelCenterAtZ(waveZ, _v1);
      const squadKinds: VirusKind[] = ['rhino', 'spore', 'neuro'];
      const count = 2 + (Math.abs(Math.round(waveZ)) % 2);
      for (let k = 0; k < count; k++) {
        const kind = squadKinds[(Math.abs(Math.round(waveZ / 95)) + k) % squadKinds.length];
        const ang = k * 2.1 + waveZ * 0.05;
        const pos = new THREE.Vector3(
          _v1.x + Math.cos(ang) * 4.2,
          _v1.y + Math.sin(ang) * 3.1,
          waveZ - k * 14
        );
        this.spawnEnemy(kind, 4, pos);
      }

      // Periodically place a bio-capsule pickup along the endless run
      if (Math.abs(Math.round(waveZ / 95)) % 2 === 1) {
        const pkKind = this.hull < 70 ? 'heal' : 'energy';
        const pkMesh = createBioPickup(pkKind);
        const pkPos = new THREE.Vector3(_v1.x, _v1.y, waveZ - 26);
        pkMesh.position.copy(pkPos);
        this.scene.add(pkMesh);
        this.pickups.push({
          active: true,
          kind: pkKind,
          mesh: pkMesh,
          pos: pkPos,
          life: 45,
        });
      }

      this.nextEndlessWaveZ -= 95;
    }
  }

  private enterEndingCutscene(): void {
    this.phase = 'ending';
    this.endingTime = 0;
    this.endingStage = 0;
    this.endingSubtitle =
      'Profesor Aris & B.I.O.-7 berhasil keluar melalui saluran akhir menuju ruang re-ekspansi laboratorium!';
    this.endingReadyForSummary = false;
    this.endingTransformFlashed = false;
    this.patientVitality = 100;
    this.heldKeys.clear();
    this.mouseDown = false;
    this.audio.setThrustIntensity(0);
    this.audio.playVictory();
    this.persistProgress(true);

    // Clear anatomical entities & reveal sunlit Laboratory Ending World
    this.clearRunEntities();
    this.world.group.visible = false;
    this.labWorld.group.visible = true;
    this.labWorld.profRig.root.visible = false;

    // Position shrunken Nano-Pod & B.I.O.-7 emerging onto the Expansion Pad
    this.podRig.root.visible = true;
    this.podRig.root.position.set(this.labWorld.padPosition.x, 3.1, this.labWorld.padPosition.z);
    this.podRig.root.rotation.set(0.2, Math.PI * 0.65, 0);
    this.podRig.root.scale.setScalar(0.24);

    this.robotRig.root.visible = true;
    this.robotRig.root.position.set(
      this.labWorld.padPosition.x + 0.55,
      3.4,
      this.labWorld.padPosition.z + 0.35
    );
    this.robotRig.root.scale.setScalar(0.32);

    // Switch lighting & fog to warm bright daytime laboratory
    this.fog.density = 0.014;
    this.fog.color.setHex(0xe2e8f0);
    (this.scene.background as THREE.Color).setHex(0xdbeafe);
    this.hemiLight.color.setHex(0xffffff);
    this.hemiLight.groundColor.setHex(0xcbd5e1);
    this.hemiLight.intensity = 1.25;
    this.keyLight.position.set(-4, 9, 6);
    this.keyLight.target.position.set(0.4, 1.0, 0);
    this.keyLight.intensity = 1.95;

    this.camera.position.set(-0.6, 2.2, 4.6);
    this.camera.lookAt(this.labWorld.padPosition.x, 1.3, this.labWorld.padPosition.z);
    this.emitHudSnapshot();
  }

  private updateEndingCutscene(dt: number): void {
    this.endingTime += dt;
    this.labWorld.update(dt, this.animTime, this.endingTime);
    this.updateParticles(dt);

    const t = this.endingTime;
    const pad = this.labWorld.padPosition;

    if (t < 2.5) {
      // Stage 0: Tiny Pod & B.I.O.-7 descend onto Expansion Pad
      this.endingStage = 0;
      const dropProgress = Math.min(1, t / 2.2);
      const podY = THREE.MathUtils.lerp(3.0, 0.75, dropProgress);
      this.podRig.root.position.set(pad.x, podY, pad.z);
      this.podRig.root.rotation.y += dt * (2.5 + dropProgress * 4.5);

      this.robotRig.root.position.set(
        pad.x + 0.65,
        podY + 0.35 + Math.sin(this.animTime * 4) * 0.08,
        pad.z + 0.35
      );
      this.robotRig.scannerRing.rotation.z += dt * 4;

      _camGoal.set(-0.7, 1.9, 4.2);
      _camLook.set(pad.x + 0.2, 1.15, pad.z);
    } else if (t < 5.6) {
      // Stage 1: Re-expansion flash! Profesor Aris & B.I.O.-7 return to full human/robot size
      this.endingStage = 1;
      this.endingSubtitle =
        'Sinar Re-Ekspansi aktif! Profesor Aris & B.I.O.-7 kembali ke wujud asli di laboratorium.';

      if (!this.endingTransformFlashed) {
        this.endingTransformFlashed = true;
        this.audio.playPickup();
        this.podRig.root.visible = false;
        this.labWorld.profRig.root.visible = true;
        this.labWorld.profRig.root.scale.setScalar(0.18);
        this.spawnParticleBurst(new THREE.Vector3(pad.x, 1.1, pad.z), 0x38bdf8, 36, 7);
      }

      const grow = THREE.MathUtils.damp(this.labWorld.profRig.root.scale.x, 1.0, 4.5, dt);
      this.labWorld.profRig.root.scale.setScalar(grow);

      const robScale = THREE.MathUtils.damp(this.robotRig.root.scale.x, 1.12, 4.5, dt);
      this.robotRig.root.scale.setScalar(robScale);
      this.robotRig.root.position.x = THREE.MathUtils.damp(this.robotRig.root.position.x, pad.x + 1.05, 4, dt);
      this.robotRig.root.position.y = THREE.MathUtils.damp(
        this.robotRig.root.position.y,
        1.65 + Math.sin(this.animTime * 2.4) * 0.08,
        4,
        dt
      );
      this.robotRig.root.position.z = THREE.MathUtils.damp(this.robotRig.root.position.z, pad.z + 0.55, 4, dt);
      this.robotRig.root.rotation.y = THREE.MathUtils.damp(this.robotRig.root.rotation.y, -Math.PI * 0.42, 4, dt);
      this.robotRig.scannerRing.rotation.z += dt * 2.5;

      // Sweep camera into warm two-shot framing Profesor Aris, B.I.O.-7, and healthy Raka
      _camGoal.set(-0.25, 2.05, 5.15);
      _camLook.set(0.35, 1.15, -0.2);
    } else {
      // Stage 2: Profesor Aris & B.I.O.-7 gaze warmly at cured grandchild Raka waving from recovery bed
      this.endingStage = 2;
      this.endingSubtitle =
        'Raka tersenyum bugar & kembali sehat 100%! Ekspedisi Nano-Medika sukses menyelamatkan sang cucu.';
      if (t >= 7.8) {
        this.endingReadyForSummary = true;
      }

      this.robotRig.root.position.y = 1.65 + Math.sin(this.animTime * 2.4) * 0.08;
      this.robotRig.scannerRing.rotation.z += dt * 2.5;

      // Gentle slow cinematic orbit framing everyone together
      const sway = Math.sin((t - 5.6) * 0.35) * 0.85;
      _camGoal.set(0.2 + sway, 2.05, 5.35);
      _camLook.set(0.35, 1.12, -0.25);
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camGoal.x, 3.2, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camGoal.y, 3.2, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camGoal.z, 3.2, dt);
    this.camera.lookAt(_camLook);

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.1) {
      this.hudSyncTimer = 0;
      this.emitHudSnapshot();
    }
  }

  public openVictorySummary(): void {
    this.setPhase('victory');
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= 0) continue;

      // Despawn passed enemies far behind player in endless mode to keep performance locked
      if (e.zone >= 4 && e.pos.z > this.podState.pos.z + 65) {
        this.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
        continue;
      }

      if (e.hitFlash > 0) {
        e.hitFlash -= dt;
      }

      const slowMult = e.frozenTimer > 0 ? 0.42 : 1.0;
      if (e.frozenTimer > 0) e.frozenTimer -= dt;

      // Spin sub-rings if present
      e.mesh.rotation.y += dt * 1.1 * slowMult;
      const r1 = e.mesh.getObjectByName('spinRing1');
      const r2 = e.mesh.getObjectByName('spinRing2');
      if (r1) r1.rotation.x += dt * 2.2 * slowMult;
      if (r2) r2.rotation.y -= dt * 2.6 * slowMult;

      // Orbit boss shield nodes
      if (e.isBossShieldNode && this.bossEntity && e.shieldOrbitAngle !== undefined) {
        e.shieldOrbitAngle += dt * 1.15 * slowMult;
        e.pos.set(
          this.bossEntity.pos.x + Math.cos(e.shieldOrbitAngle) * 7.5,
          this.bossEntity.pos.y + Math.sin(e.shieldOrbitAngle * 1.3) * 4.8,
          this.bossEntity.pos.z + 3.5
        );
        e.mesh.position.copy(e.pos);
      } else if (e.kind === 'boss') {
        // Boss hovers menacingly inside Cardiac Chamber
        e.pos.x = e.homePos.x + Math.sin(this.animTime * 0.85) * 6.5;
        e.pos.y = e.homePos.y + Math.cos(this.animTime * 1.1) * 3.8;
        e.mesh.position.copy(e.pos);
      } else {
        // Regular enemies bob & strafe within their tunnel sector
        const distToPod = e.pos.distanceTo(this.podState.pos);
        if (distToPod < 48) {
          _v1.subVectors(this.podState.pos, e.pos).normalize();
          const chaseSpeed = e.kind === 'spore' ? 5.2 : e.kind === 'neuro' ? 4.2 : 3.2;
          if (distToPod > 8.5) {
            e.vel.lerp(_v1.multiplyScalar(chaseSpeed * slowMult), 2.2 * dt);
          } else {
            // Orbit-strafe
            e.vel.set(Math.cos(this.animTime * 2 + e.id) * 4.5, Math.sin(this.animTime * 2.3 + e.id) * 3.2, 0);
          }
        } else {
          e.vel.set(
            Math.sin(this.animTime * 1.5 + e.id) * 2.2,
            Math.cos(this.animTime * 1.7 + e.id) * 1.8,
            0
          );
        }
        e.pos.addScaledVector(e.vel, dt);

        // Constrain enemy inside tunnel wall
        getTunnelCenterAtZ(e.pos.z, _v2);
        const maxR = Math.max(1.5, getTunnelRadiusAtZ(e.pos.z) - e.radius - 0.5);
        const edx = e.pos.x - _v2.x;
        const edy = e.pos.y - _v2.y;
        const edist = Math.hypot(edx, edy);
        if (edist > maxR && edist > 0.001) {
          e.pos.x = _v2.x + (edx / edist) * maxR;
          e.pos.y = _v2.y + (edy / edist) * maxR;
        }
        e.mesh.position.copy(e.pos);
      }

      // Enemy Attack Telegraph & Firing
      const dist = e.pos.distanceTo(this.podState.pos);
      if (dist < 58 && !e.isBossShieldNode) {
        e.attackTimer -= dt * slowMult;
        if (e.attackTimer <= 0.45 && e.windupTimer <= 0) {
          // Telegraph windup scale pulse
          e.windupTimer = 0.45;
        }
        if (e.windupTimer > 0) {
          e.windupTimer -= dt;
          const pulse = 1.0 + Math.sin(e.windupTimer * 28) * 0.14;
          e.mesh.scale.setScalar(pulse);
        } else {
          e.mesh.scale.setScalar(1.0);
        }

        if (e.attackTimer <= 0) {
          if (e.kind === 'boss') {
            e.attackTimer = 2.1;
            // Boss radial volley of 5 viral shock orbs
            for (let k = -2; k <= 2; k++) {
              _v1.subVectors(this.podState.pos, e.pos).normalize();
              _v1.x += k * 0.14;
              _v1.y += Math.sin(k * 1.2) * 0.1;
              _v1.normalize().multiplyScalar(28);
              this.spawnProjectile(false, 'enemyOrb', e.pos, _v1, 0.75, 13, 3.2);
            }
          } else {
            e.attackTimer = e.kind === 'neuro' ? 2.4 : 3.2;
            _v1.subVectors(this.podState.pos, e.pos).normalize().multiplyScalar(24);
            this.spawnProjectile(false, 'enemyOrb', e.pos, _v1, 0.55, 9, 2.8);
          }
        }
      }

      // Body collision with Pod
      const minDist = this.podState.radius + e.radius;
      if (dist < minDist) {
        _v1.subVectors(this.podState.pos, e.pos).normalize();
        this.podState.vel.addScaledVector(_v1, 16);
        this.damagePlayer(12);
      }
    }
  }

  private damageEnemy(e: EnemyEntity, dmg: number, isHeavy: boolean): void {
    // Check if Boss still has active shield nodes
    if (e.kind === 'boss') {
      const activeNodes = this.bossShieldNodes.filter((n) => !n.shieldDestroyed);
      if (activeNodes.length > 0) {
        dmg *= 0.18; // Heavily shielded while shield nodes remain
        if (Math.random() < 0.35) {
          this.bioMessage = `B.I.O.-7: "Perisai Boss masih aktif! Hancurkan ${activeNodes.length} Nodus Perisai Kuning dulu!"`;
          this.bioMessageTimer = 4;
        }
      }
    }

    e.hp -= dmg;
    e.hitFlash = 0.12;
    this.audio.playHit(isHeavy);

    if (e.hp <= 0) {
      e.hp = 0;
      this.scene.remove(e.mesh);
      this.audio.playVirusPop();
      this.kills++;
      this.combo++;
      this.comboTimer = 4.0;

      const pts = e.kind === 'boss' ? 2500 : e.isBossShieldNode ? 450 : 120 + this.combo * 20;
      this.score += pts;
      this.patientVitality = Math.min(100, this.patientVitality + (e.kind === 'boss' ? 18 : 1.5));

      const burstColor =
        e.kind === 'rhino' ? 0x84cc16 : e.kind === 'spore' ? 0xf97316 : e.kind === 'neuro' ? 0xa855f7 : 0xf43f5e;
      this.spawnParticleBurst(e.pos, burstColor, e.kind === 'boss' ? 48 : 18, e.kind === 'boss' ? 18 : 10);

      if (isHeavy || e.kind === 'boss' || e.isBossShieldNode) {
        this.hitstopTimer = 0.045;
        this.shakeIntensity = e.kind === 'boss' ? 0.65 : 0.28;
      }

      if (e.isBossShieldNode) {
        e.shieldDestroyed = true;
        const left = this.bossShieldNodes.filter((n) => !n.shieldDestroyed).length;
        this.bioMessage =
          left > 0
            ? `B.I.O.-7: "Nodus Perisai hancur! Tersisa ${left} nodus lagi!"`
            : 'B.I.O.-7: "Semua perisai Chrono-Virus Omega rontok! Serang inti merahnya sekarang!"';
        this.bioMessageTimer = 6;
      }

      // Chance to drop bio-capsule pickup
      if (!e.isBossShieldNode && e.kind !== 'boss' && Math.random() < 0.42) {
        const pkKind = this.hull < 65 ? 'heal' : Math.random() < 0.5 ? 'heal' : 'energy';
        const pkMesh = createBioPickup(pkKind);
        pkMesh.position.copy(e.pos);
        this.scene.add(pkMesh);
        this.pickups.push({
          active: true,
          kind: pkKind,
          mesh: pkMesh,
          pos: e.pos.clone(),
          life: 25,
        });
      }

      if (e.kind === 'boss') {
        this.bossDefeated = true;
        this.patientVitality = Math.max(this.patientVitality, 96);
        this.audio.playPickup();
        this.bioMessage =
          'B.I.O.-7: "Chrono-Virus Omega musnah! Terobos lorong pencernaan panjang hingga gerbang keluar Anus!"';
        this.bioMessageTimer = 9;
        this.persistProgress(false);
      }
    }
  }

  private damagePlayer(dmg: number): void {
    if (this.invulnTimer > 0 || this.phase !== 'playing') return;
    this.hull = Math.max(0, this.hull - dmg);
    this.invulnTimer = 0.55;
    this.shakeIntensity = 0.42;
    this.hitstopTimer = 0.035;
    this.audio.playHit(true);
    this.spawnParticleBurst(this.podState.pos, 0xf43f5e, 14, 9);

    if (this.hull <= 0) {
      this.persistProgress(false);
      this.setPhase('gameover');
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);

      // Tunnel wall impact check
      getTunnelCenterAtZ(p.pos.z, _v1);
      const maxR = getTunnelRadiusAtZ(p.pos.z);
      if (Math.hypot(p.pos.x - _v1.x, p.pos.y - _v1.y) > maxR) {
        p.active = false;
        p.mesh.visible = false;
        this.spawnParticleBurst(p.pos, p.fromPlayer ? 0x22d3ee : 0xf43f5e, 5, 4);
        continue;
      }

      if (p.fromPlayer) {
        // Check hit against enemies
        for (let j = 0; j < this.enemies.length; j++) {
          const e = this.enemies[j];
          if (e.hp <= 0) continue;
          const hitDist = p.radius + e.radius;
          if (p.pos.distanceToSquared(e.pos) <= hitDist * hitDist) {
            if (p.kind === 'cryo' || p.kind === 'bioAssist') {
              e.frozenTimer = 3.2;
            }
            this.damageEnemy(e, p.damage, p.kind === 'nova');
            this.spawnParticleBurst(p.pos, p.kind === 'cryo' ? 0x93c5fd : 0x22d3ee, 8, 6);
            if (p.kind !== 'nova') {
              p.active = false;
              p.mesh.visible = false;
              break;
            }
          }
        }
      } else {
        // Enemy orb vs Player Pod
        const hitDist = p.radius + this.podState.radius;
        if (p.pos.distanceToSquared(this.podState.pos) <= hitDist * hitDist) {
          p.active = false;
          p.mesh.visible = false;
          this.damagePlayer(p.damage);
        }
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.pos.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(Math.exp(-3.5 * dt));
      const ratio = p.life / p.maxLife;
      p.mesh.position.copy(p.pos);
      p.mesh.scale.setScalar(p.scale * ratio);
      p.mesh.rotation.x += dt * 4;
      p.mesh.rotation.y += dt * 4;
    }
  }

  private updatePickups(dt: number): void {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      if (!pk.active) continue;
      pk.life -= dt;
      pk.mesh.rotation.y += dt * 2.5;
      pk.mesh.position.y = pk.pos.y + Math.sin(this.animTime * 4 + i) * 0.22;

      if (pk.life <= 0) {
        pk.active = false;
        this.scene.remove(pk.mesh);
        this.pickups.splice(i, 1);
        continue;
      }

      if (pk.pos.distanceTo(this.podState.pos) < 2.6) {
        if (pk.kind === 'heal') {
          this.hull = Math.min(this.maxHull, this.hull + 24);
          this.bioMessage = 'B.I.O.-7: "Kapsul Nano-Perbaikan diserap! Integritas +24%."';
        } else {
          this.energy = Math.min(this.maxEnergy, this.energy + 45);
          this.bioMessage = 'B.I.O.-7: "Sel Bio-Energi terisi +45%!"';
        }
        this.bioMessageTimer = 3.5;
        this.audio.playPickup();
        this.spawnParticleBurst(pk.pos, pk.kind === 'heal' ? 0x10b981 : 0x38bdf8, 12, 6);
        pk.active = false;
        this.scene.remove(pk.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }

  private checkZoneGates(): void {
    for (const gate of this.gateMeshes) {
      if (gate.open) continue;
      const remaining = this.enemies.filter((e) => e.zone === gate.zone && e.hp > 0).length;
      if (remaining === 0) {
        gate.open = true;
        this.spawnParticleBurst(gate.mesh.position, 0x34d399, 28, 14);
        this.scene.remove(gate.mesh);
        this.audio.playPickup();
        const nextZone = ZONES[Math.min(5, gate.zone + 1)];
        this.bioMessage = `B.I.O.-7: "Area bersih! Gerbang menuju ${nextZone.name} terbuka!"`;
        this.bioMessageTimer = 6;
      }
    }
  }

  private render(): void {
    const isLabEnding = this.phase === 'ending' || this.phase === 'victory';
    // Project searchlight or sunlit lab window into screen UV for volumetric God-Rays (zero GC)
    if (isLabEnding) {
      _v1.set(-2.2, 3.2, -5.0);
      _v2.set(0, 1.4, 0.2);
    } else {
      _v1.set(this.podState.pos.x, this.podState.pos.y, this.podState.pos.z - 24);
      _v2.copy(this.podState.pos);
    }
    _v1.project(this.camera);
    _lightUv.set(
      THREE.MathUtils.clamp((_v1.x + 1) * 0.5, 0.15, 0.85),
      THREE.MathUtils.clamp((_v1.y + 1) * 0.5, 0.15, 0.85)
    );

    // Bind live dynamic CubeCamera reflection map onto cockpit & hull when RT is ON
    const cubeTex = this.rtPipeline.getCubeEnvTexture();
    if (cubeTex && this.rayTracingEnabled && !this.isSoftwareGl) {
      this.materials.cockpitGlass.envMap = cubeTex;
      this.materials.titaniumHull.envMap = cubeTex;
      this.materials.virusBossCore.envMap = cubeTex;
    } else {
      this.materials.cockpitGlass.envMap = null;
      this.materials.titaniumHull.envMap = null;
      this.materials.virusBossCore.envMap = null;
    }

    this.rtPipeline.render(
      this.scene,
      this.camera,
      _v2,
      _lightUv,
      this.animTime,
      this.rayTracingEnabled
    );
  }

  private persistProgress(victory: boolean): void {
    const killsDelta = Math.max(0, this.kills - this.savedKillsCheckpoint);
    this.savedKillsCheckpoint = this.kills;
    saveRunProgress({
      score: this.score,
      killsDelta,
      zoneReached: this.currentZone,
      vitality: Math.round(this.patientVitality),
      victory,
      elapsedSeconds: Math.floor(this.elapsedSeconds),
    });
  }

  private emitHudSnapshot(): void {
    const zoneEnemies = this.enemies.filter((e) => e.zone === this.currentZone && e.hp > 0).length;
    const targetExitMeters = Math.abs(ANUS_EXIT_Z) + 2;
    const distanceMeters = Math.max(0, Math.round(2 - this.podState.pos.z));
    const overallProgress = THREE.MathUtils.clamp(distanceMeters / targetExitMeters, 0, 1);
    const endlessSector =
      this.podState.pos.z < -760
        ? Math.min(10, Math.floor((-this.podState.pos.z - 760) / 172) + 1)
        : 0;

    // Minimap telemetry calculations
    getTunnelCenterAtZ(this.podState.pos.z, _v1);
    const localRad = Math.max(1, getTunnelRadiusAtZ(this.podState.pos.z));
    const lateralX = THREE.MathUtils.clamp((this.podState.pos.x - _v1.x) / localRad, -1, 1);
    const lateralY = THREE.MathUtils.clamp((this.podState.pos.y - _v1.y) / localRad, -1, 1);

    // Sample curved anatomical tunnel ahead/behind player (-48..+24 in Z)
    const tunnelSamples: { dx: number; dz: number; r: number }[] = [];
    for (let dz = 24; dz >= -48; dz -= 8) {
      const sz = this.podState.pos.z + dz;
      getTunnelCenterAtZ(sz, _v2);
      tunnelSamples.push({
        dx: _v2.x - this.podState.pos.x,
        dz,
        r: getTunnelRadiusAtZ(sz),
      });
    }

    // Target organ beacon based on current zone
    const targetOrganMap: Record<ZoneIndex, { z: number; label: string }> = {
      0: { z: -126, label: 'Katup Faring' },
      1: { z: -324, label: 'Gerbang Saraf' },
      2: { z: -534, label: 'Katup Jantung' },
      3: { z: -754, label: 'Lorong Usus' },
      4: { z: ANUS_EXIT_Z, label: 'Gerbang Anus' },
      5: { z: ANUS_EXIT_Z, label: 'Keluar Lab!' },
    };
    const organSpec = targetOrganMap[this.currentZone];
    getTunnelCenterAtZ(organSpec.z, _v2);
    const nextOrganDx = _v2.x - this.podState.pos.x;
    const nextOrganDz = organSpec.z - this.podState.pos.z;
    const nextOrganDistance = Math.round(Math.hypot(nextOrganDx, nextOrganDz));

    // Nearby active enemies within radar radius (64 units)
    const minimapEnemies: MinimapEnemyBlip[] = [];
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.hp <= 0) continue;
      const dx = e.pos.x - this.podState.pos.x;
      const dz = e.pos.z - this.podState.pos.z;
      if (Math.abs(dz) <= 60 && Math.abs(dx) <= 45) {
        minimapEnemies.push({
          dx,
          dz,
          kind: e.kind,
          isShieldNode: e.isBossShieldNode,
        });
      }
    }

    this.onHudUpdate({
      phase: this.phase,
      hull: Math.round(this.hull),
      maxHull: this.maxHull,
      energy: Math.round(this.energy),
      maxEnergy: this.maxEnergy,
      patientVitality: Math.round(this.patientVitality),
      score: this.score,
      kills: this.kills,
      combo: this.combo,
      activeWeapon: this.activeWeapon,
      zoneIndex: this.currentZone,
      zoneProgress: overallProgress,
      zoneRemainingEnemies: zoneEnemies,
      distanceMeters,
      targetExitMeters,
      endlessSector,
      bossActive: this.currentZone === 3 && !!this.bossEntity && this.bossEntity.hp > 0,
      bossDefeated: this.bossDefeated,
      bossHp: this.bossEntity ? Math.ceil(this.bossEntity.hp) : 0,
      bossMaxHp: this.bossEntity ? this.bossEntity.maxHp : 720,
      bossName: 'CHRONO-VIRUS OMEGA',
      bioMessage: this.bioMessage,
      bioAssistReady: this.bioAssistCooldown <= 0,
      rayTracingEnabled: this.rayTracingEnabled,
      isSoftwareGl: this.isSoftwareGl,
      muted: this.audio.isMuted(),
      boostCooldown: Number(this.boostCooldown.toFixed(1)),
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      endingStage: this.endingStage,
      endingSubtitle: this.endingSubtitle,
      endingReadyForSummary: this.endingReadyForSummary,
      minimap: {
        playerZ: this.podState.pos.z,
        lateralX,
        lateralY,
        robotDx: this.robotPos.x - this.podState.pos.x,
        robotDz: this.robotPos.z - this.podState.pos.z,
        nextOrganLabel: organSpec.label,
        nextOrganDistance,
        nextOrganDx,
        nextOrganDz,
        tunnelSamples,
        enemies: minimapEnemies,
      },
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.unbindEvents();
    this.clearRunEntities();
    this.world.dispose();
    this.labWorld.dispose();
    this.materials.dispose();
    this.rtPipeline.dispose();
    this.audio.dispose();
    this.sharedDisposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
