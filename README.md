# AI Work OS, Frontend

This is the web app for AI Work OS. The idea we kept coming back to during the hackathon was simple to say and hard to build: most of us lose half the day just figuring out where our work actually lives. It is spread across Jira, Notion, ClickUp, email, a calendar, and a few chat threads. So we wanted one calm screen that pulls all of that together, lets you ask plain questions about it, and never touches anything outside without asking you first.

This repo is only the frontend. It is a Next.js app (Next 16, React 19, TypeScript, Tailwind) that talks to the Nest backend over HTTP. If you are looking for the tool calling, the model wiring, and the OAuth plumbing, that all lives in the backend repo. What you get here is the interface, the auth flow, the integration screens, and the assistant.

## What it actually does today

The app is laid out as a normal signed-in workspace with a sidebar. Here is the honest state of each part, because a demo is only useful if you know what is real and what is staged.

- **Today (dashboard).** The landing screen after you sign in. A quick read on priorities, blockers, follow ups, and what is coming up, plus an ask box so you can jump straight into a question.
- **Ask AI (assistant).** The part we are most proud of. You type a question in normal language and it answers using your connected apps. It shows you the answer, and under it, the exact tools it ran to get there (for example `jira_search` or `notion_read_page`) with an ok or failed marker on each one. You can also filter it to a single source if you only want it looking at, say, Jira. More on this below.
- **Work.** A unified list of work items across sources with a detail view. This one is driven by demo data for now.
- **Approvals.** The safety net. Anything that would change something in an outside app (create a Jira ticket, edit a page) is meant to land here first as a proposal you approve or reject. Nothing leaves the app silently.
- **Integrations.** Connect and disconnect Jira, Notion, and ClickUp. Notion shows up in two flavours, the normal connection and the "Notion AI Assistant" (its hosted MCP connection). Each card shows connection health, the account and workspace, and the capabilities you granted.
- **Settings.** Profile, appearance (light, dark, system), timezone, and notification preferences.

There is a badge counter on Approvals, an attention marker on Integrations when a connection needs reconnecting, and toast notifications for the things you do. Small stuff, but it makes the thing feel alive.

## Two ways to run it: live and demo

Early on we made one decision that saved us over and over: the whole app talks to a single `WorkOsClient` interface, and there are two implementations behind it.

- **Live mode** (`http-client`) calls the real backend. Auth, integrations, and the assistant all run against it.
- **Demo mode** (`mock-client`) runs the entire app offline with realistic fixture data. No backend, no OAuth, no keys.

You switch between them with one environment variable. This meant that when the backend was mid change, or when we were on a train with no server running, we could still build and show the UI. It is also how you demo the full product (dashboard, work, approvals) even though some of those endpoints are not wired on the backend yet. In live mode those screens tell you plainly that the data is not available yet and to switch to demo mode.

To be clear about the split: in live mode, auth, the integrations screen, and the assistant are the real thing. The dashboard, work list, approvals, and settings currently read from the backend only in demo mode.

## Getting started

You need Node (18+), the backend running on port 5000, and about two minutes.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Then open http://localhost:3000.

The two settings you care about in `.env.local`:

```bash
# where the Nest backend lives
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# leave unset for live mode, or set to "mock" for the full offline demo
NEXT_PUBLIC_DATA_MODE=mock
```

If you just want to click around without standing up the backend, set `NEXT_PUBLIC_DATA_MODE=mock` and go. Everything works, the data is fake but sensible, and no connect or disconnect button will ever touch a real account.

## A quick walkthrough

1. Sign up or log in. The token is stored in the browser and attached to every backend call as a bearer token.
2. Go to Integrations and connect Jira. The button sends you to the backend, which hands back the real authorization URL, and you come back to the app once you approve. Notion and ClickUp work the same way. Your provider credentials never pass through the frontend, we only ever follow the URL the backend gives us.
3. Open Ask AI and ask something like "What Jira tickets do I have in progress right now?"
4. Watch the answer come back with its tool trail underneath. If you asked something that crosses apps, like "read my Q3 Roadmap page in Notion and open a Jira task for each initiative," you will see several tools fire in order.

One thing worth knowing: conversation history is kept in your browser for now, not on the server. The backend does not persist threads yet, so if you clear storage, the history goes with it. It was a deliberate shortcut so the assistant could feel like a real chat without waiting on a threads table.

