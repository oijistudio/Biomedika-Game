import * as THREE from 'three';
import { MaterialLibrary } from './materials';

export interface ProfessorPodRig {
  root: THREE.Group;
  cannonLeft: THREE.Mesh;
  cannonRight: THREE.Mesh;
  thrusterRingLeft: THREE.Mesh;
  thrusterRingRight: THREE.Mesh;
  thrusterGlowLeft: THREE.Mesh;
  thrusterGlowRight: THREE.Mesh;
  professorHead: THREE.Group;
  searchlight: THREE.SpotLight;
  searchlightTarget: THREE.Object3D;
}

export interface AssistantRobotRig {
  root: THREE.Group;
  wingLeft: THREE.Mesh;
  wingRight: THREE.Mesh;
  visor: THREE.Mesh;
  scannerRing: THREE.Mesh;
  muzzlePoint: THREE.Object3D;
}

export type VirusKind = 'rhino' | 'spore' | 'neuro' | 'boss';

export function createProfessorPod(mats: MaterialLibrary): ProfessorPodRig {
  const root = new THREE.Group();

  // 1. Primary Silhouette: Streamlined Lathe Titanium Hull (facing -Z)
  const hullPoints = [
    new THREE.Vector2(0.0, 1.85),
    new THREE.Vector2(0.32, 1.55),
    new THREE.Vector2(0.72, 0.95),
    new THREE.Vector2(0.86, 0.25),
    new THREE.Vector2(0.82, -0.65),
    new THREE.Vector2(0.64, -1.35),
    new THREE.Vector2(0.38, -1.75),
    new THREE.Vector2(0.0, -1.85),
  ];
  const hullGeo = new THREE.LatheGeometry(hullPoints, 28);
  hullGeo.rotateX(-Math.PI / 2); // Align nose along -Z
  hullGeo.scale(1.05, 0.78, 1.0);
  const hullMesh = new THREE.Mesh(hullGeo, mats.titaniumHull);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  root.add(hullMesh);

  // 2. Dark mechanical belly chassis & keel
  const keelGeo = new THREE.BoxGeometry(0.92, 0.32, 2.2);
  const keelMesh = new THREE.Mesh(keelGeo, mats.darkChassis);
  keelMesh.position.set(0, -0.46, 0.05);
  keelMesh.castShadow = true;
  root.add(keelMesh);

  // 3. Secondary Read: Extruded Beveled Hydro-Wings (Left & Right)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.6);
  wingShape.lineTo(1.15, -0.35);
  wingShape.lineTo(1.05, -0.85);
  wingShape.lineTo(0, -0.55);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  wingGeo.rotateX(Math.PI / 2);

  const rightWing = new THREE.Mesh(wingGeo, mats.titaniumHull);
  rightWing.position.set(0.65, -0.05, 0.1);
  rightWing.rotation.z = -0.14;
  rightWing.castShadow = true;
  root.add(rightWing);

  const leftWing = rightWing.clone();
  leftWing.scale.x = -1;
  leftWing.position.set(-0.65, -0.05, 0.1);
  leftWing.rotation.z = 0.14;
  root.add(leftWing);

  // Dorsal tail fin
  const tailGeo = new THREE.BoxGeometry(0.1, 0.65, 0.78);
  const tailFin = new THREE.Mesh(tailGeo, mats.goldAccent);
  tailFin.position.set(0, 0.52, 1.15);
  tailFin.rotation.x = 0.35;
  root.add(tailFin);

  // 4. Interior: Profesor Aris seated inside cockpit
  const profGroup = new THREE.Group();
  profGroup.position.set(0, 0.12, -0.22);

  // Lab coat shoulders & torso
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.48, 14);
  const torso = new THREE.Mesh(torsoGeo, mats.labCoat);
  torso.position.y = 0.05;
  profGroup.add(torso);

  // Collar accent
  const collarGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16);
  const collar = new THREE.Mesh(collarGeo, mats.goldAccent);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.28;
  profGroup.add(collar);

  // Professor Head Group
  const professorHead = new THREE.Group();
  professorHead.position.set(0, 0.46, 0);

  const headGeo = new THREE.SphereGeometry(0.19, 16, 16);
  const head = new THREE.Mesh(headGeo, mats.skinTone);
  professorHead.add(head);

  // Wild white scientist hair tuft
  const hairGeo = new THREE.SphereGeometry(0.21, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const hair = new THREE.Mesh(hairGeo, mats.labCoat);
  hair.position.set(0, 0.04, 0.03);
  hair.rotation.x = -0.25;
  professorHead.add(hair);

  // White mustache
  const stacheGeo = new THREE.BoxGeometry(0.18, 0.045, 0.05);
  const stache = new THREE.Mesh(stacheGeo, mats.labCoat);
  stache.position.set(0, -0.04, -0.18);
  professorHead.add(stache);

  // Glowing Cyan Lab Goggles
  const goggleFrameGeo = new THREE.BoxGeometry(0.26, 0.09, 0.08);
  const goggleFrame = new THREE.Mesh(goggleFrameGeo, mats.darkChassis);
  goggleFrame.position.set(0, 0.03, -0.16);
  professorHead.add(goggleFrame);

  const lensGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12);
  lensGeo.rotateX(Math.PI / 2);
  const leftLens = new THREE.Mesh(lensGeo, mats.goggleLens);
  leftLens.position.set(-0.065, 0.03, -0.19);
  const rightLens = leftLens.clone();
  rightLens.position.x = 0.065;
  professorHead.add(leftLens, rightLens);

  profGroup.add(professorHead);
  root.add(profGroup);

  // 5. Optical Sapphire Cockpit Canopy (renderOrder=2 so Professor stays crisp inside)
  const canopyGeo = new THREE.SphereGeometry(0.58, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.56);
  canopyGeo.scale(0.95, 0.92, 1.48);
  const canopy = new THREE.Mesh(canopyGeo, mats.cockpitGlass);
  canopy.position.set(0, 0.25, -0.25);
  canopy.renderOrder = 2;
  root.add(canopy);

  // Canopy gold rim trim
  const rimGeo = new THREE.TorusGeometry(0.56, 0.035, 10, 28);
  rimGeo.rotateX(Math.PI / 2);
  rimGeo.scale(0.95, 1, 1.46);
  const canopyRim = new THREE.Mesh(rimGeo, mats.goldAccent);
  canopyRim.position.set(0, 0.25, -0.25);
  root.add(canopyRim);

  // 6. Accent Detail: Dual Forward Nano-Purifier Cannons
  const cannonGeo = new THREE.CylinderGeometry(0.06, 0.085, 0.95, 12);
  cannonGeo.rotateX(Math.PI / 2);
  const cannonMat = mats.darkChassis;

  const cannonLeft = new THREE.Mesh(cannonGeo, cannonMat);
  cannonLeft.position.set(-0.68, -0.14, -1.05);
  const cannonRight = new THREE.Mesh(cannonGeo, cannonMat);
  cannonRight.position.set(0.68, -0.14, -1.05);

  // Glowing muzzle tips
  const tipGeo = new THREE.TorusGeometry(0.065, 0.018, 8, 16);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x22d3ee,
    emissiveIntensity: 2.0,
  });
  const tipL = new THREE.Mesh(tipGeo, tipMat);
  tipL.position.z = -0.47;
  cannonLeft.add(tipL);
  const tipR = tipL.clone();
  cannonRight.add(tipR);

  root.add(cannonLeft, cannonRight);

  // 7. Twin Rear Magneto-Plasma Thrusters
  const thrusterHousingGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.55, 16);
  thrusterHousingGeo.rotateX(Math.PI / 2);
  const thrusterLeft = new THREE.Mesh(thrusterHousingGeo, mats.darkChassis);
  thrusterLeft.position.set(-0.5, -0.05, 1.42);
  const thrusterRight = thrusterLeft.clone();
  thrusterRight.position.x = 0.5;
  root.add(thrusterLeft, thrusterRight);

  const ringGeo = new THREE.TorusGeometry(0.22, 0.032, 10, 20);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.6,
  });
  const thrusterRingLeft = new THREE.Mesh(ringGeo, ringMat);
  thrusterRingLeft.position.set(-0.5, -0.05, 1.7);
  const thrusterRingRight = thrusterRingLeft.clone();
  thrusterRingRight.position.x = 0.5;
  root.add(thrusterRingLeft, thrusterRingRight);

  const glowGeo = new THREE.ConeGeometry(0.18, 0.85, 14);
  glowGeo.rotateX(-Math.PI / 2);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.72,
  });
  const thrusterGlowLeft = new THREE.Mesh(glowGeo, glowMat);
  thrusterGlowLeft.position.set(-0.5, -0.05, 2.08);
  const thrusterGlowRight = thrusterGlowLeft.clone();
  thrusterGlowRight.position.x = 0.5;
  root.add(thrusterGlowLeft, thrusterGlowRight);

  // 8. Tactical Searchlight (SpotLight illuminating dark organic tunnels ahead)
  const searchlight = new THREE.SpotLight(0xd8f8ff, 34, 65, Math.PI / 4.2, 0.55, 1.25);
  searchlight.position.set(0, 0.15, -1.55);
  const searchlightTarget = new THREE.Object3D();
  searchlightTarget.position.set(0, -0.2, -18);
  root.add(searchlight, searchlightTarget);
  searchlight.target = searchlightTarget;

  return {
    root,
    cannonLeft,
    cannonRight,
    thrusterRingLeft,
    thrusterRingRight,
    thrusterGlowLeft,
    thrusterGlowRight,
    professorHead,
    searchlight,
    searchlightTarget,
  };
}

