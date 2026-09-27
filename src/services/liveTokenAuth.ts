import { createVerify, X509Certificate } from 'node:crypto';

const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cachedCerts: { expiresAt: number; certs: Record<string, string> } | null = null;

function b64urlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '='), 'base64');
}

async function getCerts() {
  if (cachedCerts && cachedCerts.expiresAt > Date.now()) return cachedCerts.certs;
  const response = await fetch(CERT_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Firebase certificate lookup failed: ${response.status}`);
  const certs = await response.json() as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
  cachedCerts = { certs, expiresAt: Date.now() + Math.max(60, maxAge - 30) * 1000 };
  return certs;
}

export async function verifyFirebaseIdToken(token: string, projectId: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed Firebase ID token');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(b64urlDecode(encodedHeader).toString('utf8')) as { alg?: string; kid?: string };
  const payload = JSON.parse(b64urlDecode(encodedPayload).toString('utf8')) as Record<string, any>;

  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported Firebase token');
  if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Invalid Firebase token issuer/audience');
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) throw new Error('Firebase token expired');
  if (typeof payload.iat !== 'number' || payload.iat > now + 60) throw new Error('Invalid Firebase token time');
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) throw new Error('Invalid Firebase subject');

  const certs = await getCerts();
  const cert = certs[header.kid];
  if (!cert) throw new Error('Unknown Firebase signing key');
  const publicKey = new X509Certificate(cert).publicKey;
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();
  if (!verifier.verify(publicKey, b64urlDecode(encodedSignature))) throw new Error('Invalid Firebase token signature');

  return payload;
}
