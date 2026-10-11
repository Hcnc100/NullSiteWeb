import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {CardProjectComponent} from './card-project.component';

describe('CardProjectComponent', () => {
  let component: CardProjectComponent;
  let fixture: ComponentFixture<CardProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardProjectComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CardProjectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('uses a translated cover description and falls back to original if its thumbnail fails', () => {
    fixture.componentRef.setInput('project', { id: 'p', name: 'App', description: '', urlImg: 'https://example.invalid/full.png',
      thumbnailUrl: 'https://example.invalid/small.png', coverAlt: 'Portada', translations: { en: { coverAlt: 'Cover' } }, gallery: [] });
    component.i18n.setLocale('en'); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').alt).toBe('Cover');
    expect(component.imageSource()).toContain('small.png'); component.imageError();
    expect(component.imageSource()).toContain('full.png'); component.i18n.setLocale('es');
  });
});