export function createAssistantRobot(mats: MaterialLibrary): AssistantRobotRig {
  const root = new THREE.Group();

  // 1. Spherical Brushed Aluminum Core
  const bodyGeo = new THREE.SphereGeometry(0.32, 20, 20);
  const body = new THREE.Mesh(bodyGeo, mats.robotShell);
  body.castShadow = true;
  root.add(body);

  // 2. Equatorial Gold Gyro Ring
  const beltGeo = new THREE.TorusGeometry(0.34, 0.032, 10, 24);
  beltGeo.rotateX(Math.PI / 2);
  const belt = new THREE.Mesh(beltGeo, mats.goldAccent);
  root.add(belt);

  // 3. Cyclops Optic Visor Housing & Glowing Lens
  const visorFrameGeo = new THREE.CylinderGeometry(0.14, 0.15, 0.12, 16);
  visorFrameGeo.rotateX(Math.PI / 2);
  const visorFrame = new THREE.Mesh(visorFrameGeo, mats.darkChassis);
  visorFrame.position.set(0, 0.03, -0.27);
  root.add(visorFrame);

  const visorGeo = new THREE.SphereGeometry(0.1, 14, 14);
  visorGeo.scale(1, 1, 0.45);
  const visor = new THREE.Mesh(visorGeo, mats.robotVisor);
  visor.position.set(0, 0.03, -0.32);
  root.add(visor);

  // 4. Twin Articulated Stabilizer Fins
  const finGeo = new THREE.BoxGeometry(0.28, 0.06, 0.34);
  const wingLeft = new THREE.Mesh(finGeo, mats.titaniumHull);
  wingLeft.position.set(-0.42, 0.02, 0.04);
  wingLeft.rotation.z = 0.22;
  const wingRight = new THREE.Mesh(finGeo, mats.titaniumHull);
  wingRight.position.set(0.42, 0.02, 0.04);
  wingRight.rotation.z = -0.22;
  root.add(wingLeft, wingRight);

  // 5. Dorsal Bio-Scanner Antenna + Orbiting Halo
  const mastGeo = new THREE.CylinderGeometry(0.018, 0.025, 0.28, 8);
  const mast = new THREE.Mesh(mastGeo, mats.darkChassis);
  mast.position.set(0, 0.38, 0.05);
  root.add(mast);

  const beaconGeo = new THREE.SphereGeometry(0.048, 10, 10);
  const beacon = new THREE.Mesh(beaconGeo, mats.robotVisor);
  beacon.position.set(0, 0.52, 0.05);
  root.add(beacon);

  const scannerRingGeo = new THREE.TorusGeometry(0.44, 0.015, 8, 28);
  scannerRingGeo.rotateX(Math.PI / 2.6);
  const scannerRing = new THREE.Mesh(scannerRingGeo, mats.robotVisor);
  root.add(scannerRing);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, -0.15, -0.35);
  root.add(muzzlePoint);

  return {
    root,
    wingLeft,
    wingRight,
    visor,
    scannerRing,
    muzzlePoint,
  };
}

