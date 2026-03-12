# API Reference

Complete reference for all server actions, API routes, and webhooks in Extrapolate.

## Server Actions

Server actions are server-side functions that can be called directly from client components.

### upload

Uploads an image and initiates AI processing.

**Location**: `app/actions/upload.ts`

**Parameters**:

- `previousState`: Previous form state (for useFormState)
- `formData`: FormData containing the image file

**FormData Fields**:

- `image`: File - The image to process

**Returns**:

```typescript
{
  message: string;
  status: number;
}
```

**Status Codes**:

- `401`: User not authenticated
- `402`: Insufficient credits
- `400`: Missing image or upload error
- `500`: Replicate API error

**Example**:

```typescript
import { upload } from "@/app/actions/upload";
import { useFormState } from "react-dom";

const [state, formAction] = useFormState(upload, { message: "", status: 0 });

<form action={formAction}>
  <input type="file" name="image" accept="image/*" required />
  <button type="submit">Upload</button>
</form>
```

**Side Effects**:

- Deducts 10 credits from user account
- Creates record in `data` table
- Uploads image to Supabase Storage
- Triggers Replicate prediction
- Redirects to `/p/[id]` on success

---

### uploadAgePredict

Alternative upload action for age prediction (experimental).

**Location**: `app/actions/uploadAgePredict.ts`

**Parameters**: Same as `upload`

**Differences**:

- Uses different Replicate model
- Stores in `temp` storage bucket
- Returns prediction result directly (no redirect)

---

### checkout

Creates a Stripe checkout session for purchasing credits.

**Location**: `app/actions/checkout.ts`

**Parameters**:

- `previousState`: Previous form state
- `formData`: FormData containing price ID

**FormData Fields**:

- `priceId`: string - Stripe price ID

**Returns**:

```typescript
{
  message: string;
  status: number;
}
```

**Status Codes**:

- `401`: User not authenticated
- `400`: Missing price ID
- `500`: Stripe API error

**Example**:

```typescript
import { checkout } from "@/app/actions/checkout";

const formData = new FormData();
formData.append("priceId", "price_xxx");
await checkout(null, formData);
```

**Side Effects**:

- Creates Stripe checkout session
- Redirects to Stripe checkout page

---

### deleteAccount

Permanently deletes user account and all associated data.

**Location**: `app/actions/deleteAccount.ts`

**Parameters**:

- `previousState`: Previous form state
- `formData`: FormData (empty)

**Returns**:

```typescript
{
  message: string;
  status: number;
}
```

**Status Codes**:

- `401`: User not authenticated
- `400`: Error deleting data
- `200`: Success

**Example**:

```typescript
import { deleteAccount } from "@/app/actions/deleteAccount";

const [state, formAction] = useFormState(deleteAccount, { message: "", status: 0 });

<form action={formAction}>
  <button type="submit">Delete Account</button>
</form>
```

**Side Effects**:

- Deletes all user's images from storage
- Deletes all user's data records
- Deletes user account
- Signs out user

---

### billing

Retrieves user's billing information and credit packages.

**Location**: `app/actions/billing.ts`

**Parameters**: None

**Returns**:

```typescript
{
  products: Product[];
  userData: UserData | null;
}
```

**Types**:

```typescript
interface Product {
  id: string;
  price_id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  image: string;
  credits: number;
  created_at: string;
}
```

**Example**:

```typescript
import { billing } from "@/app/actions/billing";

const { products, userData } = await billing();
```

---

## API Routes

### GET /api/auth/callback

OAuth callback handler for Supabase authentication.

**Location**: `app/api/auth/callback/route.ts`

**Query Parameters**:

- `code`: string - OAuth authorization code

**Response**:

- Redirects to home page on success
- Redirects to error page on failure

**Example**:

```
https://your-domain.com/api/auth/callback?code=xxx
```

---

## Webhooks

### POST /api/webhooks/replicate/[id]

Receives webhook notifications from Replicate when image processing completes.

**Location**: `app/api/webhooks/replicate/[id]/route.ts`

**Runtime**: Edge

**Path Parameters**:

- `id`: string - Photo ID (nanoid)

**Request Body**:

```typescript
{
  output: string; // URL to generated GIF
  status: string; // "succeeded" | "failed" | "cancelled"
}
```

**Response**:

- `200`: Success
- `400`: Error

**Behavior**:

**On Success** (`status === "succeeded"`):

1. Downloads output GIF from Replicate
2. Uploads to Supabase Storage (`output` bucket)
3. Updates `data` table with output URL
4. User receives real-time update via Supabase Realtime

**On Failure** (`status === "failed" | "cancelled"`):

1. Updates `data` table with `failed: true`
2. Refunds 10 credits to user
3. User receives real-time update

**Example Webhook Payload**:

```json
{
  "output": "https://replicate.delivery/xxx.gif",
  "status": "succeeded"
}
```

---

