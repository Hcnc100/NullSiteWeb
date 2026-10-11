import { quotaKeys } from './contact.mjs';

export async function persistContact(db, mail, ip, secret, stamp, now = Date.now()) {
  const keys = quotaKeys(ip, secret, now);
  const perIp = db.doc(`contact-rate-limits/${keys.ip}`);
  const global = db.doc(`contact-rate-limits/${keys.global}`);
  const email = db.collection('emails').doc();
  return db.runTransaction(async tx => {
    const [ipDoc, globalDoc] = await tx.getAll(perIp, global);
    const ipCount = ipDoc.data()?.count ?? 0;
    const globalCount = globalDoc.data()?.count ?? 0;
    if (ipCount >= 3 || globalCount >= 30) return false;
    const expiresAt = stamp(now + 86400000);
    tx.set(perIp, { count: ipCount + 1, expiresAt });
    tx.set(global, { count: globalCount + 1, expiresAt });
    const timestamp = stamp(now);
    tx.create(email, { ...mail, isOpen: false, createdAt: timestamp, updatedAt: timestamp, timestamp });
    return true;
  });
}
