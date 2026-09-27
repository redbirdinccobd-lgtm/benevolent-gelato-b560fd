# Red Bird International — Production Domain

Canonical domain: `https://redbird-international.com`

The repository already contains `CNAME` with `redbird-international.com`. The live domain is reachable, but DNS/hosting changes must be made at the domain/hosting provider; source code cannot change registrar DNS records.

## Production checklist

1. Deploy this build to the chosen HTTPS host.
2. Attach `redbird-international.com` and, if desired, `www.redbird-international.com` at the hosting provider.
3. Keep `APP_ORIGIN=https://redbird-international.com` on the server.
4. Set `OPENAI_API_KEY` only as a server secret. Never create a `VITE_OPENAI_API_KEY`.
5. Set `LIVE_AGENT_ALLOWED_EMAILS` to the actual verified admin accounts.
6. Confirm HTTPS is active before microphone/WebRTC use.
7. Open `/api/health` and test the admin login, Astra text chat, GPT-Live voice, document generation, shipment tracking and client portal.

## Security note

The AI routes now require verified Firebase admin authentication. Firestore brand guidelines and generated documents are admin-only. The legacy `portalUsers` login still uses the existing application data model and should be migrated to Firebase Authentication before treating the buyer portal as a high-security credential system.
