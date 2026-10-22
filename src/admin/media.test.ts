// @vitest-environment jsdom
import { Blob, File } from 'node:buffer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
}));
vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  adminClient: vi.fn(async () => ({
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
    from: () => ({ insert: mocks.insert }),
  })),
}));
import { imageType, prepareImage, rightsSchema, uploadMedia } from './media';
const target = {
  id: '10000000-0000-4000-8000-000000000001',
  updated_at: '2026-10-22T12:00:00Z',
};
const rights = {
  license: 'own-authorized' as const,
  author: 'Test fixture',
  source: '',
  confirmed: true as const,
};
const png = new File(
  [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])],
  'fixture.png',
  { type: 'image/png' },
);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.select.mockResolvedValue({ data: null, error: { code: '23503' } });
  mocks.insert.mockReturnValue({ select: mocks.select });
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 10, height: 10, close: vi.fn() })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback) =>
      callback(
        new Blob(['test'], {
          type: 'image/webp',
        }) as unknown as globalThis.Blob,
      ),
  );
});
describe('licensed images and compensation', () => {
  it('rejects executable SVG disguised as an image', () => {
    expect(() =>
      imageType(new TextEncoder().encode('<svg onload="alert(1)">')),
    ).toThrow();
  });
  it('requires explicit rights and a source for public domain/CC0', () => {
    expect(
      rightsSchema.safeParse({ ...rights, confirmed: false }).success,
    ).toBe(false);
    expect(rightsSchema.safeParse({ ...rights, license: 'cc0' }).success).toBe(
      false,
    );
    expect(
      rightsSchema.safeParse({
        ...rights,
        license: 'cc0',
        source: 'https://example.invalid/license',
      }).success,
    ).toBe(true);
    expect(
      rightsSchema.safeParse({ ...rights, license: 'cc-by-4.0' }).success,
    ).toBe(false);
  });
  it('rejects oversized files before decoding', async () => {
    await expect(
      prepareImage({ size: 5 * 1024 * 1024 + 1 } as globalThis.File),
    ).rejects.toMatchObject({ key: 'imageSize' });
    expect(createImageBitmap).not.toHaveBeenCalled();
  });
  it('removes an uploaded object if its database link fails', async () => {
    await expect(
      uploadMedia(
        target,
        'place-photos',
        png as unknown as globalThis.File,
        rights,
        'Test',
        0,
      ),
    ).rejects.toMatchObject({ key: 'referenced' });
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.remove).toHaveBeenCalledWith([
      expect.stringMatching(
        new RegExp('^' + target.id + '/[a-f0-9-]+\\.webp$'),
      ),
    ]);
    expect(mocks.upload.mock.calls[0][2]).toMatchObject({
      upsert: false,
      contentType: 'image/webp',
      metadata: { license: 'own-authorized', rights_confirmed: true },
    });
  });
  it('reports a cleanup failure rather than silently hiding a public orphan', async () => {
    mocks.remove.mockResolvedValue({ error: { status: 500 } });
    await expect(
      uploadMedia(
        target,
        'place-photos',
        png as unknown as globalThis.File,
        rights,
        'Test',
        0,
      ),
    ).rejects.toMatchObject({
      key: 'orphanUpload',
      cleanupPath: expect.stringContaining(target.id),
    });
  });
  it('does not delete a potentially linked object after an uncertain database response', async () => {
    mocks.select.mockResolvedValue({
      data: null,
      error: { message: 'Network response lost', code: '' },
    });
    await expect(
      uploadMedia(
        target,
        'place-photos',
        png as unknown as globalThis.File,
        rights,
        'Test',
        0,
      ),
    ).rejects.toMatchObject({
      key: 'uncertainUpload',
      cleanupPath: expect.stringContaining(target.id),
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('reports the generated path after an upload response is lost without writing a database link', async () => {
    mocks.upload.mockResolvedValue({
      error: { message: 'Network response lost' },
    });
    await expect(
      uploadMedia(
        target,
        'place-photos',
        png as unknown as globalThis.File,
        rights,
        'Test',
        0,
      ),
    ).rejects.toMatchObject({
      key: 'uploadError',
      cleanupPath: expect.stringContaining(target.id),
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
