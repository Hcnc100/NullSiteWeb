import '@angular/compiler';
import '@analogjs/vitest-angular/setup-zone';
import '../styles.scss';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { vi } from 'vitest';

setupTestBed({ zoneless: false, errorOnUnknownElements: true, errorOnUnknownProperties: true });

// Jasmine restored native spies after each test; preserve that isolation in Vitest.
afterEach(() => { vi.restoreAllMocks(); });
