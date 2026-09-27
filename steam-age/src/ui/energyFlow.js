/**
 * Energiefluss als Bandbreite (kein Prozent-Label in der Hauptansicht).
 */

export class EnergyFlowViz {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.flows = { useful: 0, exhaust: 0, injection: 0, radiation: 0 };
    this.t = 0;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
  }

  /** @param {ReturnType<import('../sim/engine.js').SteamSimulation['getEnergyFlows']>} flows */
  update(flows) {
    this.flows = flows;
  }

  draw(dt) {
    if (!this.w) this.resize();
    this.t += dt;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    const total =
      this.flows.useful +
      this.flows.exhaust +
      this.flows.injection +
      this.flows.radiation +
      1;

    const lanes = [
      { key: "useful", label: "Mechanische Arbeit", color: "#ffc857" },
      { key: "exhaust", label: "Abgas / Dampf weg", color: "#6b7280" },
      { key: "injection", label: "Kondensations-Verlust", color: "#60a5fa" },
      { key: "radiation", label: "Strahlung Kessel", color: "#f87171" },
    ];

    const laneH = (this.h - 40) / lanes.length;
    lanes.forEach((lane, i) => {
      const y = 28 + i * laneH;
      const frac = this.flows[lane.key] / total;
      const w = Math.max(4, (this.w - 140) * Math.min(1, frac * 3));

      ctx.fillStyle = "#888";
      ctx.font = "11px system-ui";
      ctx.fillText(lane.label, 8, y + laneH * 0.35);

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(130, y, this.w - 138, laneH * 0.55);

      const pulse = 0.85 + 0.15 * Math.sin(this.t * 4 + i);
      ctx.fillStyle = lane.color;
      ctx.globalAlpha = 0.35 + frac * 0.65;
      ctx.fillRect(130, y, w * pulse, laneH * 0.55);
      ctx.globalAlpha = 1;

      for (let p = 0; p < w / 18; p++) {
        const px = 130 + ((this.t * 40 + p * 18) % w);
        ctx.fillStyle = lane.color;
        ctx.beginPath();
        ctx.arc(px, y + laneH * 0.28, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = "#c4b5a0";
    ctx.font = "600 12px system-ui";
    ctx.fillText("Energiefluss (Breite = Anteil)", 8, 16);
  }
}
