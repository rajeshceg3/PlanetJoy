# Verify PlanetJoy
PlanetJoy - Explore the World: 3D globe explorer (vite + react-three-fiber).
## Launch
npm install, then npm run dev or npm run build && npm run preview.
## Doctor
`python3 .cursor/skills/verify-planet-joy/verify.py`
## Drive
Builds with vite and renders the built app in headless Chromium asserting the boot marker and zero JS console errors.
## Evidence
`.cursor/skills/verify-planet-joy/evidence.json`
## Cleanup
Static server terminated after the render.
## Known boundaries
Render smoke only; e2e suites (playwright/karma) not exercised here.
