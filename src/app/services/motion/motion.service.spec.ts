import { vi } from 'vitest';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { MotionService } from './motion.service';

describe('MotionService', () => {
  it('tracks reduced motion and removes its listener on destruction', () => {
    let listener: ((event: { matches: boolean }) => void) | undefined;
    const remove = vi.fn().mockName('removeEventListener');
    const query = { matches: true, addEventListener: (_: string, callback: typeof listener) => { listener = callback; }, removeEventListener: remove };
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { defaultView: { matchMedia: () => query } } }] });
    const service = TestBed.inject(MotionService);
    expect(service.reduced()).toBe(true);
    listener?.({ matches: false });
    expect(service.reduced()).toBe(false);
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledWith('change', listener);
  });
});
