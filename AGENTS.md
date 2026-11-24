# Working in this repository

Read the [constitution](.specify/memory/constitution.md) before planning or making changes.
Create or switch to a dedicated feature branch before editing project files. Never develop or commit directly on `main`.
Write agent guidance and all Spec Kit artifacts in English.

- Setup and checks: [README.md](README.md), [Makefile](Makefile)
  and [.pre-commit-config.yaml](.pre-commit-config.yaml).
- Backend: [api/README.md](api/README.md). Frontend: [web/README.md](web/README.md).
- AI: [docs/ai.md](docs/ai.md). Versions: [docs/versions.md](docs/versions.md).
- Spec Kit workflow and skill invocations: [docs/spec-driven.md](docs/spec-driven.md).
- Official skills, project MCP servers, and pinned CLI wrappers:
  [docs/agent-tooling.md](docs/agent-tooling.md).

Vendor skills provide workflow guidance. Preserve this template's existing
architecture, providers, deployment, and quality tools when applying them.
Use the project CLI wrappers and the Atlassian v2 MCP for the installed skills.

Plans and tasks must reuse the existing template and its actual `api/` and `web/` paths.
Read the configuration instead of copying its requirements into the constitution
or rebuilding infrastructure that is already available.
