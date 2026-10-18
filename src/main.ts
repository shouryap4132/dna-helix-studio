import GUI, { type Controller } from "lil-gui";
import { HelixStudio } from "./helix";
import { DEFAULTS, PRESETS, type Params } from "./params";
import "./style.css";

// Control panel for the helix. Settings are saved in this browser, can be
// shared as a link (every value is in the URL), and exported as JSON or as a
// ready-to-paste snippet for the wiki's dnaScene.ts / bases.ts.

const STORE = "dna-helix-studio";

function fromHash(): Partial<Params> | null {
  const h = location.hash.slice(1);
  if (!h.startsWith("s=")) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(h.slice(2)))));
  } catch {
    return null;
  }
}
function toHash(p: Params) {
  return "s=" + btoa(unescape(encodeURIComponent(JSON.stringify(p))));
}
function fromStorage(): Partial<Params> | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const params: Params = { ...DEFAULTS, ...(fromHash() ?? fromStorage() ?? {}) };
const canvas = document.querySelector<HTMLCanvasElement>("#stage")!;
const studio = new HelixStudio(canvas, params);

const toast = (msg: string) => {
  const el = document.querySelector<HTMLElement>("#toast")!;
  el.textContent = msg;
  el.classList.add("on");
  setTimeout(() => el.classList.remove("on"), 1800);
};

const gui = new GUI({ title: "Helix controls", width: 320 });
const all: Controller[] = [];
const ctl = (c: Controller) => {
  all.push(c);
  return c.onChange(changed);
};

let saveTimer = 0;
function changed() {
  studio.apply(params);
  refreshEnabled();
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(params));
    } catch {
      // storage blocked: settings still work for this visit
    }
  }, 250);
}

function loadValues(v: Partial<Params>) {
  Object.assign(params, DEFAULTS, v);
  all.forEach((c) => c.updateDisplay());
  changed();
  studio.resetView();
}

// ---- presets ------------------------------------------------------------
const presetState = { preset: "Wiki (current)" };
gui
  .add(presetState, "preset", Object.keys(PRESETS))
  .name("Preset")
  .onChange((name: string) => {
    loadValues(PRESETS[name]);
    toast(`Loaded "${name}"`);
  });

// ---- colors ---------------------------------------------------------------
const colors = gui.addFolder("Colors");
ctl(colors.addColor(params, "background").name("Page background"));
ctl(colors.addColor(params, "strand1").name("Backbone 1"));
ctl(colors.addColor(params, "strand2").name("Backbone 2"));
ctl(colors.add(params, "beadsMatchBackbone").name("Beads match backbone"));
const beadColor = ctl(colors.addColor(params, "beadColor").name("Bead color"));

const bases = gui.addFolder("Nucleotides");
ctl(bases.addColor(params, "baseA").name("A  adenine"));
ctl(bases.addColor(params, "baseT").name("T  thymine"));
ctl(bases.addColor(params, "baseG").name("G  guanine"));
ctl(bases.addColor(params, "baseC").name("C  cytosine"));
ctl(bases.addColor(params, "baseTint").name("Soften toward"));
ctl(bases.add(params, "baseTintAmount", 0, 1, 0.01).name("Soften (bright pairs)"));
ctl(bases.add(params, "flankTintAmount", 0, 1, 0.01).name("Soften (outer pairs)"));
ctl(bases.add(params, "sequence").name("Sequence (bright pairs)"));

// ---- finishes ---------------------------------------------------------------
const bb = gui.addFolder("Backbone & bead finish");
ctl(bb.add(params, "bbRoughness", 0, 1, 0.01).name("Roughness"));
ctl(bb.add(params, "bbMetalness", 0, 1, 0.01).name("Metalness"));
ctl(bb.add(params, "bbSpecular", 0, 1, 0.01).name("Specular"));
ctl(bb.add(params, "bbClearcoat", 0, 1, 0.01).name("Clearcoat"));
ctl(bb.add(params, "bbClearcoatRoughness", 0, 1, 0.01).name("Clearcoat roughness"));
ctl(bb.add(params, "bbSheen", 0, 1, 0.01).name("Sheen"));
ctl(bb.add(params, "bbEnvIntensity", 0, 2, 0.01).name("Reflection strength"));

