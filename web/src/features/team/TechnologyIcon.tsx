const logos: Record<string, string> = {
  Python: 'python',
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  React: 'react',
  FastAPI: 'fastapi',
  PyTorch: 'pytorch',
  PostgreSQL: 'postgresql',
  Docker: 'docker',
  Kubernetes: 'kubernetes',
  AWS: 'aws',
  GCP: 'googlecloud',
  Git: 'git',
  'GitHub Actions': 'githubactions',
  Pandas: 'pandas',
};
const concepts: Record<string, string> = {
  Cybersecurity: 'M12 2 21 6v6c0 5-9 10-9 10S3 17 3 12V6Zm-5 10 3 3 7-7',
  AI: 'M4 4h16v16H4zM8 16l2.5-8L13 16M9 13h3M16 8v8M8 1v3m8-3v3M8 20v3m8-3v3M1 8h3m-3 8h3m16-8h3m-3 8h3',
  Cloud: 'M6 18a4 4 0 0 1-1-8 7 7 0 0 1 13-1 5 5 0 0 1 0 9Z',
  SQL: 'M4 6c0-5 16-5 16 0s-16 5-16 0v12c0 5 16 5 16 0V6M4 12c0 5 16 5 16 0',
};
export function TechnologyIcon({ name }: { name: string }) {
  const logo = logos[name];
  return (
    <span className="technology-icon" title={name}>
      {logo ? (
        <img src={`/team/icons/${logo}.svg`} alt={name} width={20} height={20} />
      ) : (
        <svg viewBox="0 0 24 24" role="img" aria-label={name}>
          {concepts[name] ? (
            <path d={concepts[name]} />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <circle cx="4" cy="4" r="2" />
              <circle cx="20" cy="4" r="2" />
              <circle cx="4" cy="20" r="2" />
              <circle cx="20" cy="20" r="2" />
              <path d="m6 6 3 3m6 6 3 3M6 18l3-3m6-6 3-3" />
            </>
          )}
        </svg>
      )}
    </span>
  );
}
