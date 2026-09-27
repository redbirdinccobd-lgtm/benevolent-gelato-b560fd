<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fffd0f84-4027-4fc7-bc44-d69b65e42fb1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure the Firebase `VITE_*` values locally and set the server-side `OPENAI_API_KEY` in `.env`
3. Run the app:
   `npm run dev`


## GPT-6 Astra setup

For Scarlet's current AI core, configure `OPENAI_API_KEY` on the server and keep it out of all `VITE_*` variables. The primary model is `gpt-6-astra`; the real-time browser voice layer uses GPT-Live over WebRTC. See `LIVE_AGENT_SETUP.md`.

## Production AI architecture

Scarlet uses GPT-Live for low-latency voice and GPT-6 Astra as the backend reasoning agent. Protected AI requests require a verified Firebase admin token. See `GPT6_ASTRA_MIGRATION.md` and `DOMAIN_CONNECTION.md`.
