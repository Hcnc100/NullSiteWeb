import type { Terms } from '../models/Terms';

/** An empty local cache is not proof that the public document does not exist. */
export function readLegalSnapshot(snapshot: { exists: boolean; fromCache: boolean; data: unknown }): Terms | null | undefined {
  if (!snapshot.exists) return snapshot.fromCache ? undefined : null;
  const value = snapshot.data;
  if (typeof value !== 'object' || value === null || !('title' in value) || !('content' in value)
    || typeof value.title !== 'string' || typeof value.content !== 'string') {
    throw new Error('Invalid legal document');
  }
  return { title: value.title, content: value.content };
}
