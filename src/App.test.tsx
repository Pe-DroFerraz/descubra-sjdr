import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import './i18n';
import App from './App';
afterEach(() => vi.unstubAllGlobals());
describe('stage 0 scaffold', () => {
  it('renders home without Supabase keys and identifies unfinished content', () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    const html = renderToString(<MemoryRouter><App /></MemoryRouter>);
    expect(html).toContain('Descubra');
    expect(html).toContain('Conteúdo em construção');
    expect(html).toContain('Privacidade');
    expect(html).toContain('href="/lugares"');
  });
  it.each(['/mapa', '/eventos', '/q/demo'])('does not present unfinished %s as operational', (path) => {
    vi.stubGlobal('localStorage', { getItem: () => 'ok' });
    const html = renderToString(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
    expect(html).toContain('Módulo ainda não publicado');
    expect(html).not.toContain('role="dialog"');
  });
});
