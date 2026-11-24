# Application starter

Gotowa templatka aplikacji: React i TypeScript w `web`, FastAPI w `api`, PostgreSQL albo SQLite oraz wspólne uruchamianie przez Docker Compose. Szkielet AI używa LangGraph, lokalnej Ollamy, Neo4j dla grafu wiedzy i źródeł oraz Qdrant dla wektorów. Strona główna AzenoHI.dev wyświetla ekran „Hybrid Intelligence” ze sceną orbitalną. Przykładowy CRUD `items` jest dostępny w API i pozostaje w kodzie frontendu do wykorzystania przy budowie aplikacji. Uwierzytelnianie i uprawnienia dodajesz do konkretnej aplikacji.

Jakość sprawdzamy lokalnie: strict TypeScript, lintowanie z informacją o typach, Prettier, Vitest, Playwright, Ruff, strict Pyright, pytest i dokumentacja. Audytu zależności ani GitHub Actions nie ma. Telemetria FastAPI, LangSmith i baz AI jest jawnie wyłączona; logi JSON i identyfikatory żądań zostają. Langfuse zapisuje świadomie skonfigurowane ślady operacji AI, domyślnie bez treści promptów i odpowiedzi.

## Cały projekt w Dockerze

Wymagany jest działający Docker z Compose co najmniej 2.23.1. Z katalogu głównego:

```bash
make up
```

| Adres                                | Zastosowanie                     |
| ------------------------------------ | -------------------------------- |
| `http://127.0.0.1:8080`              | Frontend                         |
| `http://127.0.0.1:8000/docs`         | Swagger lokalnego API            |
| `http://127.0.0.1:8000/health/ready` | Gotowość API i połączenie z bazą |
| `http://127.0.0.1:8080/health/web`   | Gotowość serwera frontendu       |
| `http://127.0.0.1:3000`              | Langfuse: ślady AI               |
| `http://127.0.0.1:7474`              | Neo4j Browser                    |
| `http://127.0.0.1:6333/dashboard`    | Qdrant dashboard                 |

Przeglądarka korzysta z jednego originu. Nginx serwuje frontend i przekazuje `/api/` oraz `/health/` do FastAPI, a API łączy się z PostgreSQL. Compose czeka na bazy, wykonuje migracje SQL (`migrate`), pobiera modele (`ollama-models`) oraz tworzy constraints Neo4j i kolekcję Qdrant (`ai-init`). Potem uruchamia API i frontend. Pierwszy start pobiera modele `qwen3:0.6b` i `embeddinggemma`; potrzebuje dostępu do sieci i więcej czasu. Langfuse ma osobny PostgreSQL, ClickHouse, Redis i magazyn S3 RustFS. Te usługi inicjalizują się niezależnie od bazy aplikacji; niedostępny eksport śladów nie blokuje API. Migracje nie są efektem ubocznym importu aplikacji.

Porty i lokalne dane połączenia można zmienić przez root `.env`, korzystając z [.env.example](.env.example). Domyślnie usługi są wystawione wyłącznie na localhost: web `8080`, API `8000`, PostgreSQL `5432`, Neo4j `7474`/`7687`, Qdrant `6333`, Ollama `11434`. Jeśli natywna Ollama zajmuje port 11434, ustaw `OLLAMA_PORT=11435` w root `.env`. Dane PostgreSQL przechowuje nazwany wolumen `postgres18-data`. Hasło trafia do sterownika przez `PGPASSWORD`, dzięki czemu znaki specjalne w haśle nie zmieniają składni adresu bazy.

```bash
make logs
make down
# Ponowne uruchomienie i przebudowanie:
make up
```

`make down` zachowuje dane i modele w nazwanych wolumenach. `docker compose down -v` usuwa wszystkie lokalne dane stosu oraz pobrane modele. Kontenery API i frontendu działają bez roota, z systemem plików tylko do odczytu i zapisywalnym katalogiem tymczasowym.

## AI: LangGraph i dwa grafy

`PUT /api/v1/ai/documents/{uuid}` indeksuje źródło wraz z opcjonalnymi, jawnymi faktami i cytatami `evidence`. `POST /api/v1/ai/query` uruchamia LangGraph: embedding pytania → wyszukiwanie Qdrant → źródła i fakty z Neo4j → odpowiedź. SQL przechowuje status indeksowania i chroni retrieval przed częściowymi zapisami. Frontend pozostaje prostą stroną startową.

