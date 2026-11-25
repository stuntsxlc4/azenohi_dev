type Milestone = {
  year: number;
  description: readonly [string, string];
  image: string;
  // Checkpoint coordinates on the desktop artwork, as percentages.
  checkpoint: readonly [number, number];
};

// Illustrative content. Copy and images can be replaced here independently of the view.
export const milestones: readonly Milestone[] = [
  {
    year: 2017,
    description: ['It all started', 'at my place'],
    image: '/journey/home-office.webp',
    checkpoint: [9, 77.5],
  },
  {
    year: 2018,
    description: ['Remote work', 'during Zoom era'],
    image: '/journey/remote-work.webp',
    checkpoint: [23.4, 72.8],
  },
  {
    year: 2020,
    description: ['First hackathons', 'and real impact'],
    image: '/journey/hackathon.webp',
    checkpoint: [36.4, 69.6],
  },
  {
    year: 2023,
    description: ['Growing team,', 'bigger goals'],
    image: '/journey/team.webp',
    checkpoint: [50.8, 66.1],
  },
  {
    year: 2025,
    description: ['More projects,', 'more impact'],
    image: '/journey/projects.webp',
    checkpoint: [64.9, 61.5],
  },
];
