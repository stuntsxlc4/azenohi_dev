# Feature Specification: Cinematic Transitions

**Feature branch**: `codex/cinematic-transitions`

**Created**: 2026-11-25

## User Scenarios and Testing

### US1 — Traverse the two environments (P1)

An orbital visitor opens Journey, selects a checkpoint and returns. The same Canvas, object phases, quality and Pause/Play state survive. Opening Journey directly displays its content independently of WebGL.

### US2 — Browse the orbital portfolio (P1)

Home, Team, the catalogue and all six details share the header and continuously animated orbit. Navigating back restores the catalogue scroll position and focuses the originating card. Rapid navigation, history, reloads and resizing leave the destination usable.

### US3 — Navigate comfortably (P1)

Keyboard, touch and reduced-motion visitors retain complete access. Focus follows the destination heading unless the catalogue restores a card. Missing WebGL or late imagery leave usable content over the fallback.

## Requirements

- **FR-001**: Preserve routes, assets, Earth rendering, Journey composition and demo data.
- **FR-002**: Keep exactly one orbital renderer after orbital entry and suspend it when fully covered or the document is hidden.
- **FR-003**: Preserve Earth, cloud, station and ring phases, user motion choice and existing quality selection across routes.
- **FR-004**: Use interruptible content motion, an environment crossfade and a shared navigation surface with route-specific timing.
- **FR-005**: Polish nav, actions, cards and checkpoints with motion tokens and respect reduced motion.
- **FR-006**: Preserve route focus, history, scroll restoration, input responsiveness and the poster fallback.
- **FR-007**: Capture paired screenshots, repeatable frame and memory measurements, production bundle analysis, browser checks and a final 45–60 second recording.

## Success Criteria

- **SC-001**: No duplicate Canvas, state reset, inaccessible focus target or blocked navigation across 20 complete routes.
- **SC-002**: Demonstrate five viewport sizes and six performance configurations. Report render cadence and its tail separately from browser callbacks. Target stable 30 FPS and aim for 60 FPS on the M3 Pro.
- **SC-003**: Verify Chromium, WebKit and mobile Chromium, keyboard operation, reduced motion and the mandatory repository checks. Document any measurement or runtime limits.

## Clarifications

- Phase freezes while Journey fully covers the orbit or the document is hidden, and resumes from that phase. Manual Pause freezes object animation immediately.
- Direct Journey starts without a renderer. The first orbital visit is allowed to use the existing static poster while WebGL initializes.
- Six viewport/DPR combinations apply to the benchmark. The five distinct sizes apply to the screenshot matrix.
