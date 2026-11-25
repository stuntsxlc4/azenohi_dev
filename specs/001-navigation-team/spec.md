# Feature Specification: Cinematic Team, Shared Scene & Navigation

**Feature Branch**: `codex/cinematic-team`

**Created**: 2026-11-25

**Status**: Clarified

**Input**: Extend the existing AZENO HI website with navigation and a responsive Team page.

## Clarifications

### Session 2026-11-25

- Q: Should the written description guide composition when the referenced image is absent? → A: Yes, use the description.
- Follow-up instruction — remove the visible demonstration disclaimer beneath the Team heading.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate between pages (Priority: P1)

Visitors can reach Team from Home and return using the shared header or browser history.

**Why this priority**: Visitors need working access to the team page.

**Independent Test**: Open Home, follow Team, reload, go back and forward, and return through the logo.

**Acceptance Scenarios**:

1. Given Home, when Team or Meet the team is selected, then `/team` opens with the correct active navigation, document title and focus on the page heading.
2. Given a direct visit to `/team`, when reloading, then Team remains available.
3. Given navigation between pages, when using Back and Forward, then URL, content, title and active navigation agree.
4. Given a narrow screen, when navigating with keyboard or touch, then every available destination remains accessible.

### User Story 2 - View the team (Priority: P1)

Visitors see a cinematic, readable grid with clearly identified team information.

**Why this priority**: This is the primary new content.

**Independent Test**: Open Team at desktop, tablet and phone widths and inspect cards with absent optional information.

**Acceptance Scenarios**:

1. Given Team, when viewing the page, then OUR TEAM and People × AI appear above a responsive portrait grid with red accents and names at the bottom.
2. Given the supplied twelve fictional members, when viewing cards, then their supplied names, roles and technologies appear with cinematic portraits. Demonstration status remains recorded in data and accessible list labeling.
3. Given an optional portrait, role or confirmed link, when supplied, then the card renders that information accessibly. Cards without actions remain ordinary content.

### Edge Cases

- Missing or failed portraits show a neutral placeholder.
- Missing roles and links do not create empty controls.
- Reduced-motion preferences suppress card movement and retain existing Home behavior.
- Paused or reduced-motion route changes update framing immediately without restarting animation.
- Unknown paths show an explanatory page with a Home link.
- Modified link clicks preserve standard browser behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Provide Home at `/` and Team at `/team`, including direct entry, refresh and browser history.
- **FR-002**: Share a logo linking Home and Home, Team, Projects and Journey navigation. Mark the current page with a red underline and aria-current.
- **FR-003**: Enable Meet the team. Keep Projects, Journey and Explore projects visibly unavailable.
- **FR-004**: Update document titles and move focus meaningfully after navigation. Provide visible keyboard focus and readable navigation on phones.
- **FR-005**: Display OUR TEAM, People × AI with a red multiplication sign, a dark spatial background and a responsive multicolumn card grid.
- **FR-006**: Separate team records from presentation. Each record has a stable identifier, display name, optional role, portrait and confirmed links. Separate demonstration records from publication records and omit unconfirmed counts.
- **FR-007**: Use neutral placeholders for missing portraits and retain demonstration metadata and accessible list labeling. Avoid invented personal information and inactive profile affordances.
- **FR-008**: Provide subtle hover and interactive focus treatment, reduced-motion support, semantic headings, appropriate image descriptions and no horizontal overflow.
- **FR-009**: Preserve Earth textures, shaders, materials, atmosphere, ship model, lighting and quality settings. Share one persistent animated scene across Home and Team, allowing camera framing changes, with Pause/Play, motion preferences and fallback.
- **FR-010**: Verify behavior through existing local checks, regression tests and desktop/mobile browser inspection. Capture Home and Team screenshots and report missing materials and reference-video availability.

- **FR-011**: Retain exactly one Canvas across Home → Team → Home, with continuous Earth/cloud/ring/ship motion and subtle parallax. Route transitions must not remount or reset the scene.
- **FR-012**: Use smooth route camera transitions, a visible curved Earth horizon and upper-right ship on Team. Hide Home foreground figures on Team. Scroll content independently above the scene.
- **FR-013**: Render twelve fictional members with the exact supplied names, roles and technologies, explicit demo flags, optional links and locally optimized portraits where generation is available.
- **FR-014**: Show recognizable accessible technology icons with recorded licenses. Desktop targets six columns, with fewer columns on smaller screens, equal-height cards, subtle hover scaling and lighting, and reduced-motion support.
- **FR-015**: Apply the supplied cinematic palette through semantic tokens, controlled blue/red/warm lighting and diagonal red accents, preserving the planet appearance.
- **FR-016**: Measure animation performance where possible, targeting 30 FPS on the target MacBook. Inspect 1920×1080, 2560×1440, 1440×900, 768×1024 and 390×844, capture screenshots and attempt a short transition video. Report environmental limitations and reference availability.

### Key Entities *(include if feature involves data)*

- Team member has a stable identity, display name and optional role, portrait and confirmed links.
- Demonstration member uses explicitly illustrative labels and carries no claim about actual membership.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All navigation acceptance scenarios pass on desktop and mobile.
- **SC-002**: Pages remain readable without horizontal scrolling at 320, 768 and 1440 pixel widths.
- **SC-003**: Every demonstration record carries its demo flag, with zero invented biographies or unconfirmed membership counts.
- **SC-005**: Navigation preserves Canvas identity across ten alternating route transitions, with zero application console errors.
- **SC-006**: All twelve supplied demo members render with roles and technology icons, and six columns appear at 1920px.
- **SC-007**: Record measured frame timing and environment against the 30 FPS target without unmeasured quality reductions.
- **SC-004**: Screenshots cover both pages at the five specified viewports, and all required checks pass or have documented reproducible blockers.

## Assumptions

- Public, English-language informational pages follow the existing website language.
- Existing project assets provide the visual baseline. When the reference video is unavailable, use the written direction.
- The supplied twelve names, roles and technologies are fictional demonstration content. Generated adult portraits illustrate these fictional identities.
- A visible wrapping mobile navigation can satisfy the requirement without a disclosure menu.
