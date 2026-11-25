import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import './home.css';
import { SiteHeader } from './SiteHeader';
import { useLocation } from 'react-router';

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

export function SceneShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const team = pathname === '/team';
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
      className={`home scene-shell ${team ? 'scene-team' : 'scene-home'}`}
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
                view={team ? 'team' : 'home'}
                moving={moving}
                pointer={pointer}
                onReady={showScene}
                onFailure={showPoster}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      {!team && <div className="home-foreground" aria-hidden="true" />}
      <SiteHeader path={pathname} />
      {children}
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
