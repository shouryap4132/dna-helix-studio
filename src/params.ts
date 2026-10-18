// Every value the studio can tune. Defaults ("Wiki (current)") match the
// helix on the DelNorte-SD wiki Team page, so tweaks start from what's live.

export type ToneMapping = "Neutral" | "ACES Filmic" | "AgX" | "None";

export interface Params {
  // colors
  background: string;
  strand1: string;
  strand2: string;
  beadsMatchBackbone: boolean;
  beadColor: string;
  baseA: string;
  baseT: string;
  baseG: string;
  baseC: string;
  baseTint: string; // color the bases are blended toward
  baseTintAmount: number; // 0 = pure base color
  flankTintAmount: number; // extra blend for the outer (non-highlight) pairs

  // backbone + bead finish
  bbRoughness: number;
  bbMetalness: number;
  bbSpecular: number;
  bbClearcoat: number;
  bbClearcoatRoughness: number;
  bbSheen: number;
  bbEnvIntensity: number;

  // rung (nucleotide) finish
  rungsMatchBackboneFinish: boolean;
  rungRoughness: number;
  rungMetalness: number;
  rungSpecular: number;
  rungClearcoat: number;
  rungClearcoatRoughness: number;
  rungSheen: number;
  rungEnvIntensity: number;

  // reflection environment (never visible, only reflected)
  envWall: string;
  envSoftbox: number;
  envFillCard: number;
  envFloor: number;
  envBlur: number;

  // lights + renderer
  toneMapping: ToneMapping;
  exposure: number;
  hemi: number;
  hemiSky: string;
  hemiGround: string;
  key: number;
  keyColor: string;
  fill: number;
  rim: number;
  shadowOpacity: number;
  shadowSoftness: number;

  // geometry
  basePairs: number;
  sequence: string;
  highlightPairs: number; // how many middle pairs are "member" bases
  helixRadius: number;
  rise: number;
  pairsPerTurn: number;
  groove: number;
  backboneRadius: number;
  showBeads: boolean;
  beadRadius: number;
  rungRadius: number;
  highlightRungRadius: number;
  rungGap: number;

  // motion + view
  autoRotate: boolean;
  spinSpeed: number;
  horizontal: boolean;
  tilt: number;
}

export const DEFAULTS: Params = {
  background: "#fbf3e4",
  strand1: "#8e8471",
  strand2: "#8e8471",
  beadsMatchBackbone: true,
  beadColor: "#efe7d8",
  baseA: "#4caf6e",
  baseT: "#e2643c",
  baseG: "#e8a93a",
  baseC: "#4a7fd6",
  baseTint: "#efe7d8",
  baseTintAmount: 0.12,
  flankTintAmount: 0.42,

  bbRoughness: 0.3,
  bbMetalness: 0,
  bbSpecular: 0.7,
  bbClearcoat: 0.3,
  bbClearcoatRoughness: 0.25,
  bbSheen: 0,
  bbEnvIntensity: 0.55,

  rungsMatchBackboneFinish: true,
  rungRoughness: 0.3,
  rungMetalness: 0,
  rungSpecular: 0.7,
  rungClearcoat: 0.3,
  rungClearcoatRoughness: 0.25,
  rungSheen: 0,
  rungEnvIntensity: 0.55,

  envWall: "#5c5852",
  envSoftbox: 3.2,
  envFillCard: 0.9,
  envFloor: 0.22,
  envBlur: 0.03,

  toneMapping: "Neutral",
  exposure: 1,
  hemi: 0.95,
  hemiSky: "#ffffff",
  hemiGround: "#e6ded0",
  key: 1.5,
  keyColor: "#fff6ec",
  fill: 0.35,
  rim: 0.8,
  shadowOpacity: 0.06,
  shadowSoftness: 14,

  basePairs: 42,
  sequence: "ATGCAGTCGATCGA",
  highlightPairs: 14,
  helixRadius: 1.9,
  rise: 0.62,
  pairsPerTurn: 10.5,
  groove: 2.4,
  backboneRadius: 0.19,
  showBeads: true,
  beadRadius: 0.24,
  rungRadius: 0.14,
  highlightRungRadius: 0.19,
  rungGap: 0.07,

  autoRotate: true,
  spinSpeed: 0.16,
  horizontal: true,
  tilt: 0.22,
};

export const PRESETS: Record<string, Partial<Params>> = {
  "Wiki (current)": {},
  "Satin, light beads": {
    strand1: "#a89b86",
    strand2: "#a89b86",
    beadsMatchBackbone: false,
    beadColor: "#efe7d8",
    bbRoughness: 0.42,
    bbClearcoat: 0,
    bbSpecular: 0.5,
    bbSheen: 0.3,
    bbEnvIntensity: 0.3,
    rungsMatchBackboneFinish: true,
    envWall: "#9c958a",
    hemi: 1.3,
  },
  "Coral & cyan": {
    strand1: "#f0786b",
    strand2: "#65c5d6",
    beadsMatchBackbone: true,
    baseA: "#f3ebdd",
    baseT: "#f3ebdd",
    baseG: "#f3ebdd",
    baseC: "#f3ebdd",
    baseTintAmount: 0,
    flankTintAmount: 0,
    showBeads: false,
    backboneRadius: 0.34,
    bbRoughness: 0.55,
    bbClearcoat: 0,
    bbSpecular: 0.35,
    bbEnvIntensity: 0.25,
  },
  "High gloss": {
    bbRoughness: 0.16,
    bbClearcoat: 0.8,
    bbClearcoatRoughness: 0.08,
    bbSpecular: 1,
    bbEnvIntensity: 0.9,
  },
  "Matte clay": {
    bbRoughness: 0.85,
    bbClearcoat: 0,
    bbSpecular: 0.2,
    bbEnvIntensity: 0.1,
  },
};
