export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  portrait?: string;
  technologies: readonly string[];
  demo: boolean;
  links?: readonly { label: string; url: string }[];
}
export const members: readonly TeamMember[] = [];
export const demoMembers: readonly TeamMember[] = [
  {
    id: 'pawel',
    name: 'Paweł',
    role: 'Python Developer',
    technologies: ['Python', 'FastAPI'],
    demo: true,
    portrait: '/team/pawel.webp',
  },
  {
    id: 'olga',
    name: 'Olga',
    role: 'AI Engineer',
    technologies: ['AI', 'PyTorch'],
    demo: true,
    portrait: '/team/olga.webp',
  },
  {
    id: 'michal',
    name: 'Michał',
    role: 'Frontend Developer',
    technologies: ['JavaScript', 'TypeScript'],
    demo: true,
    portrait: '/team/michal.webp',
  },
  {
    id: 'przemek',
    name: 'Przemek',
    role: 'Cloud Engineer',
    technologies: ['AWS', 'Cloud'],
    demo: true,
    portrait: '/team/przemek.webp',
  },
  {
    id: 'kacper',
    name: 'Kacper',
    role: 'React Developer',
    technologies: ['React', 'JavaScript'],
    demo: true,
    portrait: '/team/kacper.webp',
  },
  {
    id: 'julia',
    name: 'Julia',
    role: 'ML Engineer',
    technologies: ['Python', 'Machine Learning'],
    demo: true,
    portrait: '/team/julia.webp',
  },
  {
    id: 'adam',
    name: 'Adam',
    role: 'Database Engineer',
    technologies: ['PostgreSQL', 'SQL'],
    demo: true,
    portrait: '/team/adam.webp',
  },
  {
    id: 'tomek',
    name: 'Tomek',
    role: 'Security Engineer',
    technologies: ['Cybersecurity'],
    demo: true,
    portrait: '/team/tomek.webp',
  },
  {
    id: 'kasia',
    name: 'Kasia',
    role: 'Data Scientist',
    technologies: ['Python', 'Pandas'],
    demo: true,
    portrait: '/team/kasia.webp',
  },
  {
    id: 'bartek',
    name: 'Bartek',
    role: 'DevOps Engineer',
    technologies: ['Kubernetes', 'GitHub Actions'],
    demo: true,
    portrait: '/team/bartek.webp',
  },
  {
    id: 'marta',
    name: 'Marta',
    role: 'Software Engineer',
    technologies: ['Docker', 'Git'],
    demo: true,
    portrait: '/team/marta.webp',
  },
  {
    id: 'piotr',
    name: 'Piotr',
    role: 'AI Architect',
    technologies: ['LLM', 'AI'],
    demo: true,
    portrait: '/team/piotr.webp',
  },
];
