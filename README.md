# DNA Helix Studio

A live tuning page for the 3D DNA double helix on the DelNorte-SD iGEM 2026
wiki's Team page. Every color, material, reflection and light is a control, so
anyone on the team can art-direct the helix without touching the wiki's code.

**Live:** https://shouryap4132.github.io/dna-helix-studio/

## Using it

- **Drag** to orbit, **scroll** to zoom, **right-drag** to pan.
- **Preset** (top of the panel) starts from a saved look. "Wiki (current)" is
  exactly what's on the wiki now.
- **Colors / Nucleotides**: page background, each backbone, beads, and the A,
  T, G, C base colors. "Beads match backbone" makes the joint beads reuse the
  backbone's material.
- **Backbone & bead finish / Nucleotide finish**: roughness, metalness,
  specular, clearcoat, sheen and reflection strength.
- **Reflections (studio)**: the invisible studio the surfaces reflect: wall
  tone, softbox, fill card, floor, blur. Darker walls give glossy surfaces more
  contrast.
- **Lights**: tone mapping, exposure, ambient, key, fill, rim, shadow.
- **Shape**: number of base pairs, radius, twist, thicknesses, gaps.

Your settings are saved in your browser automatically.

## Sending a look back

Open **Save & share** and use:

- **Copy share link**: a URL with every setting in it. Whoever opens it sees
  exactly your helix.
- **Copy wiki code**: the values formatted for the wiki
  (`src/contents/members/dnaScene.ts` and `bases.ts`), plus the full settings.
- **Download / Copy settings (JSON)** and **Import settings…** to pass files
  around.
- **Save PNG** for a screenshot.

## Development

```bash
npm install
npm run dev      # local server with hot reload
npm run build    # type-check + production build into dist/
```

`src/params.ts` holds every setting, its default and the presets;
`src/helix.ts` is the three.js scene; `src/main.ts` is the control panel.

### Deploying

The site is served by GitHub Pages from the `gh-pages` branch, which holds
only the built files. To publish changes:

```bash
npm run build
sh scripts/deploy.sh
```
