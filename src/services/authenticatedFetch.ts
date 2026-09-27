import { auth } from '../firebase';

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  if (!token) throw new Error('Please sign in to the admin portal first.');
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body && typeof init.body !== 'string') headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers });
}
