import * as THREE from 'three';
import {
  getTunnelCenterAtZ,
  getTunnelRadiusAtZ,
  BloodCellBody,
  ForkSeptumBody,
} from './world';
import { ZONES, ZoneIndex } from './types';

export interface PodPhysicsState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  radius: number;
  pitch: number;
  yaw: number;
  roll: number;
}

const _center = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _normal = new THREE.Vector3();

export function getZoneIndexAtZ(z: number): ZoneIndex {
  if (z > -140) return 0;
  if (z > -480) return 1;
  if (z > -920) return 2;
  if (z > -1420) return 3;
  if (z > -1780) return 4;
  if (z > -2420) return 5;
  if (z > -3120) return 6;
  if (z > -4420) return 7;
  if (z > -6040) return 8;
  return 9;
}

export function stepPodPhysics(
  pod: PodPhysicsState,
  thrustInput: THREE.Vector3,
  dt: number,
  heartBeatWave: number,
  bloodCells: BloodCellBody[],
  forkSepta: ForkSeptumBody[] = []
): { wallImpactSpeed: number; obstacleImpactSpeed: number; cellBumps: number } {
  const zoneIdx = getZoneIndexAtZ(pod.pos.z);
  const zone = ZONES[zoneIdx];

  // 1. Apply Thruster Acceleration
  const accel = zoneIdx >= 5 ? 58.0 : 48.0;
  pod.vel.addScaledVector(thrustInput, accel * dt);

  // 2. Apply Anatomical Fluid Current & Cardiac Pulse Wave
  pod.vel.z += zone.currentZ * dt * 1.45;
  if (zoneIdx === 4 && heartBeatWave > 0.7) {
    pod.vel.z += (heartBeatWave - 0.7) * 8.5 * dt;
  }

  // 3. Hydrodynamic Viscous Fluid Drag
  const dragFactor = Math.exp(-zone.viscosity * dt);
  pod.vel.multiplyScalar(dragFactor);

  // Clamp max velocity
  const maxSpeed = zoneIdx >= 5 ? 56 : 44;
  if (pod.vel.lengthSq() > maxSpeed * maxSpeed) {
    pod.vel.setLength(maxSpeed);
  }

  // 4. Integrate Position
  pod.pos.addScaledVector(pod.vel, dt);

  // Clamp entry Z bound at Mouth (+8); allow flying past ANUS_EXIT_Z (-6200) to trigger ending
  if (pod.pos.z > 8) {
    pod.pos.z = 8;
    if (pod.vel.z > 0) pod.vel.z *= -0.4;
  } else if (pod.pos.z < -6240) {
    pod.pos.z = -6240;
  }

  // 5. Elastic Organic Tunnel Wall Collision
  getTunnelCenterAtZ(pod.pos.z, _center);
  const maxR = Math.max(1.8, getTunnelRadiusAtZ(pod.pos.z) - pod.radius - 0.35);

  const dx = pod.pos.x - _center.x;
  const dy = pod.pos.y - _center.y;
  const radialDist = Math.hypot(dx, dy);

  let wallImpactSpeed = 0;
  if (radialDist > maxR && radialDist > 0.0001) {
    const nx = dx / radialDist;
    const ny = dy / radialDist;

    pod.pos.x = _center.x + nx * maxR;
    pod.pos.y = _center.y + ny * maxR;

    const vn = pod.vel.x * nx + pod.vel.y * ny;
    if (vn > 0) {
      wallImpactSpeed = vn;
      const restitution = 0.56;
      pod.vel.x -= (1 + restitution) * vn * nx;
      pod.vel.y -= (1 + restitution) * vn * ny;
    }
  }

  // 6. Central Bifurcation Septum Pillar Collision (forces Left or Right sub-corridor choice!)
  let obstacleImpactSpeed = 0;
  for (let i = 0; i < forkSepta.length; i++) {
    const sep = forkSepta[i];
    if (Math.abs(pod.pos.z - sep.pos.z) > 5.0) continue;
    const sx = pod.pos.x - sep.pos.x;
    const sz = pod.pos.z - sep.pos.z;
    const minDist = pod.radius + sep.radius;
    const dSq = sx * sx + sz * sz;
    if (dSq < minDist * minDist && dSq > 0.0001) {
      const dist = Math.sqrt(dSq);
      const nx = sx / dist;
      const nz = sz / dist;
      pod.pos.x = sep.pos.x + nx * minDist;
      pod.pos.z = sep.pos.z + nz * minDist;

      const vn = pod.vel.x * nx + pod.vel.z * nz;
      if (vn < 0) {
        obstacleImpactSpeed = Math.max(obstacleImpactSpeed, -vn);
        const restitution = 0.65;
        pod.vel.x -= (1 + restitution) * vn * nx;
        pod.vel.z -= (1 + restitution) * vn * nz;
      }
    }
  }

  // 7. Elastic Momentum Exchange with Floating Erythrocytes
  let cellBumps = 0;
  for (let i = 0; i < bloodCells.length; i++) {
    const cell = bloodCells[i];
    if (Math.abs(cell.pos.z - pod.pos.z) > 2.6) continue;
    _delta.subVectors(cell.pos, pod.pos);
    const minDist = pod.radius + cell.radius;
    const dSq = _delta.lengthSq();
    if (dSq < minDist * minDist && dSq > 0.0001) {
      const dist = Math.sqrt(dSq);
      _normal.copy(_delta).divideScalar(dist);
      const overlap = minDist - dist;
      cell.pos.addScaledVector(_normal, overlap * 0.85);
      pod.pos.addScaledVector(_normal, -overlap * 0.15);

      const impulse = 8.5 + pod.vel.length() * 0.65;
      cell.vel.addScaledVector(_normal, impulse);
      cell.angVel.x += (Math.random() - 0.5) * 4.5;
      cell.angVel.y += (Math.random() - 0.5) * 4.5;
      cellBumps++;
    }
  }

  return { wallImpactSpeed, obstacleImpactSpeed, cellBumps };
}
