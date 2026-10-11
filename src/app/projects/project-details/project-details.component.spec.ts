import { vi } from 'vitest';
import { DIALOG_DATA, Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { provideRouter } from '@angular/router';
import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {ProjectDetailsComponent} from './project-details.component';
import { I18nService } from '../../i18n/i18n.service';

describe('ProjectDetailsComponent', () => {
  let component: ProjectDetailsComponent;
  let fixture: ComponentFixture<ProjectDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetailsComponent, DialogModule],
      providers: [
        provideRouter([]),
        { provide: DialogRef, useValue: { close: vi.fn().mockName('close') } },
        { provide: DIALOG_DATA, useValue: { id: 'test', name: 'Test', description: '', urlImg: '', urlRepo: '', urlPlay: '',
          gallery: ['https://example.invalid/one.png', 'javascript:alert(1)', 'https://example.invalid/two.png'],
          galleryItems: [{ url: 'https://example.invalid/one.png', alt: 'Pantalla de inicio', order: 0 }] } }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProjectDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses safe gallery URLs and descriptive labels', () => {
    fixture.detectChanges();
    expect(component.images.length).toBe(2);
    expect(component.images[0].alt).toBe('Pantalla de inicio');
    expect(component.images[1].alt).toContain('Test');
    expect(fixture.nativeElement.querySelectorAll('button.gallery-thumbnail').length).toBe(2);
  });

  it('opens a keyboard-accessible viewer and exposes a labelled close button', () => {
    fixture.detectChanges();
    const dialog = TestBed.inject(Dialog);
    const open = vi.spyOn(dialog, 'open');
    fixture.nativeElement.querySelector('button.gallery-thumbnail').click();
    expect(open).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
      ariaModal: true, restoreFocus: true, ariaLabelledBy: 'image-dialog-title',
    }));
    fixture.nativeElement.querySelector('button.close-dialog').click();
    expect(TestBed.inject(DialogRef).close).toHaveBeenCalled();
  });
  it('updates gallery descriptions when language changes without replacing the original viewer image', () => {
    const data = TestBed.inject(DIALOG_DATA);
    data.galleryItems[0].translations = { en: { alt: 'Home screen' }, es: { alt: 'Inicio' } };
    data.galleryItems[0].thumbnailUrl = 'https://example.invalid/small.png';
    TestBed.inject(I18nService).setLocale('en'); fixture.detectChanges();
    expect(component.images[0].alt).toBe('Home screen');
    expect(component.images[0].thumbnail).toContain('small.png'); expect(component.images[0].url).toContain('one.png');
    TestBed.inject(I18nService).setLocale('es'); fixture.detectChanges(); expect(component.images[0].alt).toBe('Inicio');
  });
});







