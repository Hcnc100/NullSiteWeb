import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function environmentSource(env, production = false) {
  const required = ['SITE_KEY', 'FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID', 'FIREBASE_STORAGE_BUCKET', 'FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_APP_ID'];
  if (production && required.some(key => !env[key]?.trim())) throw new Error('Missing production configuration');
  if (production && env.FIREBASE_PROJECT_ID !== 'nullpointer-716ae') throw new Error('Unexpected Firebase project');
  const value = key => production ? env[key] ?? '' : 'CI_PLACEHOLDER';
  return `export const environment = ${JSON.stringify({ production, siteKey: value('SITE_KEY'), firebase: {
    apiKey: value('FIREBASE_API_KEY'), authDomain: value('FIREBASE_AUTH_DOMAIN'),
    projectId: production ? env.FIREBASE_PROJECT_ID : 'demo-nullsite-phase2',
    storageBucket: value('FIREBASE_STORAGE_BUCKET'), messagingSenderId: value('FIREBASE_MESSAGING_SENDER_ID'),
    appId: value('FIREBASE_APP_ID'), measurementId: value('FIREBASE_MEASUREMENT_ID'),
  } }, null, 2)};\n`;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const prod = environmentSource(process.env, process.argv.includes('--production'));
  const dev = environmentSource({}, false);
  mkdirSync('src/environments', { recursive: true });
  writeFileSync('src/environments/environment.ts', dev);
  writeFileSync('src/environments/environment.prod.ts', prod);
}
