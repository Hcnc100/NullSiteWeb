import { LEGAL_HTML_LIMITS, legalHref, sanitizeLegalHtml } from './legal-html';

describe('Legal HTML boundary', () => {
  const parse = (html: unknown): HTMLElement => {
    const root = document.createElement('div');
    root.innerHTML = sanitizeLegalHtml(html, document).html;
    return root;
  };

  it('preserves document text, lists and dates while normalizing the supplied H1', () => {
    const result = sanitizeLegalHtml('<article><header><h1>Privacy</h1></header><p>First <strong>clause</strong>.</p>'
      + '<h2>Contact</h2><ul><li>One</li></ul><time datetime="2026-10-10">October 10</time></article>', document);
    const root = parse(result.html);
    expect(root.querySelector('h1')).toBeNull();
    expect(root.querySelectorAll('h2').length).toBe(2);
    expect(root.querySelector('strong')?.textContent).toBe('clause');
    expect(root.querySelector('li')?.textContent).toBe('One');
    expect(root.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-10');
    expect(result.headings.map(item => item.id)).toEqual(['legal-section-1', 'legal-section-2']);
  });

  it('removes active content and resource-bearing elements, including namespaced content', () => {
    const root = parse('<p>Keep</p><script>alert(1)</script><style>body{display:none}</style>'
      + '<iframe src="https://example.invalid"></iframe><img src="https://example.invalid/pixel">'
      + '<svg><a href="javascript:alert(1)">SVG</a></svg><math><mtext>Math</mtext></math>'
      + '<base href="https://example.invalid"><link rel="stylesheet" href="https://example.invalid/x.css">'
      + '<form><input autofocus><button>Submit</button></form><template><img src="x"></template>');
    expect(root.textContent).toBe('Keep');
    expect(root.querySelector('script,style,iframe,img,svg,math,base,link,form,input,button,template')).toBeNull();
  });

  it('drops event handlers, foreign classes, hidden attributes and DOM-clobbering IDs/names', () => {
    const root = parse('<div id="main-content" name="location" class="legal-note navbar" hidden aria-hidden="true" '
      + 'onclick="alert(1)" tabindex="0"><p onmouseover="alert(2)">Visible clause</p></div>');
    const block = root.querySelector('div')!;
    expect(block.className).toBe('legal-note');
    expect(Array.from(block.attributes).map(attribute => attribute.name)).toEqual(['class']);
    expect(root.querySelector('p')?.attributes.length).toBe(0);
    expect(root.textContent).toBe('Visible clause');
  });

  it('maps only safe visual properties to explicit classes and never retains supplied CSS', () => {
    const root = parse('<p style="text-align:center;font-weight:700;font-style:italic;position:fixed;'
      + 'z-index:99999;color:transparent;background:url(https://example.invalid/pixel);font-size:0">Clause</p>');
    const paragraph = root.querySelector('p')!;
    expect(paragraph.hasAttribute('style')).toBe(false);
    expect(paragraph.className.split(' ')).toEqual(['legal-align-center', 'legal-strong', 'legal-emphasis']);
    expect(paragraph.textContent).toBe('Clause');
  });

  it('preserves approved callouts and normalizes pasted Word markup without losing safe text', () => {
    const root = parse('<div class="legal-warning"><p class="MsoNormal" style="font-family:Calibri">'
      + '<span lang="EN" style="color:red">Important <b>clause</b></span></p></div>');
    expect(root.querySelector('.legal-warning')).toBeTruthy();
    expect(root.querySelector('[style],.MsoNormal')).toBeNull();
    expect(root.querySelector('span')?.getAttribute('lang')).toBe('en');
    expect(root.textContent).toBe('Important clause');
  });

  it('supports HTTPS and plain mailto links with safe target/rel', () => {
    const root = parse('<a href="https://example.com/policy" target="_blank">Policy</a>'
      + '<a href="mailto:privacy+web@example.com">Email</a>');
    const links = root.querySelectorAll('a');
    expect(links[0].getAttribute('href')).toBe('https://example.com/policy');
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[0].getAttribute('target')).toBe('_blank');
    expect(links[1].getAttribute('href')).toBe('mailto:privacy+web@example.com');
  });

  for (const href of ['javascript:alert(1)', 'data:text/html,x', 'http://example.com', '//example.com',
    'https://user:password@example.com', 'https://example.com/\npolicy',
    'mailto:user@example.com?bcc=other@example.com', 'mailto:user?subject=x@example.com',
    'mailto:user%0d%0a@example.com', 'mailto:user#fragment@example.com']) {
    it(`rejects an unsafe or unsupported link: ${href.replace(/\n/g, '\\n')}`, () => {
      expect(legalHref(href)).toBeNull();
    });
  }

  it('decodes HTML entities before rejecting obfuscated protocols and preserves link text', () => {
    const root = parse('<a href="java&#x73;cript:alert(1)" target="_blank">Contact text</a>');
    expect(root.querySelector('a')?.hasAttribute('href')).toBe(false);
    expect(root.querySelector('a')?.hasAttribute('target')).toBe(false);
    expect(root.textContent).toBe('Contact text');
  });

  it('keeps table captions, headers and bounded spans without preserving width/style attributes', () => {
    const root = parse('<table width="9999"><caption>Data use</caption><tr><th scope="col">Data</th>'
      + '<th scope="col">Purpose</th></tr><tr><td colspan="2" rowspan="9999">Example</td></tr></table>');
    expect(root.querySelector('caption')?.textContent).toBe('Data use');
    expect(root.querySelector('th')?.getAttribute('scope')).toBe('col');
    expect(root.querySelector('td')?.getAttribute('colspan')).toBe('2');
    expect(root.querySelector('td')?.hasAttribute('rowspan')).toBe(false);
    expect(root.querySelector('table')?.hasAttribute('width')).toBe(false);
  });

  it('is idempotent, including tables and mapped styles, for future save/preview cycles', () => {
    const first = sanitizeLegalHtml('<h1>Policy</h1><p style="text-align:center">Text</p>'
      + '<a href="https://example.com">Link</a><table><tr><td>Data</td></tr></table>', document);
    const second = sanitizeLegalHtml(first.html, document);
    expect(second.html).toBe(first.html);
    expect(second.changed).toBe(false);
    expect(second.headings).toEqual(first.headings);
  });

  it('assigns unique stable anchors and ignores supplied IDs, including duplicate titles', () => {
    const result = sanitizeLegalHtml('<h2 id="location">Same</h2><h2 id="location">Same</h2>', document, 'preview');
    expect(result.headings.map(item => item.id)).toEqual(['preview-section-1', 'preview-section-2']);
    expect(result.html).not.toContain('id=');
  });

  it('normalizes skipped heading levels and bounds index labels without truncating body text', () => {
    const label = 'x'.repeat(300);
    const result = sanitizeLegalHtml(`<h4>First</h4><h6>${label}</h6><h2>Next</h2>`, document);
    expect(result.headings.map(item => item.level)).toEqual([2, 3, 2]);
    expect(result.headings[1].text.length).toBeLessThanOrEqual(200);
    expect(result.html).toContain(label);
    expect(sanitizeLegalHtml(result.html, document).html).toBe(result.html);
  });

  it('normalizes malformed HTML, leaves Angular syntax inert and does not trust a supplied prefix', () => {
    const result = sanitizeLegalHtml('<p>One <b>two<p>{{constructor.constructor("alert(1)")()}}', document, 'x" onclick="bad');
    expect(result.rejected).toBeNull();
    expect(result.html).toContain('{{constructor.constructor');
    expect(parse(result.html).textContent).toContain('One two');
  });

  it('fails closed on invalid/empty content rather than inventing a legal document', () => {
    for (const value of [null, undefined, {}, '', '<script>alert(1)</script>', '<p> </p>']) {
      expect(sanitizeLegalHtml(value, document).rejected).toBe('invalid-content');
    }
  });

  it('rejects excessive size without rendering a truncated version', () => {
    const result = sanitizeLegalHtml('x'.repeat(LEGAL_HTML_LIMITS.characters + 1), document);
    expect(result.rejected).toBe('too-long');
    expect(result.html).toBe('');
    expect(result.headings).toEqual([]);
  });

  it('rejects excessive nesting, node count and heading count without partial output', () => {
    for (const html of [
      '<div>'.repeat(LEGAL_HTML_LIMITS.depth + 2) + 'Clause' + '</div>'.repeat(LEGAL_HTML_LIMITS.depth + 2),
      '<span></span>'.repeat(LEGAL_HTML_LIMITS.nodes + 1),
      '<h2>Heading</h2>'.repeat(LEGAL_HTML_LIMITS.headings + 1),
    ]) {
      const result = sanitizeLegalHtml(html, document);
      expect(result.rejected).toBe('too-complex');
      expect(result.html).toBe('');
    }
  });
});
