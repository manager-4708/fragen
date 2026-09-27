/**
 * Kohlehaufen-Visualisierung — Schrumpfen statt Prozent-Effizienz.
 */

export class CoalHeapViz {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas, label) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.label = label;
    this.initialKg = 50;
    this.remainingKg = 50;
    this.burnedKg = 0;
    this.ghost = false;
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

  setCoal(remaining, burned, initial = 50) {
    this.initialKg = initial;
    this.remainingKg = remaining;
    this.burnedKg = burned;
  }

  /** @param {number} progress 0..1 Aufgabenfortschritt */
  draw(progress = 0) {
    if (!this.w) this.resize();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    ctx.fillStyle = this.ghost ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.fillStyle = this.ghost ? "#8a8a8a" : "#c9c2b8";
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText(this.label, 12, 22);

    const pileW = this.w - 24;
    const maxH = this.h - 56;
    const fillRatio = Math.max(0, Math.min(1, this.remainingKg / this.initialKg));
    const pileH = maxH * Math.pow(fillRatio, 0.65);

    const baseY = this.h - 20;
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(12, baseY - 4, pileW, 6);

    const chunks = 24;
    for (let i = 0; i < chunks; i++) {
      const row = Math.floor(i / 6);
      const col = i % 6;
      const threshold = i / chunks;
      if (threshold > fillRatio) continue;
      const x = 16 + col * (pileW / 6) + (row % 2) * 8;
      const y = baseY - pileH + row * (pileH / 4) + Math.sin(i * 1.7) * 3;
      ctx.fillStyle = `hsl(25, ${this.ghost ? 5 : 18}%, ${22 + (i % 5) * 4}%)`;
      ctx.beginPath();
      ctx.ellipse(x, y, 14, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#e8dcc8";
    ctx.font = "12px system-ui";
    ctx.fillText(`Kohle im Bunker: ${this.remainingKg.toFixed(1)} kg`, 12, this.h - 28);

    const taskX = 12;
    const taskW = pileW;
    const taskY = 36;
    ctx.strokeStyle = "rgba(255,220,160,0.35)";
    ctx.strokeRect(taskX, taskY, taskW, 10);
    ctx.fillStyle = "rgba(255,180,80,0.55)";
    ctx.fillRect(taskX, taskY, taskW * Math.min(1, progress), 10);
    ctx.fillStyle = "#aaa";
    ctx.fillText("Aufgabe", taskX, taskY - 4);

    if (this.burnedKg > 0.01 && progress > 0.02) {
      const perUnit = this.burnedKg / progress;
      ctx.fillStyle = "#ffd89a";
      ctx.fillText(`Verbrauch bis hier: ${this.burnedKg.toFixed(1)} kg Kohle`, 12, 48);
      ctx.fillStyle = "#9cb4ff";
      ctx.font = "11px system-ui";
      ctx.fillText(`≈ ${perUnit.toFixed(1)} kg Kohle pro voller Aufgabe (hochgerechnet)`, 12, 62);
    }
  }
}
