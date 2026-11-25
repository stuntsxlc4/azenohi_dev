import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import { App } from './App';

afterEach(() => vi.unstubAllGlobals());

it('renders the starter without requiring a backend request', () => {
  const fetcher = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetcher);
  render(<App />);
  expect(screen.getByRole('main')).toHaveTextContent('Hybrid Intelligence');
  expect(fetcher).not.toHaveBeenCalled();
});

it('renders Team on direct entry and focuses the titled page', () => {
  window.history.replaceState(null, '', '/team');
  render(<App />);
  expect(document.title).toBe('AzenoHI.dev — Team');
  expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  expect(screen.getByRole('link', { name: /^Team$/ })).toHaveAttribute('aria-current', 'page');
  window.history.replaceState(null, '', '/');
});

it('provides a recovery link for unknown paths', () => {
  window.history.replaceState(null, '', '/unknown');
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
  expect(screen.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', '/');
  window.history.replaceState(null, '', '/');
});

it('renders and operates the independent Journey timeline', async () => {
  window.history.replaceState(null, '', '/journey/');
  const user = userEvent.setup();
  render(<App />);
  expect(document.title).toBe('AzenoHI.dev — Journey');
  expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  expect(screen.getByRole('link', { name: 'Journey' })).toHaveAttribute('aria-current', 'page');
  const first = screen.getByRole('button', { name: /^2017/ });
  const last = screen.getByRole('button', { name: /^2025/ });
  await user.click(first);
  expect(first).toHaveAttribute('aria-pressed', 'true');
  await user.click(last);
  expect(first).toHaveAttribute('aria-pressed', 'false');
  expect(last).toHaveAttribute('aria-pressed', 'true');
  await user.click(last);
  expect(last).toHaveAttribute('aria-pressed', 'false');
  window.history.replaceState(null, '', '/');
});