export function createVirusModel(kind: VirusKind, mats: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();

  if (kind === 'rhino') {
    // Rhinovirus-Alpha: Icosahedral capsid + 12 protein spikes + glowing core
    const coreGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const core = new THREE.Mesh(coreGeo, mats.virusRhino);
    core.castShadow = true;
    group.add(core);

    const innerGeo = new THREE.OctahedronGeometry(0.55, 0);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xd9f99d,
      emissive: 0x84cc16,
      emissiveIntensity: 1.6,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    // Protein spikes along icosahedron vertices
    const dirs = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
      [0.7, 0.7, 0], [-0.7, 0.7, 0], [0.7, -0.7, 0], [-0.7, -0.7, 0],
    ];
    const spikeGeo = new THREE.ConeGeometry(0.14, 0.55, 8);
    const tipGeo = new THREE.SphereGeometry(0.11, 8, 8);
    dirs.forEach(([x, y, z]) => {
      const dir = new THREE.Vector3(x, y, z).normalize();
      const spike = new THREE.Mesh(spikeGeo, mats.virusRhino);
      spike.position.copy(dir).multiplyScalar(0.95);
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const tip = new THREE.Mesh(tipGeo, innerMat);
      tip.position.y = 0.28;
      spike.add(tip);
      group.add(spike);
    });
  } else if (kind === 'spore') {
    // Bakteri Spore-Drifter: Segmented toxic capsule + orbiting halo + 3 flagella
    const bodyGeo = new THREE.CapsuleGeometry(0.65, 1.15, 8, 16);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, mats.virusSpore);
    body.castShadow = true;
    group.add(body);

    const bandGeo = new THREE.TorusGeometry(0.72, 0.1, 8, 18);
    const band = new THREE.Mesh(bandGeo, mats.goldAccent);
    group.add(band);

    const eyeGeo = new THREE.SphereGeometry(0.24, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.0,
    });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0.15, 0.92);
    group.add(eye);

    // Flagella tails
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(ang) * 0.3, Math.sin(ang) * 0.3, -0.9),
        new THREE.Vector3(Math.cos(ang + 0.5) * 0.55, Math.sin(ang + 0.5) * 0.55, -1.6),
        new THREE.Vector3(Math.cos(ang - 0.3) * 0.35, Math.sin(ang - 0.3) * 0.35, -2.25),
      ]);
      const tailGeo = new THREE.TubeGeometry(curve, 12, 0.065, 6, false);
      const tail = new THREE.Mesh(tailGeo, mats.virusSpore);
      group.add(tail);
    }
  } else if (kind === 'neuro') {
    // Neuro-Parasit Vektor: Crystalline octahedron + rotating bio-electric rings + tendrils
    const crystalGeo = new THREE.OctahedronGeometry(0.95, 0);
    const crystal = new THREE.Mesh(crystalGeo, mats.virusNeuro);
    crystal.castShadow = true;
    group.add(crystal);

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.2,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 8, 24), ringMat);
    ring1.name = 'spinRing1';
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.05, 8, 24), ringMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.name = 'spinRing2';
    group.add(ring1, ring2);

    const hornGeo = new THREE.ConeGeometry(0.18, 0.8, 6);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const horn = new THREE.Mesh(hornGeo, mats.virusNeuro);
      horn.position.set(Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0);
      horn.rotation.z = a - Math.PI / 2;
      group.add(horn);
    }
  } else {
    // BOSS: Chrono-Virus Omega (Monumental multi-part crystalline core)
    const coreGeo = new THREE.IcosahedronGeometry(2.6, 1);
    const core = new THREE.Mesh(coreGeo, mats.virusBossCore);
    core.castShadow = true;
    core.name = 'bossCore';
    group.add(core);

    const innerGlow = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.7, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfda4af,
        emissive: 0xf43f5e,
        emissiveIntensity: 2.5,
      })
    );
    group.add(innerGlow);

    const ringA = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.18, 12, 36), mats.goldAccent);
    ringA.name = 'spinRing1';
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.14, 12, 36), mats.virusNeuro);
    ringB.rotation.x = Math.PI / 3;
    ringB.name = 'spinRing2';
    group.add(ringA, ringB);

    // 12 Crown spikes
    const crownGeo = new THREE.ConeGeometry(0.36, 1.45, 8);
    for (let i = 0; i < 12; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 12);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );
      const spike = new THREE.Mesh(crownGeo, mats.virusBossCore);
      spike.position.copy(dir).multiplyScalar(2.85);
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      group.add(spike);
    }
  }

  return group;
}

