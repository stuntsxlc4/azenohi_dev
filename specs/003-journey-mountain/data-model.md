# Journey Data Model

Each milestone has a unique numeric year, two lines of descriptive copy, a local image path and a desktop checkpoint expressed as horizontal and vertical percentages of the artwork. The five illustrative entries are ordered by year in `web/src/features/journey/milestones.ts`. The location metadata changes when the artwork changes. Display copy and image paths can be revised independently.

The view starts with no selected milestone. Activating a milestone selects its year and replaces any prior selection. Activating the selected milestone clears the selection.
