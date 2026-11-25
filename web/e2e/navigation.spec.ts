import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test('navigates with menu, CTA, direct entry, refresh and history', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Team', exact: true }).click();
  await expect(page).toHaveURL('/team');
  await expect(page).toHaveTitle('AzenoHI.dev — Team');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Team', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'People × AI' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await page.goForward();
  await expect(page).toHaveURL('/team');
  await page.getByRole('link', { name: 'AzenoHI.dev home' }).click();
  await page.getByRole('link', { name: 'Meet the team' }).click();
  await expect(page).toHaveURL('/team');
  await page.goto('/team');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('People × AI');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('keeps navigation and cards accessible at narrow widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/team');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Home', exact: true }),
    ).toBeVisible();
  }
  await page.getByRole('navigation').getByRole('link', { name: 'Home', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
});

test('preserves the same Canvas and pause state through client navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Pause animation' })).toBeVisible();
  const canvas = await page.locator('canvas').elementHandle();
  await page.getByRole('button', { name: 'Pause animation' }).click();
  for (let index = 0; index < 10; index++) {
    const destination = index % 2 === 0 ? 'Team' : 'Home';
    await page
      .getByRole('navigation')
      .getByRole('link', { name: destination, exact: true })
      .click();
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await canvas?.evaluate((node) => node === document.querySelector('canvas'))).toBe(true);
    await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Play animation' }).click();
  await expect(page.getByRole('button', { name: 'Pause animation' })).toBeVisible();
});

test('opens all project details and restores the invoking card on the persistent scene', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  const canvas = await page.locator('canvas').elementHandle();
  await page.getByRole('link', { name: 'Explore projects' }).click();
  const cards = page.locator('.project-card');
  await expect(cards).toHaveCount(6);
  const names = await cards.locator('h2').allTextContents();
  for (const name of names) {
    const card = page
      .locator('.project-card')
      .filter({ has: page.getByRole('heading', { name, exact: true }) });
    await card.focus();
    const top = await page.locator('.route-content').evaluate((el) => el.scrollTop);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    expect(await canvas?.evaluate((el) => el === document.querySelector('canvas'))).toBe(true);
    await page
      .getByRole('link', { name: /Back to projects/ })
      .first()
      .click();
    await expect(card).toBeFocused();
    expect(await page.locator('.route-content').evaluate((el) => el.scrollTop)).toBe(top);
  }
  await page.goForward();
  await expect(page).toHaveTitle('AzenoHI.dev — Risk Miner');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Product gallery' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('link', { name: /Risk Miner/ })).toBeFocused();
});

test('opens the mountain Journey and supports keyboard and mobile interaction', async ({
  page,
}) => {
  const errors: string[] = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const journeyLink = page.getByRole('navigation').getByRole('link', { name: 'Journey' });
  await journeyLink.click();
  await expect(page).toHaveURL('/journey');
  await expect(page).toHaveTitle('AzenoHI.dev — Journey');
  await expect(journeyLink).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('canvas')).toHaveCount(0);
  const milestones = page
    .getByRole('list', { name: 'Illustrative milestones' })
    .getByRole('button');
  await expect(milestones).toHaveCount(5);

  await page.keyboard.press('Tab');
  await expect(milestones.first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(milestones.first()).toHaveAttribute('aria-pressed', 'true');
  await milestones.last().click();
  await expect(milestones.last()).toHaveAttribute('aria-pressed', 'true');
  await expect(milestones.first()).toHaveAttribute('aria-pressed', 'false');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await page.goForward();
  await expect(page).toHaveURL('/journey');
  await page.goto('/journey/');
  await expect(journeyLink).toHaveAttribute('aria-current', 'page');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});
