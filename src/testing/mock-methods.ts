import { vi } from 'vitest';
import type { Mocked } from 'vitest';

/** Typed partial service double: only the methods explicitly used by a spec are provided. */
export function mockMethods<T extends object>(label: string, methods: readonly (keyof T)[]): Mocked<T> {
  return Object.fromEntries(methods.map(method => [method, vi.fn().mockName(`${label}.${String(method)}`)])) as Mocked<T>;
}
