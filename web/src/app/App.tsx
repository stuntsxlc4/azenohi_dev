import { Component, lazy, Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import './home.css';

const OrbitScene = lazy(() => import('../features/home/OrbitScene'));
const motionQuery = '(prefers-reduced-motion: reduce)';

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onFailure();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function App() {
  const [moving, setMoving] = useState(() => !window.matchMedia?.(motionQuery).matches);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.(motionQuery);
    const update = () => setMoving(!media?.matches);
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, []);
  const available = typeof WebGL2RenderingContext !== 'undefined' && !failed;
  return (
    <div className="home">
      <div className="orbital-view" aria-hidden="true">
        {available && (
          <SceneBoundary onFailure={() => setFailed(true)}>
            <Suspense fallback={null}>
              <OrbitScene
                moving={moving}
                onReady={() => setReady(true)}
                onFailure={() => setFailed(true)}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <header className="home-header">
        <div className="wordmark">
          <i aria-hidden="true" />
          Azeno<b>HI</b>
          <small>.dev</small>
        </div>
        <nav aria-label="Main navigation">
          <a href="/" aria-current="page">
            Home
          </a>
          {['Team', 'Projects', 'Journey'].map((label) => (
            <span key={label} aria-disabled="true">
              {label}
            </span>
          ))}
        </nav>
      </header>
      <main className="home-content">
        <div className="heading-mark">Azeno HI</div>
        <h1 aria-label="Hybrid Intelligence">
          Hybrid{' '}
          <span>
            <em>In</em>telligence
          </span>
        </h1>
        <p className="home-tagline">People × AI</p>
        <div className="home-actions">
          <button type="button" disabled>
            Explore projects <span aria-hidden="true">→</span>
          </button>
          <button type="button" disabled>
            Meet the team <span aria-hidden="true">↗</span>
          </button>
        </div>
      </main>
      <div className="home-foot">
        {available && ready && (
          <button
            type="button"
            onClick={() => setMoving(!moving)}
            aria-label={moving ? 'Pause animation' : 'Play animation'}
          >
            <i className={moving ? 'pause' : 'play'} aria-hidden="true" />
            {moving ? 'Pause' : 'Play'}
          </button>
        )}
      </div>
    </div>
  );
}
