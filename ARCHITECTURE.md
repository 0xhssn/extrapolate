# Extrapolate - Repository Architecture Documentation

## Overview

Extrapolate is a Next.js 14 application that uses AI to transform user photos and show how they might age over time. The application leverages Replicate for AI model processing, Supabase for authentication and data storage, and Stripe for payment processing.

**Tech Stack:**
- **Framework:** Next.js 14.2.3 (App Router)
- **Language:** TypeScript 5.4.5
- **Runtime:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.3
- **Database:** Supabase (PostgreSQL)
- **AI Processing:** Replicate
- **Payments:** Stripe
- **Package Manager:** pnpm 9.3.0

---

## Repository Structure

```
extrapolate/
├── app/                          # Next.js 14 App Router directory
│   ├── actions/                  # Server Actions for data mutations
│   │   ├── billing.ts           # Stripe billing operations
│   │   ├── checkout.ts          # Checkout flow logic
│   │   ├── deleteAccount.ts     # Account deletion handler
│   │   ├── upload.ts            # Image upload to Supabase
│   │   └── uploadAgePredict.ts  # Age prediction upload handler
│   ├── api/                      # API Route Handlers
│   │   ├── auth/
│   │   │   └── callback/        # OAuth callback route
│   │   │       └── route.ts
│   │   └── webhooks/            # Webhook endpoints
│   │       ├── replicate/[id]/  # Replicate webhook for AI results
│   │       │   └── route.ts
│   │       ├── stripe/          # Stripe payment webhooks
│   │       │   └── route.ts
│   │       └── supabase/        # Supabase webhooks
│   │           └── customer/
│   │               └── route.ts
│   ├── gallery/                  # Gallery page (user's photos)
│   │   ├── page.tsx             # Gallery route entry
│   │   └── gallery-page.tsx     # Gallery client component
│   ├── p/[id]/                   # Dynamic photo detail page
│   │   ├── page.tsx             # Photo route entry
│   │   ├── photo-page.tsx       # Photo client component
│   │   └── not-found.tsx        # 404 for invalid photo IDs
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Homepage entry
│   └── favicon.ico               # App favicon
│
├── components/                   # React components
│   ├── aceternity-ui/           # Aceternity UI library components
│   ├── analytics/               # Analytics tracking components
│   │   ├── index.tsx
│   │   └── consent-banner.tsx   # Cookie consent banner
│   ├── home/                    # Homepage-specific components
│   │   ├── faq.tsx             # FAQ accordion
│   │   ├── photo-booth.tsx     # Photo upload interface
│   │   └── upload-dialog.tsx   # Upload modal dialog
│   ├── layout/                  # Layout components
│   │   ├── navbar.tsx          # Top navigation bar
│   │   ├── footer.tsx          # Footer component
│   │   ├── user-dropdown.tsx   # User account menu
│   │   ├── sign-in-dialog.tsx  # Authentication modal
│   │   ├── checkout-dialog.tsx # Payment checkout modal
│   │   ├── delete-account-dialog.tsx
│   │   └── terms-and-privacy.tsx
│   ├── shared/                  # Shared utility components
│   │   ├── icons/              # Icon components
│   │   │   ├── index.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── loading-dots.tsx
│   │   │   ├── loading-circle.tsx
│   │   │   ├── expanding-arrow.tsx
│   │   │   ├── google.tsx
│   │   │   ├── github.tsx
│   │   │   └── twitter.tsx
│   │   ├── modal.tsx           # Reusable modal component
│   │   ├── popover.tsx         # Popover component
│   │   ├── tooltip.tsx         # Tooltip wrapper
│   │   ├── switch.tsx          # Toggle switch
│   │   ├── leaflet.tsx         # Leaflet map component
│   │   └── counting-numbers.tsx # Animated number counter
│   ├── ui/                      # shadcn/ui components
│   │   ├── accordion.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── separator.tsx
│   │   └── sonner.tsx
│   ├── age-predict-modal.tsx    # Age prediction modal
│   ├── Banner.tsx               # Promotional banner
│   └── home-page.tsx            # Homepage main component
│
├── lib/                          # Utility libraries and helpers
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-window-size.ts
│   │   ├── use-media-query.tsx
│   │   ├── use-intersection-observer.ts
│   │   ├── use-scroll.ts
│   │   └── use-local-storage.ts
│   ├── supabase/                # Supabase client configurations
│   │   ├── admin.ts            # Admin client (service role)
│   │   ├── client.ts           # Client-side client
│   │   ├── server.ts           # Server-side client
│   │   ├── middleware.ts       # Middleware client
│   │   └── types_db.ts         # Generated database types
│   ├── utils.ts                 # General utility functions
│   ├── dub.ts                   # Dub.co analytics integration
│   ├── types.ts                 # TypeScript type definitions
│   └── constants.ts             # App-wide constants
│
├── public/                       # Static assets
│   ├── logo.png
│   ├── vercel.svg
│   ├── vercel-logotype.svg
│   ├── extrapolate-terms-of-service.pdf
│   └── extrapolate-privacy-policy.pdf
│
├── styles/                       # Global styles
│   ├── globals.css              # Global CSS and Tailwind imports
│   ├── ClashDisplay-Bold.otf    # Custom font
│   └── ClashDisplay-Semibold.otf
│
├── stripe/                       # Stripe configuration
│   ├── products.json            # Stripe product fixtures
│   └── webhook.json             # Stripe webhook fixtures
│
├── supabase/                     # Supabase configuration
│   ├── config.toml              # Supabase local config
│   ├── schema.sql               # Database schema
│   ├── seed.sql                 # Seed data
│   └── migrations/              # Database migrations
│       └── 20240514064141_init.sql
│
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.mjs              # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── components.json              # shadcn/ui configuration
├── postcss.config.js            # PostCSS configuration
├── package.json                 # Dependencies and scripts
├── pnpm-lock.yaml              # Lock file
├── vercel.json                  # Vercel deployment config
├── .env.example                 # Environment variable template
├── .envrc                       # direnv configuration
├── .gitignore                   # Git ignore rules
├── .prettierignore              # Prettier ignore rules
├── LICENSE.md                   # License file
├── README.md                    # Project readme
└── PR.md                        # Pull request template
```

