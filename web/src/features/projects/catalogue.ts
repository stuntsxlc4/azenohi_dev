export type Achievement = '1st Place' | 'Europe 1st' | '3rd Place';
export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  event: string;
  year: number;
  achievement?: Achievement;
  artwork: string;
  variant: 'standard' | 'extended';
  verification: 'demo' | 'confirmed';
  capabilities?: readonly { name: string; description: string; path: string }[];
  gallery?: readonly { title: string; image: string }[];
  technologies?: readonly string[];
  teamMemberIds?: readonly string[];
  solution?: string;
  links?: readonly { label: string; url: string }[];
}

function project(
  slug: string,
  name: string,
  description: string,
  event: string,
  achievement?: Achievement,
): Project {
  return {
    id: slug,
    slug,
    name,
    description,
    event,
    year: 2026,
    ...(achievement && { achievement }),
    artwork: '/project-art/' + slug,
    variant: 'standard',
    verification: 'demo',
  };
}
export const projects: readonly Project[] = [
  project(
    'captrace',
    'CapTrace',
    'AI Risk Copilot for FRTB-SA capital explainability',
    'HSBC AI Risk Hackathon',
    '1st Place',
  ),
  project(
    'done',
    'Done',
    'Voice-first shopping assistant with AI agents',
    'Start Warsaw × OpenAI',
    '3rd Place',
  ),
  project(
    'privymeet',
    'PrivyMeet',
    'Privacy-first meeting assistant',
    'SWM × Google DeepMind',
    '3rd Place',
  ),
  project(
    'productivity-suite',
    'Productivity Suite',
    'AI toolkit for Treasury operations',
    'HSBC Global Finals',
    'Europe 1st',
  ),
  project(
    'risktrace-control-tower',
    'RiskTrace Control Tower',
    'RWA modernization and risk analytics platform',
    'IBM Bob Hackathon',
  ),
  {
    ...project('risk-miner', 'Risk Miner', 'AI for Public Investment Risk', 'HackNation'),
    variant: 'extended',
    capabilities: [
      {
        name: 'Detect',
        description: 'project risks early',
        path: 'M12 2a10 10 0 1 0 .01 0ZM12 7a5 5 0 1 0 .01 0ZM12 11v2',
      },
      { name: 'Predict', description: 'delays and budget issues', path: 'M4 21v-7m8 7V8m8 13V2' },
      {
        name: 'Analyse',
        description: 'dependencies and impact',
        path: 'M9 2h6v5H9zM3 16h6v5H3zM15 16h6v5h-6zM12 7v5H6v4m6-4h6v4',
      },
      {
        name: 'Support',
        description: 'better public decisions',
        path: 'M12 2 21 6v6c0 6-9 10-9 10S3 18 3 12V6ZM8 12l3 3 5-6',
      },
    ],
    technologies: ['Python', 'FastAPI', 'Kubernetes', 'GCP'],
    teamMemberIds: ['pawel', 'olga', 'michal', 'przemek'],
    gallery: [
      { title: 'Geographic risk overview', image: '/project-art/geography.webp' },
      { title: 'Investment portfolio overview', image: '/project-art/portfolio.webp' },
      { title: 'Risk forecast concept', image: '/project-art/forecast.webp' },
    ],
  },
];
