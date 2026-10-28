import { test, expect } from '@playwright/test';

test('homepage shows photographic preview when the database is offline', async ({ page }) => {
  await page.route('http://127.0.0.1:54399/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /O patrimônio em imagens/ })).toBeVisible();
  const gallery = page.getByRole('region', { name: 'Galeria de São João del-Rei' });
  // The gallery is statically bundled, regardless of Supabase requests.
  await expect(gallery.locator('img')).toHaveCount(4);
  await expect(gallery.getByRole('link', { name: /Foto: Wikimedia Commons/ })).toHaveCount(4);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('map preview has visible 2D fallback without loading the catalog or 3D engine', async ({ page }) => {
  await page.route('http://127.0.0.1:54399/**', (route) => route.abort());
  await page.goto('/mapa-3d');
  await expect(page.getByTitle('Mapa de São João del-Rei')).toBeVisible();
  await expect(page.getByRole('button', { name: /Ativar 3D/ })).toBeVisible();
  await expect(page.getByText('Mapa visível imediatamente.', { exact: false })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTitle('Mapa de São João del-Rei')).toBeVisible();
});
