import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/deploy-firebase.yml', import.meta.url), 'utf8');
const release = workflow.split('  deploy:\n')[1] ?? workflow.split('  deploy:\r\n')[1];
const condition = /^    if: (.+)$/m.exec(release)?.[1].trim();
// This workflow deliberately uses the shared boolean subset of Actions/JavaScript.
const eligible = (event, ref, accepted = false) =>
  Function('github', 'inputs', `return (${condition});`)({ event_name: event, ref }, { accepted });

test('release requires successful validation and preserves production environment', () => {
  assert.match(release, /needs: validate/);
  assert.match(release, /environment: production/);
});
test('main pushes deploy, PRs and other branches never deploy', () => {
  assert.equal(eligible('push', 'refs/heads/main'), true);
  assert.equal(eligible('pull_request', 'refs/heads/main'), false);
  assert.equal(eligible('push', 'refs/heads/feature'), false);
  assert.equal(eligible('workflow_dispatch', 'refs/heads/feature', true), false);
});
test('manual release still requires explicit acceptance', () => {
  assert.equal(eligible('workflow_dispatch', 'refs/heads/main'), false);
  assert.equal(eligible('workflow_dispatch', 'refs/heads/main', true), true);
});
test('automatic release includes origins, contact backend, rules and hosting', () => {
  assert.equal((release.match(/if: github.event_name == 'push' \|\| inputs.target == 'full'/g) ?? []).length, 2);
  assert.match(release, /DEPLOY_TARGET: \$\{\{ github.event_name == 'push' && 'full' \|\| inputs.target \}\}/);
  assert.match(release, /--only firestore:rules,firestore:indexes,storage,hosting/);
});