---

## Core Architecture Patterns

### 1. Next.js App Router Structure

The application uses Next.js 14's App Router pattern:

- **Server Components by default** - All components are Server Components unless marked with `"use client"`
- **Server Actions** - Located in `app/actions/` for data mutations
- **Route Handlers** - API endpoints in `app/api/` following the new routing convention
- **Parallel Routes** - Dynamic routes for photo pages (`app/p/[id]/`)

### 2. Authentication Flow

Authentication is handled through Supabase Auth:

```
User → OAuth Provider (Google/GitHub)
     → Supabase Auth
     → app/api/auth/callback/route.ts
     → Session created
     → middleware.ts validates on each request
```

The middleware (`middleware.ts`) runs on every request to verify the user's session.

### 3. Data Flow

#### Upload Flow:
```
User uploads photo
  → app/actions/upload.ts (Server Action)
  → Supabase Storage (image stored)
  → Replicate API (AI processing triggered)
  → Webhook: app/api/webhooks/replicate/[id]/route.ts
  → Database updated with results
  → User notified
```

#### Payment Flow:
```
User selects plan
  → app/actions/checkout.ts
  → Stripe Checkout Session created
  → User completes payment
  → Webhook: app/api/webhooks/stripe/route.ts
  → Credits added to user account
  → Database updated
```

### 4. Database Architecture

**Supabase (PostgreSQL) Schema:**

Key tables (inferred from types and schema):
- `users` - User accounts with credits and metadata
- `data` - Photo data and AI processing results
- `products` - Stripe product information
- `prices` - Stripe pricing data
- `customers` - Stripe customer mapping

**Row Level Security (RLS):** Enabled for user data isolation

---

## Key Technologies & Integrations

### AI Processing (Replicate)

- Model: Age transformation AI model
- Webhook-based async processing
- Results stored in Supabase Storage

### Storage (Supabase Storage)

- User photos stored in Supabase buckets
- Public access URLs for sharing
- Configured in `next.config.mjs` image domains

### Payment Processing (Stripe)

- One-time credit purchases
- Webhook integration for payment verification
- Product/price management via fixtures

### Analytics

- **Dub Analytics** (`@dub/analytics`) - Link tracking and analytics
- **Google Analytics** (`@next/third-parties`) - Page view tracking
- Cookie consent banner for GDPR compliance

