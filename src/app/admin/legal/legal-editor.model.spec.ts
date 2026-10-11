
import { assertLegalSize, draftValue, legalContent, legalId, sameDraft, sameTerms } from './legal-editor.model';

describe('Legal editor contract', () => {
  const value = { title: 'Title', content: '<h2>Section</h2><p>Body</p>' };
  it('normalizes unsafe HTML and trims a valid title', () => {
    expect(legalContent({ title: ' Title ', content: '<p onclick="evil()">Body</p><script>bad()</script>' }, document))
      .toEqual({ title: 'Title', content: '<p>Body</p>' });
  });
  it('rejects empty, overlong and control-character titles and active-only content', () => {
    for (const title of ['', ' ', 'x'.repeat(181), 'Title\nInjected']) expect(() => legalContent({ ...value, title }, document)).toThrow();
    expect(() => legalContent({ ...value, content: '<img src="https://example.com">' }, document)).toThrow();
  });
  it('only accepts stable path-safe IDs', () => {
    expect(legalId('BvAnIKuobmk5fScuWh5Y')).toBe(true);
    for (const id of ['', '../terms', 'x/y', 'x'.repeat(101)]) expect(legalId(id)).toBe(false);
  });
  it('detects mobile edits even without a web revision', () => {
    expect(sameTerms(value, { ...value, content: '<p>Mobile edit</p>' })).toBe(false);
    expect(sameTerms(null, value)).toBe(false); expect(sameTerms(null, null)).toBe(true);
  });
  it('detects concurrent draft and publication changes', () => {
    const a = { id: 'legal', ...value, base: value, revision: 2, publishedRevision: 1 };
    expect(sameDraft(a, { ...a })).toBe(true);
    expect(sameDraft(a, { ...a, revision: 3 })).toBe(false);
    expect(sameDraft(a, { ...a, publishedRevision: 2 })).toBe(false);
    expect(sameDraft(a, { ...a, base: null })).toBe(false);
  });
  it('fails closed on malformed persisted drafts', () => {
    const a = { ...value, base: null, revision: 1, publishedRevision: 0 };
    expect(draftValue('legal', a).base).toBeNull();
    for (const change of [{ revision: 0 }, { publishedRevision: 2 }, { base: {} }, { content: 3 }, { revision: 1.1 }]) {
      expect(() => draftValue('legal', { ...a, ...change })).toThrow();
    }
  });
  it('bounds UTF-8 payload size before Firestore writes', () => {
    expect(() => assertLegalSize({ content: '漢'.repeat(310000) })).toThrowError(new Error("legal-size"));
    expect(() => assertLegalSize(value)).not.toThrow();
  });
});
