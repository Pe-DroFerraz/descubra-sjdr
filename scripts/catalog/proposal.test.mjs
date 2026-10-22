import { describe, expect, it } from 'vitest';
import data from '../../content/catalogo-inicial.json';
import { proposalSchema, proposalSql } from './proposal.mjs';
describe('review-only initial tourism catalog', () => {
  it('contains at least twenty sourced draft candidates and six linked routes', () => {
    expect(proposalSchema.safeParse(data).success).toBe(true);
    expect(data.places.length).toBeGreaterThanOrEqual(20);
  });
  it('never treats blocked primary sources as consulted or operating data as verified', () => {
    expect(
      data.blocked_primary_sources.every((s) => s.consulted === false),
    ).toBe(true);
    expect(
      data.places.every(
        (p) =>
          p.verified_at === null &&
          p.price_description === null &&
          p.status === 'draft' &&
          p.editorial.review_required,
      ),
    ).toBe(true);
    expect(data.events).toEqual([]);
    expect(data.photos).toEqual([]);
  });
  it('rejects publication and unresolved stop references', () => {
    const changed = globalThis.structuredClone(data);
    changed.places[0].status = 'published';
    expect(proposalSchema.safeParse(changed).success).toBe(false);
    const broken = globalThis.structuredClone(data);
    broken.routes[0].stops[0].place_id = '90000000-0000-4000-8000-000000000099';
    expect(proposalSchema.safeParse(broken).success).toBe(false);
  });
  it('emits SQL without overwrites or published content and safely quotes names', () => {
    const changed = globalThis.structuredClone(data);
    changed.places[0].name = "Casa d'Água";
    const sql = proposalSql(changed);
    expect(sql).toContain("Casa d''Água");
    expect(sql).toContain('on conflict(id) do nothing');
    expect(sql).not.toContain('do update');
    expect(sql).not.toContain("'published'");
  });
});

describe('official evidence supplied externally', () => {
  it('attributes all five external sources without claiming local access', () => {
    const official = data.sources.filter(
      (s) => s.kind === 'external-official-reference',
    );
    expect(official).toHaveLength(5);
    expect(
      official.every(
        (s) =>
          !s.consulted &&
          !s.accessed_here &&
          s.verification_origin === 'user_external_session',
      ),
    ).toBe(true);
    const changed = globalThis.structuredClone(data);
    changed.sources.find(
      (s) => s.kind === 'external-official-reference',
    ).consulted = true;
    expect(proposalSchema.safeParse(changed).success).toBe(false);
  });
  it('confirms only the supplied address and keeps divergent schedules unresolved', () => {
    const museum = data.places.find((p) => p.slug === 'museu-regional');
    expect(museum.address).toBe(
      'Rua Marechal Deodoro, 12, Centro, São João del-Rei, MG',
    );
    expect(
      data.places.filter(
        (p) => p.editorial.address_state === 'external-official-reference',
      ),
    ).toHaveLength(1);
    expect(museum.pending_fields).toContain('horarios');
    expect(
      museum.editorial.notes.some((n) => n.includes('Horários divergentes')),
    ).toBe(true);
  });
  it('persists every candidate reference and pending field in review-only SQL', () => {
    expect(
      data.places.every((p) => p.source_urls.length && p.pending_fields.length),
    ).toBe(true);
    expect(proposalSql(data)).toContain('source_urls,pending_fields');
    expect(proposalSql(data)).toContain('horarios');
    for (const route of data.routes)
      for (const stop of route.stops)
        expect(
          data.places.find((p) => p.id === stop.place_id).editorial
            .identity_state,
        ).toBe('external-official-reference');
    expect(
      data.routes.find((r) => r.slug === 'gastronomico').pending_fields,
    ).toContain('estabelecimentos_gastronomicos_verificados');
  });
});
