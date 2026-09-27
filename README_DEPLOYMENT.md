# Red Bird International — Production Deployment

## Vercel

- Frontend is built with Vite into `dist/`.
- API requests under `/api/*` are handled by `api/index.ts`.
- `server.ts` exports `createApp()` and does not open a long-lived listener on Vercel.
- Secrets belong in Vercel Environment Variables, never in source control.

Required production variables include the Firebase `VITE_*` values plus the server-side `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_LIVE_MODEL`, `OPENAI_REASONING_EFFORT`, `FIREBASE_PROJECT_ID`, `LIVE_AGENT_ALLOWED_EMAILS`, and `APP_ORIGIN`.
