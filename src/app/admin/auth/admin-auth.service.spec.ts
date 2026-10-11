import { vi } from 'vitest';
import type { Mock, Mocked } from 'vitest';
import { mockMethods } from 'src/testing/mock-methods';
import { TestBed } from '@angular/core/testing';
import type { User } from 'firebase/auth';
import { ADMIN_AUTH_API, AdminAuthService } from './admin-auth.service';
import type { AdminAuthApi } from './admin-auth.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let next: (user: User | null) => void;
  let fail: () => void;
  let api: Mocked<AdminAuthApi>;
  let unsubscribe: Mock;
  const user = { uid: 'same-mobile-uid', email: 'admin@example.com' } as User;

  beforeEach(() => {
    unsubscribe = vi.fn().mockName('unsubscribe');
    api = mockMethods<AdminAuthApi>('api', ['observe', 'login', 'logout', 'claims']);
    api.observe.mockImplementation((onNext, onError) => { next = onNext; fail = onError; return unsubscribe; });
    api.claims.mockReturnValue(Promise.resolve({ admin: true }));
    api.login.mockReturnValue(Promise.resolve(user));
    api.logout.mockReturnValue(Promise.resolve());
    TestBed.configureTestingModule({ providers: [{ provide: ADMIN_AUTH_API, useValue: api }] });
    service = TestBed.inject(AdminAuthService);
  });

  it('starts unresolved without exposing user or admin controls', () => {
    expect(service.access()).toBe('loading');
    expect(service.user()).toBeNull();
    expect(service.isAdmin()).toBe(false);
  });

  it('waits for the initial session rather than redirecting prematurely', async () => {
    let ready = false;
    const promise = service.whenReady().then(() => { ready = true; });
    await Promise.resolve();
    expect(ready).toBe(false);
    next(null);
    await promise;
    expect(service.access()).toBe('anonymous');
  });

  it('uses the returned Firebase UID and requires boolean admin true', async () => {
    next(user);
    expect(await service.whenReady()).toBe('admin');
    expect(service.user()?.uid).toBe('same-mobile-uid');
  });

  it('rejects a normal authenticated account', async () => {
    api.claims.mockReturnValue(Promise.resolve({}));
    next(user);
    expect(await service.whenReady()).toBe('forbidden');
    expect(service.isAdmin()).toBe(false);
  });

  it('does not accept a string or email as administrative authorization', async () => {
    api.claims.mockReturnValue(Promise.resolve({ admin: 'true' }));
    next(user);
    expect(await service.whenReady()).toBe('forbidden');
  });

  it('trims email but never modifies the password', async () => {
    await service.login(' admin@example.com ', '  secret  ');
    expect(api.login).toHaveBeenCalledWith('admin@example.com', '  secret  ');
    expect(service.isAdmin()).toBe(true);
  });

  it('propagates failed login without inventing an identity', async () => {
    next(null);
    api.login.mockReturnValue(Promise.reject(new Error('invalid')));
    await expect(service.login('admin@example.com', 'wrong')).rejects.toThrow();
    expect(service.user()).toBeNull();
    expect(service.isAdmin()).toBe(false);
  });

  it('clears private identity before logout finishes', async () => {
    await service.login('admin@example.com', 'secret');
    const promise = service.logout();
    expect(service.user()).toBeNull();
    expect(service.isAdmin()).toBe(false);
    await promise;
    expect(service.access()).toBe('anonymous');
  });

  it('cannot restore permissions from a stale claim response after signout', async () => {
    let resolve!: (claims: Record<string, unknown>) => void;
    api.claims.mockReturnValue(new Promise(result => { resolve = result; }));
    next(user);
    next(null);
    resolve({ admin: true });
    await Promise.resolve();
    expect(service.access()).toBe('anonymous');
    expect(service.user()).toBeNull();
  });

  it('updates access when claims change', async () => {
    next(user);
    await service.whenReady();
    api.claims.mockReturnValue(Promise.resolve({ admin: false }));
    next(user);
    expect(await service.whenReady()).toBe('forbidden');
  });

  it('fails closed when claims cannot be read', async () => {
    api.claims.mockReturnValue(Promise.reject(new Error('network')));
    next(user);
    expect(await service.whenReady()).toBe('error');
    expect(service.user()).toBeNull();
  });

  it('fails closed if the observer reports an error', () => {
    fail();
    expect(service.access()).toBe('error');
    expect(service.isAdmin()).toBe(false);
  });

  it('fails closed even if signOut fails', async () => {
    await service.login('admin@example.com', 'secret');
    api.logout.mockReturnValue(Promise.reject(new Error('network')));
    await expect(service.logout()).rejects.toThrow();
    expect(service.access()).toBe('error');
    expect(service.user()).toBeNull();
  });

  it('disposes the Firebase listener', () => {
    TestBed.resetTestingModule();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
