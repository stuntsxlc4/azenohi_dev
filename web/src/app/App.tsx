import { useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router';
import { Home } from '../features/home/Home';
import { Team } from '../features/team/Team';
import { SceneShell } from './SceneShell';

function Pages() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title =
      pathname === '/' ? 'Hybrid Intelligence' : pathname === '/team' ? 'Team' : 'Page not found';
    document.title = `AzenoHI.dev — ${title}`;
    document.querySelector('h1')?.focus({ preventScroll: true });
    const content = document.querySelector('.route-content');
    if (content) content.scrollTop = 0;
  }, [pathname]);
  return (
    <SceneShell>
      <div className="route-content">
        <Routes>
          <Route path="/" element={<Home />} />
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
