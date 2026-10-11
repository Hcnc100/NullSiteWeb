import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import {NavbarComponent} from './navbar.component';
import { signal } from '@angular/core';
import { PublicBlogService } from '../../blog/public-blog.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: PublicBlogService, useValue: { enabled: signal(false) } }],
      imports: [NavbarComponent, RouterTestingModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('adds the public blog link only when enabled', () => {
    const blog = TestBed.inject(PublicBlogService);
    expect(component.listIdsSections).not.toContain('blog');
    blog.enabled.set(true); expect(component.listIdsSections).toContain('blog');
    blog.enabled.set(false); expect(component.listIdsSections).not.toContain('blog');
  });
});





