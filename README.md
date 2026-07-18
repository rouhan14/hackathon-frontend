# AI Work OS Frontend

Next.js app for auth, integrations, and the workplace assistant.

## Getting Started

1. Copy env and point at the Nest API (live mode by default when `NEXT_PUBLIC_DATA_MODE` is not `mock`):

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

2. Start the backend (`hackathon-backend`) on port 5000 with valid `BEDROCK_*` and provider OAuth env.

3. Start the frontend:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Live assistant flow

1. Sign up / log in.
2. Connect Jira under **Integrations** (`GET /auth/jira`).
3. Open **Assistant** and ask e.g. “What open Jira issues am I assigned to?”
4. The UI calls `POST /assistant/ask`; tool traces (e.g. `jira_search`) show under the answer.
5. Conversation history is stored in the browser until the backend adds durable threads.

### Mock mode

Set `NEXT_PUBLIC_DATA_MODE=mock` in `.env.local` for a full offline demo without the API.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
