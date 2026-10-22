// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  onChange: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      getUser: mocks.getUser,
      onAuthStateChange: mocks.onChange,
      signOut: mocks.signOut,
    },
    rpc: mocks.rpc,
    from: mocks.from,
  },
}));
import { AuthProvider, useAuth } from './context';
const user = {
  id: '10000000-0000-4000-8000-000000000001',
  email: 'fixture@example.invalid',
  user_metadata: { role: 'admin' },
};
function Probe() {
  const auth = useAuth();
  return (
    <div>
      {auth.pending
        ? 'pending'
        : auth.error
          ? 'error'
          : auth.user
            ? auth.roles.join(',') || 'visitor'
            : 'signed-out'}
    </div>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: 'test-only-token', user } },
    error: null,
  });
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.onChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  mocks.rpc.mockResolvedValue({ data: false, error: null });
  const result = {
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    eq: vi.fn(),
  };
  result.eq.mockReturnValue(result);
  mocks.from.mockReturnValue({ select: () => result });
});
afterEach(cleanup);
describe('verified session and server permissions', () => {
  it('ignores editable metadata claiming administrator', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText('visitor')).toBeTruthy();
    expect(mocks.rpc).toHaveBeenCalledWith('has_role', { requested: 'admin' });
  });
  it('does not trust a stored session whose user cannot be verified', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { status: 401 },
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText('error')).toBeTruthy();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('accepts admin only after server verification', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText('admin')).toBeTruthy();
  });
  it('clears verified identity and roles on sign-out', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText('visitor');
    const callback = mocks.onChange.mock.calls[0][0];
    await act(async () => callback('SIGNED_OUT', null));
    await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
  });
});
