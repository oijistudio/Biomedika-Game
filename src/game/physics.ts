import * as THREE from 'three';
import { getTunnelCenterAtZ, getTunnelRadiusAtZ, BloodCellBody } from './world';
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
  if (z > -130) return 0;
  if (z > -330) return 1;
  if (z > -540) return 2;
  if (z > -760) return 3;
  if (z > -2480) return 4;
  return 5;
}

export function stepPodPhysics(
  pod: PodPhysicsState,
  thrustInput: THREE.Vector3,
  dt: number,
  heartBeatWave: number,
  bloodCells: BloodCellBody[]
): { wallImpactSpeed: number; cellBumps: number } {
  const zoneIdx = getZoneIndexAtZ(pod.pos.z);
  const zone = ZONES[zoneIdx];

  // 1. Apply Thruster Acceleration
  const accel = zoneIdx >= 4 ? 54.0 : 46.0;
  pod.vel.addScaledVector(thrustInput, accel * dt);

  // 2. Apply Anatomical Fluid Current & Cardiac Pulse Wave
  pod.vel.z += zone.currentZ * dt * 1.45;
  if (zoneIdx === 3 && heartBeatWave > 0.7) {
    // Rhythmic systolic pulse nudges pod gently
    pod.vel.z += (heartBeatWave - 0.7) * 8.5 * dt;
  }

  // 3. Hydrodynamic Viscous Fluid Drag (frame-rate independent exponential damping)
  const dragFactor = Math.exp(-zone.viscosity * dt);
  pod.vel.multiplyScalar(dragFactor);

  // Clamp max velocity (faster in endless digestive corridor)
  const maxSpeed = zoneIdx >= 4 ? 52 : 42;
  if (pod.vel.lengthSq() > maxSpeed * maxSpeed) {
    pod.vel.setLength(maxSpeed);
  }

  // 4. Integrate Position
  pod.pos.addScaledVector(pod.vel, dt);

  // Clamp entry Z bound at Mouth (+8); allow flying past ANUS_EXIT_Z (-2585) to trigger ending
  if (pod.pos.z > 8) {
    pod.pos.z = 8;
    if (pod.vel.z > 0) pod.vel.z *= -0.4;
  } else if (pod.pos.z < -2610) {
    pod.pos.z = -2610;
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

    // Push back inside wall
    pod.pos.x = _center.x + nx * maxR;
    pod.pos.y = _center.y + ny * maxR;

    // Velocity along outward normal
    const vn = pod.vel.x * nx + pod.vel.y * ny;
    if (vn > 0) {
      wallImpactSpeed = vn;
      const restitution = 0.56;
      pod.vel.x -= (1 + restitution) * vn * nx;
      pod.vel.y -= (1 + restitution) * vn * ny;
    }
  }

  // 6. Elastic Momentum Exchange with Floating Erythrocytes (Red Blood Cells)
  let cellBumps = 0;
  for (let i = 0; i < bloodCells.length; i++) {
    const cell = bloodCells[i];
    // Fast Z-slab cull
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

      // Transfer impulse to blood cell
      const impulse = 8.5 + pod.vel.length() * 0.65;
      cell.vel.addScaledVector(_normal, impulse);
      cell.angVel.x += (Math.random() - 0.5) * 4.5;
      cell.angVel.y += (Math.random() - 0.5) * 4.5;
      cellBumps++;
    }
  }

  return { wallImpactSpeed, cellBumps };
}
