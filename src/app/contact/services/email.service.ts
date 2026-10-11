import { inject, Injectable, InjectionToken } from '@angular/core';
import type { Email } from '../../models/Email';

export const CONTACT_FETCH = new InjectionToken<typeof fetch>('CONTACT_FETCH', {
  providedIn: 'root', factory: (): typeof fetch => globalThis.fetch.bind(globalThis),
});

export class ContactSubmissionError extends Error {
  public constructor(public readonly status: number) { super('Contact submission failed'); }
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private readonly request = inject(CONTACT_FETCH);

  public async sendNewEmail(email: Email, token: string): Promise<void> {
    if (!token.trim()) throw new Error('Contact verification required');
    const response = await this.request('/api/contact', {
      method: 'POST', credentials: 'omit', redirect: 'error',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
      name: email.name.trim(), email: email.email.trim(), subject: email.subject.trim(),
        message: email.message.trim(), token,
      }),
    });
    if (response.status !== 201 || (await response.json() as { ok?: boolean }).ok !== true) {
      throw new ContactSubmissionError(response.status);
    }
  }
}
