import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
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
  const pointer = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const showScene = useCallback(() => setReady(true), []);
  const showPoster = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const media = window.matchMedia?.(motionQuery);
    const update = () => setMoving(!media?.matches);
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, []);
  const available = typeof WebGL2RenderingContext !== 'undefined' && !failed;
  return (
    <div
      className="home"
      onPointerMove={(event) => {
        if (!moving || event.pointerType === 'touch') return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointer.current.x = (2 * (event.clientX - rect.left)) / rect.width - 1;
        pointer.current.y = (2 * (event.clientY - rect.top)) / rect.height - 1;
        event.currentTarget.style.setProperty('--drift-x', `${pointer.current.x * -6}px`);
        event.currentTarget.style.setProperty('--drift-y', `${pointer.current.y * -3}px`);
      }}
      onPointerLeave={(event) => {
        if (!moving) return;
        pointer.current.x = 0;
        pointer.current.y = 0;
        event.currentTarget.style.removeProperty('--drift-x');
        event.currentTarget.style.removeProperty('--drift-y');
      }}
    >
      <div className="orbital-view" data-rendered={available && ready} aria-hidden="true">
        {available && (
          <SceneBoundary onFailure={showPoster}>
            <Suspense fallback={null}>
              <OrbitScene
                moving={moving}
                pointer={pointer}
                onReady={showScene}
                onFailure={showPoster}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div className="home-foreground" aria-hidden="true" />
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
