import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { contactHandler, verifyCaptcha } from './contact.mjs';
import { persistContact } from './quota.mjs';

initializeApp();
const db = getFirestore();
const captchaSecret = defineSecret('CONTACT_RECAPTCHA_SECRET');
const rateSecret = defineSecret('CONTACT_RATE_LIMIT_KEY');
// Comma-separated exact HTTPS origins; no wildcard or default production domain.
const allowedOrigins = defineString('CONTACT_ALLOWED_ORIGINS');

async function persist(mail, ip) {
  return persistContact(db, mail, ip, rateSecret.value(), value => Timestamp.fromMillis(value));
}

export const submitContact = onRequest({ region: 'us-central1', maxInstances: 3, concurrency: 20,
  serviceAccount: 'contact-runtime@nullpointer-716ae.iam.gserviceaccount.com',
  timeoutSeconds: 20, memory: '256MiB', cors: false,
  secrets: [captchaSecret, rateSecret] }, contactHandler({
    origins: () => allowedOrigins.value().split(',').map(value => value.trim()).filter(value => {
      try { const url = new URL(value); return url.protocol === 'https:' && url.origin === value; }
      catch { return false; }
    }),
    verify: (token, hostname) => verifyCaptcha(token, captchaSecret.value(), hostname), persist,
  }));
