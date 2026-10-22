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
