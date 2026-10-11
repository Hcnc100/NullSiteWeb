import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { persistContact } from '../quota.mjs';
if (!process.env.FIRESTORE_EMULATOR_HOST) throw Error('Emulator required: refusing production access');
const app = initializeApp({ projectId: 'demo-nullsite-phase2' });
const db = getFirestore(app);
const mail = { name: 'Test visitor', email: 'test@example.com', subject: 'Test', message: 'Synthetic test' };
const secret = 'test-only-not-a-production-secret-key';
const now = 1000000;
const stamp = value => Timestamp.fromMillis(value);
try {
  await db.recursiveDelete(db.collection('emails'));
  await db.recursiveDelete(db.collection('contact-rate-limits'));
  const concurrent = await Promise.all(Array.from({ length: 6 }, () => persistContact(db, mail, '192.0.2.1', secret, stamp, now)));
  assert.equal(concurrent.filter(Boolean).length, 3);
  assert.equal((await db.collection('emails').get()).size, 3);
  for (let i = 0; i < 27; i++) assert.equal(await persistContact(db, mail, `192.0.2.${i + 2}`, secret, stamp, now), true);
  assert.equal(await persistContact(db, mail, '192.0.2.254', secret, stamp, now), false);
  const emails = await db.collection('emails').get();
  assert.equal(emails.size, 30);
  for (const doc of emails.docs) {
    assert.equal(doc.data().isOpen, false); assert.ok(!('token' in doc.data()));
    assert.ok(doc.data().timestamp instanceof Timestamp);
  }
  assert.equal(await persistContact(db, mail, '192.0.2.1', secret, stamp, now + 600001), true);
  console.log('PASS quota integration: parallel IP limit, global limit, bucket reset, atomic writes and mobile timestamp');
} finally {
  await db.recursiveDelete(db.collection('emails'));
  await db.recursiveDelete(db.collection('contact-rate-limits'));
  await deleteApp(app);
}
