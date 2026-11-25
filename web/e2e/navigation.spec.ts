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
