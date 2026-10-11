import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {ImgDetailsProjectComponent} from './img-details-project.component';

describe('ImgProjectComponent', () => {
  let component: ImgDetailsProjectComponent;
  let fixture: ComponentFixture<ImgDetailsProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImgDetailsProjectComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ImgDetailsProjectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('uses the original screenshot if the lightweight thumbnail is unavailable', () => {
    fixture.componentRef.setInput('urlImgProject', 'https://example.invalid/small.png');
    fixture.componentRef.setInput('originalUrl', 'https://example.invalid/full.png'); fixture.componentRef.setInput('indexScreenshots', 0);
    expect(component.source()).toContain('small.png'); component.imageError(); expect(component.source()).toContain('full.png');
  });
});





