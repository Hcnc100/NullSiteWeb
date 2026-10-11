import { vi } from 'vitest';
import type { Mock, Mocked } from 'vitest';
import { mockMethods } from 'src/testing/mock-methods';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AdminResumeComponent } from './admin-resume.component';
import { AdminResumeService } from './admin-resume.service';
import { AdminAuthService } from '../auth/admin-auth.service';

describe('Resume editor', () => {
  let service: Mocked<AdminResumeService>;
  beforeEach(async () => {
    service = mockMethods('resume', ['load', 'publish', 'withdraw']);
    service.load.mockResolvedValue({}); service.publish.mockResolvedValue();
    await TestBed.configureTestingModule({ imports: [AdminResumeComponent], providers: [provideRouter([]),
      { provide: AdminResumeService, useValue: service },
      { provide: AdminAuthService, useValue: { isAdmin: signal(true), access: () => 'admin' } },
    ] }).compileComponents();
  });
  async function setup(): Promise<AdminResumeComponent> {
    const fixture = TestBed.createComponent(AdminResumeComponent);
    fixture.detectChanges(); await fixture.whenStable(); return fixture.componentInstance;
  }
  it('starts without a fabricated published PDF', async () => {
    const component = await setup(); expect(component.settings()).toEqual({});
    expect(component.hasUnsavedChanges()).toBe(false);
  });
  it('does not accidentally reuse a selected PDF under another language', async () => {
    const component = await setup(); component.file.set(new File(['%PDF-test'], 'cv.pdf'));
    vi.spyOn(window, 'confirm').mockReturnValue(false); component.setLocale('en');
    expect(component.locale()).toBe('es'); expect(component.file()).not.toBeNull();
    (window.confirm as Mock).mockReturnValue(true); component.setLocale('en');
    expect(component.file()).toBeNull(); expect(component.locale()).toBe('en');
  });
  it('retains selected PDF on failed publication', async () => {
    const component = await setup(); component.file.set(new File(['%PDF-test'], 'cv.pdf'));
    vi.spyOn(window, 'confirm').mockReturnValue(true); service.publish.mockRejectedValue(new Error('content-conflict'));
    await component.publish(); expect(component.hasUnsavedChanges()).toBe(true);
    expect(component.error()).toContain('otro dispositivo');
  });
});
