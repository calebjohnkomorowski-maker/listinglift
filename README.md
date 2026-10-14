# ListingLift

**Listing copy for real estate agents in seconds, with a Fair Housing check built in.**

An agent enters a property once (or pastes rough notes) and gets five ready-to-edit pieces of marketing copy: an MLS description that fits their MLS's character limit, an Instagram/Facebook post, an email blast, headline options, and an open house blurb. Every output is scanned for Fair Housing red flags as the agent edits.

> Screenshots: _add after deploying_
>
> | Desktop | Mobile |
> | --- | --- |
> | `docs/screenshot-desktop.png` | `docs/screenshot-mobile.png` |
>
> | Fair Housing warnings | Sample listing demo |
> | --- | --- |
> | `docs/screenshot-fair-housing.png` | `docs/demo.gif` |

---

## The problem

Writing listing copy is repetitive and surprisingly high-stakes:

- **Every listing needs the same story told five ways.** MLS remarks, a social caption, an email to the sphere, headlines for flyers and ads, and an open house invite.
- **MLS remarks have hard character limits** that vary by MLS. Agents end up trimming by hand.
- **Fair Housing violations hide in friendly language.** Phrases like "perfect for families", "walking distance to church", or "safe neighborhood" feel harmless but can violate the Fair Housing Act. Generic AI writers produce them constantly.
- **Agents' real inputs are messy.** Notes from a walkthrough include shorthand, typos, and private details (seller motivation, lockbox codes) that must never reach public copy.

ListingLift handles all four.

## Features

- **Five outputs from one form**, each in its own card with **Copy**, **Regenerate** (just that card), and an **editable text area**.
- **MLS character limit** (default 1,000, editable) with a live counter. The server enforces the limit: if a draft runs long, it asks the model to tighten it, then trims at a sentence boundary as a last resort.
- **Fair Housing compliance, two layers deep:**
  1. The system prompt instructs the model on HUD advertising guidance: describe the property, not the people.
  2. A client-side checker scans every output live and shows a yellow chip with the flagged phrase and a neutral alternative. Direct swaps (e.g. "master suite" → "primary suite") get a one-click **Replace**.
- **Never invents facts.** Missing details are left out, not made up. Private notes such as seller motivation, showing instructions, and lockbox info are kept out of public copy.
- **Four tones:** Warm & inviting, Luxury, Straightforward, Investor-focused.
- **Fill sample listing.** A realistic 4 bed / 2.5 bath colonial in Malvern (Chester County, PA) with deliberately messy notes, so a demo takes five seconds.
- **Built for phones.** Two columns on desktop, stacked on mobile, and a sticky Generate button.
- **Safe to share.** The API key stays server-side, and the demo is rate limited per IP with a daily cap.

## How the Fair Housing checker works

The flagged-terms list lives in one file, [`lib/fairHousingTerms.ts`](lib/fairHousingTerms.ts), so it's easy to review and extend. Each entry has:

| Field | Purpose |
| --- | --- |
| `phrases` | Plain phrases to flag. Matching is case-insensitive and whole-word, and spaces and hyphens are interchangeable. These are also listed in the model's system prompt as "never use". |
| `regex` | Optional precise pattern for terms that need context, so **"family room"** passes but **"family-friendly"** is flagged, and **"Church Street"** or **"Temple University"** aren't flagged as places of worship. |
| `suggestion` | The neutral alternative shown on the chip. |
| `replacement` | Optional. Enables one-click Replace (supports `$1` capture groups, and preserves capitalization). |
| `category`, `reason` | Shown on hover: familial status, religion, disability, and so on. |

[`lib/fairHousing.ts`](lib/fairHousing.ts) compiles the list once and re-scans each card on every edit. When one match sits inside a longer one ("growing family" inside "ideal for a growing family"), only the longer match is shown, so there are no duplicate chips.

Categories covered: familial status, age/household makeup, religion, race/color/national origin, disability, sex/gendered language, neighborhood characterization ("safe", "exclusive"), source of income, and subjective school claims.

Because the same file feeds the system prompt, the model is steered away from these phrases in the first place. The checker catches anything that slips through, plus anything the agent types while editing.

