# Research

## Persistent routing

Decision — pinned React Router with BrowserRouter and Link, persistent shell outside route content.
Rationale — native document navigation resets WebGL and cannot meet continuity. Standard router handles history and modified clicks.
Alternatives considered — custom interception would duplicate browser semantics.

## Camera and scene

Decision — fixed full-viewport Canvas, translate camera x/y only. Existing Planet derives geometry and sun placement from viewport dimensions, so retain projection and zoom. Existing terrain, cloud, ring and ship motion already implement the requested animation.
Rationale — continuity with stable lighting and materials. Paused navigation updates framing once via invalidate.
Alternatives considered — remounting scene or changing zoom conflicts with appearance and continuity requirements.

## Assets

Decision — separate generated fictional adult portraits, optimized to local WebP. Local licensed technology icons with accessible labels. Semantic CSS lighting surrounds content.
Rationale — supplied fictional identities can be represented without implying real membership.
Alternatives considered — random real portraits would misrepresent affiliation.

## Reference

User confirmed the written brief is the visual reference because no reference image was attached.
