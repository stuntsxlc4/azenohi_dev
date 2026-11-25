import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { App } from '../../app/App';
import { projects } from './catalogue';
import { ProjectSections, ProjectsPage } from './ProjectPages';
import { MemoryRouter } from 'react-router';
afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
});
it('lists six unique routes with the four supplied awards', () => {
  history.replaceState(null, '', '/projects');
  render(<App />);
  expect(new Set(projects.map((p) => p.slug)).size).toBe(6);
  expect(document.querySelectorAll('.project-award')).toHaveLength(4);
  for (const p of projects)
    expect(screen.getByRole('link', { name: new RegExp(p.name) })).toHaveAttribute(
      'href',
      '/projects/' + p.slug,
    );
  fireEvent.click(screen.getByRole('link', { name: /Risk Miner/ }));
  expect(screen.getByRole('region', { name: 'Key capabilities' })).toHaveTextContent('Support');
  expect(
    screen.getByRole('region', { name: 'Product gallery' }).querySelectorAll('figure'),
  ).toHaveLength(3);
  expect(screen.getByText('Demonstration team and stack')).toBeVisible();
  fireEvent.click(screen.getAllByText(/Back to projects/)[0]!);
});
it.each(projects)('supports direct entry for $name', (p) => {
  history.replaceState(null, '', '/projects/' + p.slug);
  render(<App />);
  expect(document.title).toBe('AzenoHI.dev — ' + p.name);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(p.name);
  expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
});
it('recovers from an unknown project', () => {
  history.replaceState(null, '', '/projects/missing');
  render(<App />);
  expect(document.title).toContain('Project not found');
  fireEvent.click(screen.getByRole('link', { name: /Back to projects/ }));
  expect(document.title).toContain('Projects');
});
it('renders announced work and supplied optional editorial content', () => {
  render(
    <MemoryRouter>
      <ProjectsPage moreProjects />
      <ProjectSections
        project={{
          ...projects[0]!,
          solution: 'Example solution',
          links: [{ label: 'Example', url: '/example' }],
        }}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText('More projects in progress')).toBeVisible();
  expect(screen.getByText('Example solution')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Example' })).toBeVisible();
});
