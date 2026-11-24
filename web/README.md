# Application Web

Templatka React i TypeScript z Vite, TanStack Query, walidacją Zod, Vitest i Playwright. Strona główna AzenoHI.dev wyświetla ekran „Hybrid Intelligence” ze sceną orbitalną.

Kod jest podzielony na `src/app`, `src/features/items` oraz `src/shared`. Przykładowy moduł `items` pozostaje w kodzie wraz z kontraktami API, formularzami, paginacją i testami. Nie jest montowany na stronie głównej. Moduł `ItemsWorkspace` wymaga providera TanStack Query. Przykład jest publiczny; auth i filtrowanie danych według właściciela są częścią docelowej aplikacji.

## Uruchomienie

Wymagany Node `26.13.1` i npm `12.2.2`. Polecenia w tym pliku zakładają bieżący katalog `web`:

```bash
nvm install
nvm use
npm install --global npm@12.2.2 --no-audit --no-fund
npm ci
npm run dev
```

Frontend jest dostępny na `http://localhost:5173`. Domyślny adres API to `/api/v1`; Vite przekazuje `/api/` i `/health/` do `http://127.0.0.1:8000`. Uruchom równolegle backend zgodnie z [instrukcją API](../api/README.md) albo cały projekt przez [root Compose](../README.md).

Home dobiera profil grafiki do okna i możliwości WebGL. Profil Ultra korzysta z natywnego DPR, map globalnych 8K oraz dokładniejszych danych Europy. Aby porównać lżejszy wariant na komputerze, otwórz `/?quality=balanced`. Przycisk w prawym dolnym rogu zatrzymuje całą animację. Źródła danych planety i warunki wykorzystania znajdują się w [wykazie tekstur](public/home/planet/CREDITS.txt).

Opcjonalne ustawienia w `web/.env`:

```dotenv
VITE_API_BASE_URL=/api/v1
API_PROXY_TARGET=http://127.0.0.1:8000
```

`VITE_API_BASE_URL` zawiera pełny prefiks REST, np. `/api/v1` albo `https://api.example.com/api/v1`. Dla bezwzględnego adresu klient wyznacza health check na `/health/ready` tego samego API. `API_PROXY_TARGET` steruje lokalnym proxy Vite i preview. Przy oddzielnych originach skonfiguruj CORS w backendzie.

Zmienne `VITE_*` są konfiguracją publiczną. Wartość adresu API jest wstawiana podczas builda; zmiana wymaga ponownego zbudowania frontendu.

## Jakość kodu

```bash
npm run check
# Poszczególne kroki:
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

TypeScript działa w trybie `strict`, z `noUncheckedIndexedAccess` i `exactOptionalPropertyTypes`. Oxlint wykonuje lintowanie z informacją o typach oraz reguły React i dostępności; ostrzeżenia kończą sprawdzenie błędem. Prettier zapewnia wspólne formatowanie. `npm run format` świadomie wprowadza poprawki formatu.

Vitest i Testing Library sprawdzają klienta API, formularze, dialogi i zachowanie modułu. Minimalny coverage wynosi 90% dla linii, instrukcji, funkcji i gałęzi. Raport HTML jest zapisywany w `coverage/`. Budowanie aplikacji również wykonuje kontrolę typów.

Oxlint wybrano dla zgodności z TypeScript 7. W dniu aktualizacji najnowszy `typescript-eslint` deklarował peer dependency TypeScript `<6.1`; instalowanie go z TS 7 wymagałoby zignorowania kontraktu zgodności. Szczegóły wersji i źródła: [docs/versions.md](../docs/versions.md).

## Playwright

Zainstaluj przeglądarki:

```bash
npm exec -- playwright install chromium firefox webkit
# Na Linuksie, gdy brakuje bibliotek systemowych:
npm exec -- playwright install --with-deps
```

W monorepo uruchom:

```bash
npm run test:e2e
# Pojedyncza przeglądarka:
npm run test:e2e -- --project=chromium
# Interaktywny runner:
npm run test:e2e:ui
```

Konfiguracja uruchamia produkcyjny build i preview na `4173` oraz API z tymczasowym SQLite na `8001`. Helper korzysta z projektu `../api`, stosuje migracje w osobnym procesie i sprząta bazę po testach. Zmienne developerskiej i produkcyjnej bazy nie są dziedziczone. Własne porty można wybrać przez `E2E_WEB_PORT` i `E2E_API_PORT`.

Projekty przeglądarkowe to `chromium`, `firefox`, `webkit` i `mobile-chromium`. Trzy scenariusze sprawdzają nawigację klawiaturą, dostępność i szerokość widoku, rzeczywiste połączenie z API przez proxy wraz z operacjami CRUD klienta HTTP oraz niezależność strony głównej od dostępności API. axe wykonuje automatyczne reguły WCAG 2/2.1 A i AA; nie zastępuje ręcznego przeglądu dostępności.

Testowanie działającego Compose albo innego środowiska:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npm run test:e2e:compose
```

