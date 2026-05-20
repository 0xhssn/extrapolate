<a href="https://extrapolate.app">
  <img alt="Extrapolate – See how well you age with AI" src="https://extrapolate.app/api/og">
  <h1 align="center">Extrapolate</h1>
</a>

<p align="center">
  See how well you age with AI
</p>

<p align="center">
  <a href="https://twitter.com/steventey">
    <img src="https://img.shields.io/twitter/follow/steventey?style=flat&label=steventey&logo=twitter&color=0bf&logoColor=fff" alt="Steven Tey Twitter follower count" />
  </a>
  <a href="https://github.com/steven-tey/extrapolate">
    <img src="https://img.shields.io/github/stars/steven-tey/extrapolate?label=steven-tey%2Fextrapolate" alt="Extrapolate repo star count" />
  </a>
</p>

<p align="center">
  <a href="#introduction"><strong>Introduction</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#project-structure"><strong>Project Structure</strong></a> ·
  <a href="#environment-variables"><strong>Environment Variables</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#development"><strong>Development</strong></a> ·
  <a href="#author"><strong>Author</strong></a>
</p>
<br/>

## Introduction

Extrapolate transforms your face with AI to show how you might age through time. Upload a selfie and get a GIF of your face aging — powered by Next.js, Replicate, Stripe, Supabase, Upstash, and Cloudflare R2.

## Features

- **AI Age Transformation** — 3-second GIF of your face aging through time 🧓
- **Credit-Based Purchases** — Buy credits and spend them on transformations via Stripe checkout
- **Customer Portal** — Manage billing and credits through the Stripe billing portal
- **Secure Storage** — Store & retrieve photos from Cloudflare R2 using Workers
- **Rate Limiting** — API protection via Upstash Redis rate limiting
- **Webhook Sync** — Stripe product/price catalog and customer management synced via webhooks
- **Edge Runtime** — Webhook handlers run on the Vercel Edge for low-latency processing

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Actions) |
| **Payments** | Stripe (Checkout, Billing Portal, Webhooks) |
| **Database** | Supabase (PostgreSQL, Auth, Row-Level Security) |
| **AI** | Replicate (age transformation model) |
| **Storage** | Cloudflare R2 + Cloudflare Workers |
| **Rate Limiting** | Upstash Redis |
| **Styling** | Tailwind CSS, Radix UI, Framer Motion |
| **Analytics** | Dub Analytics |
| **Package Manager** | pnpm |
| **Deployment** | Vercel (with Edge Runtime for webhooks) |

## Project Structure

```
.
├── app/
│   ├── actions/                  # Server Actions
│   │   ├── billing.ts            # Stripe billing portal redirect
│   │   ├── checkout.ts           # Stripe checkout session creation
│   │   ├── deleteAccount.ts      # Account deletion
│   │   ├── upload.ts             # Photo upload to R2
│   │   └── uploadAgePredict.ts   # Age prediction via Replicate
│   ├── api/
│   │   └── webhooks/
│   │       ├── replicate/        # Replicate webhook (prediction results)
│   │       ├── stripe/           # Stripe webhook (product/price/checkout sync)
│   │       └── supabase/
│   │           └── customer/     # Supabase webhook (customer CRUD sync to Stripe)
│   ├── gallery/                  # Gallery page
│   └── p/[id]/                   # Public photo page
├── components/                   # React components (UI, layout, shared)
├── lib/
│   ├── constants.ts              # App constants
│   ├── dub.ts                    # Dub (Dub.sh) client
│   ├── hooks/                    # Custom React hooks
│   ├── stripe.ts                 # ✨ Centralized Stripe client initialization
│   ├── supabase/                 # Supabase client (server, admin, browser, types)
│   ├── types.ts                  # Shared type definitions
│   └── utils.ts                  # Utility functions (URL, formatters, etc.)
├── public/                       # Static assets
└── stripe/                       # Stripe fixture files (for local testing)
```

### Key Modules

#### `lib/stripe.ts` — Centralized Stripe Client

All Stripe initialization is consolidated into a single utility module, eliminating duplicate environment-check logic across 4 files. It provides:

- **`getStripeClient()`** — Returns a cached `Stripe` instance with the correct secret key for the current environment (production vs. test).
- **`getStripeWebhookSecret()`** — Returns the environment-appropriate webhook signing secret.
- **`getStripeCustomerField(userData)`** — Resolves the correct Stripe customer ID field (`stripe_id` in production, `stripe_id_dev` otherwise).
- **`isProduction()`** — Reusable environment check.

## Architecture