const rf = gui.addFolder("Nucleotide finish");
ctl(rf.add(params, "rungsMatchBackboneFinish").name("Same as backbone"));
const rungCtl = [
  ctl(rf.add(params, "rungRoughness", 0, 1, 0.01).name("Roughness")),
  ctl(rf.add(params, "rungMetalness", 0, 1, 0.01).name("Metalness")),
  ctl(rf.add(params, "rungSpecular", 0, 1, 0.01).name("Specular")),
  ctl(rf.add(params, "rungClearcoat", 0, 1, 0.01).name("Clearcoat")),
  ctl(rf.add(params, "rungClearcoatRoughness", 0, 1, 0.01).name("Clearcoat roughness")),
  ctl(rf.add(params, "rungSheen", 0, 1, 0.01).name("Sheen")),
  ctl(rf.add(params, "rungEnvIntensity", 0, 2, 0.01).name("Reflection strength")),
];

// ---- reflections + lights -----------------------------------------------------
const env = gui.addFolder("Reflections (studio)");
ctl(env.addColor(params, "envWall").name("Studio walls"));
ctl(env.add(params, "envSoftbox", 0, 8, 0.05).name("Softbox brightness"));
ctl(env.add(params, "envFillCard", 0, 4, 0.05).name("Fill card"));
ctl(env.add(params, "envFloor", 0, 2, 0.01).name("Floor"));
ctl(env.add(params, "envBlur", 0, 0.5, 0.005).name("Blur"));

const lights = gui.addFolder("Lights");
ctl(lights.add(params, "toneMapping", ["Neutral", "ACES Filmic", "AgX", "None"]).name("Tone mapping"));
ctl(lights.add(params, "exposure", 0.2, 2.5, 0.01).name("Exposure"));
ctl(lights.add(params, "hemi", 0, 4, 0.01).name("Ambient"));
ctl(lights.addColor(params, "hemiSky").name("Ambient (top)"));
ctl(lights.addColor(params, "hemiGround").name("Ambient (bottom)"));
ctl(lights.add(params, "key", 0, 5, 0.01).name("Key light"));
ctl(lights.addColor(params, "keyColor").name("Key color"));
ctl(lights.add(params, "fill", 0, 3, 0.01).name("Fill light"));
ctl(lights.add(params, "rim", 0, 3, 0.01).name("Rim light"));
ctl(lights.add(params, "shadowOpacity", 0, 0.6, 0.01).name("Shadow darkness"));
ctl(lights.add(params, "shadowSoftness", 0, 30, 0.5).name("Shadow softness"));

// ---- geometry -------------------------------------------------------------------
const geo = gui.addFolder("Shape");
ctl(geo.add(params, "basePairs", 6, 120, 1).name("Base pairs"));
ctl(geo.add(params, "highlightPairs", 0, 60, 1).name("Bright pairs"));
ctl(geo.add(params, "helixRadius", 0.8, 4, 0.01).name("Helix radius"));
ctl(geo.add(params, "rise", 0.3, 1.5, 0.01).name("Rise per pair"));
ctl(geo.add(params, "pairsPerTurn", 6, 16, 0.1).name("Pairs per turn"));
ctl(geo.add(params, "groove", 1, 3.14, 0.01).name("Groove angle"));
ctl(geo.add(params, "backboneRadius", 0.05, 0.6, 0.01).name("Backbone thickness"));
ctl(geo.add(params, "showBeads").name("Show beads"));
ctl(geo.add(params, "beadRadius", 0.05, 0.6, 0.01).name("Bead size"));
ctl(geo.add(params, "rungRadius", 0.03, 0.4, 0.01).name("Rung thickness"));
ctl(geo.add(params, "highlightRungRadius", 0.03, 0.4, 0.01).name("Bright rung thickness"));
ctl(geo.add(params, "rungGap", 0, 0.5, 0.01).name("Gap between pairs"));
geo.close();

