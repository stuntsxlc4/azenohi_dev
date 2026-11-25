# Implementation plan

Reuse BrowserRouter, SceneShell, Orbit, palette tokens, local member IDs and TechnologyIcon. Add a typed local catalogue and one slug route in web/src/features/projects. Extend the route camera offset without touching shader, texture or quality settings. Use responsive raster illustrations and independently accessible DOM content. Retain the scroll container and capture the selected card for return navigation. No API changes.

## Constitution check

Each change serves one of the three spec scenarios. Data comes from the brief and local media. Verify using the existing web, E2E and pre-commit gates.

## 04B implementation

Extend the existing semantic CSS tokens and route framing. Preserve the single mounted scene, animated groups, lighting, shader code, textures and models. Change card geometry, image placement, panel gradients, metadata and section spacing. Compare captures at five viewport sizes, measure the live renderer, verify motion preferences and keyboard paths, then record a clean 30-second tour.
