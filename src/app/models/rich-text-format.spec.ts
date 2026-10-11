import { sanitizeBlogHtml, sanitizePublishedHtml } from './blog-draft';
import { sanitizeLegalHtml } from '../terms/legal-html';

describe('Closed rich text vocabulary', () => {
  const normalize = (html: string): string => sanitizeBlogHtml(html, 'lab', document).html;
  it('converts editor styles and legacy font attributes to known classes only', () => {
    const input = '<p><span style="color:#c62828;font-family:Georgia;font-size:24px;background:url(https://bad.test);position:fixed">Hello</span><font face="Arial" size="5" color="red">Legacy</font></p>';
    for (const html of [normalize(input), sanitizeLegalHtml(input, document).html]) {
      expect(html).toContain('rt-color-red'); expect(html).toContain('rt-font-serif'); expect(html).toContain('rt-size-large');
      expect(html).toContain('rt-font-sans'); expect(html).not.toMatch(/style=|background|position|bad\.test|<font/);
    }
  });
  it('removes executable content, remote fonts, arbitrary classes and unsupported style values', () => {
    const input = '<p class="evil rt-font-mono" onclick="alert(1)" style="font-family:evil;font-size:9999px;color:var(--evil)">Visible<script>alert(1)</script><svg onload="alert(1)"></svg><a href="javascript:alert(1)">link</a></p>';
    for (const html of [normalize(input), sanitizeLegalHtml(input, document).html]) {
      expect(html).toContain('rt-font-mono'); expect(html).not.toMatch(/evil|style=|9999|onclick|script|svg|javascript:/);
    }
  });
  it('is idempotent for both policies and preserves formatting on published blog HTML', () => {
    const input = '<h4>Heading</h4><p><font size="5" face="Georgia" color="red">Rich</font></p>';
    const blog = normalize(input); expect(normalize(blog)).toBe(blog);
    const legal = sanitizeLegalHtml(input, document).html; expect(sanitizeLegalHtml(legal, document).html).toBe(legal);
    expect(sanitizePublishedHtml(blog, 'es-lab', 'v1', document)).toBe(blog);
    const aligned = normalize('<p style="text-align:center;font-family:Georgia">Aligned</p>');
    expect(normalize(aligned)).toBe(aligned);
  });
  it('does not broaden image policy or permit prototype names as formatting values', () => {
    const input = '<p><font size="__proto__" face="constructor">Text</font><img src="https://bad.test/x.png" onerror="alert(1)"></p>';
    expect(normalize(input)).toBe('<p><span>Text</span></p>');
    expect(sanitizeLegalHtml(input, document).html).toBe('<p><span>Text</span></p>');
  });
  it('fails closed on excessive blog depth and length', () => {
    expect(normalize('<span>'.repeat(90) + 'Deep' + '</span>'.repeat(90))).toBe('');
    expect(normalize('x'.repeat(200001))).toBe('');
  });
});
