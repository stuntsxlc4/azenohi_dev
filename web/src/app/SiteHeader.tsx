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
        {['Projects', 'Journey'].map((label) => (
          <span key={label} aria-disabled="true" title={`${label} is not available yet`}>
            {label}
            <RouteLock />
          </span>
        ))}
      </nav>
    </header>
  );
}
