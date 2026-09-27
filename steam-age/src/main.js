import { CONSTRUCTIONS, getConstruction, constructionsByEra } from "./data/constructions.js";
import { scenarioLabel } from "./sim/loads.js";
import { SteamSimulation } from "./sim/engine.js";
import { MachineScene } from "./render/machineScene.js";
import { CoalHeapViz } from "./ui/coalViz.js";
import { EnergyFlowViz } from "./ui/energyFlow.js";
import { TaskMeterViz } from "./ui/taskMeters.js";

const $ = (id) => document.getElementById(id);

const titleEl = $("title");
const blurbEl = $("blurb");
const museumEl = $("museum");
const scenarioEl = $("scenario");
const timelineEl = $("timeline");
const telemetryEl = $("telemetry");
const expertEl = $("expert");

const viewCanvas = $("view");
const coalMain = $("coalMain");
const coalGhost = $("coalGhost");
const energyCanvas = $("energyFlow");
const taskRoot = $("taskMeter");

const scene = new MachineScene(viewCanvas);
const coalViz = new CoalHeapViz(coalMain, "Deine Maschine");
const ghostViz = new CoalHeapViz(coalGhost, "Referenz (Newcomen)");
ghostViz.ghost = true;
const flowViz = new EnergyFlowViz(energyCanvas);
const taskMeter = new TaskMeterViz(taskRoot);

let currentId = CONSTRUCTIONS[0].id;
let sim = new SteamSimulation(getConstruction(currentId));
let ghostSim = new SteamSimulation(getConstruction("newcomen-1712"));
let compareEnabled = true;
const COAL_START = 50;

function buildTimeline() {
  timelineEl.innerHTML = "";
  for (const c of constructionsByEra()) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${c.year} · ${c.title.split(" ")[0]}…`;
    btn.title = c.title;
    btn.dataset.id = c.id;
    if (c.id === currentId) btn.classList.add("active");
    btn.addEventListener("click", () => selectConstruction(c.id));
    timelineEl.appendChild(btn);
  }
}

function selectConstruction(id) {
  currentId = id;
  const c = getConstruction(id);
  sim = new SteamSimulation(c);
  sim.coalKg = COAL_START;
  ghostSim = new SteamSimulation(getConstruction("newcomen-1712"));
  ghostSim.coalKg = COAL_START;

  titleEl.textContent = c.title;
  blurbEl.textContent = c.blurb;
  museumEl.innerHTML = `Museum / Exemplar: <a href="${c.museumUrl}" target="_blank" rel="noopener">${c.museum}</a> · ${c.era}`;
  scenarioEl.textContent = `Aufgabe: ${scenarioLabel(c.scenario)}`;

  scene.loadConstruction(c);
  buildTimeline();
  updateStaticCoal();
  renderFrame(0);
}

function updateStaticCoal() {
  coalViz.setCoal(sim.coalKg, sim.telemetry.coalBurnedTotalKg ?? 0, COAL_START);
  ghostViz.setCoal(ghostSim.coalKg, ghostSim.telemetry.coalBurnedTotalKg ?? 0, COAL_START);
}

function syncGhostScenario() {
  const main = getConstruction(currentId);
  if (main.scenario.kind === "pump") {
    ghostSim.load.targetVolumeM3 = main.scenario.targetVolumeM3;
    ghostSim.load.liftM = main.scenario.liftM;
  }
}

function renderTelemetry() {
  const t = sim.telemetry;
  telemetryEl.innerHTML = `
    <span>Druck: <b>${t.pressureBar?.toFixed(2) ?? "—"}</b> bar</span>
    <span>Welle: <b>${t.shaftPowerKW?.toFixed(1) ?? "0"}</b> kW</span>
    <span>Takte: <b>${t.strokes ?? 0}</b></span>
    <span>Fortschritt: <b>${((t.progress ?? 0) * 100).toFixed(0)}%</b></span>
  `;
  expertEl.textContent = JSON.stringify(
    {
      coalEfficiencyRatio: sim.getCoalEfficiencyRatio().toFixed(3),
      coalPerProgressKg: sim.getCoalPerProgress().toFixed(2),
      energyFlows: sim.getEnergyFlows(),
    },
    null,
    2,
  );
}

function renderFrame(dt) {
  const progress = sim.telemetry.progress ?? 0;
  coalViz.setCoal(sim.coalKg, sim.heatInputJ / (24e6 * 0.42), COAL_START);
  coalViz.draw(progress);

  const showGhost = compareEnabled && currentId !== "newcomen-1712";
  $("coalGhost").closest(".coal-row").style.opacity = showGhost ? "1" : "0.35";
  if (showGhost) {
    ghostViz.setCoal(ghostSim.coalKg, ghostSim.heatInputJ / (24e6 * 0.42), COAL_START);
    ghostViz.draw(ghostSim.telemetry.progress ?? 0);
  } else {
    ghostViz.draw(0);
  }

  flowViz.update(sim.getEnergyFlows());
  flowViz.draw(dt);
  taskMeter.render(getConstruction(currentId), sim.telemetry, progress);
  scene.update(sim.telemetry, dt);
  renderTelemetry();
}

let last = performance.now();
let speed = 1;

function loop(now) {
  const dtReal = Math.min(0.05, (now - last) / 1000);
  last = now;
  const dt = dtReal * speed;

  if (sim.running && !sim.taskComplete) {
    sim.tick(dt);
    if (compareEnabled && currentId !== "newcomen-1712") {
      syncGhostScenario();
      if (!ghostSim.taskComplete) ghostSim.tick(dt);
    }
  }

  renderFrame(dtReal);
  requestAnimationFrame(loop);
}

$("run").addEventListener("click", () => {
  if (sim.taskComplete) {
    sim.reset();
    sim.coalKg = COAL_START;
    ghostSim.reset();
    ghostSim.coalKg = COAL_START;
  }
  sim.start();
  ghostSim.start();
});

$("coal").addEventListener("click", () => {
  sim.addCoal(10);
  ghostSim.addCoal(10);
});

$("reset").addEventListener("click", () => {
  sim.reset();
  sim.coalKg = COAL_START;
  ghostSim.reset();
  ghostSim.coalKg = COAL_START;
  sim.stop();
  ghostSim.stop();
});

$("compare").addEventListener("change", (e) => {
  compareEnabled = e.target.checked;
});

$("speed").addEventListener("change", (e) => {
  speed = parseFloat(e.target.value);
});

window.addEventListener("resize", () => {
  scene.resize();
  coalViz.resize();
  ghostViz.resize();
  flowViz.resize();
});

selectConstruction(currentId);
scene.resize();
coalViz.resize();
ghostViz.resize();
flowViz.resize();
sim.coalKg = COAL_START;
ghostSim.coalKg = COAL_START;
requestAnimationFrame(loop);