const motion = gui.addFolder("Motion & view");
ctl(motion.add(params, "autoRotate").name("Auto-rotate"));
ctl(motion.add(params, "spinSpeed", 0, 2, 0.01).name("Spin speed"));
ctl(motion.add(params, "horizontal").name("Horizontal"));
ctl(motion.add(params, "tilt", -1, 1, 0.01).name("Tilt"));
motion.close();

// ---- share / export ---------------------------------------------------------------
const copy = async (text: string, done: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    window.prompt("Copy this:", text);
  }
};
const download = (name: string, href: string) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
};

const actions = {
  shareLink: () => {
    history.replaceState(null, "", "#" + toHash(params));
    copy(location.href, "Share link copied");
  },
  copyJson: () => copy(JSON.stringify(params, null, 2), "Settings JSON copied"),
  downloadJson: () =>
    download(
      "helix-settings.json",
      "data:application/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(params, null, 2)),
    ),
  importJson: () => {
    const text = window.prompt("Paste settings JSON (or a share link):");
    if (!text) return;
    try {
      const hash = text.includes("#s=") ? text.slice(text.indexOf("#s=") + 3) : null;
      const v = hash
        ? JSON.parse(decodeURIComponent(escape(atob(hash))))
        : JSON.parse(text);
      loadValues(v);
      toast("Settings loaded");
    } catch {
      toast("Couldn't read those settings");
    }
  },
  wikiCode: () => copy(wikiSnippet(params), "Wiki code copied"),
  png: () => download("helix.png", studio.snapshot()),
  resetView: () => studio.resetView(),
  reset: () => {
    if (!window.confirm("Reset every control to the wiki's current look?")) return;
    presetState.preset = "Wiki (current)";
    loadValues({});
    history.replaceState(null, "", location.pathname);
    toast("Reset to defaults");
  },
};
const share = gui.addFolder("Save & share");
share.add(actions, "shareLink").name("Copy share link");
share.add(actions, "copyJson").name("Copy settings (JSON)");
share.add(actions, "downloadJson").name("Download settings");
share.add(actions, "importJson").name("Import settings…");
share.add(actions, "wikiCode").name("Copy wiki code");
share.add(actions, "png").name("Save PNG");
share.add(actions, "resetView").name("Reset camera");
share.add(actions, "reset").name("Reset everything");

function refreshEnabled() {
  beadColor.enable(!params.beadsMatchBackbone);
  rungCtl.forEach((c) => c.enable(!params.rungsMatchBackboneFinish));
}
refreshEnabled();

// The values to paste into the wiki (src/contents/members/*.ts).
function wikiSnippet(p: Params) {
  const n = (v: number) => +v.toFixed(3);
  return `// --- from DNA Helix Studio ---
// dnaScene.ts
const FINISH = {
  metalness: ${n(p.bbMetalness)},
  roughness: ${n(p.bbRoughness)},
  specularIntensity: ${n(p.bbSpecular)},
  clearcoat: ${n(p.bbClearcoat)},
  clearcoatRoughness: ${n(p.bbClearcoatRoughness)},
  envMapIntensity: ${n(p.bbEnvIntensity)},
} as const;
const BACKBONE_LIGHT = "${p.strand1}";
const BACKBONE_R = ${n(p.backboneRadius)};
const BEAD_R = ${n(p.beadRadius)};
// studio environment: walls ${p.envWall}, softbox ${n(p.envSoftbox)}, fill ${n(p.envFillCard)}, floor ${n(p.envFloor)}
// lights: ${p.toneMapping} @ ${n(p.exposure)}, ambient ${n(p.hemi)}, key ${n(p.key)}, fill ${n(p.fill)}, rim ${n(p.rim)}

// bases.ts
export const BASE_COLORS = {
  A: "${p.baseA}",
  T: "${p.baseT}",
  G: "${p.baseG}",
  C: "${p.baseC}",
};

// full settings (load with "Import settings…"):
// ${JSON.stringify(p)}
`;
}
