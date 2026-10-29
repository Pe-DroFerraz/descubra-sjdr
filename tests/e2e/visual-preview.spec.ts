import { test, expect } from '@playwright/test';

test('homepage provides full editorial experiences when Supabase is offline', async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/Uma cidade para sentir/})).toBeVisible();
  await expect(page.getByRole('heading',{name:/Existe um São João/})).toBeVisible();
  await expect(page.locator('.destination-mosaic .visual-photo img')).toHaveCount(4);
  await expect(page.getByRole('link',{name:/Ver mapa da cidade/})).toBeVisible();
  await expect(page.getByRole('link',{name:/Abrir mapa em tela cheia/})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('curated routes and itinerary builder work without a database',async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/roteiros');
  await expect(page.getByRole('heading',{name:/Roteiros que/})).toBeVisible();
  await page.getByRole('link',{name:/Explorar roteiro/}).first().click();
  await expect(page.getByText('Passo a passo,')).toBeVisible();
  await expect(page.getByText('4 paradas')).toBeVisible();
  await page.getByRole('checkbox',{name:/Incluir Igreja de São Francisco/}).uncheck();
  await expect(page.getByText('3 paradas')).toBeVisible();
  await page.goto('/planejar');
  await page.getByRole('button',{name:/Encontrar meu roteiro/}).click();
  await expect(page.getByRole('link',{name:/Ver roteiro com/})).toBeVisible();
});

test('map retains an immediately visible flat fallback',async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/mapa-3d');
  await expect(page.getByTitle('Mapa de São João del-Rei')).toBeVisible();
  await expect(page.getByRole('button',{name:/Ativar 3D/})).toBeVisible();
});

test('main map is a first-class destination with map filters even when the catalog is offline',async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/mapa');
  await expect(page.getByRole('heading',{name:/Descubra a cidade/})).toBeVisible();
  await expect(page.getByRole('region',{name:'Mapa de São João del-Rei com pontos turísticos'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Igrejas',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Igrejas',exact:true}).click();
  await expect(page.getByText('Igreja de São Francisco de Assis',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:'Eventos',exact:true}).click();
  await expect(page.getByText(/Ainda não há eventos futuros publicados/)).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('3D can actually initialize, show its canvas and switch between terrain and flat mode',async ({page})=>{
  // A controlled MapLibre module exercises the app's dynamic ESM loading and
  // terrain-ready lifecycle without depending on a third-party CDN in CI.
  await page.route('https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.mjs',async route=>{
    await route.fulfill({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},
      body: