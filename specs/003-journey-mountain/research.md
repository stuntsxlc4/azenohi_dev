# Journey Design Decisions

## Mountain and trail

Use the supplied reference as the asset source. Remove the embedded interface with an image edit and export the panorama, trail and flag together in WebP. This keeps the trail registered to the ridge and maintains the original lighting. A separate 3D scene would require reconstructing the supplied composition and introduce a second renderer.

## Layout and motion

Anchor desktop milestones to artwork coordinates. Switch to an ordered list over a separate vertical trail below the mountain hero at narrow widths. This gives interactive text physical space to wrap. Scaling the desktop layout across all widths would shrink the text and hit targets together.

Reuse CSS transforms and opacity for the light drift, reveal and selection cues. The pointer handler updates a CSS custom property without triggering React renders. The media preference disables animation without changing the milestone controls.
