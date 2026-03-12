# Troubleshooting

Common issues and their solutions when working with Extrapolate.

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [Authentication Issues](#authentication-issues)
3. [Upload Issues](#upload-issues)
4. [Payment Issues](#payment-issues)
5. [Database Issues](#database-issues)
6. [Deployment Issues](#deployment-issues)
7. [Performance Issues](#performance-issues)

---

## Setup Issues

### Node Version Mismatch

**Problem**: Build fails with Node version error

**Error**:

```
Error: The engine "node" is incompatible with this module
```

**Solution**:

```bash
# Check your Node version
node --version

# Install Node 18.17.0 or higher
nvm install 18.17.0
nvm use 18.17.0

# Or use the latest LTS
nvm install --lts
nvm use --lts
```

---

### Package Installation Fails

**Problem**: `npm install` fails with dependency errors

**Error**:

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, use --legacy-peer-deps
npm install --legacy-peer-deps
```

---

### Environment Variables Not Loading

**Problem**: Application can't find environment variables

**Solution**:

1. Ensure `.env.local` exists in project root
2. Restart development server after changing env vars
3. Check variable names match exactly (case-sensitive)
4. For client-side vars, use `NEXT_PUBLIC_` prefix

```bash
# Correct
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

# Wrong (won't be accessible in browser)
SUPABASE_URL=https://xxx.supabase.co
```

---

## Authentication Issues

### OAuth Redirect Error

**Problem**: After Google sign-in, redirect fails

**Error**:

```
Invalid redirect URL
```

**Solution**:

1. **Add redirect URL to Google OAuth settings**:
   - Go to Google Cloud Console
   - Navigate to APIs & Services > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add authorized redirect URI:
     ```
     https://your-project.supabase.co/auth/v1/callback
     ```

2. **Add redirect URL to Supabase**:
   - Go to Supabase Dashboard
   - Authentication > URL Configuration
   - Add to "Redirect URLs":
     ```
     http://localhost:3000/api/auth/callback
     https://your-domain.com/api/auth/callback
     ```

---

### Session Not Persisting

**Problem**: User gets logged out on page refresh

**Solution**:

1. **Check cookie settings**:

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return getCookie(name);
        },
        set(name: string, value: string, options: any) {
          setCookie(name, value, options);
        },
        remove(name: string, options: any) {
          deleteCookie(name, options);
        },
      },
    },
  );
```

2. **Check browser settings**:
   - Ensure cookies are enabled
   - Check if third-party cookies are blocked
   - Try in incognito mode to rule out extensions

---

### "User not found" Error

**Problem**: Authenticated user not found in database

**Solution**:

1. **Check if trigger is working**:

```sql
-- In Supabase SQL Editor
SELECT * FROM auth.users WHERE email = 'your-email@example.com';
SELECT * FROM public.users WHERE email = 'your-email@example.com';
```

2. **Manually create user record** (if trigger failed):

```sql
INSERT INTO public.users (id, email, name, image, credits)
SELECT id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url', 0
FROM auth.users
WHERE email = 'your-email@example.com';
```

3. **Verify trigger exists**:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## Upload Issues

### "Missing image" Error

**Problem**: Upload fails with "Missing image" error

**Solution**:

1. **Check form encoding**:

```typescript
// Ensure form has correct enctype
<form action={upload} encType="multipart/form-data">
  <input type="file" name="image" accept="image/*" />
  <button type="submit">Upload</button>
</form>
```

2. **Check file input name**:

```typescript
// Must be named "image"
<input type="file" name="image" />
```

3. **Verify file is selected**:

```typescript
const handleSubmit = (e: FormEvent) => {
  const formData = new FormData(e.currentTarget as HTMLFormElement);
  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    alert("Please select an image");
    e.preventDefault();
    return;
  }
};
```

---

### "Not enough credits" Error

**Problem**: Upload fails even with sufficient credits

**Solution**:

1. **Check credit balance**:

```sql
SELECT credits FROM users WHERE id = 'your-user-id';
```

2. **Manually add credits** (for testing):

```sql
UPDATE users SET credits = 100 WHERE id = 'your-user-id';
```

3. **Check RPC function**:

```sql
-- Test update_credits function
SELECT update_credits('your-user-id'::uuid, 10);
```

---

### Replicate API Error

**Problem**: Image processing fails with Replicate error

**Error**:

```
Prediction error generating gif
```

**Solution**:

1. **Check API token**:

```bash
# Verify token is set
echo $REPLICATE_API_TOKEN

# Test token with curl
curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/predictions
```

2. **Check Replicate account**:
   - Ensure you have credits
   - Verify billing is set up
   - Check for rate limits

3. **Check model version**:

```typescript
// Ensure model version is correct
const prediction = await replicate.predictions.create({
  version: "9222a21c181b707209ef12b5e0d7e94c994b58f01c7b2fec075d2e892362f13c",
  // ...
});
```

---

### Image Upload to Storage Fails

**Problem**: Upload to Supabase Storage fails

**Error**:

```
Error uploading image, please try again
```

**Solution**:

1. **Check storage buckets exist**:
   - Go to Supabase Dashboard > Storage
   - Verify `input`, `output`, and `temp` buckets exist
   - Ensure buckets are public

2. **Check storage policies**:

```sql
-- View storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'input';

-- Create policy if missing
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'input');
```

3. **Check file size**:
   - Maximum file size: 10MB for input
   - Compress large images before upload

---

## Payment Issues

### Stripe Webhook Not Receiving Events

**Problem**: Credits not added after purchase

**Solution**:

1. **For local development**:

```bash
# Use Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy webhook signing secret to .env.local
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxx
```

2. **For production**:
   - Go to Stripe Dashboard > Developers > Webhooks
   - Verify webhook URL is correct
   - Check webhook signing secret matches env var
   - View webhook logs for errors

3. **Test webhook manually**:

```bash
stripe trigger checkout.session.completed
```

---

### Checkout Session Creation Fails

**Problem**: Can't create Stripe checkout session

**Error**:

```
Error creating checkout session
```

**Solution**:

1. **Check Stripe keys**:

```bash
# Verify keys are set
echo $STRIPE_SECRET_KEY_TEST

# Ensure using test keys in development
# Test keys start with sk_test_
```

2. **Check price ID**:

```bash
# List prices
stripe prices list

# Verify price exists
stripe prices retrieve price_xxx
```

3. **Check product metadata**:

```typescript
// Ensure product has credits in metadata
const session = await stripe.checkout.sessions.create({
  // ...
  metadata: {
    userId: user.id,
    credits: "50", // Must be string
  },
});
```

---

### Credits Not Added After Payment

**Problem**: Payment succeeds but credits not added

**Solution**:

1. **Check webhook logs**:
   - Stripe Dashboard > Developers > Webhooks > [Your webhook]
   - View recent events
   - Check for errors

2. **Manually add credits**:

```sql
-- Add credits manually
UPDATE users SET credits = credits + 50 WHERE id = 'user-id';
```

3. **Check metadata**:

```typescript
// In webhook handler
const session = event.data.object as Stripe.Checkout.Session;
console.log("Metadata:", session.metadata);

// Ensure userId and credits are present
if (!session.metadata?.userId || !session.metadata?.credits) {
  console.error("Missing metadata");
}
```

---

## Database Issues

### RLS Policy Blocking Query

**Problem**: Query returns empty even though data exists

**Error**:

```
No rows returned
```

**Solution**:

1. **Check RLS policies**:

```sql
-- View policies
SELECT * FROM pg_policies WHERE tablename = 'data';

-- Temporarily disable RLS for testing
ALTER TABLE data DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE data ENABLE ROW LEVEL SECURITY;
```

2. **Use service role for admin operations**:

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

// Bypasses RLS
const supabase = createAdminClient();
```

---

### Migration Fails

**Problem**: Database migration fails

**Solution**:

1. **Check migration syntax**:

```bash
# Validate SQL
supabase db lint
```

2. **Run migrations manually**:

```bash
# Push to remote
supabase db push

# Or run SQL directly in Supabase dashboard
```

3. **Reset database** (development only):

```bash
supabase db reset
```

---

### Type Generation Fails

**Problem**: `npm run gen-types` fails

**Solution**:

1. **Check Supabase CLI version**:

```bash
supabase --version

# Update if needed
npm install -g supabase@latest
```

2. **Link project**:

```bash
supabase link --project-ref your-project-ref
```

3. **Generate types manually**:

```bash
supabase gen types typescript --linked > lib/supabase/types_db.ts
```

---

## Deployment Issues

### Build Fails on Vercel

**Problem**: Deployment fails during build

**Error**:

```
Error: Build failed
```

**Solution**:

1. **Check build logs** in Vercel dashboard

2. **Test build locally**:

```bash
npm run build
```

3. **Common fixes**:
   - Add all env vars to Vercel
   - Check for TypeScript errors
   - Verify all imports are correct
   - Check for missing dependencies

---

### Environment Variables Not Working in Production

**Problem**: App works locally but not in production

**Solution**:

1. **Add env vars to Vercel**:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`
   - Redeploy after adding

2. **Check variable names**:
   - Must match exactly (case-sensitive)
   - Client vars need `NEXT_PUBLIC_` prefix

3. **Redeploy**:

```bash
# Trigger new deployment
git commit --allow-empty -m "Trigger deploy"
git push
```

---

### Webhook URLs Not Working

**Problem**: Webhooks fail in production

**Solution**:

1. **Update webhook URLs**:
   - Stripe: `https://your-domain.com/api/webhooks/stripe`
   - Replicate: `https://your-domain.com/api/webhooks/replicate/[id]`

2. **Update webhook secrets**:
   - Get new signing secret from Stripe
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel

3. **Test webhooks**:

```bash
# Use Stripe CLI
stripe trigger checkout.session.completed \
  --webhook-endpoint https://your-domain.com/api/webhooks/stripe
```

---

## Performance Issues

### Slow Image Loading

**Problem**: Images load slowly

**Solution**:

1. **Use Next.js Image component**:

```typescript
import Image from "next/image";

<Image
  src={imageUrl}
  alt="Photo"
  width={500}
  height={500}
  loading="lazy"
/>
```

2. **Enable caching**:

```typescript
// In storage upload
await supabase.storage.from("output").upload(path, file, {
  cacheControl: "3600", // 1 hour
});
```

3. **Use CDN**:
   - Supabase Storage has built-in CDN
   - Ensure public URLs are used

---

### Slow Database Queries

**Problem**: Queries take too long

**Solution**:

1. **Add indexes**:

```sql
-- Index on user_id for faster lookups
CREATE INDEX idx_data_user_id ON data(user_id);

-- Index on created_at for sorting
CREATE INDEX idx_data_created_at ON data(created_at DESC);
```

2. **Optimize queries**:

```typescript
// Bad: Fetches all columns
const { data } = await supabase.from("data").select("*");

// Good: Only fetch needed columns
const { data } = await supabase.from("data").select("id, output, created_at");
```

3. **Use pagination**:

```typescript
const { data } = await supabase
  .from("data")
  .select("*")
  .range(0, 9) // First 10 items
  .order("created_at", { ascending: false });
```

---

### High Replicate Costs

**Problem**: Replicate bills are too high

**Solution**:

1. **Implement rate limiting**:

```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 per hour
});
```

2. **Increase credit cost**:

```typescript
// Charge more credits per generation
const CREDITS_PER_GENERATION = 20; // Instead of 10
```

3. **Add image validation**:

```typescript
// Reject images without faces
// Reject inappropriate images
// Limit image size
```

---

## Getting More Help

### Check Logs

**Vercel**:

```bash
# View logs
vercel logs your-project-name

# Follow logs in real-time
vercel logs your-project-name --follow
```

**Supabase**:

- Dashboard > Logs > API Logs
- Dashboard > Logs > Database Logs

**Stripe**:

- Dashboard > Developers > Logs
- Dashboard > Developers > Webhooks > [Your webhook] > Events

---

### Debug Mode

Enable debug logging:

```typescript
// lib/supabase/client.ts
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        debug: process.env.NODE_ENV === "development",
      },
    },
  );
```

---

### Community Support

- **GitHub Issues**: Report bugs and request features
- **Supabase Discord**: Get help with Supabase issues
- **Replicate Discord**: Get help with AI model issues
- **Stripe Support**: Contact for payment issues

---

## Next Steps

- [Overview](./01-overview.md) - Understand the architecture
- [Setup Guide](./02-setup.md) - Set up the project
- [Examples](./05-examples.md) - See code examples
