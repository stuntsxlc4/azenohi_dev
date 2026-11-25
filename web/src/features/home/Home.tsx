import { Link, useLocation } from 'react-router';
import { RouteLock } from '../../app/SiteHeader';

export function Home() {
  const { search } = useLocation();
  return (
    <main className="home-content">
      <div className="heading-mark">Azeno HI</div>
      <h1 tabIndex={-1} aria-label="Hybrid Intelligence">
        Hybrid{' '}
        <span>
          <em>In</em>telligence
        </span>
      </h1>
      <p className="home-tagline">People × AI</p>
      <div className="home-actions">
        <button type="button" disabled>
          Explore projects <RouteLock />
        </button>
        <Link to={`/team${search}`}>Meet the team</Link>
      </div>
    </main>
  );
}
