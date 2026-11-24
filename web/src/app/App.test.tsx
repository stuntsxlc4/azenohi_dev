import { render, screen } from '@testing-library/react';
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
