# Tasks — Cinematic Team

## Phase 1: Setup

- [X] T001 Pin router in web/package.json and lock, verify ignores and server fallback (FR-001).

## Phase 2: Foundation

- [X] T002 Implement persistent web/src/app/SceneShell.tsx with shared motion/fallback state and fixed Canvas (FR-009, FR-011).

## Phase 3: US1 Navigation and shared scene

- [X] T003 [US1] Extend web/e2e/navigation.spec.ts and web/src/features/home/OrbitScene.test.tsx for Canvas identity, pause and route camera behavior (FR-001–004, FR-011–012, SC-001, SC-005).
- [X] T004 [US1] Integrate router and persistent header in web/src/app/App.tsx and SiteHeader.tsx, extract content-only Home.tsx and animate camera translation in OrbitScene.tsx (FR-001–004, FR-009, FR-011–012).

## Phase 4: US2 Cinematic Team

- [X] T005 [US2] Generate and optimize twelve fictional portraits in web/public/team/ and record asset provenance (FR-013).
- [X] T006 [US2] Update web/src/features/team/members.ts with unique stable id, name, role, portrait, technologies, optional links and demo flag for the twelve supplied records (FR-006, FR-013, SC-003, SC-006).
- [X] T007 [US2] Add accessible licensed technology assets and TechnologyIcon.tsx, update Team.tsx and Team.test.tsx for portraits, roles and icons (FR-005–008, FR-014).
- [X] T008 [US2] Update web/src/app/palette.css, home.css and web/src/features/team/team.css for six-column cinematic cards, shared scene visibility, diagonal accents and responsive scrolling (FR-005, FR-008, FR-012, FR-014–015, SC-002).

## Phase 5: Verification

- [X] T009 Measure actual scene frames, inspect five viewports with .agents/bin/playwright-cli, capture screenshots/video and record results in specs/001-navigation-team/verification.md (FR-010, FR-016, SC-004, SC-007).
- [X] T010 Run make web-check, make e2e and hooks, resolve regressions and record diagnostics in specs/001-navigation-team/verification.md (FR-010).

## Dependencies and strategy

Setup → foundation → US1 → US2 → verification. US1 independently proves stable navigation and scene identity. US2 independently proves twelve cards, six columns and responsive presentation. Asset preparation is independent of scene integration. Complete both stories before delivery.
