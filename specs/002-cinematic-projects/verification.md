# Projects verification

## Scope and traceability

The Spec Kit specification, clarification, plan, task generation and pre-implementation analysis mapped the catalogue to T001–T002, deep links and restoration to T003, and the Risk Miner presentation to T004. T005 covers runtime verification across all three stories. Implementation uses the repository's React/Vite conventions and Playwright CLI wrapper. The local ImageGen assets have 540 px card and 1200 px detail versions. The three gallery images are isolated concept views from the supplied video at 00:38.

## Implementation and reference comparison

- The catalogue follows the supplied still's left-aligned two-line heading, active Projects tab, red accents, right-hand station and illustrated card grid. The sixth entry follows the film. Event footers use text and neutral symbols. CSS controls the optional in-card transitions.
- ProjectCard composes ProjectArtwork, ProjectAchievement and the event footer. ProjectDetailPage uses the same data for both layouts. ProjectSections handles capabilities, gallery, stack, stable member IDs, solution text and links when supplied. BackToProjects supports direct entry and history restoration.
- The five standard presentations follow the 00:26 frame with a split heading/art layout, award when present, divider and two return links. The extended presentation follows 00:38–00:45 with the map, four capabilities, three gallery views and team/technology sidebar. The physical station model, Earth lighting and generated art differ from the reference renders.
- Content is demonstration material. The owner should verify events, dates, awards, descriptions, the proposed Risk Miner stack and the four demonstration assignments. The gallery depicts concepts. No additional awards or performance claims were introduced.

## Browser and performance evidence

The screenshots directory contains the catalogue, CapTrace and Risk Miner at 2560×1440, 1920×1080, 1440×900, 768×1024 and 390×844. The wrapper exercised Home → Team → Projects, navigated internally and checked scroll-container width. The final matrix recorded zero page errors or console errors. Three.js logged its existing Clock deprecation warning. Tablet card overflow and portrait station placement were corrected during review. Ultra-wide layout uses the same approximately five-percent gutters as the reference.

At 1920×1080 and DPR 1 the live catalogue Canvas reported 59.988 FPS over 5.001 seconds after warm-up on an Apple M3 Pro MacBook Pro. This is a local Chromium sample. Quality selection and shaders are unchanged. All 15 project WebP files together occupy about 728 KiB on disk.

## Quality gates and convergence

- make web-check passed 48 unit tests, type-aware lint, formatting, strict types and the production build. Coverage reached 95.22% lines, 94.05% statements, 95.83% functions and 92% branches.
- make api-check, compose-check and spec-check passed.
- make e2e passed 21 tests across Chromium, WebKit and mobile Chromium. All seven Firefox cases failed at browser launch with “Could not find profile folder.” A standalone Playwright launch reproduced this before application load with an explicit isolated profile path as well.
- Convergence verified all six data entries, conditional awards, dynamic detail routes, media variants, team references, persistent scene ownership, reduced motion, keyboard restoration, responsive grid and screenshots. The Firefox runtime check remains open.

The final axe pass on the catalogue, CapTrace and Risk Miner returned zero violations. Earlier scans identified card accessible names that omitted visible text and a skipped heading level in capabilities. The component now derives each link name from the card content and uses second-level capability headings.

All local pre-commit hooks passed on the final working tree, including Chromium against the production build. All 15 artwork responses matched the local WebP files byte for byte. Vercel rewrites the project routes to the SPA entry point. Artwork lives under /project-art/ so Nginx and Vercel can serve it independently of the /projects route.
