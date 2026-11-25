import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MemberCard, Team } from './Team';

it('renders twelve team cards without profile actions', () => {
  render(<Team />);
  expect(screen.getByRole('list', { name: 'Demonstration team cards' })).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(12);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

it('renders supplied optional information and recovers a failed portrait', () => {
  render(
    <ul>
      <MemberCard
        member={{
          id: 'test',
          name: 'Test person',
          technologies: [],
          demo: true,
          role: 'Test role',
          portrait: '/missing.jpg',
          links: [{ label: 'Website', url: 'https://example.com' }],
        }}
      />
    </ul>,
  );
  expect(screen.getByText('Test role')).toBeInTheDocument();
  expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
  fireEvent.error(screen.getByRole('img'));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

it('renders a neutral placeholder when optional portrait, role and links are absent', () => {
  render(
    <ul>
      <MemberCard member={{ id: 'empty', name: 'Example', technologies: [], demo: true }} />
    </ul>,
  );
  expect(screen.getByRole('heading', { name: 'Example' })).toBeVisible();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
