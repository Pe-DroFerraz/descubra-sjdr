import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ exchange: vi.fn() }));
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { exchangeCodeForSession: mocks.exchange } },
}));
import { exchangeCodeOnce } from './callback';
beforeEach(() => {
  mocks.exchange.mockReset();
});
describe('PKCE callback', () => {
  it('exchanges a code only once across overlapping StrictMode effects', async () => {
    let finish: (value: unknown) => void = () => {};
    mocks.exchange.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const a = exchangeCodeOnce('strict-fixture'),
      b = exchangeCodeOnce('strict-fixture');
    expect(a).toBe(b);
    finish({ data: { session: {}, redirectType: null }, error: null });
    await expect(a).resolves.toEqual({ recovery: false });
    expect(mocks.exchange).toHaveBeenCalledTimes(1);
  });
  it('takes recovery context from the SDK exchange, not URL metadata', async () => {
    mocks.exchange.mockResolvedValue({
      data: { session: {}, redirectType: 'recovery' },
      error: null,
    });
    await expect(exchangeCodeOnce('recovery-fixture')).resolves.toEqual({
      recovery: true,
    });
  });
  it('fails closed on rejected codes', async () => {
    mocks.exchange.mockResolvedValue({
      data: { session: null },
      error: { message: 'fixture' },
    });
    await expect(exchangeCodeOnce('bad-fixture')).rejects.toThrow(
      'Callback rejected',
    );
  });
});
