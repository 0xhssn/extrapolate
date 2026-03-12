# Setup Guide

This guide will walk you through setting up Extrapolate for local development.

## Prerequisites

- **Node.js**: Version 18.17.0 or higher
- **npm**: Version 9.0.0 or higher (or pnpm 9.3.0+)
- **Git**: For version control
- **Accounts**: Supabase, Replicate, and Stripe accounts

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/extrapolate.git
cd extrapolate
```

## Step 2: Install Dependencies

```bash
npm install
```

Or if using pnpm:

```bash
pnpm install
```

## Step 3: Set Up Supabase

### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for the project to be created

### 3.2 Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Alternatively, run the SQL from `supabase/schema.sql` in the Supabase SQL Editor.

### 3.3 Configure Authentication

1. Go to Authentication > Providers in Supabase dashboard
2. Enable Google OAuth provider
3. Add your OAuth credentials:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### 3.4 Set Up Storage Buckets

Create two storage buckets in Supabase:

1. **input**: For uploaded images
   - Make it public
   - Set file size limit: 10MB
   - Allowed MIME types: `image/*`

2. **output**: For generated GIFs
   - Make it public
   - Set file size limit: 50MB
   - Allowed MIME types: `image/gif`

3. **temp**: For temporary uploads
   - Make it public
   - Set file size limit: 10MB

### 3.5 Get Supabase Credentials

From your Supabase project settings:

- **Project URL**: Settings > API > Project URL
- **Anon Key**: Settings > API > Project API keys > anon public
- **Service Role Key**: Settings > API > Project API keys > service_role (keep secret!)

## Step 4: Set Up Replicate

### 4.1 Create Replicate Account

1. Go to [replicate.com](https://replicate.com)
2. Sign up for an account
3. Add payment method (pay-as-you-go)

### 4.2 Get API Token

1. Go to Account > API Tokens
2. Create a new token
3. Copy the token (you won't see it again)

## Step 5: Set Up Stripe

### 5.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete account verification

### 5.2 Create Products

Create credit packages in Stripe:

```bash
# Use Stripe CLI
stripe products create --name "50 Credits" --description "50 credits for image generation"

# Create price for the product
stripe prices create --product prod_xxx --unit-amount 500 --currency usd --metadata credits=50
```

Or use the Stripe fixtures:

```bash
npm run fixtures:products
```

### 5.3 Set Up Webhooks

1. Go to Developers > Webhooks in Stripe dashboard
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `product.created`
   - `product.updated`
   - `product.deleted`
   - `price.created`
   - `price.updated`
   - `price.deleted`
   - `checkout.session.completed`
4. Copy the webhook signing secret

For local development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5.4 Get Stripe Credentials

- **Secret Key**: Developers > API keys > Secret key
- **Webhook Secret**: Developers > Webhooks > Signing secret
- **Test Keys**: Use test mode keys for development

## Step 6: Configure Environment Variables

Create `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# Replicate
REPLICATE_API_TOKEN=r8_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Stripe (use test keys for development)
STRIPE_SECRET_KEY_TEST=sk_test_xxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxx

# Production Stripe keys (for production only)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional: For cron jobs
CRON_SECRET=your_random_secret

# Optional: For Cloudflare tunnel
TUNNEL_URL=https://your-tunnel.trycloudflare.com
```

## Step 7: Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Step 8: Test the Setup

### 8.1 Test Authentication

1. Click "Sign In" button
2. Sign in with Google
3. Verify you're redirected back to the app
4. Check that your user appears in Supabase `users` table

### 8.2 Test Credit Purchase

1. Click on user avatar
2. Click "Buy Credits"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify credits appear in your account

### 8.3 Test Image Upload

1. Click "Upload Photo"
2. Select an image with a clear face
3. Wait for processing (may take 30-60 seconds)
4. Verify the generated GIF appears

## Step 9: Set Up Testing (Optional)

### 9.1 Install Playwright Browsers

```bash
npm run test:e2e:install
```

### 9.2 Configure Test Environment

Create `.env.test`:

```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

### 9.3 Run Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui
```

## Common Setup Issues

### Issue: Supabase Connection Error

**Solution**: Verify your Supabase URL and keys are correct. Check that your IP is not blocked.

### Issue: Replicate API Error

**Solution**: Ensure you have credits in your Replicate account and the API token is valid.

### Issue: Stripe Webhook Not Receiving Events

**Solution**:

- For local development, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- For production, ensure webhook URL is publicly accessible

### Issue: OAuth Redirect Error

**Solution**: Add your redirect URL to Google OAuth settings and Supabase Auth settings.

## Next Steps

- [Usage Guide](./03-usage.md) - Learn how to use the application
- [API Reference](./04-api-reference.md) - Understand the API
- [Examples](./05-examples.md) - See code examples

## Development Tools

### Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma (for database schema)
- GitLens

### Useful Commands

```bash
# Format code
npm run format:write

# Lint code
npm run lint

# Generate Supabase types
npm run gen-types

# Run Stripe fixtures
npm run fixtures:products
npm run fixtures:webhook

# Start Cloudflare tunnel
npm run tunnel
```

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Post-Deployment Checklist

- [ ] Update Supabase OAuth redirect URLs
- [ ] Update Stripe webhook URLs
- [ ] Configure custom domain
- [ ] Set up monitoring
- [ ] Test all features in production
- [ ] Enable Vercel Analytics
