import { test, expect, type Page } from '@playwright/test';
import { Buffer } from 'node:buffer';
import AxeBuilder from '@axe-core/playwright';
const userId = '71000000-0000-4000-8000-000000000001',
  categoryId = '72000000-0000-4000-8000-000000000001',
  placeId = '72000000-0000-4000-8000-000000000002',
  secondId = '72000000-0000-4000-8000-000000000003',
  routeId = '72000000-0000-4000-8000-000000000004';
const stamp = '2026-10-22T12:00:00.000Z';
const token = [
  Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
  Buffer.from(
    JSON.stringify({
      sub: userId,
      role: 'authenticated',
      aud: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url'),
  'test-only-signature',
].join('.');
const user = {
  id: userId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'cms-fixture@example.invalid',
  app_metadata: { provider: 'email' },
  user_metadata: { role: 'admin' },
  created_at: stamp,
};
const session = {
  access_token: token,
  refresh_token: 'test-only-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  user,
};
type RecordRow = Record<string, unknown>;
async function backend(page: Page, admin = true) {
  const state = {
    admin,
    failPlaces: false,
    schemaReady: true,
    storageUploads: 0,
    storageDeletes: 0,
    order: [] as unknown[],
    tables: {
      categories: [
        {
          id: categoryId,
          name: 'Categoria fixture',
          slug: 'categoria-fixture',
          published: false,
          updated_at: stamp,
        },
      ],
      places: [placeId, secondId].map((id, i) => ({
        id,
        name: `Local fixture ${i + 1}`,
        slug: `local-fixture-${i + 1}`,
        category_id: categoryId,
        description: 'Only browser fixture',
        address: null,
        latitude: null,
        longitude: null,
        website: null,
        phone: null,
        whatsapp: null,
        instagram: null,
        price_description: null,
        verified_at: null,
        status: 'draft',
        is_demo: false,
        updated_at: stamp,
        place_photos: [],
        place_hours: [],
        place_translations: [],
      })),
      routes: [
        {
          id: routeId,
          name: 'Roteiro fixture',
          slug: 'roteiro-fixture',
          description: 'Only browser fixture',
          duration_minutes: null,
          weather: 'any',
          status: 'draft',
          is_demo: false,
          updated_at: stamp,
        },
      ],
      events: [],
      tips: [],
      place_photos: [],
      route_stops: [],
      advertisers: [],
      route_sponsors: [],
    } as Record<string, RecordRow[]>,
  };
  let sequence = 10;
  const nextStamp = () =>
    new Date(Date.parse(stamp) + ++sequence * 1000).toISOString();
  await page.route('http://127.0.0.1:54399/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method();
    if (url.pathname === '/auth/v1/token')
      return route.fulfill({ json: session });
    if (url.pathname === '/auth/v1/user') return route.fulfill({ json: user });
    if (url.pathname === '/auth/v1/logout')
      return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/rpc/has_role'))
      return route.fulfill({
        json:
          request.headers().authorization === `Bearer ${token}` && state.admin,
      });
    if (url.pathname.endsWith('/rpc/admin_set_route_stops')) {
      const body = request.postDataJSON();
      if (!state.admin)
        return route.fulfill({
          status: 403,
          json: { code: '42501', message: 'Test-only denied' },
        });
      if (body.expected_updated_at !== state.tables.routes[0].updated_at)
        return route.fulfill({
          status: 409,
          json: { code: '40001', message: 'Fixture stale route' },
        });
      state.order = body.stops;
      state.tables.route_stops = body.stops.map((s: RecordRow, i: number) => ({
        ...s,
        id: `73000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
        route_id: routeId,
        position: i,
      }));
      state.tables.routes[0].updated_at = nextStamp();
      return route.fulfill({ json: body.stops.length });
    }
    if (url.pathname.includes('/rest/v1/rpc/'))
      return route.fulfill({ json: [] });
    if (url.pathname.includes('/storage/v1/object/info/'))
      return route.fulfill({
        json: {
          id: 'fixture',
          name: 'fixture.webp',
          bucket_id: 'place-photos',
          metadata: {
            license: 'own-authorized',
            author: 'Fixture photographer',
            source: '',
          },
        },
      });
    if (url.pathname.startsWith('/storage/v1/object/')) {
      if (method === 'POST') {
        state.storageUploads++;
        return route.fulfill({
          json: { Id: 'fixture', Key: url.pathname.split('/object/')[1] },
        });
      }
      if (method === 'DELETE') {
        state.storageDeletes++;
        return route.fulfill({ json: [] });
      }
      return route.fulfill({ status: 404 });
    }
    const table = url.pathname.split('/rest/v1/')[1];
    if (!table) return route.fulfill({ json: [] });
    if (table === 'places' && state.failPlaces && method === 'GET')
      return route.fulfill({
        status: 503,
        json: { message: 'Test-only unavailable' },
      });
    if (
      !state.schemaReady &&
      method === 'GET' &&
      url.searchParams.get('select')?.includes('source_urls')
    )
      return route.fulfill({
        status: 400,
        json: {
          code: '42703',
          message: 'Fixture missing editorial columns',
        },
      });
    const records = state.tables[table] ?? [];
    const selected = records.filter((row) =>
      [...url.searchParams].every(
        ([key, value]) =>
          !value.startsWith('eq.') || String(row[key]) === value.slice(3),
      ),
    );
    if (method === 'HEAD')
      return route.fulfill({
        status: 200,
        headers: { 'content-range': `*/${selected.length}` },
      });
    if (method === 'GET') return route.fulfill({ json: selected });
    if (!state.admin)
      return route.fulfill({
        status: 403,
        json: { code: '42501', message: 'Test-only denied' },
      });
    let result: RecordRow[] = [];
    if (method === 'POST') {
      const body = request.postDataJSON();
      result = (Array.isArray(body) ? body : [body]).map((data) => ({
        status: 'draft',
        is_demo: false,
        updated_at: nextStamp(),
        id: `74000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
        ...data,
      }));
      state.tables[table] = [...records, ...result];
    }
    if (method === 'PATCH') {
      for (const row of selected)
        Object.assign(row, request.postDataJSON(), {
          updated_at: nextStamp(),
        });
      result = selected;
    }
    if (method === 'DELETE') {
      state.tables[table] = records.filter((row) => !selected.includes(row));
      result = selected;
    }
    const single = request.headers().accept?.includes('vnd.pgrst.object');
    return route.fulfill({ json: single ? (result[0] ?? null) : result });
  });
  return state;
}
async function login(page: Page) {
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Entrar', exact: true }),
  ).toBeVisible();
  await page
    .getByLabel('E-mail', { exact: true })
    .fill('cms-fixture@example.invalid');
  await page.getByLabel('Senha', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  // Navigation must wait for the login and server role verification to finish.
  await expect(
    page.getByRole('heading', {
      name: /^(Ateliê do conteúdo|Acesso restrito à administração)$/,
    }),
  ).toBeVisible();
}
test('anonymous and a forged metadata administrator cannot open management or issue content writes', async ({
  page,
}) => {
  const state = await backend(page, false);
  let writes = 0;
  page.on('request', (r) => {
    if (
      r.url().includes('/rest/v1/') &&
      ['PATCH', 'DELETE'].includes(r.method())
    )
      writes++;
  });
  await login(page);
  await expect(
    page.getByRole('heading', { name: 'Acesso restrito à administração' }),
  ).toBeVisible();
  expect(state.tables.categories).toHaveLength(1);
  expect(writes).toBe(0);
});
for (const entity of [
  'categories',
  'places',
  'routes',
  'events',
  'tips',
] as const)
  test(`administrator creates, edits and deletes ${entity} with real form validation`, async ({
    page,
  }) => {
    const state = await backend(page);
    await login(page);
    await expect(
      page.getByRole('heading', { name: 'Ateliê do conteúdo' }),
    ).toBeVisible();
    await page.goto('/admin?secao=' + entity);
    await page
      .getByRole('button', { name: 'Novo conteúdo', exact: true })
      .click();
    const editor = page.getByRole('form', { name: 'Novo conteúdo' });
    await editor
      .getByLabel(entity === 'tips' ? 'Título' : 'Nome', { exact: true })
      .fill('Conteúdo fixture');
    if (entity !== 'events' && entity !== 'tips')
      await editor
        .getByLabel('Nome na URL', { exact: true })
        .fill('conteudo-fixture');
    await editor
      .getByLabel('Fontes do conteúdo (uma URL HTTPS por linha)', {
        exact: true,
      })
      .fill('https://example.invalid/editorial');
    await editor
      .getByLabel(
        'Campos pendentes (um por linha; vazio somente após revisão)',
        { exact: true },
      )
      .fill('revisao_fixture');
    if (entity === 'places')
      await editor
        .getByRole('combobox', { name: 'Categoria', exact: true })
        .selectOption(categoryId);
    if (entity === 'tips') {
      await editor
        .getByLabel('Descrição', { exact: true })
        .fill('Only test data');
      await editor.getByLabel('Tipo da dica', { exact: true }).fill('teste');
    }
    if (entity === 'events') {
      await editor.getByLabel('Início confirmado').fill('2026-11-01T10:00');
      await editor.getByLabel('Término confirmado').fill('2026-11-01T11:00');
    }
    await editor
      .getByRole('button', { name: 'Salvar conteúdo', exact: true })
      .click();
    await expect(
      page.getByText('Conteúdo salvo.', { exact: false }),
    ).toBeVisible();
    const row = page.locator('.admin-record').filter({
      has: page.getByRole('heading', {
        name: 'Conteúdo fixture',
        exact: true,
      }),
    });
    await expect(row).toBeVisible();
    await row
      .getByRole('button', { name: 'Editar conteúdo', exact: true })
      .click();
    const editing = page.getByRole('form', { name: 'Editar conteúdo' });
    await editing
      .getByLabel(entity === 'tips' ? 'Título' : 'Nome', { exact: true })
      .fill('Conteúdo revisado');
    await editing
      .getByRole('button', { name: 'Salvar conteúdo', exact: true })
      .click();
    await expect(
      page
        .locator('.admin-record')
        .getByRole('heading', { name: 'Conteúdo revisado', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', {
        name: 'Excluir: Conteúdo revisado',
        exact: true,
      })
      .click();
    await page
      .getByRole('button', { name: 'Confirmar exclusão', exact: true })
      .click();
    await expect(
      page
        .locator('.admin-record')
        .getByRole('heading', { name: 'Conteúdo revisado', exact: true }),
    ).toHaveCount(0);
    expect(
      state.tables[entity].some(
        (row) =>
          row.name === 'Conteúdo revisado' || row.title === 'Conteúdo revisado',
      ),
    ).toBe(false);
  });
test('publication requires editorial confirmation and management remains responsive on mobile', async ({
  page,
}) => {
  await backend(page);
  await login(page);
  await page.goto('/admin?secao=categories');
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: 'Novo conteúdo', exact: true })
    .click();
  const editor = page.getByRole('form', { name: 'Novo conteúdo' });
  await editor.getByLabel('Nome', { exact: true }).fill('Categoria fixture 2');
  await editor
    .getByLabel('Nome na URL', { exact: true })
    .fill('categoria-fixture-2');
  await editor
    .getByLabel('Fontes do conteúdo (uma URL HTTPS por linha)', {
      exact: true,
    })
    .fill('https://example.invalid/editorial');
  await editor.getByLabel('Publicado no catálogo').check();
  await editor
    .getByRole('button', { name: 'Salvar conteúdo', exact: true })
    .click();
  await expect(
    page.getByText('Confirme a revisão editorial antes de publicar.'),
  ).toBeVisible();
  await editor
    .getByLabel(
      'Revisei as fontes, o endereço, os direitos e a exatidão deste conteúdo antes de publicá-lo.',
    )
    .check();
  await editor
    .getByRole('button', { name: 'Salvar conteúdo', exact: true })
    .click();
  await expect(
    page.getByText('Conteúdo salvo.', { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('admin-mobile.png'),
    fullPage: true,
  });
});
test('ordered route stops are sent in one transactional operation and support keyboard controls', async ({
  page,
}) => {
  const state = await backend(page);
  await login(page);
  await page.goto('/admin?secao=stops');
  await page
    .getByRole('combobox', {
      name: 'Selecione um roteiro para organizar as paradas.',
    })
    .selectOption(routeId);
  const adding = page.getByRole('combobox', { name: 'Adicionar parada' });
  await adding.selectOption(placeId);
  await page
    .getByRole('button', { name: 'Adicionar parada', exact: true })
    .click();
  await adding.selectOption(secondId);
  await page
    .getByRole('button', { name: 'Adicionar parada', exact: true })
    .click();
  await page.getByRole('button', { name: 'Mover para cima: 2' }).click();
  await page
    .getByRole('button', { name: 'Salvar paradas', exact: true })
    .click();
  await expect
    .poll(() => state.order)
    .toEqual([
      { place_id: secondId, duration_minutes: null },
      { place_id: placeId, duration_minutes: null },
    ]);
});
test('image upload validates rights, uses a generated path and supports metadata CRUD and deletion', async ({
  page,
}) => {
  const state = await backend(page);
  await login(page);
  await page.goto('/admin?secao=media');
  await page
    .getByLabel('Selecione um local para gerenciar a galeria.')
    .selectOption(placeId);
  await page
    .getByLabel('Descrição acessível da fotografia')
    .fill('Fotografia fixture');
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#173c58';
    ctx.fillRect(0, 0, 20, 20);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Arquivo de imagem').setInputFiles({
    name: 'fixture.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await page
    .getByLabel('Autor ou instituição responsável')
    .fill('Fixture photographer');
  await page
    .getByLabel(
      'Confirmo os direitos de uso, a ausência de dados pessoais e a revisão desta imagem.',
      { exact: false },
    )
    .check();
  await page
    .getByRole('button', { name: 'Enviar fotografia', exact: true })
    .click();
  await expect.poll(() => state.storageUploads).toBe(1);
  await expect(
    page.getByText('Conteúdo salvo.', { exact: false }),
  ).toBeVisible();
  expect(state.tables.place_photos[0].storage_path).toMatch(
    new RegExp('^' + placeId + '/[a-f0-9-]+\\.webp$'),
  );
  await page
    .locator('article')
    .getByRole('button', { name: 'Editar descrição e posição' })
    .click();
  await page
    .getByLabel('Descrição acessível da fotografia')
    .fill('Legenda revisada');
  await page
    .getByRole('button', { name: 'Salvar conteúdo', exact: true })
    .click();
  await expect(
    page.locator('article').getByText('Legenda revisada'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Remover imagem', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Confirmar exclusão', exact: true })
    .click();
  await expect.poll(() => state.storageDeletes).toBe(1);
  await expect(page.getByText('Nenhuma fotografia vinculada.')).toBeVisible();
});

test('a revoked administrator role prevents writes even while the editor is open', async ({
  page,
}) => {
  const state = await backend(page);
  await login(page);
  await page.goto('/admin?secao=categories');
  await page
    .getByRole('button', { name: 'Novo conteúdo', exact: true })
    .click();
  const editor = page.getByRole('form', { name: 'Novo conteúdo' });
  await editor.getByLabel('Nome', { exact: true }).fill('Denied fixture');
  await editor
    .getByLabel('Nome na URL', { exact: true })
    .fill('denied-fixture');
  state.admin = false;
  await editor
    .getByRole('button', { name: 'Salvar conteúdo', exact: true })
    .click();
  await expect(
    page.getByText(
      'Sua sessão ou permissão administrativa não foi confirmada.',
      { exact: false },
    ),
  ).toBeVisible();
  expect(state.tables.categories).toHaveLength(1);
});
test('concurrent editing reports a conflict instead of overwriting a newer record', async ({
  page,
}) => {
  const state = await backend(page);
  await login(page);
  await page.goto('/admin?secao=categories');
  await page
    .locator('.admin-record')
    .getByRole('button', { name: 'Editar conteúdo', exact: true })
    .click();
  const editor = page.getByRole('form', { name: 'Editar conteúdo' });
  await editor.getByLabel('Nome', { exact: true }).fill('Stale change');
  state.tables.categories[0].updated_at = '2026-10-22T15:00:00.000Z';
  state.tables.categories[0].name = 'Newer server change';
  await editor
    .getByRole('button', { name: 'Salvar conteúdo', exact: true })
    .click();
  await expect(
    page.getByText('O conteúdo mudou desde que você o abriu', {
      exact: false,
    }),
  ).toBeVisible();
  expect(state.tables.categories[0].name).toBe('Newer server change');
});

test('event image upload, replacement and deletion preserve the event and clean old objects', async ({
  page,
}) => {
  const state = await backend(page);
  const eventId = '75000000-0000-4000-8000-000000000001';
  state.tables.events.push({
    id: eventId,
    updated_at: stamp,
    name: 'Evento fixture',
    description: 'Only test data',
    status: 'draft',
    starts_at: '2026-11-01T13:00:00Z',
    ends_at: '2026-11-01T14:00:00Z',
    verified_at: null,
    image_path: null,
    is_demo: false,
  });
  await login(page);
  await page.goto('/admin?secao=media');
  await page
    .getByRole('combobox', { name: 'Fotografias', exact: true })
    .selectOption('event-images');
  await page
    .getByLabel('Selecione um evento para gerenciar sua imagem.')
    .selectOption(eventId);
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    return canvas.toDataURL('image/png').split(',')[1];
  });
  for (let i = 0; i < 2; i++) {
    await page
      .getByLabel('Descrição acessível da fotografia')
      .fill('Event image fixture ' + i);
    await page.getByLabel('Arquivo de imagem').setInputFiles({
      name: 'fixture.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64'),
    });
    await page
      .getByLabel('Autor ou instituição responsável')
      .fill('Fixture author');
    await page
      .getByLabel(
        'Confirmo os direitos de uso, a ausência de dados pessoais e a revisão desta imagem.',
        { exact: false },
      )
      .check();
    await page
      .getByRole('button', { name: 'Enviar fotografia', exact: true })
      .click();
    await expect.poll(() => state.storageUploads).toBe(i + 1);
    await expect(
      page.getByText('Conteúdo salvo.', { exact: false }),
    ).toBeVisible();
  }
  expect(state.tables.events).toHaveLength(1);
  expect(state.storageDeletes).toBe(1);
  await page
    .getByRole('button', { name: 'Remover imagem', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Confirmar exclusão', exact: true })
    .click();
  await expect.poll(() => state.storageDeletes).toBe(2);
  await expect(page.getByText('Nenhuma fotografia vinculada.')).toBeVisible();
  expect(state.tables.events[0].image_path).toBeNull();
});

test('publishing an attraction remains blocked until its sources, pending fields and address are reviewed', async ({
  page,
}) => {
  const state = await backend(page);
  await login(page);
  await page.goto('/admin?secao=places');
  await page
    .locator('.admin-record')
    .filter({
      has: page.getByRole('heading', {
        name: 'Local fixture 1',
        exact: true,
      }),
    })
    .getByRole('button', { name: 'Editar conteúdo' })
    .click();
  const editor = page.getByRole('form', { name: 'Editar conteúdo' });
  await editor
    .getByLabel('Fontes do conteúdo (uma URL HTTPS por linha)', {
      exact: true,
    })
    .fill('https://example.invalid/source');
  await editor
    .getByLabel('Campos pendentes (um por linha; vazio somente após revisão)', {
      exact: true,
    })
    .fill('endereco');
  await editor
    .getByRole('combobox', { name: 'Estado editorial', exact: true })
    .selectOption('published');
  const review = editor.getByLabel(
    'Revisei as fontes, o endereço, os direitos e a exatidão deste conteúdo antes de publicá-lo.',
  );
  await review.check();
  await editor
    .getByRole('button', { name: 'Salvar conteúdo', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('Publicação bloqueada');
  expect(state.tables.places[0].status).toBe('draft');
  await editor.getByLabel('Endereço', { exact: true }).fill('Fixture only');
  await editor
    .getByLabel('Campos pendentes (um por linha; vazio somente após revisão)', {
      exact: true,
    })
    .fill('');
  await review.check();
  await editor
    .getByRole('button', { name: 'Salvar conteúdo', exact: true })
    .click();
  await expect(
    page.getByText('Conteúdo salvo.', { exact: false }),
  ).toBeVisible();
  expect(state.tables.places[0]).toMatchObject({
    status: 'published',
    source_urls: ['https://example.invalid/source'],
    pending_fields: [],
  });
});

test('missing editorial migration is explicit and does not hide the versioned draft proposal', async ({
  page,
}) => {
  const state = await backend(page);
  state.schemaReady = false;
  await login(page);
  await expect(
    page.getByText('O banco ainda não oferece todos os recursos editoriais.', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Novo conteúdo', exact: true }),
  ).toHaveCount(0);
  await page.goto('/admin?secao=catalog');
  await expect(
    page.getByRole('heading', {
      name: 'Maria Fumaça — passeio ferroviário',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Endereço confirmado na referência fornecida pelo usuário', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        'Referência oficial fornecida em outra sessão; não acessada neste ambiente',
        { exact: true },
      )
      .first(),
  ).toBeVisible();
});

test('a stale route editor preserves its draft while the server retains the concurrent winner', async ({
  page,
}) => {
  const state = await backend(page);
  state.tables.route_stops = [
    {
      id: '76000000-0000-4000-8000-000000000001',
      route_id: routeId,
      place_id: placeId,
      position: 0,
      duration_minutes: 10,
    },
  ];
  await login(page);
  await page.goto('/admin?secao=stops');
  await page
    .getByRole('combobox', {
      name: 'Selecione um roteiro para organizar as paradas.',
    })
    .selectOption(routeId);
  await expect(page.locator('.admin-stop')).toHaveCount(1);
  await page
    .getByRole('combobox', { name: 'Adicionar parada' })
    .selectOption(secondId);
  await page
    .getByRole('button', { name: 'Adicionar parada', exact: true })
    .click();
  state.tables.routes[0].updated_at = '2026-10-27T12:00:00.123456Z';
  state.tables.route_stops[0].duration_minutes = 20;
  await page
    .getByRole('button', { name: 'Salvar paradas', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'O conteúdo mudou desde que você o abriu',
  );
  await expect(page.locator('.admin-stop')).toHaveCount(2);
  expect(state.tables.route_stops).toHaveLength(1);
  expect(state.tables.route_stops[0].duration_minutes).toBe(20);
});
