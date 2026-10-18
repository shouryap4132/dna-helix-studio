import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Params } from "./params";

// The wiki's DNA helix, rebuilt so every look-related value comes from Params.
// Geometry is only rebuilt when a geometry value changes, the reflection
// environment only when an environment value changes; materials and lights
// update in place, so sliders stay smooth.

type Base = "A" | "T" | "G" | "C";
const PAIR: Record<Base, Base> = { A: "T", T: "A", G: "C", C: "G" };
const FLANK_SEQ = "GATCCTAG";

const TONE: Record<Params["toneMapping"], THREE.ToneMapping> = {
  Neutral: THREE.NeutralToneMapping,
  "ACES Filmic": THREE.ACESFilmicToneMapping,
  AgX: THREE.AgXToneMapping,
  None: THREE.NoToneMapping,
};

const GEOMETRY_KEYS: (keyof Params)[] = [
  "basePairs",
  "sequence",
  "highlightPairs",
  "helixRadius",
  "rise",
  "pairsPerTurn",
  "groove",
  "backboneRadius",
  "showBeads",
  "beadRadius",
  "rungRadius",
  "highlightRungRadius",
  "rungGap",
  "beadsMatchBackbone",
];
const ENV_KEYS: (keyof Params)[] = [
  "envWall",
  "envSoftbox",
  "envFillCard",
  "envFloor",
  "envBlur",
];

interface Rung {
  mesh: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshPhysicalMaterial>;
  base: Base;
  highlight: boolean;
}

const keyOf = (p: Params, keys: (keyof Params)[]) =>
  JSON.stringify(keys.map((k) => p[k]));

export class HelixStudio {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  private controls: OrbitControls;
  private model = new THREE.Group(); // orientation + tilt
  private spin = new THREE.Group(); // rotation about the helix axis
  private helix = new THREE.Group(); // rebuilt geometry lives here

  private strandMats = [
    new THREE.MeshPhysicalMaterial(),
    new THREE.MeshPhysicalMaterial(),
  ];
  private beadMat = new THREE.MeshPhysicalMaterial();
  private rungs: Rung[] = [];

  private hemi = new THREE.HemisphereLight();
  private key = new THREE.DirectionalLight();
  private fill = new THREE.DirectionalLight();
  private rim = new THREE.DirectionalLight();
  private ground: THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial>;
  private envTexture: THREE.Texture | null = null;

