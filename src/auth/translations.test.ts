import { describe, expect, it } from 'vitest';
import i18n from '../i18n';
function keys(value: unknown, prefix = ''): string[] {
  return typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([name, child]) =>
        keys(child, `${prefix}${name}.`),
      )
    : [prefix.slice(0, -1)];
}
describe('all interface and authentication translations', () => {
  it.each(['en', 'es'])('keeps %s labels complete', (language) =>
    expect(
      keys(i18n.getResourceBundle(language, 'translation')).sort(),
    ).toEqual(keys(i18n.getResourceBundle('pt', 'translation')).sort()),
  );
});
