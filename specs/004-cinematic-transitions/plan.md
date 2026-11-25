# Implementation Plan: Cinematic Transitions

## Context and constitution

Extend the React/Vite SPA in `web/src`, its CSS palette, R3F renderer and existing Playwright/Vitest workflow. The existing `api/` remains in the repository quality gates. No new runtime dependencies or data access. The feature complies with the constitution's purpose, template reuse, data and local checks principles.

## Design

- Place the header, route sections and orbit under the existing scene shell. Keep the last orbital framing underneath Journey and leave its active route content inert while covered.
- Choose persistent Canvas over restoring scene state after disposal. Keeping one GPU allocation avoids refetch, shader recompilation and serialization of multiple object transforms. Suspend the R3F loop when covered and when the document is hidden. Keep explicit reduced-motion changes and the current session's button behavior.
- Layer the existing mountain scene over the live orbit and use a warm gradient and selective copy/timeline staging. Keep routing and focus synchronous with React. Use CSS opacity and transforms for dynamic presentation. The document View Transition API captures a snapshot before committing the DOM and would add coordination with React Router, history and the continuously rendered Canvas. Keep the environment layers live and use CSS, including a first-entry starting style.
- Route timing starts at 460 ms for Team, 380 ms for the catalogue, 420 ms for details and 900 ms when crossing environments. Keep the longest transition separate from routing and reduced-motion behavior.
- Keep project artwork ratios and use a detail reveal on the existing artwork. Full shared-element geometry is optional and risks cropping mismatched card/detail art.
- Compare production builds, collected via the pinned Playwright wrapper and existing browser package. Capture width and overflow, separate RAF callback and WebGL draw cadence, profile warm and repeated routes, and verify the original fallback.

## References

- [Document View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
- [CSS starting styles](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style)
