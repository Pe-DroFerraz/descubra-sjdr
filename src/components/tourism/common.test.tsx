// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
beforeEach(async () => {
  await i18n.changeLanguage('pt');
});
vi.mock('../../data/api', () => ({
  mediaUrl: () => '/test-only-missing.webp',
  CatalogUnavailable: class extends Error {},
}));
import { Photo, State } from './common';
afterEach(cleanup);
describe('honest catalog and photograph states', () => {
  it('replaces a failed photograph with an explicit placeholder, never an invented image', () => {
    render(<Photo path="fixture/missing.webp" alt="Test photograph" />);
    fireEvent.error(screen.getByRole('img', { name: 'Test photograph' }));
    expect(
      screen.getByRole('img', { name: 'Fotografia indisponível no momento' }),
    ).toBeTruthy();
    expect(document.querySelector('img')).toBeNull();
  });
  it('distinguishes an empty catalog, no filter results and a failed request', () => {
    const view = render(<State resource="places" empty />);
    expect(screen.getByText('Ainda não há locais publicados')).toBeTruthy();
    view.rerender(<State resource="places" empty filtered />);
    expect(
      screen.getByText('Nenhum resultado para estes filtros'),
    ).toBeTruthy();
    view.rerender(
      <State resource="places" empty error={new Error('test only')} />,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(
      screen.getByText('Não foi possível carregar os locais'),
    ).toBeTruthy();
    expect(screen.queryByText('Ainda não há locais publicados')).toBeNull();
  });
});
