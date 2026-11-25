# Navigation contract

| URL | Heading | Active tab | Return behavior |
| --- | --- | --- | --- |
| /projects | From Hackathons to Real Impact | Projects | A previously selected card regains focus and its scroll offset on history traversal. |
| /projects/:slug | Catalogue name | Projects | Either return control goes to the originating entry or opens the catalogue after direct entry. |
| /projects/unknown | Project not found | Projects | One link returns to the catalogue. |

Client-side links preserve the query string, including scene quality overrides. The six valid slugs come from the local catalogue. Every page has one main heading and updates the document title. Browser Back and Forward retain normal history semantics.