Przy ustawionym `PLAYWRIGHT_BASE_URL` runner nie startuje serwerów ani bazy. Frontend pod tym adresem powinien przekazywać `/api/v1` do testowego API. Testy tworzą rekordy i usuwają tylko własne identyfikatory. Ten tryb działa również po skopiowaniu `web` do osobnego repozytorium; lokalny tryb izolowany wymaga sąsiedniego projektu `api`.

Raport HTML: `playwright-report/`. Ślady i screenshoty są zachowywane przy niepowodzeniach w `test-results/`; nagrywanie wideo jest wyłączone. Raport można otworzyć poleceniem `npm exec -- playwright show-report`.

## Pre-commit

W bieżącym monorepo konfiguracja hooków znajduje się w katalogu głównym:

```bash
# Z root projektu:
make hooks
uv run --project api --locked pre-commit run --all-files
```

Hooki frontendu sprawdzają lint, format, typy, testy jednostkowe z coverage i produkcyjny build z Playwright Chromium. Pełen zestaw czterech projektów przeglądarkowych wykonuj przez `npm run test:e2e`.

Po skopiowaniu zawartości `web` do własnego repo można użyć dołączonego `.pre-commit-config.yaml`. Zainstaluj narzędzie `pre-commit` lokalnie, np. przez `uv tool install pre-commit`, a następnie wykonaj `pre-commit install`. Dla hooka E2E ustaw `PLAYWRIGHT_BASE_URL` działającego środowiska, ponieważ samodzielne repo frontendu nie zawiera helperowi potrzebnego `../api`.

## Docker i Vercel

[Root Compose](../compose.yaml) buduje frontend w Node, a wynik serwuje Nginx działający bez roota na porcie `8080`. `/api/` i `/health/` są przekazywane do usługi API. Statyczne assets mają długi cache, a dokument HTML jest odświeżany; log JSON zawiera metodę, status, czas i request ID.

Na Vercel ustaw **Root Directory `web`**, preset **Vite**, output `dist` oraz komendy instalacji i builda z `vercel.json`. Dodaj przed buildem:

```dotenv
VITE_API_BASE_URL=https://twoje-api.example.com/api/v1
```

`web/vercel.json` uruchamia instalację i build przez przypięty npm 12.2.2 oraz `npm ci`. Domyślny npm 11 z obrazu Node 26 na Vercel nie spełnia wymagań projektu. Pozostaw komendy zapisane w tej konfiguracji. [Wersje package managerów na Vercel](https://vercel.com/docs/package-managers).

API powinno dopuszczać origin frontendu w `APP_CORS_ALLOWED_ORIGINS`. Oddzielny projekt API korzysta z Root Directory `api` i hostowanego PostgreSQL. Natywny hosting Vite opisuje [dokumentacja Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Klient API i rozbudowa

`src/shared/api/client.ts` łączy `fetch` z timeoutem i anulowaniem. Zod waliduje odpowiedzi serwera. Publiczne błędy mają spójny typ `ApiError`, bez ujawniania surowych komunikatów wyjątków; request ID ułatwia odnalezienie wpisu w logach backendu. TanStack Query zarządza odczytami, ponawianiem i unieważnianiem danych po mutacji.

Nowe funkcjonalności dodawaj pod `src/features/<nazwa>`, utrzymując kontrakty i zapytania razem z modułem. Wspólne komponenty i adaptery przenoś do `shared`, gdy korzysta z nich więcej niż jeden moduł. Testy jednostkowe umieszczaj przy kodzie, a pełne przepływy użytkownika w `e2e`.