### Rate Limiting

- **Upstash Redis** - Rate limiting for API endpoints
- **@upstash/ratelimit** - Request throttling

---

## Component Architecture

### UI Component Libraries

1. **shadcn/ui** (`components/ui/`)
   - Accessible, customizable components built on Radix UI
   - Configured via `components.json`
   - Uses Tailwind CSS for styling

2. **Aceternity UI** (`components/aceternity-ui/`)
   - Additional UI components for enhanced UX

3. **Custom Shared Components** (`components/shared/`)
   - Reusable components for common patterns
   - Loading states, icons, modals, tooltips

### Layout Components

- **Navbar** - Authentication state, user menu, navigation
- **Footer** - Links and branding
- **Modal System** - Centralized modal management

### Feature Components

- **Photo Booth** - Main upload interface
- **Gallery** - User's photo collection
- **Photo Page** - Individual photo view with sharing

---

## Configuration Files

### `next.config.mjs`

- Image domain allowlist for Supabase, Replicate, Google
- Custom redirects for social links
- Build optimizations

### `tailwind.config.ts`

- Custom theme configuration
- Plugin integrations (forms, typography, animations)
- Design system tokens

### `tsconfig.json`

- Path aliases (`@/` → project root)
- Strict type checking enabled
- Next.js preset

### `components.json`

- shadcn/ui component configuration
- Theme and style preferences
- Component installation settings

---

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Replicate AI
REPLICATE_API_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SECRET_KEY_TEST=
STRIPE_WEBHOOK_SECRET_TEST=

# Security
CRON_SECRET=

# Cloudflare (optional)
TUNNEL_URL=
```

---

## Development Workflow

### Available Scripts

```bash
# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # Run ESLint

# Formatting
pnpm format                 # Check formatting
pnpm format:write           # Format all files

# Database
pnpm gen-types             # Generate Supabase types (local)
pnpm gen-types-2           # Generate Supabase types (remote)
pnpm gen-schema            # Dump database schema

# Stripe
pnpm fixtures:webhook      # Load webhook fixtures
pnpm fixtures:products     # Load product fixtures

# Tunneling
pnpm tunnel                # Cloudflare tunnel for webhooks
```

### Code Quality

- **ESLint** - Next.js recommended config
- **Prettier** - Automatic code formatting with Tailwind plugin
- **TypeScript** - Strict type checking

---

## Deployment

### Vercel (Recommended)

The app is optimized for Vercel deployment:

1. Environment variables configured in Vercel dashboard
2. Automatic deployments on git push
3. Preview deployments for pull requests
4. Edge middleware for authentication

### Build Requirements

- Node.js 20.x
- pnpm 9.3.0
- PostgreSQL database (Supabase)
- Stripe account with products configured
- Replicate API access

---

## Security Considerations

1. **Authentication** - Supabase Auth with OAuth providers
2. **Authorization** - Row Level Security (RLS) in Supabase
3. **API Security** - Webhook signature verification
4. **Rate Limiting** - Upstash Redis protection
5. **Environment Variables** - Never committed, using `.env.example`
6. **CORS** - Configured in webhook handlers

---

## Performance Optimizations

1. **Image Optimization** - Next.js Image component with remote patterns
2. **Code Splitting** - Automatic with App Router
3. **Server Components** - Reduced client-side JavaScript
4. **Edge Middleware** - Fast authentication checks
5. **SWR** - Client-side data fetching and caching
6. **Lazy Loading** - Dynamic imports for heavy components

---

## Testing Strategy

**Current State:** No test files present in repository

**Recommended Testing Approach:**
- Unit tests for utilities and hooks
- Integration tests for Server Actions
- E2E tests for critical user flows (upload, payment)
- Webhook testing with Stripe CLI

---

## Future Considerations

1. **Testing Infrastructure** - Add Jest/Vitest + React Testing Library
2. **Monitoring** - Error tracking (Sentry) and performance monitoring
3. **Caching Strategy** - Redis caching for expensive operations
4. **CDN** - Static asset optimization
5. **Documentation** - API documentation for webhooks
6. **Internationalization** - Multi-language support

---

## Contributing

See `PR.md` for pull request guidelines and contribution workflow.

## License

See `LICENSE.md` for licensing information.

---

**Last Updated:** March 11, 2026
**Version:** 0.1.0
