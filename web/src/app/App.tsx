import { z } from 'zod/mini';
import { useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router';
import { ProjectsPage, ProjectDetailPage } from '../features/projects/ProjectPages';
import { Home } from '../features/home/Home';
import { Team } from '../features/team/Team';
import { Journey } from '../features/journey/Journey';
import { SceneShell } from './SceneShell';

const returnPosition = z.object({ projectReturn: z.object({ id: z.string(), top: z.number() }) });
const journeyPath = /^\/journey\/?$/;
const cataloguePath = /^\/projects\/?$/;
const detailPath = /^\/projects\/[^/]+\/?$/;

function Pages() {
  const location = useLocation();
  const { pathname } = location;
  const isJourney = journeyPath.test(pathname);
  const [presentation, setPresentation] = useState(() => ({
    location,
    outgoing: null as typeof location | null,
    orbitalLocation: isJourney ? null : location,
    visitedJourney: isJourney,
    arrival: 'initial',
  }));
  if (location !== presentation.location) {
    const previous = presentation.location.pathname;
    let arrival = 'normal';
    if (isJourney || journeyPath.test(previous)) arrival = 'environment';
    else if (pathname === '/team') arrival = 'team';
    else if (detailPath.test(pathname)) arrival = 'detail';
    else if (cataloguePath.test(pathname))
      arrival = detailPath.test(previous) ? 'catalogue-return' : 'catalogue';
    setPresentation({
      location,
      outgoing:
        pathname === previous
          ? presentation.outgoing
          : arrival !== 'environment' && pathname.replace(/\/$/, '') !== previous.replace(/\/$/, '')
            ? presentation.orbitalLocation
            : null,
      orbitalLocation: isJourney ? presentation.orbitalLocation : location,
      visitedJourney: isJourney || presentation.visitedJourney,
      arrival: pathname === previous ? presentation.arrival : arrival,
    });
  }
  const outgoing = presentation.outgoing;
  useLayoutEffect(() => {
    if (!outgoing) return undefined;
    const timeout = window.setTimeout(() => {
      setPresentation((current) =>
        current.outgoing === outgoing ? { ...current, outgoing: null } : current,
      );
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [outgoing]);
  const orbitalContent = useRef<HTMLDivElement>(null);
  const journeyContent = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const content = isJourney ? journeyContent.current : orbitalContent.current;
    const heading = content?.querySelector('h1');
    const title = isJourney
      ? 'Journey'
      : pathname === '/'
        ? 'Hybrid Intelligence'
        : /^\/team\/?$/.test(pathname)
          ? 'Team'
          : cataloguePath.test(pathname)
            ? 'Projects'
            : heading?.textContent;
    document.title = `AzenoHI.dev — ${title}`;
    const saved = returnPosition.safeParse(window.history.state).data?.projectReturn;
    const card = saved && cataloguePath.test(pathname) && document.getElementById(saved.id);
    if (content) content.scrollTop = card && saved ? saved.top : 0;
    if (card) card.focus({ preventScroll: true });
    else heading?.focus({ preventScroll: true });
  }, [isJourney, pathname]);
  const { orbitalLocation } = presentation;
  return (
    <SceneShell
      orbitalPath={orbitalLocation?.pathname}
      journey={isJourney}
      arrival={presentation.arrival}
    >
      {[outgoing, orbitalLocation].map(
        (route) =>
          route && (
            <div
              key={route.pathname}
              ref={route === orbitalLocation ? orbitalContent : undefined}
              className={`route-content orbital-content${route.pathname.startsWith('/projects') ? ' portfolio-content' : ''}`}
              inert={isJourney || route === outgoing}
              aria-hidden={isJourney || route === outgoing || undefined}
              data-outgoing={route === outgoing || undefined}
            >
              <Routes location={route}>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:slug" element={<ProjectDetailPage />} />
                <Route path="/team" element={<Team />} />
                <Route
                  path="*"
                  element={
                    <main className="team-content">
                      <h1 tabIndex={-1}>Page not found</h1>
                      <Link to="/">Return Home</Link>
                    </main>
                  }
                />
              </Routes>
            </div>
          ),
      )}
      {presentation.visitedJourney && (
        <div
          ref={journeyContent}
          className="route-content mountain-content"
          inert={!isJourney}
          aria-hidden={!isJourney || undefined}
        >
          <Journey />
        </div>
      )}
    </SceneShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Pages />
    </BrowserRouter>
  );
}
