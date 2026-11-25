import { useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { milestones } from './milestones';
import './journey.css';

type CheckpointStyle = CSSProperties & { '--checkpoint-x': string; '--checkpoint-y': string };

function driftLight(event: PointerEvent<HTMLElement>) {
  if (
    event.pointerType !== 'mouse' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
    return;
  const { currentTarget, clientX } = event;
  const { left, width } = currentTarget.getBoundingClientRect();
  currentTarget.style.setProperty('--journey-drift', `${(clientX - left - width / 2) * 0.018}px`);
}

export function Journey() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <main
      className="journey"
      onPointerMove={driftLight}
      onPointerLeave={(event) => event.currentTarget.style.removeProperty('--journey-drift')}
    >
      <div className="journey-landscape" aria-hidden="true" />
      <div className="journey-copy">
        <p className="heading-mark">Our journey</p>
        <h1 tabIndex={-1}>
          <span>Small Steps.</span>{' '}
          <span>
            Big <em>Dreams.</em>
          </span>
        </h1>
        <p className="journey-intro">
          From a home office to global hackathons.
          <br />
          The journey continues...
        </p>
      </div>
      <ol className="journey-timeline" aria-label="Illustrative milestones">
        {milestones.map(({ year, description, image, checkpoint: [x, y] }) => {
          const style: CheckpointStyle = { '--checkpoint-x': `${x}%`, '--checkpoint-y': `${y}%` };
          return (
            <li key={year} className="journey-milestone" style={style}>
              <button
                type="button"
                className="journey-entry"
                aria-pressed={selected === year}
                onClick={() => setSelected(selected === year ? null : year)}
              >
                <img className="journey-frame" src={image} alt="" width={172} height={106} />
                <span className="journey-checkpoint" aria-hidden="true" />
                <span className="journey-caption">
                  <span className="journey-year">{year}</span> <span>{description[0]}</span>{' '}
                  <span>{description[1]}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="journey-summit">
        The best
        <br />
        is yet to come
      </p>
      <p className="journey-note">Illustrative milestones</p>
    </main>
  );
}