### POST /api/webhooks/stripe

Receives webhook notifications from Stripe for payment and product events.

**Location**: `app/api/webhooks/stripe/route.ts`

**Runtime**: Edge

**Headers**:

- `stripe-signature`: string - Webhook signature for verification

**Request Body**: Stripe Event object

**Supported Events**:

#### Product Events

- `product.created`: Creates product in database
- `product.updated`: Updates product in database
- `product.deleted`: Deletes product from database

#### Price Events

- `price.created`: Creates price in database
- `price.updated`: Updates price in database
- `price.deleted`: Deletes price from database

#### Checkout Events

- `checkout.session.completed`: Adds credits to user account

**Response**:

- `200`: Success
- `400`: Verification failed or error

**Example: Checkout Completed**

When a user completes checkout:

1. Stripe sends `checkout.session.completed` event
2. Webhook extracts user ID and credits from metadata
3. Credits are added to user's account
4. User receives real-time credit update

**Metadata Structure**:

```typescript
{
  userId: string;
  credits: number;
}
```

---

### POST /api/webhooks/supabase/customer

Receives webhook notifications from Supabase for database events.

**Location**: `app/api/webhooks/supabase/customer/route.ts`

**Runtime**: Edge

**Request Body**:

```typescript
{
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
  old_record?: any;
}
```

**Response**:

- `200`: Success

**Use Cases**:

- Sync user data with external services
- Trigger notifications
- Analytics tracking

---

## Database Functions

### update_credits

RPC function to update user credits atomically.

**Location**: Defined in `supabase/schema.sql`

**Parameters**:

```typescript
{
  user_id: UUID;
  credit_amount: number; // Can be positive or negative
}
```

**Returns**: void

**Example**:

```typescript
await supabase.rpc("update_credits", {
  user_id: userId,
  credit_amount: -10, // Deduct 10 credits
});
```

**Behavior**:

- Atomically updates credits
- Prevents negative credit balance
- Thread-safe for concurrent operations

---

### get_products

RPC function to retrieve products with prices.

**Location**: Defined in `supabase/schema.sql`

**Parameters**: None

**Returns**:

```typescript
Array<{
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  price_id: string;
}>;
```

**Example**:

```typescript
const { data: products } = await supabase.rpc("get_products");
```

---

## Supabase Storage

### Buckets

#### input

Stores uploaded user images.

**Path Structure**: `/{user_id}/{photo_id}`

**Access**: Public read, authenticated write

**Example URL**:

```
https://xxx.supabase.co/storage/v1/object/public/input/user-id/photo-id
```

#### output

Stores generated GIF images.

**Path Structure**: `/{user_id}/{photo_id}`

**Access**: Public read, server write only

**Example URL**:

```
https://xxx.supabase.co/storage/v1/object/public/output/user-id/photo-id
```

#### temp

Stores temporary uploads.

**Path Structure**: `/{user_id}/{random_id}`

**Access**: Public read, authenticated write

**Lifecycle**: Files should be cleaned up after use

---

## Row Level Security (RLS) Policies

### users table

**SELECT**: Users can only select their own record

```sql
CREATE POLICY "Enable select for users based on user_id"
ON users FOR SELECT
USING (auth.uid() = id);
```

### data table

**ALL**: Users can perform all operations on their own data

```sql
CREATE POLICY "Enable ALL for users based on user_id"
ON data
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## Rate Limiting

Rate limiting is implemented using Upstash Redis (if configured).

**Limits**:

- Upload: 5 requests per minute per user
- Checkout: 10 requests per minute per user
- API routes: 100 requests per minute per IP

**Implementation**:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
});

const { success } = await ratelimit.limit(userId);
if (!success) {
  return { message: "Rate limit exceeded", status: 429 };
}
```

---

## Error Handling

All API routes and server actions follow consistent error handling:

**Success Response**:

```typescript
{
  message: "Success message",
  status: 200,
  data?: any
}
```

**Error Response**:

```typescript
{
  message: "Error description",
  status: 400 | 401 | 402 | 500,
  error?: string
}
```

**Common Status Codes**:

- `200`: Success
- `400`: Bad request (missing parameters, validation error)
- `401`: Unauthorized (not authenticated)
- `402`: Payment required (insufficient credits)
- `429`: Rate limit exceeded
- `500`: Internal server error

---

## TypeScript Types

### DataProps

```typescript
type DataProps = {
  id: string;
  user_id: string;
  input: string;
  output: string | null;
  images: any | null;
  failed: boolean;
  created_at: string;
};
```

### UserData

```typescript
type UserData = {
  id: string;
  email: string;
  name: string;
  image: string;
  credits: number;
  created_at: string;
};
```

### Product

```typescript
interface Product {
  id: string;
  price_id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
}
```

---

## Next Steps

- [Examples](./05-examples.md) - See practical examples
- [Troubleshooting](./06-troubleshooting.md) - Debug common issues
