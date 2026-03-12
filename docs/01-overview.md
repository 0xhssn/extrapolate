# Overview

## What is Extrapolate?

Extrapolate is an AI-powered web application that transforms your photos to show how you might age over time. Users can upload a photo and receive an animated GIF showing their face aging from childhood to old age.

## Architecture

### High-Level Architecture

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Supabase   │   │  Replicate  │
│   (Auth,    │   │  (AI Model) │
│  Database,  │   │             │
│  Storage)   │   └─────────────┘
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Stripe    │
│ (Payments)  │
└─────────────┘
```

### Component Architecture

```
app/
├── (pages)           # Route pages
├── actions/          # Server actions
├── api/              # API routes & webhooks
└── layout.tsx        # Root layout

components/
├── home/             # Home page components
├── layout/           # Layout components (navbar, footer)
├── shared/           # Reusable components
└── ui/               # UI primitives (shadcn/ui)

lib/
├── supabase/         # Supabase clients & utilities
├── hooks/            # Custom React hooks
├── types.ts          # TypeScript types
└── utils.ts          # Utility functions
```

## Core Concepts

### 1. User Flow

1. **Authentication**: Users sign in with Google OAuth via Supabase
2. **Credit Purchase**: Users buy credits through Stripe checkout
3. **Photo Upload**: Users upload a photo to Supabase Storage
4. **AI Processing**: Replicate processes the image using an age transformation model
5. **Result Delivery**: Processed GIF is stored and displayed to the user
6. **Gallery**: Users can view all their generated images

### 2. Credit System

- Each image generation costs **10 credits**
- Credits are purchased through Stripe
- Credits are stored in the `users` table
- Credits are deducted when processing starts
- Credits are refunded if processing fails

### 3. Real-time Updates

The application uses Supabase Realtime to provide live updates:

- Photo processing status
- Result availability
- Credit balance changes

### 4. Data Flow

```
User Upload → Supabase Storage (input) → Replicate API → Webhook
                                                            ↓
User View ← Supabase Storage (output) ← Database Update ←──┘
```

## Technology Stack

### Frontend

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Radix UI**: Accessible component primitives
- **Zustand**: State management

### Backend

- **Next.js API Routes**: Serverless API endpoints
- **Server Actions**: Server-side form handling
- **Edge Runtime**: Fast, globally distributed functions

### Services

- **Supabase**:
  - PostgreSQL database
  - Authentication (Google OAuth)
  - Storage (image files)
  - Realtime subscriptions
- **Replicate**: AI model hosting and inference
- **Stripe**: Payment processing and subscription management

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Playwright**: End-to-end testing
- **TypeScript**: Static type checking

## Database Schema

### Tables

#### `users`

Stores user account information and credits.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  image TEXT,
  credits NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `data`

Stores photo generation records.

```sql
CREATE TABLE data (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  input TEXT,
  output TEXT,
  images JSONB,
  failed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `products`

Stores Stripe product information.

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  active BOOLEAN,
  metadata JSONB
);
```

#### `prices`

Stores Stripe pricing information.

```sql
CREATE TABLE prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  unit_amount BIGINT,
  currency TEXT,
  metadata JSONB
);
```

## Security

### Authentication

- OAuth 2.0 via Supabase Auth
- Session-based authentication with HTTP-only cookies
- Middleware protection for authenticated routes

### Authorization

- Row Level Security (RLS) policies on all tables
- Users can only access their own data
- Admin operations use service role key

### API Security

- Webhook signature verification (Stripe, Replicate)
- CORS configuration
- Rate limiting (via Upstash Redis)
- Environment variable protection

## Performance

### Optimization Strategies

1. **Image Optimization**: Next.js Image component with automatic optimization
2. **Edge Functions**: API routes run on edge for low latency
3. **Caching**: Supabase Storage with cache control headers
4. **Code Splitting**: Automatic code splitting with Next.js
5. **Lazy Loading**: Components loaded on demand

### Monitoring

- Vercel Analytics for performance metrics
- Dub Analytics for link tracking
- Error tracking (configure Sentry or similar)

## Deployment

### Recommended Platform

- **Vercel**: Optimized for Next.js applications
- **Environment**: Production and Preview environments
- **CI/CD**: Automatic deployments on git push

### Environment Variables

Required environment variables:

```bash
# Replicate
REPLICATE_API_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Optional
CRON_SECRET=
TUNNEL_URL=
```

## Next Steps

- [Setup Guide](./02-setup.md) - Get the application running locally
- [API Reference](./04-api-reference.md) - Learn about available APIs
- [Examples](./05-examples.md) - See code examples