```bash
make ai-smoke
# Ponowna jawna inicjalizacja schematu i indeksów:
make ai-init
```

Poza Compose AI jest domyślnie wyłączone; można je włączyć przez `APP_AI_ENABLED=true`. [Dokumentacja AI](docs/ai.md) opisuje REST, dual graph, idempotencję, modele i wybór baz. [Przykład Vercel](api/.env.vercel.example) korzysta z zewnętrznego PostgreSQL, AuraDB Free, Qdrant Cloud Free z inference oraz Cloudflare Workers AI Free. Darmowe plany mają limity i zasady usuwania nieaktywnych zasobów, opisane w dokumentacji AI.

## Langfuse

`make up` uruchamia również Langfuse na `http://localhost:3000`. Lokalne konto:
`developer@example.test`, hasło `Langfuse-local-only-2026`. Dane logowania i klucze
w przykładach służą wyłącznie lokalnemu developmentowi.

```bash
make langfuse-smoke
```

Ślady obejmują ingest, embedding, retrieval, graf i generowanie odpowiedzi.
Domyślnie zapisują metadane oraz czasy wykonania. `LANGFUSE_CAPTURE_CONTENT=true`
w root `.env` pozwala włączyć zapis treści; po zmianie odtwórz kontener API.
Na Vercel backend korzysta z zewnętrznego Langfuse przez zmienne `APP_LANGFUSE_*`.
[Konfiguracja, prywatność i oficjalne skille](docs/langfuse.md).

## Spec-Driven Development

Spec Kit 1.4.1 is configured for Codex as project skills in `.agents/skills`.
Start in chat with `$speckit-specify` and describe the next feature. The constitution
contains only four core principles; the stack and checks remain in the template.
Install the CLI with `make spec-install` and verify the setup with `make spec-check`.
[Workflow guide](docs/spec-driven.md).

## Praca lokalna

Official agent skills and project MCP servers are included for Codex. Run
`make agent-install` to install their isolated CLI tools, then `make agent-check`.
GitHub can reuse an existing `gh` login; Atlassian requires
`make agent-login-atlassian`. See the [agent tooling guide](docs/agent-tooling.md)
for the selected skills, credentials, and template-specific conventions.

