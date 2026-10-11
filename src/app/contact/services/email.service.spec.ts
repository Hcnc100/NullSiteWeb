import { vi } from 'vitest';
import type { Mock } from 'vitest';
import {TestBed} from '@angular/core/testing';

import {CONTACT_FETCH, ContactSubmissionError, EmailService} from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let request: Mock;

  beforeEach(() => {
    request = vi.fn().mockName('fetch').mockResolvedValue({
      status: 201, json: async () => ({ ok: true }) });
    TestBed.configureTestingModule({ providers: [{ provide: CONTACT_FETCH, useValue: request }] });
    service = TestBed.inject(EmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  const mail = { name: ' Visitor ', email: 'visitor@example.com', subject: ' Hello ',
    message: ' Message ', isOpen: false };
  it('sends token only to same-origin backend, not Firestore', async () => {
    await service.sendNewEmail(mail, 'captcha-token');
    const [url, options] = request.mock.calls.at(-1)! as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(options.credentials).toBe('omit');
    expect(JSON.parse(options.body as string)).toEqual({ name: 'Visitor', email: mail.email,
      subject: 'Hello', message: 'Message', token: 'captcha-token' });
  });
  it('does not send without CAPTCHA', async () => {
    await expect(service.sendNewEmail(mail, '')).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
  it('exposes only HTTP status for safe user feedback', async () => {
    request.mockResolvedValue({status: 400, json: async () => ({secret: 'never display response'})});
    await expect(service.sendNewEmail(mail, 'token')).rejects.toEqual(new ContactSubmissionError(400));
  });
  it('rejects backend rejection and SPA fallback instead of reporting success', async () => {
    for (const status of [200, 400, 429, 503]) {
      request.mockResolvedValue({ status, json: async () => ({ ok: true }) });
      await expect(service.sendNewEmail(mail, 'token')).rejects.toThrow();
    }
    request.mockResolvedValue({ status: 201, json: async () => ({ ok: false }) });
    await expect(service.sendNewEmail(mail, 'token')).rejects.toThrow();
  });
});








