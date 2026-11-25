import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { members, demoMembers } from '../team/members';
import { TechnologyIcon } from '../team/TechnologyIcon';
import { projects } from './catalogue';
import type { Project, Achievement } from './catalogue';
import './projects.css';

function ProjectAchievement({ award }: { award: Achievement }) {
  const medal = award === '3rd Place';
  return (
    <span className={'project-award ' + (medal ? 'bronze' : 'gold')}>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d={
            medal
              ? 'M4 2h6l3 6-4 3ZM14 2h6l-5 9-3-4ZM12 10a6 6 0 1 0 .01 0Z'
              : 'M6 3h12v2h4v3c0 4-3 6-6 6l-3 2v3h4v2H7v-2h4v-3l-3-2c-4 0-6-3-6-6V5h4Zm0 4H4c0 3 1 4 3 5Zm12 0-1 5c2-1 3-3 3-5Z'
          }
        />
      </svg>
      {award}
    </span>
  );
}
function ProjectArtwork({ project, card = false }: { project: Project; card?: boolean }) {
  return (
    <img
      className="project-art"
      src={project.artwork + (card ? '-card' : '') + '.webp'}
      alt=""
      width={card ? 540 : 1200}
      height={card ? 360 : 800}
      decoding="async"
    />
  );
}
function ProjectCard({ project }: { project: Project }) {
  const { search } = useLocation();
  return (
    <Link
      id={'card-' + project.slug}
      className={'project-card ' + project.slug}
      to={'/projects/' + project.slug + search}
      state="project-catalogue"
      onClick={(event) => {
        const top = event.currentTarget.closest('.route-content')?.scrollTop;
        window.history.replaceState(
          { ...window.history.state, projectReturn: { id: event.currentTarget.id, top } },
          '',
        );
      }}
    >
      <div className="card-body">
        <ProjectArtwork project={project} card />
        <div className="card-copy">
          {project.achievement && <ProjectAchievement award={project.achievement} />}
          <h2>{project.name}</h2>
          <p>{project.description}</p>
        </div>
      </div>
      <div className="project-event">
        {project.event}
        <time>{project.year}</time>
        <b aria-hidden="true">→</b>
      </div>
    </Link>
  );
}
export function ProjectsPage({ moreProjects = false }: { moreProjects?: boolean }) {
  return (
    <main className="projects-page">
      <header className="projects-hero">
        <div className="heading-mark">Our projects</div>
        <h1 tabIndex={-1}>
          From Hackathons
          <span>
            to <em>Real Impact</em>
          </span>
        </h1>
      </header>
      <div className="projects-grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      {moreProjects && <p>More projects in progress</p>}
    </main>
  );
}
function BackToProjects() {
  const location = useLocation();
  const { search } = location;
  const state: unknown = location.state;
  const navigate = useNavigate();
  return (
    <Link
      className="project-back"
      to={'/projects' + search}
      onClick={(event) => {
        if (
          state === 'project-catalogue' &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          void navigate(-1);
        }
      }}
    >
      ← &nbsp;Back to projects
    </Link>
  );
}
export function ProjectSections({ project }: { project: Project }) {
  const people = project.teamMemberIds?.flatMap((id) =>
    [...members, ...demoMembers].filter((person) => person.id === id),
  );
  return (
    <>
      <div className="case-sections">
        <div>
          {!!project.capabilities?.length && (
            <section className="case-capabilities" aria-label="Key capabilities">
              {project.capabilities.map((c) => (
                <div key={c.name}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={c.path} />
                  </svg>
                  <div>
                    <h2>{c.name}</h2>
                    <small>{c.description}</small>
                  </div>
                </div>
              ))}
            </section>
          )}
          {!!project.gallery?.length && (
            <section aria-label="Product gallery" className="case-gallery">
              {project.gallery.map((item) => (
                <figure key={item.image}>
                  <img loading="lazy" src={item.image} alt="" width="440" height="250" />
                  <figcaption>{item.title}</figcaption>
                </figure>
              ))}
              <small>Concept visuals · Illustrative project views</small>
            </section>
          )}
        </div>
        <div className="case-aside">
          {!!project.technologies?.length && (
            <section>
              <h2>Technology</h2>
              <div>
                {project.technologies.map((name) => (
                  <span key={name}>
                    <TechnologyIcon name={name} />
                    {name}
                  </span>
                ))}
              </div>
            </section>
          )}
          {!!people?.length && (
            <section>
              <h2>Team — AzenoHI</h2>
              <div>
                {people.map((person) => (
                  <span key={person.id}>
                    <img src={person.portrait} alt="" />
                    {person.name}
                  </span>
                ))}
              </div>
              {project.verification === 'demo' && <small>Demonstration team and stack</small>}
            </section>
          )}
        </div>
      </div>
      {project.solution && (
        <section>
          <h2>Solution</h2>
          <p>{project.solution}</p>
        </section>
      )}
      {project.links?.map((link) => (
        <a key={link.url} href={link.url}>
          {link.label}
        </a>
      ))}
    </>
  );
}
export function ProjectDetailPage() {
  const { slug } = useParams();
  const p = projects.find((project) => project.slug === slug);
  if (!p)
    return (
      <main className="projects-page">
        <h1 tabIndex={-1}>Project not found</h1>
        <BackToProjects />
      </main>
    );
  const extended = p.variant === 'extended';
  const event = (
    <div className="detail-event">
      {extended ? <strong>{p.event}</strong> : p.event} <time>· &nbsp;{p.year}</time>
    </div>
  );
  return (
    <main className={'projects-page project-detail ' + p.variant}>
      <BackToProjects />
      <div className="detail-inner">
        <header className="detail-hero">
          <div>
            {!extended && event}
            <h1 tabIndex={-1}>{p.name}</h1>
            <p>{p.description}</p>
            {extended && event}
            {p.achievement && <ProjectAchievement award={p.achievement} />}
          </div>
          <ProjectArtwork project={p} />
        </header>
        <ProjectSections project={p} />
        <footer>
          <BackToProjects />
        </footer>
      </div>
    </main>
  );
}
