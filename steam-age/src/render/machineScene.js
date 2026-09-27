import * as THREE from "three";
import {
  pistonDisplacementFromPhase,
  solveBeamFromPhase,
  solveSliderCrankVertical,
  alignRodBetween,
  createRodMesh,
} from "../mechanics/kinematics.js";

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/**
 * Schematische 3D-Darstellung je Archetyp — Gelenke und Stangen aus Kinematik.
 */
export class MachineScene {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1117);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    this.camera.position.set(4, 3, 6);
    this.controlsTarget = new THREE.Vector3(0, 1.2, 0);

    const amb = new THREE.AmbientLight(0xffffff, 0.45);
    const dir = new THREE.DirectionalLight(0xffeedd, 1.1);
    dir.position.set(5, 8, 4);
    this.scene.add(amb, dir);

    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.parts = {};
    this.mechanism = null;
    this.archetype = "newcomen";
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** @param {import('../data/constructions.js').Construction} c */
  loadConstruction(c) {
    this.archetype = c.archetype;
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.parts = {};
    this.mechanism = null;

    const boiler = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 1.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x4a3728, metalness: 0.4, roughness: 0.6 }),
    );
    boiler.position.set(-1.2, 1.1, 0);
    this.root.add(boiler);
    this.parts.boiler = boiler;

    const fire = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.25, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x2a1810, emissive: 0xff4400, emissiveIntensity: 0.2 }),
    );
    fire.position.set(-1.2, 0.35, 0);
    this.root.add(fire);
    this.parts.fire = fire;

    if (c.archetype === "turbine") {
      const casing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 1.2, 32),
        new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.7, roughness: 0.35 }),
      );
      casing.rotation.z = Math.PI / 2;
      casing.position.set(0.5, 1.2, 0);
      this.root.add(casing);
      const rotor = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.06, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xc0c8d0, metalness: 0.9, roughness: 0.2 }),
      );
      rotor.rotation.y = Math.PI / 2;
      rotor.position.set(0.5, 1.2, 0);
      this.root.add(rotor);
      this.parts.rotor = rotor;
      this._addGround();
      return;
    }

    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x708090, metalness: 0.65, roughness: 0.4 }),
    );
    cyl.position.set(0.3, 1.3, 0);
    this.root.add(cyl);
    this.parts.cylinder = cyl;

    const piston = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.15, 20),
      new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.8, roughness: 0.25 }),
    );
    piston.position.set(0.3, 1.3, 0);
    this.root.add(piston);
    this.parts.piston = piston;

    if (c.archetype === "newcomen" || c.archetype === "cornish" || c.archetype === "watt") {
      this._buildBeamEngine();
    } else if (c.archetype === "locomotive") {
      this._buildSliderCrank();
    } else if (c.archetype === "marine") {
      this._buildBeamEngine();
      this._buildMarineHull();
    } else {
      this.mechanism = { type: "pistonOnly", pistonRestY: 1.3, stroke: 0.55 };
    }

    if (c.archetype === "traction") {
      const plough = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.4, roughness: 0.6 }),
      );
      plough.rotation.z = -Math.PI / 2;
      plough.position.set(2, 0.4, 0);
      this.root.add(plough);
      this.parts.plough = plough;
    }

    if (c.engine.condenserSeparate) {
      const cond = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.8, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x3d5a80, metalness: 0.5, roughness: 0.45 }),
      );
      cond.position.set(-0.2, 0.7, 0.8);
      this.root.add(cond);
      this.parts.condenser = cond;
    }

    this._addGround();
  }

  _addGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x1a2332, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.root.add(ground);
  }

  _buildBeamEngine() {
    const cfg = {
      type: "beam",
      pistonX: 0.3,
      pistonRestY: 1.3,
      pistonRodLen: 1.005,
      fulcrumX: 0.95,
      fulcrumY: 2.38,
      armPiston: 0.65,
      armPump: 1.35,
      stroke: 0.55,
      pumpPlungerRodLen: 0.85,
    };
    this.mechanism = cfg;

    const fulcrum = new THREE.Group();
    fulcrum.position.set(cfg.fulcrumX, cfg.fulcrumY, 0);
    this.root.add(fulcrum);
    this.parts.fulcrum = fulcrum;

    const beamLen = cfg.armPiston + cfg.armPump;
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(beamLen, 0.12, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, metalness: 0.2, roughness: 0.8 }),
    );
    beam.position.set((cfg.armPump - cfg.armPiston) / 2, 0, 0);
    fulcrum.add(beam);
    this.parts.beam = beam;

    const pistonRod = createRodMesh(0.05, 0x777777);
    this.root.add(pistonRod);
    this.parts.pistonRod = pistonRod;

    const pumpRod = createRodMesh(0.05, 0x999999);
    this.root.add(pumpRod);
    this.parts.pumpRod = pumpRod;

    const pumpHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x606860, metalness: 0.5, roughness: 0.5 }),
    );
    pumpHead.position.set(cfg.fulcrumX + cfg.armPump, cfg.pumpPlungerY, 0);
    this.root.add(pumpHead);
    this.parts.pumpHead = pumpHead;

    const pivot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.35 }),
    );
    fulcrum.add(pivot);
  }

  _buildSliderCrank() {
    const cfg = {
      type: "crank",
      pistonX: 0.3,
      pistonRestY: 1.15,
      stroke: 0.48,
      crankCenterX: 0.65,
      crankCenterY: 1.2,
      crankRadius: 0.22,
      rodLength: 0.9,
    };
    this.mechanism = cfg;

    const crankPivot = new THREE.Group();
    crankPivot.position.set(cfg.crankCenterX, cfg.crankCenterY, 0);
    this.root.add(crankPivot);
    this.parts.crankPivot = crankPivot;

    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.06, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 }),
    );
    wheel.rotation.y = Math.PI / 2;
    crankPivot.add(wheel);
    this.parts.wheel = wheel;

    const crankArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, cfg.crankRadius * 2, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.65, roughness: 0.4 }),
    );
    crankArm.position.set(0, 0, 0);
    crankPivot.add(crankArm);
    this.parts.crankArm = crankArm;

    const connectRod = createRodMesh(0.055, 0x888888);
    this.root.add(connectRod);
    this.parts.connectRod = connectRod;
  }

  _buildMarineHull() {
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.5, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.3, roughness: 0.7 }),
    );
    hull.position.set(1, 0.5, 0);
    this.root.add(hull);

    const paddlePivot = new THREE.Group();
    paddlePivot.position.set(-0.5, 0.9, 0.55);
    this.root.add(paddlePivot);
    const paddle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.5, roughness: 0.5 }),
    );
    paddlePivot.add(paddle);
    this.parts.paddlePivot = paddlePivot;
  }

  _updateBeamKinematics(phase) {
    const cfg = this.mechanism;
    const sol = solveBeamFromPhase(phase, cfg);

    this.parts.fulcrum.rotation.z = sol.theta;
    this.parts.piston.position.y = sol.pistonY;

    _a.set(cfg.pistonX, sol.wristY ?? sol.pistonY + 0.075, 0);
    _b.set(sol.pistonAttach.x, sol.pistonAttach.y, 0);
    alignRodBetween(_a, _b, this.parts.pistonRod, this.parts.pistonRod.userData.rodGeomHeight);

    const pumpY = sol.pumpAttach.y - cfg.pumpPlungerRodLen;
    _a.set(sol.pumpAttach.x, sol.pumpAttach.y, 0);
    _b.set(sol.pumpAttach.x, pumpY, 0);
    alignRodBetween(_a, _b, this.parts.pumpRod, this.parts.pumpRod.userData.rodGeomHeight);
    if (this.parts.pumpHead) {
      this.parts.pumpHead.position.set(sol.pumpAttach.x, pumpY, 0);
    }
    return sol;
  }

  _updateCrankKinematics(crankAngle) {
    const cfg = this.mechanism;
    const sol = solveSliderCrankVertical({
      crankAngle,
      crankRadius: cfg.crankRadius,
      rodLength: cfg.rodLength,
      crankCenterX: cfg.crankCenterX,
      crankCenterY: cfg.crankCenterY,
      pistonX: cfg.pistonX,
      pistonWristOffset: 0.075,
    });

    this.parts.crankPivot.rotation.z = crankAngle;
    this.parts.piston.position.y = sol.pistonY;

    const wrist = 0.075;
    _a.set(sol.pin.x, sol.pin.y, 0);
    _b.set(cfg.pistonX, sol.wristY ?? sol.pistonY + wrist, 0);
    alignRodBetween(_a, _b, this.parts.connectRod, this.parts.connectRod.userData.rodGeomHeight);
  }

  /** @param {object} telemetry */
  update(telemetry, dt) {
    const phase = telemetry.pistonPhase ?? 0;
    const pressure = telemetry.pressureBar ?? 0;

    if (this.parts.fire?.material) {
      this.parts.fire.material.emissiveIntensity = 0.15 + Math.min(0.85, pressure * 0.25);
    }

    const mech = this.mechanism;
    if (mech?.type === "beam") {
      const sol = this._updateBeamKinematics(phase);
      if (this.parts.paddlePivot) {
        const pumpThrow = sol.pumpAttach.y - mech.fulcrumY;
        this.parts.paddlePivot.rotation.x = pumpThrow * 0.55;
      }
    } else if (mech?.type === "crank") {
      const crankAngle = phase * Math.PI * 2;
      this._updateCrankKinematics(crankAngle);
    } else if (mech?.type === "pistonOnly") {
      const stroke = pistonDisplacementFromPhase(phase, mech.stroke);
      this.parts.piston.position.y = mech.pistonRestY + stroke;
    }

    if (this.parts.rotor) {
      this.parts.rotor.rotation.x += dt * (telemetry.rpm ?? 200) * 0.02;
    }

    this.camera.lookAt(this.controlsTarget);
    this.renderer.render(this.scene, this.camera);
  }
}