> The checker is a guardrail, not legal advice. The footer reminds agents that outputs are drafts and that they are responsible for reviewing them for accuracy and compliance.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Anthropic API** via the official [`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-typescript). Default model is `claude-sonnet-5-5`, called only from a server route.
- **Structured outputs:** the route builds a Zod schema for just the requested outputs and passes it as `output_config.format`, so the model must return JSON in that shape. The response is validated again with the same schema before it reaches the browser.
- **Zod** for request validation (input length caps also bound token spend).
- **Vercel** for hosting.

### Architecture

```
Browser (React client)                     Server (Next.js route handler)
──────────────────────                     ─────────────────────────────────────────
ListingForm ──POST /api/generate──────────▶ 1. Zod-validate body (size + field caps)
                                            2. Rate limit (per IP + daily cap)
                                            3. Claude call: cached system prompt +
                                               listing facts, JSON schema output
                                            4. Validate JSON; enforce MLS limit
OutputPanel ◀──────── { outputs, meta } ─── 5. Friendly errors for every failure mode
   │
   └─ Fair Housing checker runs live on every card (client-side, no API call)
```

Regenerate reuses the same endpoint with a single output key plus the current text, so the model writes a genuinely different take instead of a near-duplicate.

## Getting started

Requires Node.js 20.9+.

```bash
git clone <your-repo-url> listinglift
cd listinglift
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000 and click **Fill sample listing** → **Generate copy**.

**No API key yet?** Set `LISTINGLIFT_MOCK=1` in `.env.local` to get template-based output with no API calls. It's useful for UI work.

### Environment variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | | From [console.anthropic.com](https://console.anthropic.com/settings/keys). Server-only. |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-5-5` | Any Claude 4.6+ model. |
| `ANTHROPIC_EFFORT` | No | `medium` | `low` / `medium` / `high` / `xhigh` / `max`. Lower is faster and cheaper. |
| `RATE_LIMIT_PER_IP` | No | `10` | Generations per IP per window. |
| `RATE_LIMIT_WINDOW_MINUTES` | No | `10` | Window length. |
| `DAILY_GENERATION_CAP` | No | `300` | Across all visitors, per UTC day. |
| `LISTINGLIFT_MOCK` | No | `0` | `1` = template output, no API calls. |

## Deploying to Vercel

1. **Push to GitHub.**
   ```bash
   git add -A && git commit -m "ListingLift" && git push
   ```
2. **Import the repo** at [vercel.com/new](https://vercel.com/new). The Next.js framework preset is detected automatically; no build settings need to change.
3. **Add environment variables** under _Settings → Environment Variables_ (or on the import screen):
   - `ANTHROPIC_API_KEY`: your key. Mark it **Sensitive**, and apply it to Production (and Preview if you want preview deploys to work).
   - Optional: `ANTHROPIC_MODEL`, `ANTHROPIC_EFFORT`, `RATE_LIMIT_PER_IP`, `RATE_LIMIT_WINDOW_MINUTES`, `DAILY_GENERATION_CAP`.
4. **Deploy.** If you add or change env vars later, redeploy (_Deployments → ⋯ → Redeploy_) so they take effect.

Or with the CLI:

```bash
npm i -g vercel
vercel link
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

The API route sets `maxDuration = 60` seconds, which leaves room for the occasional MLS "tighten" pass.

### Protecting your credits on a shared demo link

The built-in rate limiter is in-memory, so each Vercel function instance keeps its own counters. That's fine for a demo, but it's a soft limit. For stronger protection:

- Set a **monthly spend limit** for the key in the Anthropic Console (the real backstop).
- Lower `DAILY_GENERATION_CAP` for public links.
- Swap the limiter in [`lib/rateLimit.ts`](lib/rateLimit.ts) for a Redis-backed one (e.g. Upstash) for a shared, exact count.

## Project structure

```
app/
  api/generate/route.ts   API route: validate → rate-limit → Claude → validate → respond
  layout.tsx, page.tsx    Shell, fonts, metadata
components/
  ListingLift.tsx         Page state: form, outputs, loading, errors, regenerate
  ListingForm.tsx         Basics · Features · Location · Notes · Tone · Outputs
  OutputPanel.tsx         Empty / skeleton / error states and the five output cards
  OutputCard.tsx          Card shell with Copy + Regenerate, skeletons
  ComplianceChips.tsx     Yellow Fair Housing warning chips with one-click Replace
lib/
  fairHousingTerms.ts     ← the editable flagged-terms list
  fairHousing.ts          Checker + replacement logic
  prompt.ts               System prompt (static, cacheable) + user prompt builder
  generate.ts             Anthropic call, output validation, MLS limit enforcement
  types.ts                Zod schemas and shared types
  options.ts              Property types, feature chips, tones, output types
  rateLimit.ts            Per-IP + daily-cap limiter
  sampleListing.ts        The Chester County demo listing
  mock.ts                 Template output for LISTINGLIFT_MOCK=1
```

## Disclaimer

ListingLift generates drafts. The listing agent is responsible for reviewing all copy for accuracy and for compliance with the Fair Housing Act, state and local fair housing laws, MLS rules, and brokerage advertising policies before publishing.
