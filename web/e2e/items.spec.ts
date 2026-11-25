import { AxeBuilder } from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
import { expect, test as base } from '@playwright/test';
import { z } from 'zod';

const itemSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
});
const healthSchema = z.object({ status: z.literal('ok') });
const test = base.extend<{ createdItems: string[] }>({
  createdItems: async ({ request }, provideFixture) => {
    const identifiers: string[] = [];
    try {
      await provideFixture(identifiers);
    } finally {
      for (const identifier of identifiers) {
        const response = await request.delete(`/api/v1/items/${identifier}`);
        expect(response.ok() || response.status() === 404).toBe(true);
      }
    }
  },
});

test('renders accessible start navigation at the configured viewport', async ({
  browserName,
  page,
}) => {
  await page.goto('/?source=navigation-test');
  await expect(page).toHaveTitle('AzenoHI.dev — Hybrid Intelligence');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hybrid Intelligence');
  await expect(page.locator('nav [aria-disabled=true]')).toHaveCount(2);

  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  const startLink = navigation.getByRole('link', { name: 'Home' });
  await expect(navigation.getByRole('link')).toHaveCount(2);
  await expect(startLink).toHaveAttribute('href', '/?source=navigation-test');
  await expect(startLink).toHaveAttribute('aria-current', 'page');
  // WebKit on macOS uses Option-Tab to focus links by default.
  const focusNextLink =
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.getByRole('link', { name: 'AzenoHI.dev home' }).focus();
  await page.keyboard.press(focusNextLink);
  await expect(startLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/?source=navigation-test');

  const viewport = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(viewport.content).toBeLessThanOrEqual(viewport.viewport);
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    accessibility.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});

test('connects the frontend proxy to the real API and persists an example resource', async ({
  page,
  request,
  createdItems,
}) => {
  const correlationId = `smoke-${randomUUID()}`;
  const health = await request.get('/health/ready', {
    headers: { 'X-Request-ID': correlationId },
  });
  expect(health.ok()).toBe(true);
  expect(healthSchema.parse(await health.json()).status).toBe('ok');
  expect(health.headers()['x-request-id']).toBe(correlationId);

  const title = `Test ${randomUUID()}`;
  const createdResponse = await request.post('/api/v1/items', {
    data: { title, description: 'Testowy element' },
  });
  expect(createdResponse.status()).toBe(201);
  const item = itemSchema.parse(await createdResponse.json());
  createdItems.push(item.id);
  const resource = `/api/v1/items/${item.id}`;
  const fetched = await request.get(resource);
  expect(fetched.ok()).toBe(true);
  expect(itemSchema.parse(await fetched.json())).toEqual(item);

  const updatedTitle = `${title} po zmianie`;
  const updatedResponse = await request.patch(resource, {
    data: { title: updatedTitle, description: null },
  });
  expect(updatedResponse.ok()).toBe(true);
  expect(itemSchema.parse(await updatedResponse.json())).toMatchObject({
    id: item.id,
    title: updatedTitle,
    description: null,
  });
  await page.goto('/');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hybrid Intelligence');
  const persisted = await request.get(resource);
  expect(itemSchema.parse(await persisted.json()).title).toBe(updatedTitle);
  expect((await request.delete(resource)).status()).toBe(204);
  expect((await request.get(resource)).status()).toBe(404);
});

test('loads the page without depending on API availability', async ({ page }) => {
  let apiRequests = 0;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/\/(?:api|health)\//, async (route) => {
    apiRequests += 1;
    await route.abort('failed');
  });
  await page.goto('/');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hybrid Intelligence');
  expect(apiRequests).toBe(0);
  expect(errors).toEqual([]);
});
