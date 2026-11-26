import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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

export function SceneShell({
  children,
  orbitalPath,
  journey,
  arrival,
}: {
  children: ReactNode;
  orbitalPath: string | undefined;
  journey: boolean;
  arrival: string;
}) {
  const { pathname } = useLocation();
  const path = orbitalPath?.replace(/\/$/, '') ?? '';
  const visitedOrbit = orbitalPath !== undefined;
  const team = path === '/team';
  const view = path.startsWith('/projects') ? 'projects' : team ? 'team' : 'home';
  const framing =
    path === '/projects/risk-miner'
      ? 'caseStudy'
      : /^\/projects\/[^/]+/.test(path)
        ? 'detail'
        : view;
  const [reduced, setReduced] = useState(() => window.matchMedia?.(motionQuery).matches ?? false);
  const [motionChoice, setMotionChoice] = useState<boolean>();
  const moving = motionChoice ?? !reduced;
  const [coverage, setCoverage] = useState({ journey, covered: journey });
  if (coverage.journey !== journey) setCoverage({ journey, covered: false });
  const [documentHidden, setDocumentHidden] = useState(document.hidden);
  const shell = useRef<HTMLDivElement>(null);
  const orbitHidden = journey && (coverage.covered || reduced);
  const orbitActive = !orbitHidden && !documentHidden;
  const pointer = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const showScene = useCallback(() => setReady(true), []);
  const showPoster = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const media = window.matchMedia?.(motionQuery);
    const update = () => {
      setReduced(media?.matches ?? false);
      setMotionChoice(undefined);
    };
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const update = () => setDocumentHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useLayoutEffect(() => {
    if (!journey || reduced || !orbitalPath || !shell.current) return undefined;
    const duration = getComputedStyle(shell.current).getPropertyValue('--duration-cinematic');
    const timeout = window.setTimeout(
      () => setCoverage({ journey, covered: true }),
      Number.parseFloat(duration),
    );
    return () => window.clearTimeout(timeout);
  }, [journey, orbitalPath, reduced]);
  useEffect(() => {
    if (!visitedOrbit || !window.requestIdleCallback) return undefined;
    const warmPanorama = () => {
      const panorama = new Image();
      panorama.src = '/journey/mountain.webp';
      void panorama.decode().catch(() => {});
    };
    const idle = window.requestIdleCallback(warmPanorama, { timeout: 1500 });
    return () => window.cancelIdleCallback(idle);
  }, [visitedOrbit]);
  useLayoutEffect(() => {
    if (moving && !reduced && !journey) return;
    pointer.current.x = 0;
    pointer.current.y = 0;
    shell.current?.style.removeProperty('--drift-x');
    shell.current?.style.removeProperty('--drift-y');
  }, [journey, moving, reduced]);
  const available = typeof WebGL2RenderingContext !== 'undefined' && !failed;
  return (
    <div
      ref={shell}
      className={`home scene-shell scene-${view}`}
      data-environment={journey ? 'mountain' : 'orbit'}
      data-arrival={arrival}
      onPointerMove={(event) => {
        if (journey || reduced || !moving || event.pointerType === 'touch') return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointer.current.x = (2 * (event.clientX - rect.left)) / rect.width - 1;
        pointer.current.y = (2 * (event.clientY - rect.top)) / rect.height - 1;
        event.currentTarget.style.setProperty('--drift-x', `${pointer.current.x * -6}px`);
        event.currentTarget.style.setProperty('--drift-y', `${pointer.current.y * -3}px`);
      }}
      onPointerLeave={(event) => {
        pointer.current.x = 0;
        pointer.current.y = 0;
        event.currentTarget.style.removeProperty('--drift-x');
        event.currentTarget.style.removeProperty('--drift-y');
      }}
    >
      <div
        className="orbital-view"
        data-rendered={available && ready}
        data-covered={orbitHidden}
        aria-hidden="true"
      >
        {orbitalPath && available && (
          <SceneBoundary onFailure={showPoster}>
            <Suspense fallback={null}>
              <OrbitScene
                view={framing}
                moving={moving}
                active={orbitActive}
                parallax={!reduced}
                pointer={pointer}
                onReady={showScene}
                onFailure={showPoster}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      {orbitalPath && <div className="home-foreground" aria-hidden="true" />}
      <SiteHeader path={pathname} />
      {children}
      <div className="home-foot">
        {!journey && available && ready && (
          <button
            type="button"
            onClick={() => setMotionChoice(!moving)}
            aria-label={moving ? 'Pause animation' : 'Play animation'}
            title={moving ? 'Pause animation' : 'Play animation'}
          >
            <i className={moving ? 'pause' : 'play'} aria-hidden="true" />
            {view !== 'home' && (moving ? 'Pause' : 'Play')}
          </button>
        )}
      </div>
    </div>
  );
}
