import { createLoadState, loadStep } from "./loads.js";

const DT = 1 / 60;

/**
 * Physikalisch plausibles Gesamtmodell: Kessel, Maschine, Verluste, Last.
 */
export class SteamSimulation {
  /** @param {import('../data/constructions.js').Construction} construction */
  constructor(construction) {
    this.construction = construction;
    this.reset();
  }

  reset() {
    const c = this.construction;
    this.timeS = 0;
    this.running = false;
    this.coalKg = 0;
    this.coalRateKgS = 0;
    this.boilerPressureBar = 0.2;
    this.boilerWater = c.boiler.waterCapacityL * 0.9;
    this.steamFraction = 0;
    this.pistonPhase = 0;
    this.strokeCount = 0;
    this.shaftPowerW = 0;
    this.mechanicalWorkJ = 0;
    this.heatInputJ = 0;
    this.lossExhaustJ = 0;
    this.lossInjectionJ = 0;
    this.lossRadiationJ = 0;
    this.load = createLoadState(c.scenario);
    this.taskComplete = false;
    this.telemetry = {};
  }

  start() {
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  /** Kohle manuell nachlegen (Schaufeln) */
  addCoal(kg = 5) {
    this.coalKg += kg;
  }

  /** @param {number} dt seconds */
  tick(dt = DT) {
    if (!this.running || this.taskComplete) return;

    const c = this.construction;
    const b = c.boiler;
    const e = c.engine;

    const targetCoalRate = this.coalKg > 0.01 ? Math.min(0.12, this.coalKg * 0.15) : 0;
    this.coalRateKgS = targetCoalRate;
    const coalBurned = Math.min(this.coalKg, this.coalRateKgS * dt);
    this.coalKg -= coalBurned;

    const heatIn = coalBurned * b.coalHeatMJPerKg * 1e6 * b.boilEfficiency;
    this.heatInputJ += heatIn;

    const pressureTarget = b.maxPressureBar * Math.min(1, Math.sqrt(heatIn / (dt * 2e6 + 1)));
    this.boilerPressureBar += (pressureTarget - this.boilerPressureBar) * Math.min(1, dt * 0.8);
    this.boilerPressureBar = Math.max(0.1, Math.min(b.maxPressureBar, this.boilerPressureBar));

    this.boilerWater -= coalBurned * 0.4;
    if (this.boilerWater < 100) {
      this.boilerWater = c.boiler.waterCapacityL * 0.85;
    }

    const radiation = heatIn * 0.06;
    this.lossRadiationJ += radiation;

    let shaftPower = 0;
    let exhaustLoss = 0;
    let injectionLoss = 0;

    if (c.archetype === "turbine") {
      const te = c.engine;
      const steamEnthalpy = heatIn * 0.55;
      const idealPower = steamEnthalpy / dt;
      shaftPower = idealPower * te.isentropicEfficiency * te.mechanicalEfficiency;
      exhaustLoss = heatIn * te.exhaustLossFactor;
      this.lossExhaustJ += exhaustLoss;
      this.pistonPhase = (this.pistonPhase + dt * (te.maxRpm / 60)) % 1;
    } else {
      const area = Math.PI * (e.cylinderDiameterM / 2) ** 2;
      const strokeVol = area * e.strokeM;
      const spm = e.strokesPerMin / 60;
      this.pistonPhase = (this.pistonPhase + dt * spm) % 1;
      if (this.pistonPhase < dt * spm) this.strokeCount += 1;

      let effectivePressure = Math.max(0, (this.boilerPressureBar - 1) * 1e5);
      let archetypeFactor = 1;
      if (c.archetype === "newcomen") {
        effectivePressure = Math.max(0, 0.92e5 * (this.boilerPressureBar / b.maxPressureBar));
        effectivePressure *= 1 - e.injectionLossFactor;
        archetypeFactor = 0.55;
      } else {
        if (e.expansionFactor) archetypeFactor *= 1.12;
        if (e.condenserSeparate) archetypeFactor *= 1.18;
      }

      const strokesPerSec = spm;
      const volPerSec = strokeVol * strokesPerSec * (e.doubleActing ? 2 : 1);
      const indicatedPower = effectivePressure * volPerSec * archetypeFactor;

      injectionLoss = heatIn * e.injectionLossFactor * (e.condenserSeparate ? 0.35 : 1);
      exhaustLoss = heatIn * e.exhaustLossFactor;
      this.lossInjectionJ += injectionLoss;
      this.lossExhaustJ += exhaustLoss;

      shaftPower = indicatedPower * e.mechanicalEfficiency;
    }

    shaftPower = Math.max(0, shaftPower * (this.coalKg > 0 || this.boilerPressureBar > 0.5 ? 1 : 0.3));
    this.shaftPowerW = shaftPower;
    this.mechanicalWorkJ += shaftPower * dt;

    const loadResult = loadStep(this.load, c.scenario, dt, shaftPower);
    this.taskComplete = loadResult.complete;
    this.timeS += dt;

    const usefulWorkRate = loadResult.powerRequiredW;
    this.telemetry = {
      pressureBar: this.boilerPressureBar,
      shaftPowerKW: shaftPower / 1000,
      coalKg: this.coalKg,
      coalBurnedTotalKg: this.heatInputJ / (b.coalHeatMJPerKg * 1e6 * b.boilEfficiency + 1),
      progress: loadResult.progress,
      usefulPowerKW: usefulWorkRate / 1000,
      pistonPhase: this.pistonPhase,
      strokes: this.strokeCount,
      ...loadResult.detail,
    };
  }

  /** Nutzarbeit / zugeführte Wärme (Kohle) — für Experten, nicht Haupt-UI */
  getCoalEfficiencyRatio() {
    const coalEnergy = this.heatInputJ;
    if (coalEnergy < 1) return 0;
    return this.mechanicalWorkJ / coalEnergy;
  }

  /** Kohle pro Fortschrittseinheit (je kleiner, desto besser) */
  getCoalPerProgress() {
    const burned = this.heatInputJ / (this.construction.boiler.coalHeatMJPerKg * 1e6 * 0.45);
    const p = this.telemetry.progress || 0.001;
    return burned / Math.max(0.001, p);
  }

  getEnergyFlows() {
    const total = this.heatInputJ + 1;
    return {
      useful: this.mechanicalWorkJ,
      exhaust: this.lossExhaustJ,
      injection: this.lossInjectionJ,
      radiation: this.lossRadiationJ,
      remaining: Math.max(0, total - this.mechanicalWorkJ - this.lossExhaustJ - this.lossInjectionJ - this.lossRadiationJ),
    };
  }
}
