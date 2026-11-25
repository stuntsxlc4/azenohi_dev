# Feature Specification: Cinematic Mountain Journey

**Branch**: `codex/journey-mountain`
**Created**: 2026-11-25

## User Scenarios & Testing

### US1 — Visit Journey (P1)

Visitors open Journey from the shared header or directly at `/journey`. The active menu item, document title and heading focus follow navigation, refresh and browser history.

### US2 — Explore the team timeline (P1)

Visitors follow a glowing red trail through five illustrated milestones to a branded summit. Each entry shows its year and two lines of copy and responds to pointer and keyboard activation. Visitors can identify all entries and their descriptions on narrow and wide screens.

## Requirements

- **FR-001** — Expose `/journey` through the shared navigation, including mobile, with title, active state and heading focus.
- **FR-002** — Use the supplied mountain reference as the source for the Journey scenery and the five photo cards. Keep the shared orbital scene for the other portfolio routes.
- **FR-003** — Show “OUR JOURNEY”, “Small Steps. Big Dreams.”, with “Dreams.” in red, the supplied two-line introduction and “THE BEST IS YET TO COME”. Include the summit flag, red route and checkpoint glow.
- **FR-004** — Show the five supplied demonstrative milestones in chronological order. Label the content as illustrative and keep it replaceable independently of the component.
- **FR-005** — Keep typography and cards legible with no horizontal scrolling. Use a landscape composition on desktop and a mountain hero with a sequential trail on narrow screens.
- **FR-006** — Support focus, pointer, touch, and visible checkpoint selection. Respect reduced motion across reveals, glow and parallax.

## Success Criteria

- **SC-001** — Route, refresh, history and focus pass Chromium verification.
- **SC-002** — Provide screenshots at 2560×1440, 1920×1080, 1440×900, 768×1024 and 390×844 with readable layouts and no horizontal overflow or console errors.
- **SC-003** — Sample sustained animation during Journey interaction against a 30 FPS target. Record the test device, browser and limits of the measurement.

## Clarifications

- The supplied screenshot is the visual and asset source. Separate rendered UI from the mountain artwork so it can adapt across viewports.
- Each frame doubles as the associated milestone control. Selection highlights that entry and preserves chronological order.
- Firefox and changes to stage 04B are outside scope. The timeline is static illustrative content and needs no API.
