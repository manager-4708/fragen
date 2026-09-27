import { solveBeamFromPhase, solveSliderCrankVertical } from "./src/mechanics/kinematics.js";

const beamCfg = {
  pistonX: 0.3,
  fulcrumX: 0.95,
  fulcrumY: 2.38,
  armPiston: 0.65,
  armPump: 1.35,
  pistonRodLen: 1.005,
  stroke: 0.55,
  pumpPlungerRodLen: 0.85,
};

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

let minY = Infinity;
let maxY = -Infinity;
for (let i = 0; i <= 120; i++) {
  const phase = i / 120;
  const sol = solveBeamFromPhase(phase, beamCfg);
  const armErr = Math.abs(dist(sol.pistonAttach, { x: beamCfg.fulcrumX, y: beamCfg.fulcrumY }) - beamCfg.armPiston);
  if (armErr > 0.001) {
    console.error("Piston arm length drift", phase, armErr);
    process.exit(1);
  }
  const wrist = { x: beamCfg.pistonX, y: sol.wristY };
  const rodLen = dist(wrist, sol.pistonAttach);
  if (Math.abs(rodLen - beamCfg.pistonRodLen) > 0.02) {
    console.error("Piston rod inconsistent", phase, rodLen);
    process.exit(1);
  }
  minY = Math.min(minY, sol.pistonY);
  maxY = Math.max(maxY, sol.pistonY);
}

const stroke = maxY - minY;
if (Math.abs(stroke - beamCfg.stroke) > 0.08) {
  console.error("Beam stroke mismatch", stroke);
  process.exit(1);
}

let prevY = null;
for (let i = 0; i <= 60; i++) {
  const phi = (i / 60) * Math.PI * 2;
  const sol = solveSliderCrankVertical({
    crankAngle: phi,
    crankRadius: 0.22,
    rodLength: 0.9,
    crankCenterX: 0.65,
    crankCenterY: 1.2,
    pistonX: 0.3,
    pistonWristOffset: 0.075,
  });
  const pinDist = Math.hypot(sol.pin.x - 0.65, sol.pin.y - 1.2);
  if (Math.abs(pinDist - 0.22) > 0.001) {
    console.error("Crank pin radius wrong", pinDist);
    process.exit(1);
  }
  const rodLen = Math.hypot(sol.pin.x - 0.3, sol.pin.y - sol.wristY);
  if (Math.abs(rodLen - 0.9) > 0.02) {
    console.error("Connecting rod length wrong", rodLen);
    process.exit(1);
  }
  if (prevY !== null && Math.abs(sol.pistonY - prevY) > 0.35) {
    console.error("Piston jumped discontinuously");
    process.exit(1);
  }
  prevY = sol.pistonY;
}

console.log("verify-kinematics: OK", { beamStroke: stroke });