### Stripe Integration

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Server      │────▶│  lib/stripe.ts  │────▶│  Stripe API  │
│  Actions     │     │  (shared util)  │     │              │
│  (checkout,  │     │                 │     │  - Checkout  │
│   billing)   │     │  - getStripeClient()    │  - Billing   │
├──────────────┤     │  - getStripeCustomerField()    │  Portal      │
│  Webhooks    │     │  - getStripeWebhookSecret()    └──────────────┘
│  (stripe,    │     └─────────────────┘
│   supabase)  │
└──────────────┘
```

The Stripe client is instantiated once (module-level singleton) and reused across requests. The correct secret key (`STRIPE_SECRET_KEY` or `STRIPE_SECRET_KEY_TEST`) is selected based on the `NEXT_PUBLIC_VERCEL_ENV` environment variable.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
|---|---|
| `REPLICATE_API_TOKEN` | Replicate API token for AI model inference |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin operations) |
| `STRIPE_SECRET_KEY` | Stripe secret key (production) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (production) |
| `STRIPE_SECRET_KEY_TEST` | Stripe secret key (development/testing) |
| `STRIPE_WEBHOOK_SECRET_TEST` | Stripe webhook signing secret (development/testing) |
| `CRON_SECRET` | Secret for cron job authentication |
| `TUNNEL_URL` | Cloudflare tunnel URL (for local webhook testing) |

## Deploy Your Own

You can deploy this template to Vercel with the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-title=Extrapolate%20%E2%80%93%C2%A0See%20how%20well%20you%20age%20with%20AI&demo-description=Age%20transformation%20AI%20app%20powered%20by%20Next.js%2C%20Replicate%2C%20Upstash%2C%20and%20Cloudflare%20R2%20%2B%20Workers.&demo-url=https%3A%2F%2Fextrapolate.app%2F&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F4B2RUQ7DTvPgpf3Ra9jSC2%2Fda2571b055081a670ac9649d3ac0ac7a%2FCleanShot_2023-01-20_at_12.04.08.png&project-name=Extrapolate%20%E2%80%93%C2%A0See%20how%20well%20you%20age%20with%20AI&repository-name=extrapolate&repository-url=https%3A%2F%2Fgithub.com%2Fsteven-tey%2Fextrapolate&from=templates&integration-ids=oac_V3R1GIpkoJorr6fqyiwdhl17&env=REPLICATE_API_TOKEN%2CREPLICATE_WEBHOOK_TOKEN%2CCLOUDFLARE_WORKER_SECRET%2CPOSTMARK_TOKEN&envDescription=How%20to%20get%20these%20env%20variables%3A%20&envLink=https%3A%2F%2Fgithub.com%2Fsteven-tey%2Fextrapolate%2Fblob%2Fmain%2F.env.example)

Note that you'll need to:

- Set up a [Replicate](https://replicate.com) account to get the `REPLICATE_API_TOKEN` env var.
- Set up an [Upstash](https://upstash.com) account to get the Upstash Redis env vars.
- Set up [Stripe](https://stripe.com) to get the Stripe secret and webhook keys.
- Create a [Cloudflare R2 instance](https://www.cloudflare.com/lp/pg-r2/) and set up a [Cloudflare Worker](https://workers.cloudflare.com/) to handle uploads & reads.

### Cloudflare R2 Setup Instructions

1. Go to Cloudflare and create an [R2 bucket](https://www.cloudflare.com/lp/pg-r2/).
2. Create a [Cloudflare Worker](https://workers.cloudflare.com/) using the code snippet below.
3. Bind your worker to your R2 instance under **Settings > R2 Bucket Bindings**.
4. For extra security, set an `AUTH_KEY_SECRET` variable under **Settings > Environment Variables** (you can generate a random secret [here](https://generate-secret.vercel.app/)).
5. Replace all instances of `images.extrapolate.workers.dev` in the codebase with your Cloudflare Worker endpoint.

<details>
<summary>Cloudflare Worker Code</summary>

```ts
// Check requests for a pre-shared secret
const hasValidHeader = (request, env) => {
  return request.headers.get("X-CF-Secret") === env.AUTH_KEY_SECRET;
};

function authorizeRequest(request, env, key) {
  switch (request.method) {
    case "PUT":
    case "DELETE":
      return hasValidHeader(request, env);
    case "GET":
      return true;
    default:
      return false;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    if (!authorizeRequest(request, env, key)) {
      return new Response("Forbidden", { status: 403 });
    }

    switch (request.method) {
      case "PUT":
        await env.MY_BUCKET.put(key, request.body);
        return new Response(`Put ${key} successfully!`);
      case "GET":
        const object = await env.MY_BUCKET.get(key);

        if (object === null) {
          return new Response("Object Not Found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);

        return new Response(object.body, {
          headers,
        });
      case "DELETE":
        await env.MY_BUCKET.delete(key);
        return new Response("Deleted!");

      default:
        return new Response("Method Not Allowed", {
          status: 405,
          headers: {
            Allow: "PUT, GET, DELETE",
          },
        });
    }
  },
};
```

</details>

## Development

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev

# Tunnel for webhook testing (exposes localhost via Cloudflare)
pnpm tunnel

# Seed Stripe with test products/prices
pnpm fixtures:products

# Trigger test Stripe webhook events
pnpm fixtures:webhook

# Generate Supabase types from remote schema
pnpm gen-types

# Lint
pnpm lint

# Format
pnpm format:write
```

### Stripe Webhook Testing

1. Run the dev server and tunnel: `pnpm dev` + `pnpm tunnel`
2. Set the tunnel URL as `TUNNEL_URL` in `.env.local`
3. Set up Stripe CLI webhook forwarding:
   ```bash
   stripe listen --forward-to https://your-tunnel-url.ngrok.app/api/webhooks/stripe
   ```
4. Seed test data: `pnpm fixtures:products`
5. Trigger events: `pnpm fixtures:webhook`

## Author

- Steven Tey ([@steventey](https://twitter.com/steventey))
