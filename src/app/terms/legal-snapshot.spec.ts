import { readLegalSnapshot } from './legal-snapshot';

describe('Legal snapshot availability', () => {
  it('does not turn an empty/offline local cache into a false 404', () => {
    expect(readLegalSnapshot({ exists: false, fromCache: true, data: undefined })).toBeUndefined();
  });
  it('reports not-found only after a server-confirmed missing snapshot', () => {
    expect(readLegalSnapshot({ exists: false, fromCache: false, data: undefined })).toBeNull();
  });
  it('accepts complete cached or server documents without changing their fields', () => {
    const data = { title: 'App', content: '<p>Policy</p>' };
    for (const fromCache of [true, false]) {
      expect(readLegalSnapshot({ exists: true, fromCache, data })).toEqual(data);
    }
  });
  it('rejects malformed existing data instead of pretending the document is absent', () => {
    for (const data of [undefined, null, {}, { title: 'App', content: {} }]) {
      expect(() => readLegalSnapshot({ exists: true, fromCache: false, data })).toThrowError(new Error("Invalid legal document"));
    }
  });
});
