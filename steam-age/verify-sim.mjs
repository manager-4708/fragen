import { getConstruction } from "./src/data/constructions.js";
import { SteamSimulation } from "./src/sim/engine.js";

function runPumpScenario(constructionId, seconds = 120, steps = 60 * seconds) {
  const sim = new SteamSimulation(getConstruction(constructionId));
  sim.coalKg = 80;
  sim.start();
  for (let i = 0; i < steps; i++) sim.tick(1 / 60);
  return sim;
}

const newcomen = runPumpScenario("newcomen-1712");
const watt = runPumpScenario("watt-crofton");

if (newcomen.telemetry.progress <= 0) {
  console.error("Newcomen made no progress");
  process.exit(1);
}

if (watt.telemetry.progress <= newcomen.telemetry.progress) {
  console.error("Expected Watt to outperform Newcomen on same pump task");
  process.exit(1);
}

const newcomenCoal = newcomen.getCoalPerProgress();
const wattCoal = watt.getCoalPerProgress();
if (wattCoal >= newcomenCoal) {
  console.error(`Watt should use less coal per progress: watt=${wattCoal} newcomen=${newcomenCoal}`);
  process.exit(1);
}

for (const id of [
  "cornish-levant",
  "puffing-billy",
  "fowler-plough",
  "great-britain-paddle",
  "parsons-turbine",
]) {
  const sim = runPumpScenario(id, 60);
  if (sim.heatInputJ <= 0 || sim.telemetry.progress <= 0.001) {
    console.error(`Simulation stalled for ${id}`, sim.telemetry.progress);
    process.exit(1);
  }
}

console.log("verify-sim: OK");
console.log(
  JSON.stringify({
    newcomenProgress: newcomen.telemetry.progress,
    wattProgress: watt.telemetry.progress,
    newcomenCoalPerProgress: newcomenCoal,
    wattCoalPerProgress: wattCoal,
  }),
);
