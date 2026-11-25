# Stage 06 verification

## Executive summary

One persistent header and one session-owned orbital Canvas now connect the portfolio and Journey. The mountain page still opens directly without constructing WebGL. Returning from a warmed Journey retains the existing renderer, textures, station transforms and Pause/Play choice.

## Architecture decisions and scene lifecycle

React Router commits the new location immediately. The last orbital frame and framing targets stay available beneath a separate mountain scroll container. After the 900 ms environment transition, React Three Fiber switches to its never frame loop. Document visibility changes also suspend the loop. Paused orbital views use demand rendering for finite camera adjustments. A cancellable timeout retires the outgoing orbital content after its short fade. Every departing section becomes inert and hidden from assistive technology immediately.

## Transition system and animation continuity

Home and Team use a damped orthographic camera and station mount. Catalogue entry, catalogue return and artwork entry have different translation directions or durations. Crossing environments combines a live crossfade with warm horizon light, followed by the mountain title and checkpoint reveal. The artwork retains its original aspect ratio. Browser history still restores the catalogue scroll offset and originating card. CSS motion preferences suppress decorative transitions. Manual Play remains available to request orbital animation under reduced motion.

During Pause a route change places the camera and station mount in the new framing with one requested render. The moving scene interpolates both targets. The state of the rendered objects survives mode changes. R3F restarts its elapsed-time clock when changing loop modes, excluding time spent fully covered. Unit tests advance the ring numerically before Pause and after Play, check hidden frame-loop behavior and verify continuity of the cloud-shadow phase.

## Microinteractions and visual refinements

Shared motion tokens govern the navigation underline, button feedback, team portrait and technology accents, project cards, foreground drift and checkpoint frames. The header uses the same gutters in both environments. The existing mobile navigation remains a row of four links beneath the wordmark. Accepted artwork, panorama, trail positions and project data are preserved.

## Performance BEFORE / AFTER

The production baseline was built from `5e48ff8`. The same pinned Playwright instrumentation ran on the M3 Pro with Chrome **158.0.8127.38** and **ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)**. Each zoom/DPR configuration used a fresh page, eight seconds of initial warm-up and three 1.4-second samples per steady view. Environment transitions used three 1.45-second windows per direction, starting before link activation. The first mountain entry starts at CapTrace and the subsequent two start at Home. Scroll and focus work are included. The six DPR settings below are browser emulation.

WebGL FPS counts distinct animation frames issuing draw calls. RAF FPS counts browser callbacks. Neither measures monitor presentation or precise GPU execution time. The JSON includes draw calls, draws per frame, heap, long-task entries, median, P95, P99, longest interval and counts above 33.3 ms for each sample. Development-server data and the preliminary software-rendered Chromium run are excluded.

The table reports median-of-three Home render FPS, the largest Home P99 across the three samples and the longest RAF interval during return from Journey.

| Viewport / DPR | Home FPS before / after | Home P99 before / after (ms) | Return max before / after (ms) |
| --- | ---: | ---: | ---: |
| 2560 × 1440 / 1 | 60.0 / 60.0 | 16.8 / 16.8 | 16.7 / 16.8 |
| 1920 × 1080 / 1 | 60.0 / 60.0 | 16.8 / 16.8 | 16.7 / 16.8 |
| 1440 × 900 / 1 | 60.0 / 60.0 | 16.8 / 16.8 | 16.8 / 16.8 |
| 1440 × 900 / 2 | 60.0 / 60.0 | 16.8 / 16.8 | 16.7 / 16.8 |
| 768 × 1024 / 1 | 60.0 / 60.0 | 16.8 / 16.8 | 416.7 / 16.8 |
| 390 × 844 / 2 | 60.0 / 60.0 | 16.8 / 16.8 | 283.3 / 16.8 |

The third 768 × 1024 catalogue sample contained one 299.9 ms interval in both the RAF and WebGL series. Its median was 16.7 ms and its P95 was 16.8 ms. The long-task observer recorded no matching entry. Three isolated catalogue repeats at the same viewport had longest intervals of 16.8 ms, 16.8 ms, 16.8 ms. The cause of the original interval remains unresolved. [Tablet repeat samples](evidence/tablet-retest.json)

[Baseline samples](evidence/before.json) · [Feature samples](evidence/after.json) · [Measurement script](evidence/measure.mjs)

## Memory stability

Each build completed twenty Home → Team → Projects → CapTrace → Projects → Risk Miner → Journey → Home cycles. The counters below were taken on Home after forced garbage collection. Contexts are **cumulative creations**. Listener counts and heap include browser framework and instrumentation overhead. WebGL allocation/deletion counters are available by resource type in the JSON. They do not include driver memory reclaimed on context destruction.

| Cycle | Created contexts before / after | Canvas after | Heap before / after (MiB) | JS listeners before / after |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 1 / 1 | 1 | 7.30 / 7.29 | 187 / 188 |
| 5 | 6 / 1 | 1 | 10.45 / 9.54 | 365 / 242 |
| 10 | 11 / 1 | 1 | 12.10 / 9.70 | 530 / 242 |
| 15 | 16 / 1 | 1 | 13.16 / 9.78 | 695 / 216 |
| 20 | 21 / 1 | 1 | 14.21 / 9.99 | 860 / 216 |

The final page observed 0 context-loss events. The fully covered Journey steady-state samples issued 0 draw calls. These observations cover the measured session. Explicit allocation-minus-deletion counts at cycle 20 matched cycle 0 for all six instrumented WebGL resource types. Browser listener totals varied between post-warm checkpoints. These finite samples cannot establish a long-term JS or GPU-memory bound.

## Bundle analysis

