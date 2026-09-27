/**
 * Lastmodelle für verschiedene Szenarien.
 */

export function createLoadState(scenario) {
  switch (scenario.kind) {
    case "pump":
      return {
        kind: "pump",
        waterVolumeM3: 0,
        targetVolumeM3: scenario.targetVolumeM3,
        liftM: scenario.liftM,
        instantaneousPowerW: 0,
      };
    case "rail":
      return {
        kind: "rail",
        distanceM: 0,
        targetDistanceM: scenario.targetDistanceM,
        velocityMs: 0,
        trainMassKg: scenario.trainMassKg,
        gradePercent: scenario.gradePercent,
        rollingResistance: scenario.rollingResistance,
      };
    case "plough":
      return {
        kind: "plough",
        distanceM: 0,
        targetDistanceM: scenario.targetDistanceM,
        draftForceN: scenario.draftForceN,
        velocityMs: 0,
      };
    case "ship":
      return {
        kind: "ship",
        distanceM: 0,
        targetDistanceM: scenario.targetDistanceM,
        velocityMs: 0,
        hullDragCoeff: scenario.hullDragCoeff,
        displacementKg: scenario.displacementKg,
      };
    case "turbine":
      return {
        kind: "turbine",
        energyDeliveredMJ: 0,
        targetEnergyMJ: scenario.targetEnergyMJ,
        shaftPowerKW: 0,
        rpm: 0,
      };
    default:
      throw new Error(`Unknown scenario ${scenario.kind}`);
  }
}

/**
 * @returns {{ powerRequiredW: number, progress: number, complete: boolean, detail: Record<string, number> }}
 */
export function loadStep(load, scenario, dt, shaftPowerW) {
  switch (load.kind) {
    case "pump": {
      const g = 9.81;
      const rho = 1000;
      const volumeFlowMax = shaftPowerW > 50 ? (shaftPowerW / (rho * g * load.liftM)) * 0.85 : 0;
      const dV = volumeFlowMax * dt;
      load.waterVolumeM3 = Math.min(load.targetVolumeM3, load.waterVolumeM3 + dV);
      load.instantaneousPowerW = rho * g * load.liftM * volumeFlowMax;
      return {
        powerRequiredW: load.instantaneousPowerW,
        progress: load.waterVolumeM3 / load.targetVolumeM3,
        complete: load.waterVolumeM3 >= load.targetVolumeM3 - 1e-6,
        detail: { waterM3: load.waterVolumeM3, liftM: load.liftM },
      };
    }
    case "rail": {
      const g = 9.81;
      const resist =
        load.trainMassKg *
        g *
        (load.rollingResistance + load.gradePercent / 100);
      const maxV = 12;
      const startThreshold = resist * 0.15;
      if (load.velocityMs < 0.05 && shaftPowerW > startThreshold) {
        load.velocityMs = 0.08 + (shaftPowerW / resist) * 0.02;
      } else if (shaftPowerW > resist * load.velocityMs) {
        const accel = (shaftPowerW - resist * load.velocityMs) / (load.trainMassKg * 2.5);
        load.velocityMs = Math.min(maxV, load.velocityMs + accel * dt * 0.04);
      } else {
        load.velocityMs = Math.max(0, load.velocityMs - dt * 0.15);
      }
      load.distanceM += load.velocityMs * dt;
      const powerRequiredW = resist * load.velocityMs;
      return {
        powerRequiredW,
        progress: load.distanceM / load.targetDistanceM,
        complete: load.distanceM >= load.targetDistanceM,
        detail: { distanceM: load.distanceM, velocityKmh: load.velocityMs * 3.6 },
      };
    }
    case "plough": {
      const need = load.draftForceN * 0.18;
      load.velocityMs =
        shaftPowerW > need
          ? Math.min(1.4, 0.12 + (shaftPowerW / load.draftForceN) * 0.55)
          : Math.max(0, load.velocityMs - dt * 0.2);
      load.distanceM += load.velocityMs * dt;
      return {
        powerRequiredW: load.draftForceN * load.velocityMs,
        progress: load.distanceM / load.targetDistanceM,
        complete: load.distanceM >= load.targetDistanceM,
        detail: { furrowM: load.distanceM },
      };
    }
    case "ship": {
      const drag = load.hullDragCoeff * load.displacementKg * 0.001;
      const powerScale = Math.max(0, shaftPowerW / 500);
      load.velocityMs = Math.min(8, Math.max(load.velocityMs * 0.995, Math.sqrt(powerScale / (drag + 0.5)) * 0.35));
      load.distanceM += load.velocityMs * dt;
      return {
        powerRequiredW: drag * load.velocityMs * load.velocityMs,
        progress: load.distanceM / load.targetDistanceM,
        complete: load.distanceM >= load.targetDistanceM,
        detail: { distanceM: load.distanceM, knots: load.velocityMs * 1.944 },
      };
    }
    case "turbine": {
      const capW = scenario.loadPowerKW * 1000;
      const deliver = Math.min(capW, shaftPowerW) * dt;
      load.energyDeliveredMJ += deliver / 1e6;
      load.shaftPowerKW = deliver / dt / 1000;
      load.rpm = shaftPowerW > 1000 ? 400 + (shaftPowerW / capW) * 1400 : load.rpm * 0.95;
      return {
        powerRequiredW: capW,
        progress: load.energyDeliveredMJ / load.targetEnergyMJ,
        complete: load.energyDeliveredMJ >= load.targetEnergyMJ,
        detail: { energyMJ: load.energyDeliveredMJ, rpm: load.rpm },
      };
    }
    default:
      return { powerRequiredW: 0, progress: 0, complete: false, detail: {} };
  }
}

export function scenarioLabel(scenario) {
  switch (scenario.kind) {
    case "pump":
      return `${scenario.targetVolumeM3} m³ auf ${scenario.liftM} m heben`;
    case "rail":
      return `${scenario.targetDistanceM / 1000} km Strecke (${scenario.trainMassKg} kg)`;
    case "plough":
      return `${scenario.targetDistanceM} m Furrow ziehen`;
    case "ship":
      return `${scenario.targetDistanceM / 1000} km Fahrt`;
    case "turbine":
      return `${scenario.targetEnergyMJ} MJ Wellenenergie`;
    default:
      return "";
  }
}
