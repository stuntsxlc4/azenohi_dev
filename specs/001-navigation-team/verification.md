# Cinematic Team verification

## Delivered

Persistent SceneShell with React Router links keeps one WebGL Canvas across Home and Team. Camera translation changes framing without changing projection, Earth materials, shaders, atmosphere, quality or lighting. Motion preference, Pause/Play and fallback are shared. Team hides the Home foreground and scrolls above the scene.

Twelve supplied fictional members have local optimized generated portraits, roles, technologies, stable IDs and demo flags. Technology logos retain upstream brand colors and the included Devicon MIT license. Generic concepts use project SVGs. Semantic palette tokens implement the supplied cinematic colors. Cards use six columns on wide screens and responsive grids below.

## Validation

- make web-check passed, 38 unit tests, branch coverage above 90%, production build successful.
- Browser tests cover Canvas identity through ten alternating transitions, persistent Pause state, direct entry, reload, history, CTA, titles/focus, keyboard navigation, axe checks and overflow.
- Initial full make e2e exposed obsolete query-string expectations, subsequently corrected. Firefox cannot launch in this environment and reports Could not find profile folder before loading the app. All 18 scenarios across Chromium, WebKit and mobile Chromium passed after correction. A concurrent report-directory cleanup affected one mobile teardown, and a separate mobile rerun passed all six tests.
- All local pre-commit checks passed, including Chromium and production build. Isolated E2E ports were 8002/4174.
- Actual rendered-frame sample after warmup at 1920×1080 and DPR 1 measured 60.02 FPS over 5.015 seconds. This is a local browser measurement, not a guarantee for other GPUs or Retina resolutions. Existing quality selection remains active.
- Project playwright-cli inspected Home and Team at 1920×1080, 2560×1440, 1440×900, 768×1024 and 390×844. Screenshot review confirmed responsive cards and scene visibility. Mobile inspection reported one Canvas, twelve portrait elements and no horizontal overflow.
- No application console errors observed. Three.js emits its existing THREE.Clock deprecation warning.

## Visual evidence

Screenshots are under .playwright-cli/cinematic-home-{1920,2560,1440,768,390}.png and corresponding cinematic-team files. The transition video is .playwright-cli/cinematic-navigation.webm.

The user confirmed that the written brief is the reference. The result implements its dark navy composition, red multiplication sign, six-column portrait grid, upper-right ship, curved animated Earth horizon and restrained diagonal accents. No reference image was supplied for pixel-level comparison.

## Assets and limitations

All portraits were generated through built-in image_gen and optimized locally to WebP. Prompt set requested fictional adults, chest-up portraits, dark clothing, professional natural faces, red rim light, blue key light and dark navy backgrounds, with distinct ages/hair/glasses. See web/public/team/CREDITS.md and icons/LICENSE. Generated assets are stored under web/public/team/{member-id}.webp. Approved real team content remains a future replacement for explicitly fictional demonstration data.

Diagnostics are retained in /tmp/cinematic-check.log, /tmp/cinematic-e2e.log, /tmp/cinematic-e2e-final.log, /tmp/cinematic-hooks.log and /tmp/cinematic-visual.log. Vercel rewrite is locally reviewed, not remotely deployed.

## Final convergence

Reviewed 16 functional requirements, 7 success criteria, all acceptance scenarios, 10 tasks, persistent scene/router/data/assets/rendering decisions and four constitution principles. Zero missing, partial, contradicting or unrequested implementation findings. No convergence phase was appended, and tasks.md remained unchanged during this assessment. Firefox startup is an explicitly documented environment limitation.

## Pull request validation

After removing the visible Team disclaimer, make web-check passed. Full make e2e passed 18 cases and failed six Firefox launches. A forced Firefox reinstall, project-local TMPDIR and standalone launches using existing profile folders in the project and /Users/Shared reproduced Could not find profile folder before application loading. Merge remains gated on a zero-error result. Current diagnostics are /tmp/pr-web-check.log, /tmp/pr-e2e.log and /tmp/pr-hooks.log.
