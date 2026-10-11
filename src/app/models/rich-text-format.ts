/** Closed presentation vocabulary. Never preserve user-supplied CSS. */
export function safeHexColor(value: string): string | null {
  const hex = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/.test(hex)) return '#' + [...hex.slice(1)].map(c => c + c).join('');
  const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(hex);
  if (!rgb || rgb.slice(1).some(v => Number(v) > 255)) return null;
  return '#' + rgb.slice(1).map(v => Number(v).toString(16).padStart(2, '0')).join('');
}
export function colorFromClass(value: string): string | null {
  return /^rt-color-hex-[0-9a-f]{6}$/.test(value) ? '#' + value.slice(-6) : null;
}
export function backgroundFromClass(value: string): string | null {
  return /^rt-background-hex-[0-9a-f]{6}$/.test(value) ? '#' + value.slice(-6) : null;
}
export const richStyles: Readonly<Record<string, string>> = {
  'rt-image-left': 'display: block; margin-inline-start: 0; margin-inline-end: auto',
  'rt-image-center': 'display: block; margin-inline: auto',
  'rt-image-right': 'display: block; margin-inline-start: auto; margin-inline-end: 0',
  'rt-color-red': 'color: #ff8585', 'rt-color-blue': 'color: #a9c7ff',
  'rt-color-green': 'color: #9cdbb1', 'rt-color-default': 'color: inherit',
  'rt-font-serif': 'font-family: Georgia, serif', 'rt-font-sans': 'font-family: Arial, sans-serif',
  'rt-font-mono': 'font-family: monospace',
  'rt-size-small': 'font-size: 0.875rem', 'rt-size-normal': 'font-size: 1rem',
  'rt-size-medium': 'font-size: 1.125rem', 'rt-size-large': 'font-size: 1.5rem',
  'rt-size-xlarge': 'font-size: 2rem',
  'rt-align-left': 'text-align: left', 'rt-align-center': 'text-align: center', 'rt-align-right': 'text-align: right',
};
export function richTextClasses(element: HTMLElement): string[] {
  const classes = (element.getAttribute('class') ?? '').split(/\s+/).filter(value => Object.prototype.hasOwnProperty.call(richStyles, value) || colorFromClass(value) !== null || backgroundFromClass(value) !== null);
  const style = element.style;
  const color = (style.color || element.getAttribute('color') || '').toLowerCase().replace(/\s/g, '');
  const colors: Record<string, string> = { red: 'red', '#c62828': 'red', '#ff8585': 'red', 'rgb(198,40,40)': 'red', 'rgb(255,133,133)': 'red',
    blue: 'blue', '#a9c7ff': 'blue', 'rgb(169,199,255)': 'blue', green: 'green', '#9cdbb1': 'green', 'rgb(156,219,177)': 'green', inherit: 'default' };
  if (Object.prototype.hasOwnProperty.call(colors, color)) classes.push('rt-color-' + colors[color]);
  else {
    const hex = safeHexColor(color);
    if (hex) classes.push('rt-color-hex-' + hex.slice(1));
  }
  const background = safeHexColor(style.backgroundColor);
  if (background) classes.push('rt-background-hex-' + background.slice(1));
  const font = (style.fontFamily || element.getAttribute('face') || '').toLowerCase().replace(/["']/g, '').replace(/\s/g, '');
  const fonts: Record<string, string> = { georgia: 'serif', 'georgia,serif': 'serif', arial: 'sans', 'arial,sans-serif': 'sans', monospace: 'mono' };
  if (Object.prototype.hasOwnProperty.call(fonts, font)) classes.push('rt-font-' + fonts[font]);
  const sizes: Record<string, string> = { '14px': 'small', '0.875rem': 'small', '16px': 'normal', '1rem': 'normal', '18px': 'medium', '1.125rem': 'medium',
    '24px': 'large', '1.5rem': 'large', '32px': 'xlarge', '2rem': 'xlarge' };
  const legacy: Record<string, string> = { '1': 'small', '2': 'small', '3': 'normal', '4': 'medium', '5': 'large', '6': 'xlarge', '7': 'xlarge' };
  const legacySize = element.getAttribute('size') ?? '';
  const size = sizes[style.fontSize] ?? (element.localName === 'font' && Object.prototype.hasOwnProperty.call(legacy, legacySize) ? legacy[legacySize] : undefined);
  if (size) classes.push('rt-size-' + size);
  // One token per category, later explicit formatting wins. Stable order makes normalization idempotent.
  const byCategory = new Map<string, string>();
  for (const value of classes) byCategory.set(value.split('-')[1], value);
  return [...byCategory.values()].sort();
}

/** Convert only our own fixed classes to editor styles for engines which parse inline formatting. */
export function richHtmlForEditor(html: string, document: Document): string {
  const template = document.createElement('template'); template.innerHTML = html;
  for (const element of Array.from(template.content.querySelectorAll<HTMLElement>('[class]'))) {
    const declarations = richTextClasses(element).map(value => colorFromClass(value) ? 'color: ' + colorFromClass(value) : backgroundFromClass(value) ? 'background-color: ' + backgroundFromClass(value) : richStyles[value]);
    if (declarations.length) element.setAttribute('style', declarations.join('; '));
  }
  return template.innerHTML;
}
