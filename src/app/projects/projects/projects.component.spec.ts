import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ProjectsService } from '../services/projects.service';
import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {ProjectsComponent} from './projects.component';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent, DialogModule],
      providers: [provideRouter([]), { provide: ProjectsService, useValue: {
        listProjects: signal([{ id: 'test', name: 'Test', description: '', urlImg: '', urlRepo: '', urlPlay: '', gallery: [] }]),
      } }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one page heading and opens a named modal with focus restoration', async () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    const trigger = fixture.nativeElement.querySelector('app-card-project') as HTMLElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const modal = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(modal).toBeTruthy();
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-labelledby')).toBe('project-dialog-title');
    expect(modal.contains(document.activeElement)).toBe(true);
    TestBed.inject(Dialog).closeAll();
    await fixture.whenStable();
    expect(document.activeElement).toBe(trigger);
  });
});









