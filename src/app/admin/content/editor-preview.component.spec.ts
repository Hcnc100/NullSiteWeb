import { TestBed } from '@angular/core/testing';
import { EditorPreviewComponent } from './editor-preview.component';

describe('Editor preview', () => {
  it('updates draft text and images without interpreting HTML', () => {
    const fixture = TestBed.createComponent(EditorPreviewComponent);
    fixture.componentRef.setInput('title', 'Draft');
    fixture.componentRef.setInput('image', 'https://example.com/cover.png');
    fixture.componentRef.setInput('description', '<script>alert(1)</script>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h3').textContent).toBe('Draft');
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('https://example.com/cover.png');
    fixture.componentRef.setInput('title', 'Changed');
    fixture.componentRef.setInput('image', 'javascript:alert(1)');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h3').textContent).toBe('Changed');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
});