The main JS increased from 289.15 to 291.38 kB (92.08 to 92.86 kB gzip). CSS increased from 30.14 to 35.55 kB. The lazily imported orbital chunk changed from 1,064.99 to 1,065.13 kB (290.00 to 290.08 kB gzip). A diagnostic source-map build attributed approximately 574k generated columns to Three.js, 177k to React Three packages and 93k to three-stdlib. Unmapped code and newlines are excluded from attribution. The 500 kB warning remains visible. The runtime benefits come from skipping renderer construction on direct Journey entry and retaining the warmed renderer on return.

## Screenshot matrix

Each overview includes Home, Team, Projects, the six project details and Journey. Full-size WebP captures sit next to each overview. The browser recorded zero horizontal overflow on all 100 route/size combinations.

| Viewport | Before | After |
| --- | --- | --- |
| 2560 × 1440 | [Before](evidence/before/overview-2560.jpg) | [After](evidence/after/overview-2560.jpg) |
| 1920 × 1080 | [Before](evidence/before/overview-1920.jpg) | [After](evidence/after/overview-1920.jpg) |
| 1440 × 900 | [Before](evidence/before/overview-1440.jpg) | [After](evidence/after/overview-1440.jpg) |
| 768 × 1024 | [Before](evidence/before/overview-768.jpg) | [After](evidence/after/overview-768.jpg) |
| 390 × 844 | [Before](evidence/before/overview-390.jpg) | [After](evidence/after/overview-390.jpg) |

The intermediate frames show the brief foreground handoff, the summit emerging through the warm horizon and the return to orbit. [Detail](evidence/detail-in-progress.jpg) · [Descent](evidence/descent-in-progress.jpg) · [Ascent](evidence/ascent-in-progress.jpg)

## Native Retina and preparation time

The built-in display reports 3456 × 2234 physical pixels. This additional run used a headed Chrome window with the viewport override disabled.

- **Before**. Browser viewport 1728 × 996 CSS pixels, DPR 2, drawing buffer width 3456 px. The three Home WebGL draw-cadence readings were 120.7, 120.0, 120.0 FPS.
  - Median observed readiness on /journey was 9.5 ms across 3 samples.
  - Median observed readiness on / was 1767.0 ms across 3 samples.
- **After**. Browser viewport 1200 × 864 CSS pixels, DPR 2, drawing buffer width 2400 px. The three Home WebGL draw-cadence readings were 120.2, 119.9, 120.1 FPS.
  - Median observed readiness on /journey was 8.4 ms across 3 samples.
  - Median observed readiness on / was 7.9 ms across 3 samples.

Chrome selected different native window sizes in the two runs. Use the fixed-size matrix for like-for-like throughput comparisons. Preparation is timed from link activation to the first RAF observation of the destination with the landscape element or the renderer-ready flag. The native log also records heading/card focus and interval tails on each orbital route change. Display scanout and completion of image decoding are outside that readiness measurement. [Native samples](evidence/native.json)

## Accessibility results

Axe reported zero violations on all ten direct routes in Chromium with reduced motion. Browser tests exercise keyboard focus at entry, history restoration, checkpoint activation and interrupted transitions. The retiring route is both inert and hidden from accessibility APIs. On macOS WebKit the checkpoint traversal uses Option-Tab, verified against both builds. Screenshots and browser measurements cover the existing two-line mobile header. [Axe results](evidence/accessibility.json)

## Final recording

The [cinematic tour](cinematic-tour.mp4) is a 48.91-second 1920 × 1080 H.264 capture of the requested sequence. All 2797 frames decoded with monotonically increasing timestamps. The capture retains original frame timestamps and averaged 57.2 captured frames/s. Static holds can have long intervals between compositor updates. The capture rate is independent of application throughput. [Decoded filmstrip](evidence/tour-frames.jpg) · [Media inspection](evidence/recording.json)

## Automated test results

- `make web-check` passed lint, formatting, strict types, 52 unit tests and the production build. Coverage was 97.09% for lines and 94.15% for branches.
- `make api-check` passed the lint, types, documentation and Python test environments. Compose configuration and the installed Spec Kit integration checks passed.
- All 12 local pre-commit hooks passed, including the production Chromium suite. All 30 E2E scenarios passed across Chromium, WebKit and mobile Chromium, ten per project. [Check output](evidence/quality.txt)
- The production matrix recorded zero page errors and zero console errors. The port 8080 development-server smoke check confirmed a single Canvas, Play available under reduced motion and focus on the Home heading after leaving Journey. [Reduced-motion mobile checkpoint](evidence/mobile-reduced-motion.png)


## Spec Kit convergence

The specification, clarification decisions, plan and task list were checked against route ownership, R3F frame-loop changes, unit tests, browser tests, paired measurements and visual evidence. The first review identified overlapping heading exposure, a costly paused-camera interpolation on software rendering and foreground copy lingering during the crossfade. The implementation now retires the outgoing accessibility tree immediately, uses one demand-mode reframe in Pause and stages the incoming text after the outgoing text. The final recording and browser checks exercise these corrections.

## Known limitations

Firefox remains outside Stage 06. Its previously recorded launch failure (“Could not find profile folder”) remains open. The retained orbital allocations trade GPU memory for fast return to the existing phase. Browser resource counters do not expose total driver memory, exact GPU execution duration, panel scanout, battery use or assistive-technology behavior on physical phones. The tablet catalogue outlier remains visible in the raw data. Chrome still emits the existing Three.Clock deprecation warning. The large lazy orbital chunk remains a build warning.

## PR readiness

Local review materials, production measurements and test outcomes are included on `codex/cinematic-transitions`. The local development entry point is [localhost:8080](http://localhost:8080/).
