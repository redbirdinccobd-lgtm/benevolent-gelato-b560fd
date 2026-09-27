# Red Bird International — GPT-6 Astra Live Agent

## Architecture update (September 2026)

Scarlet now uses:
- **GPT-6 Astra** as the primary reasoning/decision engine for the text agent.
- **GPT-Live (`gpt-live-1`)** as the browser voice/conversation layer.
- **WebRTC** for microphone input and generated speech instead of the old browser PCM loop.
- **OpenAI Responses web search** for current external information when needed.
- Firebase Auth verification remains the gate before a live admin session is created.
- Gemini remains available for legacy/specialized document, branding, and existing features that have not yet been migrated.

OpenAI documents GPT-6 Astra as its flagship model for complex reasoning, coding, browsing, and agentic work. GPT-Live is designed for full-duplex voice and can delegate reasoning/tool work to a Responses model such as GPT-6 Astra.

## Required production configuration

Set these on the server only:
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-6-astra`
- `OPENAI_REASONING_EFFORT=high`
- `OPENAI_LIVE_MODEL=gpt-live-1`
- `FIREBASE_PROJECT_ID`
- `LIVE_AGENT_ALLOWED_EMAILS`

Existing Gemini variables remain required by legacy modules that still use Gemini.

**Never** put `OPENAI_API_KEY` in a `VITE_*` variable or ship it to the browser.

## Live flow

1. Admin signs in with Firebase.
2. Browser asks for microphone permission.
3. Browser creates a WebRTC SDP offer.
4. `/api/live-session` verifies the Firebase admin and exchanges the SDP with OpenAI using the server-side OpenAI key.
5. GPT-Live handles natural speech, interruptions and audio.
6. GPT-Live delegates reasoning to GPT-6 Astra.
7. Astra can use hosted web search for current external information.
8. Application state remains authoritative; consequential actions must still be checked/confirmed by application code.

## Important production notes

- Use HTTPS in production; microphone/WebRTC requires a secure origin.
- Keep authorization and confirmation checks in application code, not only in prompts.
- The current first migration passes a compact app-context snapshot into the live session. The next hardening step is to add authenticated server-side function tools/sideband handling so Astra can query Firestore directly during a live call rather than relying only on the snapshot.
- Existing `ai_memories` are still stored in Firestore. Memory should be treated as application state, not as self-modifying model code.
- Before production rollout, test representative Bengali/Banglish conversations, interruption/barge-in, reconnects, and operational facts.

## Text agent

`POST /api/ai/chat` now uses the OpenAI Responses API with:
- `gpt-6-astra`
- configurable reasoning effort
- structured JSON output
- web search
- existing live shipment/order/memory context

## Legacy modules

Document parsing, branding generation, and other older server routes may still use Gemini. They are intentionally left isolated so the Astra migration does not break unrelated workflows.

## Scarlet Conversation Contract
Scarlet should follow a simple spoken pattern: acknowledge the request, verify the available context, perform only supported actions, and report completion only after the application confirms success. If a required field is missing, ask one focused question. If data cannot be verified, say so plainly rather than inventing a status.
