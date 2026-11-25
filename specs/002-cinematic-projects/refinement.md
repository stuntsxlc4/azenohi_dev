# 04B visual audit

| View | Current film / reference time | Observed difference |
| --- | --- | --- |
| Home | 00:01 / 00:03 | Bright terrain extends under the CTA and foreground figures. The foreground and station carry more visual weight than in the darker reference. |
| Team | 00:05 / 00:12 | Tall sharp-cornered cards, small role labels and icons, narrow grid and low station. The header and grid left edges differ. The bottom of row two reaches 1143 px at 1920×1080. |
| Projects | 00:10 / 00:19 | The layout is structurally close. The art crosses the Productivity Suite title, award marks are small, and the footer repeats diamonds across events. |
| Standard details | 00:15 / 00:26 | The wide illustration intersects the station. The reference uses a compact, almost square artwork below the station and a darker field behind the description. |
| Risk Miner | 00:23 / 00:38 | The map has visible rectangular edges and overlaps the station. The capabilities, gallery captions, technology icons and portraits are too small relative to the hero. HackNation has ordinary metadata styling. |

The Team and Projects stills corroborate rounded cards, darker ground behind the grids, diagonal red accents and consistent gutters. The current film contains a uniform grey strip across the bottom. Live 1920×1080 screenshots show actual scene pixels there, the shell ends at y=1080, and hit testing at y=1079 returns page content. The strip belongs to the capture.

The linked 001 Team and 002 Projects features already define the routes and data. The added refinement criteria map to T007–T011 without changing their contracts.

## Comparison plates

Each plate shows the unmodified capture on the left and the refined view on the right at the same viewport. The source is the running application in Chromium.

| View | 2560×1440 | 1920×1080 | 1440×900 | 768×1024 | 390×844 |
| --- | --- | --- | --- | --- | --- |
| Home | [Compare](refinement/home-2560.webp) | [Compare](refinement/home-1920.webp) | [Compare](refinement/home-1440.webp) | [Compare](refinement/home-768.webp) | [Compare](refinement/home-390.webp) |
| Team | [Compare](refinement/team-2560.webp) | [Compare](refinement/team-1920.webp) | [Compare](refinement/team-1440.webp) | [Compare](refinement/team-768.webp) | [Compare](refinement/team-390.webp) |
| Projects | [Compare](refinement/projects-2560.webp) | [Compare](refinement/projects-1920.webp) | [Compare](refinement/projects-1440.webp) | [Compare](refinement/projects-768.webp) | [Compare](refinement/projects-390.webp) |
| CapTrace | [Compare](refinement/captrace-2560.webp) | [Compare](refinement/captrace-1920.webp) | [Compare](refinement/captrace-1440.webp) | [Compare](refinement/captrace-768.webp) | [Compare](refinement/captrace-390.webp) |
| Risk Miner | [Compare](refinement/risk-miner-2560.webp) | [Compare](refinement/risk-miner-1920.webp) | [Compare](refinement/risk-miner-1440.webp) | [Compare](refinement/risk-miner-768.webp) | [Compare](refinement/risk-miner-390.webp) |

Additional standard detail checks at 1920×1080: [Done](refinement/done-1920.webp), [PrivyMeet](refinement/privymeet-1920.webp), [Productivity Suite](refinement/productivity-suite-1920.webp), [RiskTrace Control Tower](refinement/risktrace-control-tower-1920.webp).

## Changes and visual verification

The shared palette now defines page gutters, panel geometry, grid gaps, icon sizes and lighting behind the content. The lighter navigation uses the existing UI font. Local gradients shape the space behind Home copy, the cards and detail text. Warm lower corners and diagonal accents frame the grids. Scene placement interpolates the camera and station mount independently of Earth, cloud, flight and rotor time. The same persistent Canvas survived the complete navigation sequence.

Team cards now have a 1:1.09 desktop ratio and rounded corners. The second row ends at y=960 in the 1080 px viewport, leaving 120 px below it. A first capture exposed too little headroom above some portraits. Top-aligned crops preserve their hairlines. The portrait layout also received a second adjustment to leave room for the ship before the first row.

Projects keeps six 1.9:1 cards with per-project artwork widths and masks, larger awards and year/arrow columns aligned to the right. The local asset inventory did not contain licensed organiser marks, so footers use the supplied event names. Standard detail artwork uses a near-square cover crop. Risk Miner uses intersecting edge masks, a smaller distant station, a distinct HackNation event label, larger gallery captions and larger team and stack graphics. The Google Cloud icon uses the same Devicon source and local MIT license as the existing technology icons.

All 29 live view/size combinations had zero horizontal overflow. Navigation retained canvas identity in every capture. Axe returned zero violations on Home, Team, Projects, CapTrace and Risk Miner. The visual checks reported zero browser console errors and page exceptions.

## Measured renderer throughput

Chromium, MacBook Pro M3 Pro, 1920×1080 CSS pixels, DPR 1. The existing renderer counter supplied two complete post-settle samples of approximately five seconds per view. Values are rounded to two decimals.

| View | Sample 1 (FPS) | Sample 2 (FPS) |
| --- | ---: | ---: |
| Home | 60.00 | 60.02 |
| Team | 60.00 | 60.00 |
| Projects | 60.00 | 60.00 |
| CapTrace | 60.00 | 60.00 |
| Risk Miner | 60.01 | 60.00 |

The samples describe average throughput in these windows. They do not establish worst-frame latency or native Retina performance.

## Recording

The delivered silent H.264 MP4 contains 30.00 seconds at 1920×1080 and 30 frames per second. It records Home → Team → Projects → CapTrace → Projects → Risk Miner → Projects. A headless Chromium capture used an explicit viewport and a larger screen surface. The old recording had 85 uniform grey rows at 00:01. The new file's bottom scanline was checked once per second over all 30 seconds, with zero matching grey rows. Representative decoded frames also show the complete scene. Capture frame rate is independent of the renderer measurements above.

## Final checks and convergence

- make web-check passed lint, formatting, strict types, all 48 unit tests and the production build. Line coverage was 95.41%, branch coverage 91.84%.
- make api-check, compose-check and spec-check passed. All local pre-commit hooks passed, including production Chromium.
- make e2e passed 21 scenarios in Chromium, WebKit and mobile Chromium. Seven Firefox launches stopped before page load with “Could not find profile folder”. Firefox remains the open runtime verification item T006.
- The final convergence review checked the five visual acceptance groups against their comparison plates, measured margins and row fit, keyboard and motion controls, persistent scene, verified media file and the existing route/data contracts. T007–T011 are complete.
