# Baseline audit and decisions

| Surface | Observed behavior on the merged Journey baseline | Change |
| --- | --- | --- |
| Home | Static poster backs a lazily mounted R3F Canvas. The foreground has pointer drift. | Retain the poster and fade the foreground during route changes. |
| Team | Twelve portrait cards share the orbit. The route changes the Earth framing and station placement. | Keep the original portrait crop and use the common hover and focus timings. |
| Projects | Six illustrated links save the invoking card and scroll offset in history. | Preserve the catalogue scroll container through the outgoing animation. |
| CapTrace, Done, PrivyMeet, Productivity Suite, RiskTrace Control Tower | One detail component chooses the project artwork and heading from the slug. The card uses a cropped, masked image, while the detail uses the full artwork. | Reveal the existing detail artwork in place. A geometric morph would change its crop. |
| Risk Miner | The extended detail includes capabilities, concept gallery, technologies and demonstration team assignments. | Keep its independent framing and test deep scrolling and return focus. |
| Journey | The route mounted a separate header and shell. Its responsive mountain and checkpoints used CSS and native buttons. Returning to orbit allocated another WebGL context. | Retain the two environments in a shared shell after their respective first visits. |

The initial renderer bundle is already a dynamic import. Direct Journey entry can render without fetching or allocating the orbital scene. Stored GPU buffers, materials, decoded textures and object transforms make keeping one warmed renderer attractive for the return journey. The draw-call and context counters in the benchmark exercise this choice in production.

The test that retains a paused Canvas across interrupted environment changes failed against the baseline. The completed feature adds independent checks for the frame loop, ring phase, route accessibility and recovery when artwork is unavailable.
