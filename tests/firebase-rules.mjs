import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, getDocs, collection, query, where, serverTimestamp, deleteDoc, deleteField, orderBy, limit, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject, listAll } from 'firebase/storage';

const env = await initializeTestEnvironment({
  projectId: 'demo-nullsite-phase2',
  firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':').pop() ?? 8085), rules: await readFile('firestore.rules', 'utf8') },
  storage: { host: '127.0.0.1', port: Number(process.env.FIREBASE_STORAGE_EMULATOR_HOST?.split(':').pop() ?? 9195), rules: await readFile('storage.rules', 'utf8') },
});
let passed = 0;
async function check(name, action) { await action(); passed++; console.log(`PASS ${name}`); }
try {
  const anonymous = env.unauthenticatedContext();
  const user = env.authenticatedContext('mobile-user');
  const admin = env.authenticatedContext('admin-user', { admin: true });
  const falseAdmin = env.authenticatedContext('string-claim', { admin: 'true' });
  const db = admin.firestore();
  const legalValue = { title: 'Policy', content: '<h2>Policy</h2><p>Body</p>' };
  const legalDraft = { ...legalValue, base: null, revision: 1, publishedRevision: 0, updatedAt: serverTimestamp() };
  const legalRef = doc(db, 'legal-drafts', 'legal-private');
  await check('admin saves private legal draft', () => assertSucceeds(setDoc(legalRef, legalDraft)));
  await check('admin lists legal drafts', () => assertSucceeds(getDocs(collection(db, 'legal-drafts'))));
  await check('anonymous cannot read legal draft', () => assertFails(getDoc(doc(anonymous.firestore(), 'legal-drafts', 'legal-private'))));
  await check('ordinary mobile user cannot list legal drafts', () => assertFails(getDocs(collection(user.firestore(), 'legal-drafts'))));
  await check('ordinary mobile user cannot write legal drafts', () => assertFails(setDoc(doc(user.firestore(), 'legal-drafts', 'legal-private'), legalDraft)));
  await check('string admin claim cannot write legal drafts', () => assertFails(setDoc(doc(falseAdmin.firestore(), 'legal-drafts', 'legal-private'), legalDraft)));
  await check('legal draft does not create a public document', async () => {
    const snapshot = await assertSucceeds(getDoc(doc(anonymous.firestore(), 'terms', 'legal-private')));
    if (snapshot.exists()) throw new Error('draft leaked into public terms');
  });
  await check('legal drafts reject extra fields', () => assertFails(setDoc(legalRef, { ...legalDraft, public: true })));
  await check('legal drafts reject malformed baseline', () => assertFails(setDoc(legalRef, { ...legalDraft, base: { title: 'Only title' } })));
  await check('legal drafts reject oversized body', () => assertFails(setDoc(legalRef, { ...legalDraft, content: 'x'.repeat(500001) })));
  await check('legal drafts reject impossible published revision', () => assertFails(setDoc(legalRef, { ...legalDraft, publishedRevision: 2 })));
  await check('legal drafts reject forged update time', () => assertFails(setDoc(legalRef, { ...legalDraft, updatedAt: new Date(0) })));
  const legalHistoryRef = doc(db, 'legal-drafts', 'legal-private', 'history', 'version1');
  const legalHistory = { ...legalValue, previous: legalValue, revision: 1, publishedAt: serverTimestamp() };
  await check('admin records legal history', () => assertSucceeds(setDoc(legalHistoryRef, legalHistory)));
  await check('admin reads legal history', () => assertSucceeds(getDocs(query(collection(db, 'legal-drafts', 'legal-private', 'history'), orderBy('publishedAt', 'desc'), limit(20)))));
  await check('anonymous cannot read previous public legal versions', () => assertFails(getDoc(doc(anonymous.firestore(), 'legal-drafts', 'legal-private', 'history', 'version1'))));
  await check('ordinary mobile user cannot read legal history', () => assertFails(getDoc(doc(user.firestore(), 'legal-drafts', 'legal-private', 'history', 'version1'))));
  await check('ordinary mobile user cannot create legal history', () => assertFails(setDoc(doc(user.firestore(), 'legal-drafts', 'legal-private', 'history', 'other'), legalHistory)));
  await check('legal history is immutable even for admin', () => assertFails(updateDoc(legalHistoryRef, { title: 'Overwrite' })));
  await check('legal history cannot be deleted from client', () => assertFails(deleteDoc(legalHistoryRef)));
  await check('legal draft deletion is denied', () => assertFails(deleteDoc(legalRef)));
  await check('existing legal public model remains readable', async () => {
    await setDoc(doc(db, 'terms', 'legacy-legal'), { ...legalValue, mobileMetadata: 'unchanged' });
    await assertSucceeds(getDoc(doc(anonymous.firestore(), 'terms', 'legacy-legal')));
  });
  await check('legal publication transaction preserves legacy metadata and privately archives previous content', async () => {
    const publicRef = doc(db, 'terms', 'legal-private');
    await setDoc(publicRef, { ...legalValue, mobileMetadata: 'keep' });
    await updateDoc(legalRef, { base: legalValue, updatedAt: serverTimestamp() });
    const next = { title: 'Updated policy', content: '<p>Updated public body</p>' };
    await assertSucceeds(runTransaction(db, async transaction => {
      const before = await transaction.get(publicRef);
      await transaction.get(legalRef);
      transaction.set(publicRef, next, { merge: true });
      transaction.set(doc(db, 'legal-drafts', 'legal-private', 'history', 'version2'), {
        ...next, previous: { title: before.data().title, content: before.data().content }, revision: 1, publishedAt: serverTimestamp(),
      });
      transaction.update(legalRef, { ...next, base: next, publishedRevision: 1, updatedAt: serverTimestamp() });
    }));
    const visible = (await getDoc(doc(anonymous.firestore(), 'terms', 'legal-private'))).data();
    if (visible.title !== next.title || visible.mobileMetadata !== 'keep' || 'base' in visible || 'revision' in visible) {
      throw new Error('public legal contract changed');
    }
  });
  await check('ordinary user legal transaction fails without partial publication', async () => {
    const publicRef = doc(user.firestore(), 'terms', 'legal-private');
    await assertFails(runTransaction(user.firestore(), async transaction => {
      await transaction.get(publicRef);
      transaction.update(publicRef, { title: 'Unauthorized' });
      transaction.set(doc(user.firestore(), 'legal-drafts', 'legal-private', 'history', 'denied'), legalHistory);
    }));
    if ((await getDoc(doc(db, 'terms', 'legal-private'))).data().title !== 'Updated policy') throw new Error('partial unauthorized write');
  });
  const email = { name: 'Visitor', email: 'visitor@example.com', subject: 'Hello', message: 'Test message', isOpen: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  await check('anonymous direct contact submission denied', () => assertFails(setDoc(doc(anonymous.firestore(), 'emails', 'valid'), email)));
  await check('ordinary mobile user cannot bypass contact backend', () => assertFails(setDoc(doc(user.firestore(), 'emails', 'bypass'), email)));
  await check('admin client cannot bypass contact backend', () => assertFails(setDoc(doc(db, 'emails', 'bypass'), email)));
  await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'emails', 'valid'), email));
  await check('anonymous cannot read contact quota', () => assertFails(getDoc(doc(anonymous.firestore(), 'contact-rate-limits', 'quota'))));
  await check('admin client cannot forge quota', () => assertFails(setDoc(doc(db, 'contact-rate-limits', 'quota'), { count: 0 })));
  await check('contact messages cannot be listed anonymously', () => assertFails(getDocs(collection(anonymous.firestore(), 'emails'))));
  await check('contact messages readable by admin', () => assertSucceeds(getDoc(doc(db, 'emails', 'valid'))));
  await check('contact forged read status rejected', () => assertFails(setDoc(doc(anonymous.firestore(), 'emails', 'read'), { ...email, isOpen: true })));
  await check('contact extra fields rejected', () => assertFails(setDoc(doc(anonymous.firestore(), 'emails', 'extra'), { ...email, admin: true })));
  await check('contact oversized message rejected', () => assertFails(setDoc(doc(anonymous.firestore(), 'emails', 'long'), { ...email, message: 'x'.repeat(251) })));
  await check('contact invalid email rejected', () => assertFails(setDoc(doc(anonymous.firestore(), 'emails', 'invalid'), { ...email, email: 'invalid' })));
  await setDoc(doc(db, 'skills', 'public'), { published: true });
  await setDoc(doc(db, 'skills', 'draft'), { published: false });
  await check('published skills query public', () => assertSucceeds(getDocs(query(collection(anonymous.firestore(), 'skills'), where('published', '==', true)))));
  await check('unpublished skills denied publicly', () => assertFails(getDoc(doc(anonymous.firestore(), 'skills', 'draft'))));
  await check('admin lists all skills', () => assertSucceeds(getDocs(collection(db, 'skills'))));
  await check('mobile signed-in user cannot edit', () => assertFails(setDoc(doc(user.firestore(), 'last-projects', 'p'), { name: 'Denied' })));
  await check('string admin claim rejected', () => assertFails(setDoc(doc(falseAdmin.firestore(), 'last-projects', 'p'), { name: 'Denied' })));
  await check('admin updates legacy projects', () => assertSucceeds(setDoc(doc(db, 'last-projects', 'p'), { name: 'Project' })));
  await check('settings deny ordinary user writes', () => assertFails(setDoc(doc(user.firestore(), 'siteSettings', 'public'), { skillsManaged: true })));
  await check('private collections default denied', () => assertFails(getDoc(doc(anonymous.firestore(), 'blog-drafts', 'p'))));
  const pdf = new TextEncoder().encode('%PDF-1.7 local test');
  const path = 'resumes/es/test.pdf';
  await check('admin uploads PDF', () => assertSucceeds(uploadBytes(ref(admin.storage(), path), pdf, { contentType: 'application/pdf' })));
  await check('unpublished PDF denied', () => assertFails(getBytes(ref(anonymous.storage(), path))));
  await check('ordinary user cannot upload PDF', () => assertFails(uploadBytes(ref(user.storage(), 'resumes/en/user.pdf'), pdf, { contentType: 'application/pdf' })));
  await check('wrong PDF MIME rejected', () => assertFails(uploadBytes(ref(admin.storage(), 'resumes/es/wrong.pdf'), pdf, { contentType: 'text/html' })));
  await setDoc(doc(db, 'siteSettings', 'public'), { resume: { es: { storagePath: path, enabled: true } } });
  await check('current published PDF downloadable', () => assertSucceeds(getBytes(ref(anonymous.storage(), path))));
  await check('public cannot list PDFs', () => assertFails(listAll(ref(anonymous.storage(), 'resumes/es'))));
  await updateDoc(doc(db, 'siteSettings', 'public'), { 'resume.es.enabled': false });
  await check('withdrawal revokes old PDF access', () => assertFails(getBytes(ref(anonymous.storage(), path))));
  await check('admin deletes PDF', () => assertSucceeds(deleteObject(ref(admin.storage(), path))));
  await check('admin uploads image', () => assertSucceeds(uploadBytes(ref(admin.storage(), 'projects/p/test.png'), new Uint8Array([1]), { contentType: 'image/png' })));
  await check('public reads project image', () => assertSucceeds(getBytes(ref(anonymous.storage(), 'projects/p/test.png'))));
  await check('SVG disallowed', () => assertFails(uploadBytes(ref(admin.storage(), 'projects/p/test.svg'), new Uint8Array([1]), { contentType: 'image/svg+xml' })));
  await check('admin deletes image', () => assertSucceeds(deleteObject(ref(admin.storage(), 'projects/p/test.png'))));
  const draft = { title: 'Private title', slug: 'private-title', locale: 'es', tags: ['Firebase'],
    excerpt: 'Private excerpt', contentHtml: '<h2>Private body</h2>', status: 'draft', contentFormat: 'html',
    contentVersion: 1, revision: 1, authorUid: 'admin-user' };
  await check('admin creates private blog draft', () => assertSucceeds(setDoc(doc(db, 'blog-drafts', 'article'), draft)));
  await check('admin lists drafts', () => assertSucceeds(getDocs(collection(db, 'blog-drafts'))));
  await check('anonymous direct draft read denied', () => assertFails(getDoc(doc(anonymous.firestore(), 'blog-drafts', 'article'))));
  await check('normal mobile user draft read denied', () => assertFails(getDoc(doc(user.firestore(), 'blog-drafts', 'article'))));
  await check('anonymous draft query denied', () => assertFails(getDocs(collection(anonymous.firestore(), 'blog-drafts'))));
  await check('normal user draft writes denied', () => assertFails(setDoc(doc(user.firestore(), 'blog-drafts', 'article'), draft)));
  await check('cannot publish a draft even as admin', () => assertFails(updateDoc(doc(db, 'blog-drafts', 'article'), { status: 'published' })));
  await setDoc(doc(db, 'blog-slugs', 'es-private-title'), { draftId: 'article' });
  await check('slug index remains private', () => assertFails(getDoc(doc(anonymous.firestore(), 'blog-slugs', 'es-private-title'))));
  await setDoc(doc(db, 'siteSettings', 'public'), { blogEnabled: true }, { merge: true });
  await check('a setting cannot make phase3 drafts public', () => assertFails(getDoc(doc(anonymous.firestore(), 'blog-drafts', 'article'))));
  await check('public blog snapshot namespace denied', () => assertFails(getDoc(doc(anonymous.firestore(), 'blog-posts', 'article'))));
  const privatePath = 'blog-drafts/article/test.png';
  await check('admin uploads private image', () => assertSucceeds(uploadBytes(ref(admin.storage(), privatePath), new Uint8Array([1]), { contentType: 'image/png' })));
  await check('admin reads private image', () => assertSucceeds(getBytes(ref(admin.storage(), privatePath))));
  await check('anonymous private image read denied despite legacy wildcard', () => assertFails(getBytes(ref(anonymous.storage(), privatePath))));
  await check('normal mobile user private image read denied', () => assertFails(getBytes(ref(user.storage(), privatePath))));
  await check('anonymous private image listing denied', () => assertFails(listAll(ref(anonymous.storage(), 'blog-drafts/article'))));
  await check('normal user private image write denied', () => assertFails(uploadBytes(ref(user.storage(), 'blog-drafts/article/other.png'), new Uint8Array([1]), { contentType: 'image/png' })));
  await check('private SVG upload denied', () => assertFails(uploadBytes(ref(admin.storage(), 'blog-drafts/article/test.svg'), new Uint8Array([1]), { contentType: 'image/svg+xml' })));
  await check('admin deletes private image', () => assertSucceeds(deleteObject(ref(admin.storage(), privatePath))));
  const post = { draftId: 'article', title: 'Published', slug: 'published', excerpt: 'Public excerpt', locale: 'es',
    tags: ['Firebase'], contentHtml: '<h2>Public snapshot</h2>', status: 'published', assetVersion: 'v1',
    sourceRevision: 1, publishedAt: serverTimestamp() };
  const postRef = doc(db, 'blog-posts', 'es-published');
  const publicPath = 'blog-public/es-published/v1/test.png';
  await updateDoc(doc(db, 'siteSettings', 'public'), { blogEnabled: deleteField() });
  await check('admin uploads staged publication image', () => assertSucceeds(uploadBytes(ref(admin.storage(), publicPath), new Uint8Array([1]), { contentType: 'image/png' })));
  await check('admin creates public snapshot while blog disabled', () => assertSucceeds(setDoc(postRef, post)));
  await check('public snapshot defaults denied without activation', () => assertFails(getDoc(doc(anonymous.firestore(), 'blog-posts', 'es-published'))));
  await check('staged image private while blog disabled', () => assertFails(getBytes(ref(anonymous.storage(), publicPath))));
  await check('ordinary user cannot enable blog', () => assertFails(updateDoc(doc(user.firestore(), 'siteSettings', 'public'), { blogEnabled: true })));
  await updateDoc(doc(db, 'siteSettings', 'public'), { blogEnabled: true });
  await check('enabled publication readable anonymously', () => assertSucceeds(getDoc(doc(anonymous.firestore(), 'blog-posts', 'es-published'))));
  await check('published locale query public', () => assertSucceeds(getDocs(query(collection(anonymous.firestore(), 'blog-posts'), where('locale', '==', 'es'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(50)))));
  await check('unfiltered public blog query denied', () => assertFails(getDocs(collection(anonymous.firestore(), 'blog-posts'))));
  await check('enabled blog still protects draft', () => assertFails(getDoc(doc(anonymous.firestore(), 'blog-drafts', 'article'))));
  await check('current publication image readable anonymously', () => assertSucceeds(getBytes(ref(anonymous.storage(), publicPath))));
  await check('publication images cannot be listed', () => assertFails(listAll(ref(anonymous.storage(), 'blog-public/es-published/v1'))));
  await check('ordinary user cannot publish', () => assertFails(setDoc(doc(user.firestore(), 'blog-posts', 'es-other'), { ...post, slug: 'other' })));
  await check('string claim cannot publish', () => assertFails(setDoc(doc(falseAdmin.firestore(), 'blog-posts', 'es-other'), { ...post, slug: 'other' })));
  await check('public snapshot cannot include private fields', () => assertFails(setDoc(postRef, { ...post, privateNotes: 'secret' })));
  await check('snapshot cannot be stored under mismatched slug', () => assertFails(setDoc(doc(db, 'blog-posts', 'es-other'), post)));
  await check('admin cannot overwrite immutable publication image', () => assertFails(uploadBytes(ref(admin.storage(), publicPath), new Uint8Array([2]), { contentType: 'image/png' })));
  await check('ordinary user cannot upload publication image', () => assertFails(uploadBytes(ref(user.storage(), 'blog-public/es-published/v2/test.png'), new Uint8Array([1]), { contentType: 'image/png' })));
  await setDoc(postRef, { ...post, assetVersion: 'v2' });
  await check('replacement revokes previous image version', () => assertFails(getBytes(ref(anonymous.storage(), publicPath))));
  await updateDoc(doc(db, 'siteSettings', 'public'), { blogEnabled: false });
  await check('disable revokes direct article read', () => assertFails(getDoc(doc(anonymous.firestore(), 'blog-posts', 'es-published'))));
  await check('disable revokes list query', () => assertFails(getDocs(query(collection(anonymous.firestore(), 'blog-posts'), where('status', '==', 'published')))));
  await updateDoc(doc(db, 'siteSettings', 'public'), { blogEnabled: true });
  await setDoc(postRef, post);
  await deleteDoc(postRef);
  await check('withdrawal revokes article read', () => assertFails(getDoc(doc(anonymous.firestore(), 'blog-posts', 'es-published'))));
  await check('withdrawal revokes publication image', () => assertFails(getBytes(ref(anonymous.storage(), publicPath))));
  console.log(`TOTAL: ${passed} rules tests passed`);
} finally { await env.cleanup(); }
