
import { chooseResume, validPdf } from './resume';
import type { ResumeEntry } from './resume';

describe('Resume publication', () => {
  const es: ResumeEntry = { storagePath: 'resumes/es/example.pdf', fileName: 'cv.pdf', sizeBytes: 100, enabled: true };
  it('selects requested locale with other-language fallback', () => {
    expect(chooseResume({ es }, 'es')).toBe(es);
    expect(chooseResume({ es }, 'en')).toBe(es);
  });
  it('never offers disabled, unsafe, or oversized PDFs', () => {
    expect(chooseResume({ es: { ...es, enabled: false } }, 'es')).toBeUndefined();
    expect(chooseResume({ es: { ...es, storagePath: 'projects/a/file.pdf' } }, 'es')).toBeUndefined();
    expect(chooseResume({ es: { ...es, sizeBytes: 11 * 1024 * 1024 } }, 'es')).toBeUndefined();
  });
  it('checks MIME, extension and PDF signature', async () => {
    expect(await validPdf(new File(['%PDF-1.7 test'], 'cv.pdf', { type: 'application/pdf' }))).toBe(true);
    expect(await validPdf(new File(['not a PDF'], 'cv.pdf', { type: 'application/pdf' }))).toBe(false);
    expect(await validPdf(new File(['%PDF-1.7 test'], 'cv.html', { type: 'application/pdf' }))).toBe(false);
    expect(await validPdf(new File(['%PDF-1.7 test'], 'cv.pdf', { type: 'text/html' }))).toBe(false);
  });
  it('rejects mismatched locale metadata rather than silently calling an English file Spanish', () => {
    expect(chooseResume({ es: { ...es, storagePath: 'resumes/en/example.pdf' } }, 'es')).toBeUndefined();
    expect(chooseResume({ en: es }, 'en')).toBeUndefined();
    expect(chooseResume({ es: { ...es, sizeBytes: 1.5 } }, 'es')).toBeUndefined();
  });
});
