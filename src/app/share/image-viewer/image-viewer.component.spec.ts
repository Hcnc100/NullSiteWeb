import { vi } from 'vitest';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ImageViewerComponent } from './image-viewer.component';

describe('ImageViewerComponent', () => {
  const data = { title: 'Galería', index: 0, images: [
    { url: 'https://example.invalid/one.png', alt: 'Inicio' },
    { url: 'https://example.invalid/two.png', alt: 'Detalle' },
  ] };

  beforeEach(() => TestBed.configureTestingModule({
    imports: [ImageViewerComponent],
    providers: [provideRouter([]), { provide: DIALOG_DATA, useValue: data },
      { provide: DialogRef, useValue: { close: vi.fn().mockName('close') } }],
  }));

  it('announces image descriptions, respects bounds and can close with a button', () => {
    const fixture = TestBed.createComponent(ImageViewerComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').alt).toBe('Inicio');
    expect(fixture.nativeElement.querySelector('nav button').disabled).toBe(true);
    fixture.componentInstance.move(-1);
    expect(fixture.componentInstance.index()).toBe(0);
    fixture.componentInstance.move(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').alt).toBe('Detalle');
    expect(fixture.nativeElement.querySelector('figcaption').textContent).toContain('2 / 2');
    fixture.componentInstance.move(1);
    expect(fixture.componentInstance.index()).toBe(1);
    fixture.nativeElement.querySelector('button.close-dialog').click();
    expect(TestBed.inject(DialogRef).close).toHaveBeenCalled();
  });

  it('handles an empty gallery without invalid navigation', () => {
    TestBed.overrideProvider(DIALOG_DATA, { useValue: { title: 'Vacía', images: [], index: -1 } });
    const fixture = TestBed.createComponent(ImageViewerComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    fixture.componentInstance.move(1);
    expect(fixture.componentInstance.index()).toBe(0);
  });
});