export function createBioPickup(kind: 'heal' | 'energy'): THREE.Group {
  const group = new THREE.Group();
  const color = kind === 'heal' ? 0x10b981 : 0x38bdf8;
  const emissive = kind === 'heal' ? 0x059669 : 0x0284c7;

  const coreMat = new THREE.MeshPhysicalMaterial({
    color,
    emissive,
    emissiveIntensity: 1.5,
    roughness: 0.15,
    metalness: 0.2,
    clearcoat: 1.0,
  });

  const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.45, 6, 12), coreMat);
  group.add(capsule);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.045, 8, 20),
    new THREE.MeshBasicMaterial({ color })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  return group;
}

export interface ProfessorHumanRig {
  root: THREE.Group;
  head: THREE.Group;
  rightArm: THREE.Group;
  leftArm: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
}

// Full-size Profesor Aris (bottom-center pivot at y=0, facing +Z by default)
export function createProfessorHumanModel(mats: MaterialLibrary): ProfessorHumanRig {
  const root = new THREE.Group();

  // 1. Shoes
  const shoeGeo = new THREE.BoxGeometry(0.16, 0.1, 0.3);
  const leftShoe = new THREE.Mesh(shoeGeo, mats.darkChassis);
  leftShoe.position.set(-0.14, 0.05, 0.04);
  leftShoe.castShadow = true;
  const rightShoe = leftShoe.clone();
  rightShoe.position.x = 0.14;
  root.add(leftShoe, rightShoe);

  // 2. Trousers / Legs
  const legGeo = new THREE.CylinderGeometry(0.1, 0.085, 0.78, 12);
  const leftLeg = new THREE.Mesh(legGeo, mats.labPants);
  leftLeg.position.set(-0.14, 0.48, 0);
  leftLeg.castShadow = true;
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.14;
  root.add(leftLeg, rightLeg);

  // 3. White Lab Coat Torso & Skirt
  const coatSkirtGeo = new THREE.CylinderGeometry(0.24, 0.31, 0.52, 16);
  const coatSkirt = new THREE.Mesh(coatSkirtGeo, mats.labCoat);
  coatSkirt.position.set(0, 0.92, 0);
  coatSkirt.castShadow = true;
  root.add(coatSkirt);

  const torsoGeo = new THREE.CylinderGeometry(0.25, 0.24, 0.48, 16);
  const torso = new THREE.Mesh(torsoGeo, mats.labCoat);
  torso.position.set(0, 1.36, 0);
  torso.castShadow = true;
  root.add(torso);

  // Gold lapel badge & collar accent
  const badgeGeo = new THREE.BoxGeometry(0.1, 0.06, 0.04);
  const badge = new THREE.Mesh(badgeGeo, mats.goldAccent);
  badge.position.set(0.12, 1.44, 0.23);
  root.add(badge);

  // 4. Articulated Arms (pivoted at shoulders)
  const armGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.56, 10);
  const handGeo = new THREE.SphereGeometry(0.07, 10, 10);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.31, 1.54, 0);
  const leftSleeve = new THREE.Mesh(armGeo, mats.labCoat);
  leftSleeve.position.y = -0.26;
  leftSleeve.castShadow = true;
  const leftHand = new THREE.Mesh(handGeo, mats.skinTone);
  leftHand.position.y = -0.56;
  leftArm.add(leftSleeve, leftHand);
  leftArm.rotation.z = -0.14;
  root.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.31, 1.54, 0);
  const rightSleeve = new THREE.Mesh(armGeo, mats.labCoat);
  rightSleeve.position.y = -0.26;
  rightSleeve.castShadow = true;
  const rightHand = new THREE.Mesh(handGeo, mats.skinTone);
  rightHand.position.y = -0.56;
  rightArm.add(rightSleeve, rightHand);
  rightArm.rotation.z = 0.14;
  root.add(rightArm);

  // 5. Head, Hair, Mustache & Lab Goggles
  const head = new THREE.Group();
  head.position.set(0, 1.78, 0);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 18), mats.skinTone);
  skull.castShadow = true;
  head.add(skull);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.225, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    mats.labCoat
  );
  hair.position.set(0, 0.05, -0.02);
  hair.rotation.x = 0.25;
  head.add(hair);

  const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.05), mats.labCoat);
  mustache.position.set(0, -0.05, 0.19);
  head.add(mustache);

  // Goggles pushed slightly onto forehead so warm eyes show
  const goggleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.09, 0.08), mats.darkChassis);
  goggleFrame.position.set(0, 0.09, 0.17);
  head.add(goggleFrame);

  const lensGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12);
  lensGeo.rotateX(Math.PI / 2);
  const lensL = new THREE.Mesh(lensGeo, mats.goggleLens);
  lensL.position.set(-0.07, 0.09, 0.2);
  const lensR = lensL.clone();
  lensR.position.x = 0.07;
  head.add(lensL, lensR);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.022, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, mats.darkHair);
  eyeL.position.set(-0.068, 0.01, 0.19);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.068;
  head.add(eyeL, eyeR);

  root.add(head);

  return { root, head, rightArm, leftArm, leftLeg, rightLeg };
}

