# Data model

TeamMember has stable unique id, name, role, portrait, technologies, optional confirmed links and demo=true for all supplied records. Twelve records preserve supplied spelling and roles. Technologies map to local icon assets or clearly named generic concept icons. Portrait loading failure uses a neutral placeholder. All fictional records are separated from future confirmed members.

Scene view is home or team. Persistent state contains moving, ready, failed and pointer. Camera target is derived from view and viewport, while flight time and planet rotation remain renderer-owned refs. Frame statistics summarize actual rendered frames after warmup and include sample duration, FPS, DPR and dimensions.
