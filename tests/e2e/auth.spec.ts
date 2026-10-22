import { test, expect, type Page } from '@playwright/test';
import { Buffer } from 'node:buffer';
const id = '70000000-0000-4000-8000-000000000001';
const email = 'auth-fixture@example.invalid';
const user = {
  id,
  aud: 'authenticated',
  role: 'authenticated',
  email,
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { role: 'admin' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
const now = Math.floor(Date.now() / 1000);
const token = [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url',
  ),
  Buffer.from(
    JSON.stringify({
      sub: id,
      role: 'authenticated',
      aud: 'authenticated',
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url'),
  'fixture-signature',
].join('.');
const session = {
  access_token: token,
  refresh_token: 'test-only-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: now + 3600,
  user,
};
async function authApi(page: Page) {
  await page.route('http://127.0.0.1:54399/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/auth/v1/token')
      return route.fulfill({ json: session });
    if (url.pathname === '/auth/v1/user') return route.fulfill({ json: user });
    if (url.pathname === '/auth/v1/logout')
      return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/rpc/has_role'))
      return route.fulfill({ json: false });
    return route.fulfill({ json: [] });
  });
}
test('existing password login verifies the user and server roles, while the catalog remains anonymous', async ({
  page,
}) => {
  await authApi(page);
  await page.goto('/conta');
  await expect(
    page.getByRole('heading', { name: 'Entrar', exact: true }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Minha conta', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Conta de visitante', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText('Antes de usar um painel administrativo', { exact: false }),
  ).toHaveCount(0);
  const publicRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/rest/v1/places?'))
      publicRequests.push(request.headers().authorization);
  });
  await page.goto('/lugares');
  await expect(page.getByText('Nenhum resultado por aqui')).toBeVisible();
  expect(publicRequests.length).toBeGreaterThan(0);
  expect(
    publicRequests.every(
      (value) => value === 'Bearer sb_publishable_test_fixture_only',
    ),
  ).toBe(true);
  await page.goto('/conta');
  await page.getByRole('button', { name: 'Sair deste navegador' }).click();
  await expect(
    page.getByRole('heading', { name: 'Entrar', exact: true }),
  ).toBeVisible();
});
test('magic link is PKCE, creates no user, hides account existence and rejects external redirects', async ({
  page,
}) => {
  await authApi(page);
  let sent: Record<string, unknown> | null = null;
  await page.route('http://127.0.0.1:54399/auth/v1/otp?**', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({
      status: 400,
      json: { msg: 'Test-only unknown account' },
    });
  });
  await page.goto('/entrar?next=https%3A%2F%2Fevil.example');
  await page
    .getByRole('button', { name: 'Link por e-mail', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email);
  await page
    .getByRole('button', { name: 'Enviar link seguro', exact: true })
    .click();
  await expect(
    page.getByText('Se houver uma conta habilitada', { exact: false }),
  ).toBeVisible();
  expect(sent).not.toBeNull();
  expect(sent!.create_user).toBe(false);
  expect(sent!.code_challenge_method).toBe('s256');
  expect(typeof sent!.code_challenge).toBe('string');
  expect(sent).not.toHaveProperty('password');
  await page.goto(
    '/auth/confirmar?error=access_denied&next=//evil.example#access_token=fixture',
  );
  await expect(
    page.getByText('Link inválido ou expirado.', { exact: false }),
  ).toBeVisible();
  await expect(page).toHaveURL('http://127.0.0.1:5174/auth/confirmar');
});
test('password recovery requires a verified recovery exchange, not a crafted query parameter', async ({
  page,
}) => {
  await authApi(page);
  await page.route('http://127.0.0.1:54399/auth/v1/recover?**', (route) =>
    route.fulfill({ json: {} }),
  );
  await page.goto('/auth/nova-senha?type=recovery');
  await expect(
    page.getByText('Para alterar a senha, abra um link válido', {
      exact: false,
    }),
  ).toBeVisible();
  await page.goto('/recuperar-senha');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email);
  await page.getByRole('button', { name: 'Enviar link seguro' }).click();
  await expect(
    page.getByText('Se houver uma conta habilitada', { exact: false }),
  ).toBeVisible();
  await page.goto('/auth/confirmar?code=test-recovery-code');
  await expect(
    page.getByRole('heading', { name: 'Nova senha', exact: true }),
  ).toBeVisible();
  await page
    .getByLabel('Nova senha', { exact: true })
    .fill('NewFixturePassword123');
  await page
    .getByLabel('Confirme a nova senha', { exact: true })
    .fill('NewFixturePassword123');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(
    page.getByRole('heading', { name: 'Minha conta', exact: true }),
  ).toBeVisible();
});

test('authentication labels and tourist calendar support Spanish and English', async ({
  page,
}) => {
  await authApi(page);
  await page.goto('/entrar');
  await page
    .getByRole('combobox', { name: 'Idioma', exact: true })
    .selectOption('es');
  await expect(
    page.getByRole('button', { name: 'Enlace por correo', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible();
  await page.goto('/eventos');
  await expect(
    page.getByRole('heading', { name: 'Qué pasa por aquí' }),
  ).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Calendario mensual' }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Idioma', exact: true })
    .selectOption('en');
  await page.goto('/entrar');
  await expect(
    page.getByRole('heading', { name: 'Sign in', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Email link', exact: true }),
  ).toBeVisible();
});
