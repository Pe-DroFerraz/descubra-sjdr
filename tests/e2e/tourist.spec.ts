import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
const id = '10000000-0000-4000-8000-000000000001',
  category = '20000000-0000-4000-8000-000000000001',
  routeId = '30000000-0000-4000-8000-000000000001';
const now = new Date(),
  start = new Date(now.getFullYear(), now.getMonth(), 15, 12).toISOString(),
  end = new Date(now.getFullYear(), now.getMonth(), 15, 18).toISOString();
const place = {
  id,
  category_id: category,
  slug: 'igreja-teste',
  name: 'Igreja de teste',
  description: 'Patrimônio de teste para validar o catálogo.',
  address: 'Rua de teste',
  latitude: -21.135,
  longitude: -44.262,
  phone: null,
  whatsapp: null,
  website: null,
  instagram: null,
  price_description: null,
  verified_at: null,
  place_translations: [
    { locale: 'en', name: 'Test Church', description: 'Test heritage site' },
  ],
  place_photos: [],
  place_hours: [],
};
const fixtures: Record<string, unknown> = {
  categories: [{ id: category, slug: 'historia', name: 'Igrejas e Museus' }],
  places: [place],
  routes: [
    {
      id: routeId,
      slug: 'roteiro-teste',
      name: 'Roteiro de teste',
      description: 'Percurso de teste',
      duration_minutes: 90,
      weather: 'rain',
      route_translations: [],
      route_stops: [{ place_id: id, position: 1, duration_minutes: 30 }],
    },
  ],
  events: [
    {
      id: '40000000-0000-4000-8000-000000000001',
      place_id: id,
      name: 'Evento de teste',
      description: 'Agenda de teste',
      starts_at: start,
      ends_at: end,
      verified_at: now.toISOString(),
      image_path: null,
      event_translations: [],
    },
  ],
  tips: [
    {
      id: '50000000-0000-4000-8000-000000000001',
      title: 'Dica de teste',
      description: 'Informação útil de teste',
      category: 'parking',
      latitude: null,
      longitude: null,
    },
  ],
  public_place_benefits: [
    {
      place_id: id,
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      features: { badge: true, priority: true, featured_pin: true },
    },
  ],
  public_route_sponsors: [],
  coupons: [],
  reviews: [],
};
async function api(page: Page, override: Record<string, unknown> = {}) {
  await page.route('http://127.0.0.1:54399/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').at(-1)!;
    if (['places', 'routes', 'events', 'tips'].includes(table)) {
      expect(url.searchParams.get('status')).toBe('eq.published');
      expect(url.searchParams.get('is_demo')).toBe('eq.false');
    }
    await route.fulfill({ json: override[table] ?? fixtures[table] ?? [] });
  });
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
}
test('search, place details, save, persist, translation and mobile navigation', async ({
  page,
}) => {
  await api(page);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Uma cidade para sentir/ }),
  ).toBeVisible();
  await page
    .getByRole('textbox', {
      name: 'Buscar lugares por nome, descrição ou endereço',
    })
    .fill('igreja');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/lugares\?q=igreja/);
  await page
    .getByRole('link', { name: 'Igreja de teste', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Igreja de teste', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Não informado').first()).toBeVisible();
  await page.getByRole('button', { name: 'Salvar lugar', exact: true }).click();
  await page.goto('/favoritos');
  await expect(
    page.getByRole('link', { name: 'Igreja de teste' }),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Dia' }).selectOption('2');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Dia 2', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Idioma', exact: true })
    .selectOption('en');
  await expect(
    page.getByRole('heading', { name: 'Your trip, your way' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Test Church' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Open menu' })
    .getByRole('link', { name: 'Events', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'What’s happening' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test('map clusters and attribution work even with unavailable tiles; category and open filters persist in URL', async ({
  page,
}) => {
  await api(page, {
    places: [
      place,
      {
        ...place,
        id: '10000000-0000-4000-8000-000000000002',
        slug: 'map-second',
        latitude: -21.13505,
      },
    ],
  });
  await page.goto('/mapa');
  await expect(
    page.getByRole('region', { name: 'Mapa', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('OpenStreetMap', { exact: true })).toBeVisible();
  await expect(page.locator('.marker-cluster')).toBeVisible();
  await expect(
    page.getByText('A base do mapa está indisponível.', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Categoria', exact: true })
    .selectOption('historia');
  await expect(page).toHaveURL(/categoria=historia/);
  await page
    .getByRole('checkbox', { name: 'Aberto agora', exact: true })
    .check();
  await expect(
    page.getByText('Nenhum resultado para estes filtros'),
  ).toBeVisible();
  await expect(page).toHaveURL(/aberto=1/);
});
test('routes, calendar, tips and a shared itinerary use published response data', async ({
  page,
}) => {
  await api(page);
  await page.goto('/roteiros');
  await page.getByRole('link', { name: /Roteiro de teste/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Roteiro de teste', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Salvar paradas na minha viagem' })
    .click();
  await page.goto('/favoritos');
  await expect(
    page.getByRole('link', { name: 'Igreja de teste' }),
  ).toBeVisible();
  await page.goto('/eventos');
  await expect(
    page.getByRole('group', { name: 'Calendário mensal' }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Evento de teste', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Evento de teste' }),
  ).toBeVisible();
  await page.goto('/dicas');
  await expect(
    page.getByRole('heading', { name: 'Dica de teste' }),
  ).toBeVisible();
  await page.goto(
    '/favoritos?trip=' + encodeURIComponent(JSON.stringify([{ id, day: 3 }])),
  );
  await page
    .getByRole('button', { name: 'Importar roteiro compartilhado' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Dia 3', exact: true }),
  ).toBeVisible();
});
test('empty, loading, errors and retry do not become fake data', async ({
  page,
}) => {
  await api(page, { places: [] });
  await page.goto('/lugares');
  await expect(page.getByText('Ainda não há locais publicados')).toBeVisible();
  let fail = true;
  await page.route(
    'http://127.0.0.1:54399/rest/v1/places?**',
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (fail)
        await route.fulfill({ status: 403, json: { message: 'Test outage' } });
      else await route.fulfill({ json: [place] });
    },
  );
  await page.reload();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Consultando os locais publicados' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Não foi possível carregar os locais',
    }),
  ).toBeVisible();
  fail = false;
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'Igreja de teste', exact: true }),
  ).toBeVisible();
});

test('favorites reorder by day, share actual IDs, and support GPS sorting', async ({
  page,
  context,
}) => {
  const second = {
    ...place,
    id: '10000000-0000-4000-8000-000000000002',
    slug: 'segundo-teste',
    name: 'Segundo teste',
    latitude: -21.14,
  };
  await api(page, { places: [place, second] });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: (text: string) => {
          sessionStorage.setItem('copied-link', text);
          return Promise.resolve();
        },
      },
    });
  });
  await page.goto(
    '/favoritos?trip=' +
      encodeURIComponent(
        JSON.stringify([
          { id, day: 1 },
          { id: second.id, day: 1 },
        ]),
      ),
  );
  await page
    .getByRole('button', { name: 'Importar roteiro compartilhado' })
    .click();
  await page.getByRole('button', { name: 'Mover para cima' }).nth(1).click();
  await expect(page.locator('.trip-row').first().getByRole('link')).toHaveText(
    'Segundo teste',
  );
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  await expect(page.getByText('Link copiado', { exact: true })).toBeVisible();
  const shared = await page.evaluate(() =>
    sessionStorage.getItem('copied-link'),
  );
  expect(JSON.parse(new URL(shared!).searchParams.get('trip')!)[0].id).toBe(
    second.id,
  );
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -21.135, longitude: -44.262 });
  await page.goto('/lugares');
  await page
    .getByRole('button', { name: 'Usar minha localização', exact: true })
    .click();
  await expect(
    page.getByRole('option', { name: 'Distância', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('combobox', { name: 'Ordenar por' })
    .selectOption('distance');
  await expect(
    page
      .locator('.place-card')
      .first()
      .getByRole('link', { name: 'Igreja de teste', exact: true }),
  ).toBeVisible();
});

test('home is responsive and passes automated WCAG checks', async ({
  page,
}) => {
  await api(page);
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: 'Igreja de teste', exact: true }),
  ).toBeVisible();
  const desktop = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(desktop.violations).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('home-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const mobile = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(mobile.violations).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('home-mobile.png'),
    fullPage: true,
  });
});

test('routes and events explain empty published catalogs without reporting a network failure', async ({
  page,
}) => {
  await api(page, { places: [], routes: [], events: [] });
  await page.goto('/roteiros');
  await expect(page.getByText('Os roteiros estão em preparação')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.goto('/eventos');
  await expect(
    page.getByText('Nenhum evento publicado neste período'),
  ).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Calendário mensal' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
