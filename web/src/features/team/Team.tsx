import { useState } from 'react';
import { demoMembers, members } from './members';
import type { TeamMember } from './members';
import './team.css';
import { TechnologyIcon } from './TechnologyIcon';

export function MemberCard({ member }: { member: TeamMember }) {
  const [failedPortrait, setFailedPortrait] = useState<string>();
  return (
    <li className="member-card">
      {member.portrait && member.portrait !== failedPortrait ? (
        <img
          loading="lazy"
          decoding="async"
          src={member.portrait}
          alt={`Portrait of ${member.name}`}
          onError={() => setFailedPortrait(member.portrait)}
        />
      ) : (
        <div className="portrait-placeholder" aria-hidden="true">
          <span />
        </div>
      )}
      <div className="member-caption">
        <h2>{member.name}</h2>
        <div className="technology-icons">
          {member.technologies.map((technology) => (
            <TechnologyIcon key={technology} name={technology} />
          ))}
        </div>
        {member.role ? <p>{member.role}</p> : null}
        {member.links?.length ? (
          <ul className="member-links">
            {member.links.map((link) => (
              <li key={link.url}>
                <a href={link.url}>
                  {link.label}
                  <span className="sr-only"> — {member.name}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

export function Team() {
  const demonstration = members.length === 0;
  const displayed = demonstration ? demoMembers : members;
  return (
    <main className="team-content">
      <p className="heading-mark">OUR TEAM</p>
      <h1 tabIndex={-1}>
        People <em>×</em> AI
      </h1>
      <ul
        className="team-grid"
        aria-label={demonstration ? 'Demonstration team cards' : 'Team members'}
      >
        {displayed.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </ul>
    </main>
  );
}
