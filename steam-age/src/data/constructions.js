/**
 * Historische Konstruktionen (Parameter didaktisch kalibriert, an Museumstypen angelehnt).
 * Quellen: Museumstafeln, Crofton/Kew/Science Museum-Dokumentation, typische Leistungsangaben.
 */

/** @typedef {'pump'|'rail'|'plough'|'ship'|'turbine'} ScenarioKind */

/**
 * @typedef {Object} Construction
 * @property {string} id
 * @property {string} title
 * @property {number} year
 * @property {string} era
 * @property {string} museum
 * @property {string} museumUrl
 * @property {string} blurb
 * @property {'newcomen'|'watt'|'cornish'|'locomotive'|'traction'|'marine'|'turbine'} archetype
 * @property {ScenarioKind} defaultScenario
 * @property {Object} boiler
 * @property {Object} engine
 * @property {Object} scenario
 */

/** @type {Construction[]} */
export const CONSTRUCTIONS = [
  {
    id: "newcomen-1712",
    title: "Newcomen atmospheric engine",
    year: 1712,
    era: "Frühe Grubenpumpe",
    museum: "Black Country Living Museum (Typ / Replik)",
    museumUrl: "https://www.bclm.co.uk/",
    blurb:
      "Atmosphärendruck treibt den Kolben nach unten, nachdem Dampf im Zylinder kondensiert wurde. Jeder Takt kühlt den Zylinder neu — hoher Kohlebedarf.",
    archetype: "newcomen",
    defaultScenario: "pump",
    boiler: {
      fireGrateM2: 0.35,
      coalHeatMJPerKg: 24,
      boilEfficiency: 0.42,
      maxPressureBar: 1.05,
      waterCapacityL: 800,
    },
    engine: {
      cylinderDiameterM: 0.64,
      strokeM: 2.4,
      strokesPerMin: 12,
      mechanicalEfficiency: 0.42,
      condenserSeparate: false,
      injectionLossFactor: 0.45,
      exhaustLossFactor: 0.22,
    },
    scenario: {
      kind: "pump",
      liftM: 30,
      targetVolumeM3: 12,
      pipeDiameterM: 0.12,
    },
  },
  {
    id: "watt-crofton",
    title: "Watt-Boulton (separate condenser)",
    year: 1776,
    era: "Watt & Boulton",
    museum: "Crofton Pumping Station",
    museumUrl: "https://www.croftonbeamengines.org.uk/",
    blurb:
      "Der Kondensator sitzt separat; der Zylinder bleibt heiß. Gleiche Pumpaufgabe wie Newcomen, deutlich weniger Kohle pro Kubikmeter Wasser.",
    archetype: "watt",
    defaultScenario: "pump",
    boiler: {
      fireGrateM2: 0.42,
      coalHeatMJPerKg: 24,
      boilEfficiency: 0.48,
      maxPressureBar: 1.4,
      waterCapacityL: 900,
    },
    engine: {
      cylinderDiameterM: 0.72,
      strokeM: 2.5,
      strokesPerMin: 14,
      mechanicalEfficiency: 0.74,
      condenserSeparate: true,
      injectionLossFactor: 0.06,
      exhaustLossFactor: 0.12,
      doubleActing: true,
    },
    scenario: {
      kind: "pump",
      liftM: 30,
      targetVolumeM3: 12,
      pipeDiameterM: 0.12,
    },
  },
  {
    id: "cornish-levant",
    title: "Cornish Balanced Beam Engine",
    year: 1840,
    era: "Cornish Bergbau",
    museum: "Levant Mine & Beam Engine (National Trust)",
    museumUrl: "https://www.nationaltrust.org.uk/visit/cornwall/levant-mine-and-beam-engine",
    blurb:
      "Großer Balancier, langsame Takte, expansionsfähiger Dampf — für tiefes Heben aus Gruben.",
    archetype: "cornish",
    defaultScenario: "pump",
    boiler: {
      fireGrateM2: 0.55,
      coalHeatMJPerKg: 24,
      boilEfficiency: 0.52,
      maxPressureBar: 2.2,
      waterCapacityL: 1200,
    },
    engine: {
      cylinderDiameterM: 0.9,
      strokeM: 2.8,
      strokesPerMin: 8,
      mechanicalEfficiency: 0.72,
      condenserSeparate: true,
      injectionLossFactor: 0.06,
      exhaustLossFactor: 0.1,
      expansionFactor: 1.35,
    },
    scenario: {
      kind: "pump",
      liftM: 45,
      targetVolumeM3: 15,
      pipeDiameterM: 0.15,
    },
  },
  {
    id: "puffing-billy",
    title: "Puffing Billy (Frühlokomotive)",
    year: 1813,
    era: "Schiene",
    museum: "Science Museum London (Exemplar)",
    museumUrl: "https://www.sciencemuseum.org.uk/objects-and-stories/puffing-billy",
    blurb:
      "Dampf auf der Schiene: Kessel, Doppelwirkender Zylinder, Zahnstange — Zugkraft gegen Reibung und Steigung.",
    archetype: "locomotive",
    defaultScenario: "rail",
    boiler: {
      fireGrateM2: 0.38,
      coalHeatMJPerKg: 24,
      boilEfficiency: 0.45,
      maxPressureBar: 1.8,
      waterCapacityL: 600,
    },
    engine: {
      cylinderDiameterM: 0.28,
      strokeM: 0.48,
      strokesPerMin: 32,
      mechanicalEfficiency: 0.68,
      condenserSeparate: false,
      injectionLossFactor: 0.15,
      exhaustLossFactor: 0.18,
      doubleActing: true,
      wheelRadiusM: 0.45,
    },
    scenario: {
      kind: "rail",
      targetDistanceM: 2000,
      trainMassKg: 8000,
      gradePercent: 1.2,
      rollingResistance: 0.008,
    },
  },
  {
    id: "fowler-plough",
    title: "Fowler Dampfpflug (Typ)",
    year: 1860,
    era: "Landwirtschaft",
    museum: "Museum of English Rural Life / Dampftraktoren-Sammlungen",
    museumUrl: "https://merl.reading.ac.uk/",
    blurb:
      "Langsam, hohe Zugkraft — Kohle pro gehobenem Furrow-Meter sichtbar am Pflug-Fortschritt.",
    archetype: "traction",
    defaultScenario: "plough",
    boiler: {
      fireGrateM2: 0.5,
      coalHeatMJPerKg: 24,
      boilEfficiency: 0.46,
      maxPressureBar: 2.0,
      waterCapacityL: 750,
    },
    engine: {
      cylinderDiameterM: 0.32,
      strokeM: 0.42,
      strokesPerMin: 22,
      mechanicalEfficiency: 0.58,
      condenserSeparate: false,
      injectionLossFactor: 0.14,
      exhaustLossFactor: 0.16,
      doubleActing: true,
    },
    scenario: {
      kind: "plough",
      targetDistanceM: 1500,
      draftForceN: 4200,
      soilResistance: 1.0,
    },
  },
  {
    id: "great-britain-paddle",
    title: "Radschiff (Prinzip SS Great Britain)",
    year: 1843,
    era: "Schifffahrt",
    museum: "SS Great Britain Trust, Bristol",
    museumUrl: "https://www.ssgreatbritain.org/",
    blurb:
      "Schub gegen Wasserwiderstand — Kohlehaufen schrumpft pro Seemeile-Äquivalent auf der Strecke.",
    archetype: "marine",
    defaultScenario: "ship",
    boiler: {
      fireGrateM2: 0.65,
      coalHeatMJPerKg: 24,
      boilEfficiency: 0.5,
      maxPressureBar: 1.6,
      waterCapacityL: 1500,
    },
    engine: {
      cylinderDiameterM: 0.55,
      strokeM: 1.2,
      strokesPerMin: 18,
      mechanicalEfficiency: 0.65,
      condenserSeparate: true,
      injectionLossFactor: 0.09,
      exhaustLossFactor: 0.11,
      doubleActing: true,
      paddleRadiusM: 1.8,
    },
    scenario: {
      kind: "ship",
      targetDistanceM: 5000,
      hullDragCoeff: 0.018,
      displacementKg: 120000,
    },
  },
  {
    id: "parsons-turbine",
    title: "Parsons Dampfturbine (Typ Turbinia)",
    year: 1897,
    era: "Dampfturbine",
    museum: "Discovery Museum Newcastle / Science Museum",
    museumUrl: "https://www.twamuseum.org.uk/",
    blurb:
      "Kein Kolbenhub — Dampf strömt durch Schaufeln. Weniger Kohle für gleiche Wellenleistung als Kolbenmaschine.",
    archetype: "turbine",
    defaultScenario: "turbine",
    boiler: {
      fireGrateM2: 0.7,
      coalHeatMJPerKg: 24,
      boilEfficiency: 0.58,
      maxPressureBar: 4.5,
      waterCapacityL: 2000,
    },
    engine: {
      rotorRadiusM: 0.35,
      maxRpm: 1800,
      isentropicEfficiency: 0.78,
      mechanicalEfficiency: 0.92,
      exhaustLossFactor: 0.08,
    },
    scenario: {
      kind: "turbine",
      targetEnergyMJ: 80,
      loadPowerKW: 120,
    },
  },
];

export function getConstruction(id) {
  const c = CONSTRUCTIONS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown construction: ${id}`);
  return c;
}

export function constructionsByEra() {
  return [...CONSTRUCTIONS].sort((a, b) => a.year - b.year);
}
