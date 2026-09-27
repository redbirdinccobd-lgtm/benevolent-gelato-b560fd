# GPT-6 Astra + GPT-Live production migration

## Target architecture

- **GPT-Live**: low-latency, full-duplex voice interface over WebRTC.
- **GPT-6 Astra**: authenticated backend reasoning brain for text, delegated voice work, structured actions and web research.
- **Firebase**: authentication + operational data.
- **Client delegation**: the live voice session sends delegated work to the authenticated Astra endpoint; the application remains responsible for permissions, confirmations and Firestore mutations.
- **Long-term memory**: `ai_memories`, bounded and user-scoped.

## Major changes

- Removed Gemini runtime dependencies and migrated the existing Gemini-shaped AI feature calls to an Astra Responses adapter.
- Migrated server TTS to OpenAI TTS.
- Added Firebase-admin authentication to AI generation and voice-command routes.
- Added rate limiting and HTTP security headers.
- Added OpenAI safety identifiers for live sessions.
- Added secure authenticated fetch helper for protected browser AI calls.
- Live voice now supports client delegation: GPT-Live talks, Astra reasons, and the dashboard receives structured actions.
- Tightened Firestore access for brand guidelines and generated documents.
- Kept existing non-AI business modules and public verification flows intact.

## Self-learning policy

The agent does **not** rewrite its own source code or security rules. “Self-learning” means it can propose durable preferences, business rules, facts and interaction patterns; the application stores validated memory in `ai_memories` and supplies relevant memory to Astra on later requests.

## Remaining production security item

`portalUsers` is still a legacy custom credential model. It should be migrated to Firebase Authentication before the buyer portal is considered high-security. Do not store or expose plaintext passwords in Firestore in the final production design.

## Verification limitation

The source package was audited and updated, but this build environment does not contain `node_modules`, so a full dependency-backed TypeScript/Vite production build could not be executed here. The deployment environment must run `npm ci`, `npm run lint`, `npm run build`, and then the live smoke tests.
