import { z } from 'zod/mini';
import { useLayoutEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router';
import { ProjectsPage, ProjectDetailPage } from '../features/projects/ProjectPages';
import { Home } from '../features/home/Home';
import { Team } from '../features/team/Team';
import { SceneShell } from './SceneShell';

const returnPosition = z.object({ projectReturn: z.object({ id: z.string(), top: z.number() }) });

function Pages() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const heading = document.querySelector('h1');
    const title =
      pathname === '/'
        ? 'Hybrid Intelligence'
        : pathname === '/team'
          ? 'Team'
          : pathname.replace(/\/$/, '') === '/projects'
            ? 'Projects'
            : heading?.textContent;
    document.title = `AzenoHI.dev — ${title}`;
    const content = document.querySelector('.route-content');
    const saved = returnPosition.safeParse(window.history.state).data?.projectReturn;
    if (pathname === '/projects' && saved && document.getElementById(saved.id)) {
      if (content) content.scrollTop = saved.top;
      document.getElementById(saved.id)?.focus({ preventScroll: true });
    } else {
      if (content) content.scrollTop = 0;
      heading?.focus({ preventScroll: true });
    }
  }, [pathname]);
  return (
    <SceneShell>
      <div className="route-content">
        <Routes>
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
