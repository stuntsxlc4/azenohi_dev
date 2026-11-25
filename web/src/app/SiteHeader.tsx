import { Link, useLocation } from 'react-router';
export function RouteLock() {
  return <i className="route-lock" aria-hidden="true" />;
}

export function SiteHeader({ path }: { path: string }) {
  const { search } = useLocation();
  return (
    <header className="home-header">
      <Link className="wordmark" to={`/${search}`} aria-label="AzenoHI.dev home">
        <i aria-hidden="true" />
        Azeno<b>HI</b>
        <small>.dev</small>
      </Link>
      <nav aria-label="Main navigation">
        <Link to={`/${search}`} aria-current={path === '/' ? 'page' : undefined}>
          Home
        </Link>
        <Link to={`/team${search}`} aria-current={path === '/team' ? 'page' : undefined}>
          Team
        </Link>
        <Link
          to={`/projects${search}`}
          aria-current={/^\/projects(?:\/|$)/.test(path) ? 'page' : undefined}
        >
          Projects
        </Link>
        <span aria-disabled="true" title="Journey is not available yet">
          Journey
          <RouteLock />
        </span>
      </nav>
    </header>
  );
}
