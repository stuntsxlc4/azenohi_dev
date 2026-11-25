# Implementation Plan — Cinematic Team

**Branch** `codex/cinematic-team` | **Date** 2026-11-25 | [Spec](spec.md)

## Summary

A persistent application shell owns the existing lazy OrbitScene, motion preference, pause state and fallback. React Router handles client navigation and native link semantics. Team content scrolls above one fixed Canvas. Camera translation interpolates view offsets while retaining projection, zoom, planet lighting, quality and assets.

## Technical Context

Use existing React 19, TypeScript 7, Vite 8, R3F and Three configuration. Add pinned react-router 8.5.3 for persistent declarative routing. Local WebP portraits and licensed local technology SVG assets support twelve explicit demo records. Tests use current Vitest and Playwright. Target five requested viewports and measured 30 FPS on the available MacBook environment. No per-card Canvas.

## Constitution Check

All four principles pass before research and after design. Changes meet specified navigation, cinematic composition and data needs. Reuse rendering, infrastructure and gates. Fictional data is labeled. Preserve diagnostics and existing data boundaries. No telemetry or deployment workflow additions.

## Project Structure

- `web/src/app/App.tsx`, `SiteHeader.tsx`, `SceneShell.tsx` own routes and persistent scene.
- `web/src/features/home/Home.tsx` contains Home content only.
- `web/src/features/home/OrbitScene.tsx` adds route camera translations and frame timing observability.
- `web/src/app/palette.css`, `home.css` and `web/src/features/team/team.css` implement cinematic semantic tokens and responsive composition.
- `web/src/features/team/members.ts`, `Team.tsx`, `TechnologyIcon.tsx` separate data, cards and accessible icons.
- `web/public/team/` contains optimized fictional portraits, local icons and attribution.
- `web/src/app/App.test.tsx`, `web/src/features/home/OrbitScene.test.tsx`, `web/src/features/team/Team.test.tsx` and `web/e2e/navigation.spec.ts` validate state, routing and content.
- Existing `api/` supports isolated E2E checks.

## Complexity Tracking

No constitution exceptions. Scene identity is stable across route changes. Motion-disabled route changes snap camera and invalidate once. Quality query parameters survive navigation.