## The assistant, in a bit more detail

The assistant is a single call to the backend's unified brain endpoint. You send a message, the model decides which tools to call across Jira, Notion, and ClickUp, chains as many as it needs, and returns one final answer plus the trace of what it did. The frontend does not pick tools or route anything. It sends your question, shows the answer, and renders the trace.

A few things the UI handles so the experience stays honest:

- It shows the model and provider that answered, quietly, under the tools.
- If a tool fails but the model carried on anyway, that tool gets an amber marker instead of a green one, so you can see it.
- If you have no apps connected, it says so and points you to the Integrations page instead of pretending it looked anything up.
- Really long messages are capped and obviously bad requests are caught before they ever leave the browser, so you are not waiting on a round trip just to be told no.
- When the model or provider is having a bad moment, you get a plain "temporarily unavailable, try again" instead of a scary error, and you are never logged out for a model hiccup. Only an actual session problem signs you out.

## What we wanted to build and did not get to

The one we most regret leaving on the table is the scheduled jobs. The architecture we settled on had a background cron layer, and the frontend already has the hooks for it: a daily brief time in Settings, and toggles for email and approval notifications. The plan was for a job to run on a schedule, assemble your "Today" brief from all your sources, and nudge you (or email you) when something needs approval, all without you opening the app. On a quieter morning it would have quietly refreshed your integrations in the background so the dashboard was never stale.

We had the shape of it designed and the settings sitting in the UI waiting to be wired. We simply ran out of hackathon hours before the recurring jobs and the notification delivery were built end to end. It is the most obvious next thing to pick up, and the groundwork is already here.

## Where Codex came in, and how much

Being straight about this, because it is the interesting part. Every architecture and design document in this project, the ones that describe the system, the data model, the integration flows, the cron layer, all of it, was written with Codex. We did not hand write those. We came in with a rough idea of what we wanted, and Codex is what turned the idea into something we could actually build against.

It helped in a few distinct ways that are worth separating out:

- **It solidified an idea we already half had.** We knew we wanted "one place for scattered work with an assistant on top." What we did not have was the vocabulary and the structure. Codex took the fuzzy version and gave it edges: what a work item is, what a proposal is, how approvals gate external writes, where the boundary between frontend and backend should sit.
- **It found the holes.** We would describe a flow and it would point out the case we had not thought about. The clearest example is auth and error handling. It kept pushing on the difference between "your session died, log the user out" and "a provider had a problem, do not log the user out," which is exactly the distinction that ended up saving the assistant from randomly kicking people to the login screen.
- **It gave us options, not one answer.** For the architecture we asked it to design for many users, not just a demo, and it came back with a few different plans at different levels of ambition. We read them, argued about them, and picked the one that fit the time we had. Having three plans to choose from was far more useful than one.
- **It did the boring work fast.** A lot of the day to day was not clever, it was volume. Wiring the same shape of component again, mapping backend fields to frontend types, writing the mock fixtures, cleaning up a merge. Codex handled a lot of that and let the humans stay on the parts that needed thinking.

The honest bottom line is that a team of our size could not have shipped this in the time we had without it. Not "it was faster," but genuinely could not have. It let a small group move like a bigger one.

If there is one gripe, it is that the credits went a lot faster than we expected. When you are in a flow and the ideas are coming, you notice the meter, and we would have happily traded a little less hand holding for a bit more runway. A minor complaint against something that carried most of the load.

## What we learned

- A single client interface with a live and a mock implementation is worth setting up on day one. It decoupled us from the backend completely and made demos bulletproof.
- The most valuable thing an assistant can show is not the answer, it is the receipts. The tool trace is what makes people trust it.
- "Never change anything without asking" is a small product rule that shaped a surprising amount of the design, from the approvals screen to how the connect buttons behave in demo mode.
- Good error handling is mostly about telling the truth. Say what is actually wrong, do not log someone out for the wrong reason, and offer the next step.

## Scripts

```bash
npm run dev          # start the dev server on :3000
npm run build        # production build
npm run start        # serve the production build
npm run lint         # eslint
npm run typecheck    # next typegen then tsc --noEmit
npm run test         # unit tests (vitest)
npm run test:e2e     # end to end tests (playwright)
```

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, lucide-react for icons, Vitest for unit tests, and Playwright for the end to end demo flow.