Wersje narzędzi: Node `26.13.1`, npm `12.2.2`, Python `3.14.10` i [uv](https://docs.astral.sh/uv/). Node jest zapisany w root `.nvmrc`; `uv` dobiera Pythona z `api/.python-version`.

```bash
nvm install
nvm use
npm install --global npm@12.2.2 --no-audit --no-fund
make install
make hooks
```

`make install` instaluje zależności z locków i przeglądarki Playwright: Chromium, Firefox oraz WebKit. Na Linuksie zależności systemowe przeglądarek można doinstalować poleceniem `npm --prefix web exec -- playwright install --with-deps`.

W pierwszym terminalu uruchom API z lokalnym SQLite:

```bash
cd api
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

W drugim terminalu, z katalogu głównego:

```bash
npm --prefix web run dev
```

Frontend będzie dostępny na `http://localhost:5173`. Vite przekazuje żądania do API na `http://127.0.0.1:8000`; `web/.env.example` opisuje zmianę adresów. Można też uruchomić tylko PostgreSQL przez `docker compose up -d postgres` i ustawić `APP_DATABASE_URL` w środowisku API. Szczegóły: [backend](api/README.md), [frontend](web/README.md).

## Sprawdzenia lokalne i pre-commit

```bash
make check
make e2e
# Testy uruchomionego wcześniej zestawu Compose:
make e2e-compose
```

`make check` wykonuje backendowe quality gates oraz frontendowy lint, formatowanie, ścisłą kontrolę typów, testy jednostkowe z coverage i produkcyjny build. Progi pokrycia wynoszą co najmniej 90%: coverage z pomiarem gałęzi w API oraz linie, instrukcje, funkcje i gałęzie frontendu.

Root pre-commit uruchamia te same kontrole jakości, dokumentację API i Chromium Playwright z produkcyjnym buildem. Hooki sprawdzają kod i nie zmieniają go automatycznie. Po sklonowaniu repozytorium aktywuj je przez `make hooks`. Ręczne wykonanie:

```bash
uv run --project api --locked pre-commit run --all-files
```

`make format` służy do świadomego formatowania kodu. Pełne testy przeglądarkowe uruchamiają się przez `make e2e`; obejmują Chromium, Firefox, WebKit i mobilny Chromium.

## Playwright: dwa tryby

Domyślny `make e2e` buduje frontend, startuje Vite preview na `4173` i oddzielne API na `8001`. API dostaje tymczasowy plik SQLite, wykonuje migracje, a po zakończeniu testów proces i dane są sprzątane. Ten tryb nie korzysta z developerskiej bazy. Wolne porty są wymagane; można je zmienić przez `E2E_WEB_PORT` i `E2E_API_PORT`.

Testy sprawdzają prostą stronę główną, dostępność przez axe, brak poziomego przewijania, rzeczywiste połączenie z API przez proxy i operacje CRUD wykonywane klientem HTTP. Potwierdzają również, że strona główna wyświetla tekst bez dostępu do API. Testy sprzątają wyłącznie własne rekordy.

Drugi tryb testuje działający frontend i API, na przykład Compose:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npm --prefix web run test:e2e:compose
```

Wtedy Playwright nie uruchamia lokalnych serwerów ani własnej bazy. Wskazana aplikacja powinna korzystać z osobnego środowiska testowego. Raport HTML trafia do `web/playwright-report`, a ślady i zrzuty nieudanych testów do `web/test-results`.

## Wdrożenie na Vercel

Frontend i backend można wdrożyć jako dwa projekty tego samego repozytorium:

- Frontend: **Root Directory `web`**, preset **Vite**, output `dist`, komendy instalacji i builda z `web/vercel.json`. Ustaw `VITE_API_BASE_URL=https://twoje-api.example.com/api/v1` przed buildem.
- Backend: **Root Directory `api`**, preset **FastAPI**, PostgreSQL przez `DATABASE_URL`, `APP_ENVIRONMENT=production` i `APP_DOCS_ENABLED=false`. W `APP_CORS_ALLOWED_ORIGINS` ustaw origin frontendu jako tablicę JSON, np. `["https://twoj-frontend.example.com"]`.

`web/vercel.json` uruchamia instalację i build przez przypięty npm 12.2.2 oraz `npm ci`. Domyślny npm 11 z obrazu Node 26 na Vercel nie spełnia wymagań projektu. Pozostaw komendy zapisane w tej konfiguracji. [Wersje package managerów na Vercel](https://vercel.com/docs/package-managers).

Dla AI skorzystaj z [api/.env.vercel.example](api/.env.vercel.example) i [instrukcji inicjalizacji](docs/ai.md#vercel-i-usługi-zewnętrzne). Modele i bazy AI działają poza funkcją Vercel.

Zmienne `VITE_*` są publiczne i trafiają do przeglądarki. PostgreSQL jest wymagany na Vercel; SQLite wymaga trwałego dysku. Migracje produkcyjne wykonuj oddzielnym kontrolowanym krokiem przed udostępnieniem nowej wersji. Instrukcje i źródła: [API](api/README.md), [web](web/README.md), [zestawienie wersji](docs/versions.md).

## Struktura

```text
api/                 FastAPI, modele, migracje, testy i lokalne gates
web/src/app/         Składanie aplikacji i providery
web/src/features/    Moduły funkcjonalne, na początek items
web/src/shared/      Klient API i wspólne komponenty
web/e2e/             Testy Playwright prawdziwego przepływu aplikacji
api/src/app/modules/ai/   Kontrakty, ingest, LangGraph i rejestr SQL
api/src/app/platform/ai/  Adaptery Ollama / chat API, Neo4j, Qdrant
compose.yaml         Bazy i modele → migracje / indeksy → API → frontend
.pre-commit-config.yaml
```

W [docs/versions.md](docs/versions.md) opisano wersje zweryfikowane 17 listopada 2026 r. oraz granice zgodności runtime i narzędzi.

## Wynik weryfikacji

Zakres i wyniki testów API, integracji AI, kontenerów, frontendu i lokalnego pre-commit opisuje [raport weryfikacji](docs/verification.md). Testy chmurowe wymagają własnych zasobów i kluczy dostawców.
