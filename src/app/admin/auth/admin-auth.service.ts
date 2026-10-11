import { computed, DestroyRef, inject, Injectable, InjectionToken, NgZone, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  browserSessionPersistence, getIdTokenResult, onIdTokenChanged,
  setPersistence, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';

export type AdminAccess = 'loading' | 'anonymous' | 'admin' | 'forbidden' | 'error';

// Small SDK boundary: tests never authenticate against the real Firebase project.
export interface AdminAuthApi {
  observe: (next: (user: User | null) => void, error: () => void) => () => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  claims: (user: User) => Promise<Record<string, unknown>>;
}

export const ADMIN_AUTH_API = new InjectionToken<AdminAuthApi>('ADMIN_AUTH_API', {
  providedIn: 'root',
  factory: (): AdminAuthApi => {
    const auth = inject(Auth);
    return {
      observe: (next, error): (() => void) => onIdTokenChanged(auth, next, error),
      login: async (email, password): Promise<User> => {
        await setPersistence(auth, browserSessionPersistence);
        return (await signInWithEmailAndPassword(auth, email, password)).user;
      },
      logout: (): Promise<void> => signOut(auth),
      claims: async (user): Promise<Record<string, unknown>> => (await getIdTokenResult(user)).claims,
    };
  },
});

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly api = inject(ADMIN_AUTH_API);
  private readonly zone = inject(NgZone);
  private readonly accessState = signal<AdminAccess>('loading');
  private readonly identity = signal<{ uid: string; email: string | null } | null>(null);
  private readonly settled = new BehaviorSubject<AdminAccess>('loading');
  private generation = 0;

  public readonly access = this.accessState.asReadonly();
  public readonly user = this.identity.asReadonly();
  public readonly isAdmin = computed(() => this.access() === 'admin');

  public constructor() {
    const unsubscribe = this.api.observe(
      user => { void this.resolveUser(user); },
      () => { this.generation++; this.publish('error', null); },
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  public async whenReady(): Promise<AdminAccess> {
    return firstValueFrom(this.settled.pipe(filter(access => access !== 'loading')));
  }

  public async login(email: string, password: string): Promise<void> {
    const user = await this.api.login(email.trim(), password);
    await this.resolveUser(user);
  }

  public async logout(): Promise<void> {
    this.generation++;
    this.publish('loading', null);
    try {
      await this.api.logout();
      this.publish('anonymous', null);
    } catch (error: unknown) {
      this.publish('error', null);
      throw error;
    }
  }

  private async resolveUser(user: User | null): Promise<void> {
    const generation = ++this.generation;
    this.publish('loading', null);
    if (user === null) {
      this.publish('anonymous', null);
      return;
    }
    try {
      const claims = await this.api.claims(user);
      if (generation !== this.generation) return;
      this.publish(claims['admin'] === true ? 'admin' : 'forbidden', { uid: user.uid, email: user.email });
    } catch {
      if (generation === this.generation) this.publish('error', null);
    }
  }

  private publish(access: AdminAccess, user: { uid: string; email: string | null } | null): void {
    this.zone.run(() => {
      this.identity.set(user);
      this.accessState.set(access);
      this.settled.next(access);
    });
  }
}
