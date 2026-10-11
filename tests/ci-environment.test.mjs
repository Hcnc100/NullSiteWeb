import { test } from 'node:test';
import assert from 'node:assert/strict';
import { environmentSource } from '../scripts/ci-environment.mjs';
const valid = { SITE_KEY: 'site', FIREBASE_API_KEY: 'key', FIREBASE_AUTH_DOMAIN: 'domain',
  FIREBASE_PROJECT_ID: 'nullpointer-716ae', FIREBASE_STORAGE_BUCKET: 'bucket',
  FIREBASE_MESSAGING_SENDER_ID: 'sender', FIREBASE_APP_ID: 'app' };
test('CI needs no secrets and targets demo project', () => {
  assert.match(environmentSource({}, false), /demo-nullsite-phase2/);
});
test('production refuses missing and mismatched configuration', () => {
  assert.throws(() => environmentSource({}, true));
  assert.throws(() => environmentSource({ ...valid, SITE_KEY: ' ' }, true));
  assert.throws(() => environmentSource({ ...valid, FIREBASE_PROJECT_ID: 'other' }, true));
});
test('configuration values are data, not interpolated code', () => {
  const key = "'; process.exit(1); //\n\"";
  const source = environmentSource({ ...valid, FIREBASE_API_KEY: key }, true);
  const parsed = JSON.parse(source.slice('export const environment = '.length, -2));
  assert.equal(parsed.firebase.apiKey, key);
  assert.equal(parsed.production, true);
});
