import * as THREE from "three";

/**
 * Geometrische Kinematik für schematische Dampfmaschinen (2D-Ebene).
 * Kolbenhub aus Sim-Phase; Gelenke aus Stangen- und Pivot-Constraints.
 */

/** @param {number} phase 0..1 */
export function pistonDisplacementFromPhase(phase, stroke = 0.55) {
  return Math.sin(phase * Math.PI * 2) * stroke;
}

/**
 * Wippen: Sim-Phase kippt den Balken; Kolben und Pumpe folgen über Stangen (ein Freiheitsgrad).
 * @param {number} phase 0..1
 */
export function solveBeamFromPhase(phase, p) {
  const maxTheta =
    p.maxTheta ?? Math.asin(Math.min(1, p.stroke / (2 * Math.max(p.armPiston, 0.01))));
  const theta = maxTheta * Math.sin(phase * Math.PI * 2);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const pistonAttach = {
    x: p.fulcrumX - p.armPiston * cos,
    y: p.fulcrumY - p.armPiston * sin,
  };
  const pumpAttach = {
    x: p.fulcrumX + p.armPump * cos,
    y: p.fulcrumY + p.armPump * sin,
  };
  const wrist = p.pistonWristOffset ?? 0.075;
  const dx = pistonAttach.x - p.pistonX;
  const dy2 = p.pistonRodLen * p.pistonRodLen - dx * dx;
  const wristY = dy2 > 0 ? pistonAttach.y - Math.sqrt(dy2) : pistonAttach.y - p.pistonRodLen;
  const pistonY = wristY - wrist;
  return { theta, pistonAttach, pumpAttach, pistonY, wristY };
}

/** Kurbel → vertikal geführter Kolben (festes pistonX). */
export function solveSliderCrankVertical(p) {
  const r = p.crankRadius;
  const L = p.rodLength;
  const phi = p.crankAngle;
  const wrist = p.pistonWristOffset ?? 0;
  const pinX = p.crankCenterX + r * Math.cos(phi);
  const pinY = p.crankCenterY + r * Math.sin(phi);
  const dx = pinX - p.pistonX;
  const under = L * L - dx * dx;
  const wristY = under > 0 ? pinY - Math.sqrt(under) : pinY - L;
  const pistonY = wristY - wrist;
  return {
    pistonY,
    wristY,
    pin: { x: pinX, y: pinY },
    crankAngle: phi,
  };
}

/**
 * @param {THREE.Vector3} a
 * @param {THREE.Vector3} b
 * @param {THREE.Mesh} mesh Zylinder entlang lokaler Y
 * @param {number} geomHeight native Zylinderhöhe der Geometrie
 */
export function alignRodBetween(a, b, mesh, geomHeight) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mesh.position.copy(mid);
  const dir = b.clone().sub(a);
  const len = dir.length();
  if (len < 1e-6) {
    mesh.scale.set(1, 0.001, 1);
    return;
  }
  mesh.scale.set(1, len / geomHeight, 1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
}

/** @param {number} radius */
export function createRodMesh(radius, color = 0x888888) {
  const h = 1;
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, h, 10),
    new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.45 }),
  );
  mesh.userData.rodGeomHeight = h;
  return mesh;
}
