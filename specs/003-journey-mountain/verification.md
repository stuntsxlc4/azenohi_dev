# Journey Verification

## Outcome

Journey is available from the shared header and at `/journey` on branch `codex/journey-mountain`. The mountain scene uses an independently rendered 2D background, with the original glow and flag registered to the terrain. The desktop checkpoints align with that trail. Tablet and phone use the same mountain hero followed by a vertical sequence of interactive entries.

The supplied `image (3).png` is the source for the background and all five photo cards. The built-in ImageGen edit removed the embedded headings, navigation, captions and thumbnails from the background. Its prompt requested a clean plate with the original rock formations, colors, clouds, sunset, flag, glowing trail and five checkpoints preserved. The photo frames were cropped directly from the supplied image. The six encoded assets in `web/public/journey/` total about 230 KB. Entries are illustrative and labelled accordingly.

## Verification results

- `npm --prefix web run check` passed, including 49 unit tests, 95.32% line coverage and 91.84% branch coverage.
- `pre-commit run --all-files` passed, including the production Chromium suite (8 tests), backend lint, format, types, tests and coverage, Sphinx, and Compose configuration.
- Chromium covered navigation, direct entry, reload, Back and Forward, active link, heading focus, keyboard selection, orbital-scene isolation, and automated Axe checks.
- Playwright CLI verified five decoded photos, no horizontal overflow and no console errors at all five sizes. A touch-emulated 390×844 session confirmed selection with the pulse and frame transition disabled under reduced motion.
- Manual visual checks compared the screenshots with the source image, including desktop checkpoint alignment and the complete tablet and phone timelines.

## Screenshots and frame cadence

Sampled `requestAnimationFrame` for 2.5 seconds with a selected checkpoint in headless Chromium 158 on a MacBook Pro (M3 Pro, 18 GB). Desktop samples followed pointer movement. These numbers describe browser callback cadence during the sample.

| Viewport | Screenshot | Mean FPS | P95 interval | Longest interval |
| --- | --- | ---: | ---: | ---: |
| 2560×1440 | [Viewport](screenshots/journey-2560.webp) | 60 | 16.7 ms | 16.8 ms |
| 1920×1080 | [Viewport](screenshots/journey-1920.webp) | 60 | 16.8 ms | 16.8 ms |
| 1440×900 | [Viewport](screenshots/journey-1440.webp) | 60 | 16.7 ms | 16.8 ms |
| 768×1024 | [Viewport](screenshots/journey-768.webp) · [Full content](screenshots/journey-768-full.webp) | 58 | 16.7 ms | 100 ms |
| 390×844 | [Viewport](screenshots/journey-390.webp) · [Full content](screenshots/journey-390-full.webp) | 60 | 16.7 ms | 16.8 ms |

## Scope and limitations

Journey mounts its own shell. Returning to an orbital route starts the orbital renderer and its pause state afresh. The shared renderer remains persistent during navigation between orbital routes. Firefox was outside scope. Actual mobile hardware performance and assistive-technology behavior remain unverified. The production build continues to emit the existing orbital bundle size warning.

## Spec Kit reconciliation

Specify and Clarify captured the route, asset provenance, demonstration content and interaction rules. Plan and Tasks mapped them to the existing frontend and verification workflow. Analyze checked the FR-001–FR-006 coverage in T002–T006 and found no conflicting requirements. Implement built the route and scene. Converge matched the six requirements to the route, responsive scene, assets, keyboard controls, screenshot matrix and verification results. No pending implementation tasks were found within the agreed scope.
