// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from './i18n';
import App from './App';
function app(path = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(async () => {
  localStorage.clear();
  vi.stubGlobal('scrollTo', vi.fn());
  await i18n.changeLanguage('pt');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe('tourist application without Cloud configuration', () => {
  it('renders the home without inventing a live catalog', async () => {
    app();
    // A cold lazy import can exceed Testing Library's 1 s default under CI load.
    await screen.findByRole(
      'heading',
      { name: /Uma cidade para sentir/ },
      { timeout: 3000 },
    );
    expect(await screen.findByRole('link', { name: /Monte sua viagem/ })).toBeTruthy();
    expect(await screen.findByRole('heading', { name: /Seus próximos dias/ })).toBeTruthy();
    expect(screen.queryByText(/DEMONSTRAÇÃO/)).toBeNull();
  });
  it('provides an honest configuration error instead of sample places', async () => {
    app('/lugares');
    await screen.findAllByText('Este conteúdo ainda não está disponível');
    expect(screen.queryByRole('article')).toBeNull();
  });
  it('supports empty favorites without requiring Supabase', async () => {
    app('/favoritos');
    expect(
      await screen.findByText('Sua próxima viagem começa com uma descoberta'),
    ).toBeTruthy();
  });
  it('keeps navigation usable when browser storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage blocked');
    });
    app('/favoritos');
    expect(
      await screen.findByText('Sua próxima viagem começa com uma descoberta'),
    ).toBeTruthy();
  });
  it('handles unknown routes', async () => {
    app('/nao-existe');
    expect(
      await screen.findByRole('heading', {
        name: 'Não encontramos esta página',
      }),
    ).toBeTruthy();
  });
});
