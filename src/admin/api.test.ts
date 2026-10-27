import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  role: vi.fn(),
  from: vi.fn(),
}));
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getUser: mocks.user },
    rpc: mocks.role,
    from: mocks.from,
  },
}));
import { adminClient, saveContent, deleteContent, saveStops } from './api';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({
    data: {
      user: {
        id: '10000000-0000-4000-8000-000000000001',
        user_metadata: { role: 'admin' },
      },
    },
    error: null,
  });
  mocks.role.mockResolvedValue({ data: true, error: null });
});
describe('server-verified management operations', () => {
  it('rejects editable metadata and never requests a content table without server admin role', async () => {
    mocks.role.mockResolvedValue({ data: false, error: null });
    await expect(adminClient()).rejects.toMatchObject({ key: 'forbidden' });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('fails closed when Auth cannot validate the user', async () => {
    mocks.user.mockResolvedValue({
      data: { user: null },
      error: { status: 401 },
    });
    await expect(adminClient()).rejects.toMatchObject({ key: 'forbidden' });
    expect(mocks.role).not.toHaveBeenCalled();
  });
  it('uses an optimistic version condition and reports zero affected rows as conflict', async () => {
    const query = {
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    mocks.from.mockReturnValue({ update: () => query });
    const row = {
      id: '10000000-0000-4000-8000-000000000002',
      updated_at: '2026-10-22T12:00:00Z',
    };
    await expect(
      saveContent(
        'categories',
        { name: 'Updated', slug: 'updated', published: false },
        row,
      ),
    ).rejects.toMatchObject({ key: 'conflict' });
    expect(query.eq).toHaveBeenCalledWith('updated_at', row.updated_at);
  });
  it('blocks parent deletion before leaving public image objects behind', async () => {
    const query = { eq: vi.fn().mockResolvedValue({ count: 1, error: null }) };
    mocks.from.mockReturnValue({ select: () => query });
    await expect(
      deleteContent('places', {
        id: '10000000-0000-4000-8000-000000000002',
        updated_at: '2026-10-22T12:00:00Z',
      }),
    ).rejects.toMatchObject({ key: 'removePhotosFirst' });
  });
});

it('keeps the complete PostgreSQL microsecond version when saving stops', async () => {
  const version = '2026-10-27T12:00:00.123456+00:00';
  const route = {
    id: '10000000-0000-4000-8000-000000000002',
    updated_at: version,
  };
  await saveStops(route, []);
  expect(mocks.role).toHaveBeenCalledWith('admin_set_route_stops', {
    target_route: route.id,
    expected_updated_at: version,
    stops: [],
  });
});
