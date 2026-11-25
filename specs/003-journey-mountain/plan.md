# Implementation Plan: Cinematic Mountain Journey

## Summary

Add a standalone 2D mountain composition to the existing React/Vite application. Use a clean plate derived from the supplied screenshot, separate WebP crops for event imagery and HTML milestone controls. Keep the red ascent and summit flag registered to the terrain.

## Technical Context

- Reuse the router, shared header, route scroll container, focus behavior and palette in `web/src/app/`.
- Render the Journey shell without an orbital renderer. Home, Team, Projects and detail routes keep the shared orbital shell.
- Store demonstration content in a typed frontend catalogue. No changes in `api/` or deployment.
- Use CSS transforms and opacity for restrained motion with narrow-screen and reduced-motion styles. Use existing Chromium, accessibility and template checks.

## Constitution Check

The feature has measurable acceptance, reuses the template, uses only public illustration data and adds no services or telemetry.

## Project Structure

- `web/src/features/journey/` — typed milestones, scene, layout and interaction.
- `web/public/journey/` — derived mountain plate and event crops.
- `web/e2e/navigation.spec.ts` — route and interaction regression.
- `specs/003-journey-mountain/` — specifications and evidence.
