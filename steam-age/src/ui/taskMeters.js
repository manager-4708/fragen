/**
 * Aufgabenbezogene Nutzen-Anzeige (Wassersäule, Strecke, …).
 */

export class TaskMeterViz {
  /** @param {HTMLElement} root */
  constructor(root) {
    this.root = root;
  }

  /** @param {import('../data/constructions.js').Construction} construction */
  /** @param {object} telemetry */
  render(construction, telemetry, progress) {
    const s = construction.scenario;
    let html = "";

    switch (s.kind) {
      case "pump": {
        const maxH = 120;
        const h = progress * maxH;
        html = `
          <div class="task-meter pump">
            <div class="shaft-label">Wassersäule (${s.liftM} m Schacht)</div>
            <div class="shaft" style="height:${maxH}px">
              <div class="water" style="height:${h}px"></div>
            </div>
            <p>${(telemetry.waterM3 ?? 0).toFixed(2)} / ${s.targetVolumeM3} m³ gehoben</p>
          </div>`;
        break;
      }
      case "rail":
        html = `
          <div class="task-meter rail">
            <div class="track"><div class="train" style="left:${progress * 100}%"></div></div>
            <p>${((telemetry.distanceM ?? 0) / 1000).toFixed(2)} / ${s.targetDistanceM / 1000} km · ${(telemetry.velocityKmh ?? 0).toFixed(1)} km/h</p>
          </div>`;
        break;
      case "plough":
        html = `
          <div class="task-meter plough">
            <div class="field"><div class="furrow" style="width:${progress * 100}%"></div></div>
            <p>${(telemetry.furrowM ?? 0).toFixed(0)} / ${s.targetDistanceM} m Furrow</p>
          </div>`;
        break;
      case "ship":
        html = `
          <div class="task-meter ship">
            <div class="sea"><div class="buoy-line" style="width:${progress * 100}%"></div></div>
            <p>${((telemetry.distanceM ?? 0) / 1000).toFixed(2)} / ${s.targetDistanceM / 1000} km · ${(telemetry.knots ?? 0).toFixed(1)} kn</p>
          </div>`;
        break;
      case "turbine":
        html = `
          <div class="task-meter turbine">
            <div class="rotor" style="--spin:${telemetry.rpm ?? 0}deg"></div>
            <p>${(telemetry.energyMJ ?? 0).toFixed(1)} / ${s.targetEnergyMJ} MJ Wellenenergie</p>
          </div>`;
        break;
    }

    this.root.innerHTML = html;
  }
}