export interface RakaHumanRig {
  root: THREE.Group;
  head: THREE.Group;
  rightArm: THREE.Group;
}

// Grandchild Raka sitting energetically & healthy on recovery bed
export function createGrandchildRakaModel(mats: MaterialLibrary): RakaHumanRig {
  const root = new THREE.Group();

  // Seated legs extending forward (+Z)
  const legGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.45, 10);
  legGeo.rotateX(Math.PI / 2);
  const legL = new THREE.Mesh(legGeo, mats.labPants);
  legL.position.set(-0.11, 0.08, 0.22);
  const legR = legL.clone();
  legR.position.x = 0.11;
  root.add(legL, legR);

  // Cheerful sky-blue sweater torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.44, 14), mats.rakaShirt);
  torso.position.set(0, 0.3, 0);
  torso.castShadow = true;
  root.add(torso);

  // Left arm resting on lap
  const armGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.38, 10);
  const handGeo = new THREE.SphereGeometry(0.055, 10, 10);
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.23, 0.46, 0);
  const lMesh = new THREE.Mesh(armGeo, mats.rakaShirt);
  lMesh.position.y = -0.17;
  const lHand = new THREE.Mesh(handGeo, mats.skinTone);
  lHand.position.y = -0.37;
  leftArm.add(lMesh, lHand);
  leftArm.rotation.x = -0.45;
  root.add(leftArm);

  // Right arm raised to wave happily
  const rightArm = new THREE.Group();
  rightArm.position.set(0.23, 0.46, 0);
  const rMesh = new THREE.Mesh(armGeo, mats.rakaShirt);
  rMesh.position.y = 0.16;
  const rHand = new THREE.Mesh(handGeo, mats.skinTone);
  rHand.position.y = 0.36;
  rightArm.add(rMesh, rHand);
  rightArm.rotation.z = -0.35;
  root.add(rightArm);

  // Head & Smiling Face
  const head = new THREE.Group();
  head.position.set(0, 0.68, 0.02);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), mats.skinTone);
  skull.castShadow = true;
  head.add(skull);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.195, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    mats.darkHair
  );
  hairCap.position.set(0, 0.03, -0.02);
  hairCap.rotation.x = 0.2;
  head.add(hairCap);

  // Bright happy eyes
  const eyeGeo = new THREE.SphereGeometry(0.022, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, mats.darkHair);
  eyeL.position.set(-0.06, 0.02, 0.165);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.06;
  head.add(eyeL, eyeR);

  // Big cheerful smile curve
  const smileGeo = new THREE.TorusGeometry(0.055, 0.012, 6, 12, Math.PI);
  const smileMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
  const smile = new THREE.Mesh(smileGeo, smileMat);
  smile.position.set(0, -0.04, 0.168);
  smile.rotation.z = Math.PI;
  head.add(smile);

  root.add(head);

  return { root, head, rightArm };
}