  private p: Params;
  private geoKey = "";
  private envKey = "";
  private clock = new THREE.Clock();
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, params: Params) {
    this.canvas = canvas;
    this.p = params;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // lets "Save PNG" read the canvas
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.ShadowMaterial({ opacity: 0.06 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;

    this.key.position.set(-6, 14, 10);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    const sc = this.key.shadow.camera;
    sc.left = -40;
    sc.right = 40;
    sc.top = 40;
    sc.bottom = -40;
    this.key.shadow.blurSamples = 20;
    this.key.shadow.bias = -0.0005;
    this.fill.position.set(8, -4, 8);
    this.rim.position.set(2, 8, -14);

    this.scene.add(this.hemi, this.key, this.fill, this.rim, this.ground);
    this.spin.add(this.helix);
    this.model.add(this.spin);
    this.scene.add(this.model);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.enablePan = true;

    this.apply(params);
    this.resize();
    this.resetView();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.renderer.setAnimationLoop(() => this.frame());
  }

  apply(p: Params) {
    this.p = p;
    const g = keyOf(p, GEOMETRY_KEYS);
    if (g !== this.geoKey) {
      this.geoKey = g;
      this.buildHelix();
    }
    const e = keyOf(p, ENV_KEYS);
    if (e !== this.envKey) {
      this.envKey = e;
      this.buildEnvironment();
    }
    this.updateMaterials();
    this.updateLights();
    document.body.style.background = p.background;
    this.model.rotation.z = p.horizontal ? -Math.PI / 2 : 0;
    this.model.rotation.x = p.tilt;
    // contact shadow just below the lowest point of the helix
    this.ground.position.y = p.horizontal
      ? -(p.helixRadius + 2.6)
      : -(Math.round(p.basePairs) * p.rise) / 2 - 1;
  }

  resetView() {
    const p = this.p;
    const span = (Math.min(p.highlightPairs, p.basePairs) + 6) * p.rise;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    const along = p.horizontal ? hfov : vfov;
    const across = p.horizontal ? vfov : hfov;
    const dist = Math.max(
      span / 2 / Math.tan(along / 2),
      (p.helixRadius + 1.8) / Math.tan(across / 2),
    );
    this.camera.position.set(0, 0.6, dist);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  snapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL("image/png");
  }

  // ---- construction ------------------------------------------------------

  private buildHelix() {
    const p = this.p;
    // dispose previous geometry and per-rung materials
    this.helix.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.rungs.forEach((r) => r.mesh.material.dispose());
    this.helix.clear();
    this.rungs = [];

    const total = Math.max(2, Math.round(p.basePairs));
    const mid = (total - 1) / 2;
    const twist = (2 * Math.PI) / p.pairsPerTurn;
    const point = (k: number, offset: number) => {
      const a = k * twist + offset;
      return new THREE.Vector3(
        p.helixRadius * Math.cos(a),
        (k - mid) * p.rise,
        p.helixRadius * Math.sin(a),
      );
    };

    [0, p.groove].forEach((offset, s) => {
      const pts: THREE.Vector3[] = [];
      for (let t = -0.6; t <= total - 0.4; t += 0.25) pts.push(point(t, offset));
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(pts, false, "centripetal"),
          total * 14,
          p.backboneRadius,
          32,
        ),
        this.strandMats[s],
      );
      tube.castShadow = true;
      this.helix.add(tube);
    });

    const beadGeo = new THREE.SphereGeometry(p.beadRadius, 40, 28);
    const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1);
    const seq = (p.sequence.toUpperCase().match(/[ATGC]/g) ?? ["A"]) as Base[];
    const hl = Math.min(Math.round(p.highlightPairs), total);
    const hlStart = Math.floor((total - hl) / 2);

    for (let k = 0; k < total; k++) {
      const p1 = point(k, 0);
      const p2 = point(k, p.groove);
      if (p.showBeads) {
        [p1, p2].forEach((pos, s) => {
          // beads reuse their strand's material instance unless overridden
          const mat = p.beadsMatchBackbone ? this.strandMats[s] : this.beadMat;
          const bead = new THREE.Mesh(beadGeo, mat);
          bead.position.copy(pos);
          bead.castShadow = true;
          this.helix.add(bead);
        });
      }
      const m = k - hlStart;
      const highlight = m >= 0 && m < hl;
      const base: Base = highlight
        ? seq[m % seq.length]
        : (FLANK_SEQ[k % FLANK_SEQ.length] as Base);
      const centre = p1.clone().lerp(p2, 0.5);
      const r = highlight ? p.highlightRungRadius : p.rungRadius;
      this.rung(rodGeo, p1, centre, r, base, highlight);
      // each half runs from its own backbone toward the middle, so the gap
      // opens at the centre and both halves stay attached to their strands
      this.rung(rodGeo, p2, centre, r, PAIR[base], highlight);
    }
  }

  private rung(
    geo: THREE.CylinderGeometry,
    from: THREE.Vector3,
    to: THREE.Vector3,
    radius: number,
    base: Base,
    highlight: boolean,
  ) {
    const dir = to.clone().sub(from);
    const len = Math.max(0.01, dir.length() - this.p.rungGap);
    dir.normalize();
    const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial());
    mesh.scale.set(radius, len, radius);
    mesh.position.copy(from).addScaledVector(dir, len / 2);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    mesh.castShadow = true;
    this.helix.add(mesh);
    this.rungs.push({ mesh, base, highlight });
  }

  // A small studio used only for reflections: walls, one broad softbox, a
  // fill card and a floor. Never visible; the page background is CSS.
  private buildEnvironment() {
    const p = this.p;
    const env = new THREE.Scene();
    env.background = new THREE.Color(p.envWall);
    const card = (w: number, h: number, power: number) =>
      new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(power, power, power),
          side: THREE.DoubleSide,
        }),
      );
    const softbox = card(16, 9, p.envSoftbox);
    softbox.position.set(-5, 10, 7);
    softbox.lookAt(0, 0, 0);
    const fillCard = card(5, 8, p.envFillCard);
    fillCard.position.set(11, 0, 5);
    fillCard.lookAt(0, 0, 0);
    const floor = card(30, 30, p.envFloor);
    floor.position.set(0, -8, 0);
    floor.lookAt(0, 0, 0);
    env.add(softbox, fillCard, floor);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const tex = pmrem.fromScene(env, p.envBlur).texture;
    pmrem.dispose();
    env.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose();
    });
    this.envTexture?.dispose();
    this.envTexture = tex;
    this.scene.environment = tex;
  }

  // ---- live updates ---------------------------------------------------------

  private updateMaterials() {
    const p = this.p;
    const bb = {
      roughness: p.bbRoughness,
      metalness: p.bbMetalness,
      specularIntensity: p.bbSpecular,
      clearcoat: p.bbClearcoat,
      clearcoatRoughness: p.bbClearcoatRoughness,
      sheen: p.bbSheen,
      envMapIntensity: p.bbEnvIntensity,
    };
    const rung = p.rungsMatchBackboneFinish
      ? bb
      : {
          roughness: p.rungRoughness,
          metalness: p.rungMetalness,
          specularIntensity: p.rungSpecular,
          clearcoat: p.rungClearcoat,
          clearcoatRoughness: p.rungClearcoatRoughness,
          sheen: p.rungSheen,
          envMapIntensity: p.rungEnvIntensity,
        };
    this.strandMats[0].setValues({ ...bb, color: p.strand1 });
    this.strandMats[1].setValues({ ...bb, color: p.strand2 });
    this.beadMat.setValues({ ...bb, color: p.beadColor });

    const baseColor: Record<Base, string> = {
      A: p.baseA,
      T: p.baseT,
      G: p.baseG,
      C: p.baseC,
    };
    const tint = new THREE.Color(p.baseTint);
    for (const r of this.rungs) {
      const c = new THREE.Color(baseColor[r.base]).lerp(
        tint,
        r.highlight ? p.baseTintAmount : p.flankTintAmount,
      );
      r.mesh.material.setValues({ ...rung, color: c });
    }
  }

  private updateLights() {
    const p = this.p;
    this.renderer.toneMapping = TONE[p.toneMapping];
    this.renderer.toneMappingExposure = p.exposure;
    this.hemi.color.set(p.hemiSky);
    this.hemi.groundColor.set(p.hemiGround);
    this.hemi.intensity = p.hemi;
    this.key.color.set(p.keyColor);
    this.key.intensity = p.key;
    this.key.shadow.radius = p.shadowSoftness;
    this.fill.intensity = p.fill;
    this.rim.intensity = p.rim;
    this.ground.material.opacity = p.shadowOpacity;
  }

  // ---- loop ---------------------------------------------------------------------

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.p.autoRotate) this.spin.rotation.y += dt * this.p.spinSpeed;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
