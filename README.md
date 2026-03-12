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
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="./docs"><strong>Documentation</strong></a> ·
  <a href="#author"><strong>Author</strong></a>
</p>
<br/>

## Introduction

Extrapolate is an app for you to see how well you age by transforming your face with Artificial Intelligence.

https://user-images.githubusercontent.com/28986134/213781048-d215894d-2286-4176-a200-f745b255ecbe.mp4

## Features

- AI-powered age transformation using Replicate
- 3s GIF of your face as it ages through time
- Google OAuth authentication via Supabase
- Credit-based payment system with Stripe
- Real-time processing updates
- Image storage with Supabase Storage
- Responsive design with Tailwind CSS
- End-to-end testing with Playwright

## Documentation

Comprehensive developer documentation is available in the [`docs`](./docs) directory:

- **[Overview](./docs/01-overview.md)** - Architecture, tech stack, and core concepts
- **[Setup Guide](./docs/02-setup.md)** - Installation and configuration instructions
- **[Usage Guide](./docs/03-usage.md)** - How to use the application features
- **[API Reference](./docs/04-api-reference.md)** - Server actions, webhooks, and endpoints
- **[Examples](./docs/05-examples.md)** - Code examples and common patterns
- **[Troubleshooting](./docs/06-troubleshooting.md)** - Common issues and solutions

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/extrapolate.git
cd extrapolate

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

For detailed setup instructions, see the [Setup Guide](./docs/02-setup.md).

## Deploy Your Own

You can deploy this template to Vercel with the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-title=Extrapolate%20%E2%80%93%C2%A0See%20how%20well%20you%20age%20with%20AI&demo-description=Age%20transformation%20AI%20app%20powered%20by%20Next.js%2C%20Replicate%2C%20Upstash%2C%20and%20Cloudflare%20R2%20%2B%20Workers.&demo-url=https%3A%2F%2Fextrapolate.app%2F&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F4B2RUQ7DTvPgpf3Ra9jSC2%2Fda2571b055081a670ac9649d3ac0ac7a%2FCleanShot_2023-01-20_at_12.04.08.png&project-name=Extrapolate%20%E2%80%93%C2%A0See%20how%20well%20you%20age%20with%20AI&repository-name=extrapolate&repository-url=https%3A%2F%2Fgithub.com%2Fsteven-tey%2Fextrapolate&from=templates&integration-ids=oac_V3R1GIpkoJorr6fqyiwdhl17&env=REPLICATE_API_TOKEN%2CREPLICATE_WEBHOOK_TOKEN%2CCLOUDFLARE_WORKER_SECRET%2CPOSTMARK_TOKEN&envDescription=How%20to%20get%20these%20env%20variables%3A%20&envLink=https%3A%2F%2Fgithub.com%2Fsteven-tey%2Fextrapolate%2Fblob%2Fmain%2F.env.example)

Note that you'll need to:

- Set up a [ReplicateHQ](https://replicate.com) account to get the `REPLICATE_API_TOKEN` env var.
- Set up an [Upstash](https://upstash.com) account to get the Upstash Redis env vars.
- Create a [Cloudflare R2 instance](https://www.cloudflare.com/lp/pg-r2/) and set up a [Cloudflare Worker](https://workers.cloudflare.com/) to handle uploads & reads (instructions below).

### Cloudflare R2 setup instructions

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

## End-to-End Testing

Extrapolate uses Playwright for comprehensive end-to-end testing.

### Running Tests

1. Install dependencies:

```bash
npm install
npm run test:e2e:install
```

2. Run tests:

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Generate and view test report
npm run test:e2e:report
```

### Test Coverage

Our E2E tests cover critical user flows:

- User authentication
- Credit purchasing
- Photo upload
- Image generation
- Error handling

## Author

- Steven Tey ([@steventey](https://twitter.com/steventey))
