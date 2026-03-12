# Usage Guide

This guide explains how to use the Extrapolate application from both a user and developer perspective.

## User Features

### 1. Authentication

#### Sign In

1. Click the "Sign In" button in the navigation bar
2. Click "Sign In with Google"
3. Authorize the application
4. You'll be redirected back to the home page

#### Sign Out

1. Click your avatar in the navigation bar
2. Click "Sign Out"

### 2. Managing Credits

#### View Credit Balance

Your current credit balance is displayed in the user dropdown menu (click your avatar).

#### Purchase Credits

1. Click your avatar in the navigation bar
2. Click "Buy Credits"
3. Select a credit package
4. Complete Stripe checkout
5. Credits will be added to your account immediately

#### Credit Costs

- **Image Generation**: 10 credits per image
- **Failed Generations**: Credits are automatically refunded

### 3. Generating Age Transformations

#### Upload and Generate

1. Click "Upload Photo" or the upload button on the home page
2. Select an image from your device
   - Supported formats: JPG, PNG, WEBP
   - Maximum size: 10MB
   - Best results: Clear frontal face photo
3. Click "Confirm Upload"
4. Wait for processing (typically 30-60 seconds)
5. View your generated age transformation GIF

#### Processing Status

The application shows real-time status updates:

- **Uploading**: Image is being uploaded to storage
- **Processing**: AI model is generating the transformation
- **Complete**: GIF is ready to view
- **Failed**: Processing failed (credits refunded)

### 4. Viewing Your Gallery

1. Click "Gallery" in the navigation
2. View all your generated images
3. Click any image to view full size
4. Share images using the share button

### 5. Account Management

#### Delete Account

1. Click your avatar
2. Click "Delete Account"
3. Confirm deletion
4. All your data and images will be permanently deleted

## Developer Features

### Server Actions

Server actions are the primary way to interact with the backend.

#### Upload Action

```typescript
import { upload } from "@/app/actions/upload";

// In a form component
<form action={upload}>
  <input type="file" name="image" accept="image/*" />
  <button type="submit">Upload</button>
</form>
```

#### Checkout Action

```typescript
import { checkout } from "@/app/actions/checkout";

// Create checkout session
const formData = new FormData();
formData.append("priceId", "price_xxx");
await checkout(null, formData);
```

### Using Supabase Client

#### Client-Side

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// Get current user
const {
  data: { user },
} = await supabase.auth.getUser();

// Query data
const { data, error } = await supabase
  .from("data")
  .select("*")
  .eq("user_id", user?.id);
```

#### Server-Side

```typescript
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const cookieStore = cookies();
const supabase = createClient(cookieStore);

// Get authenticated user
const {
  data: { user },
} = await supabase.auth.getUser();
```

#### Admin Operations

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

// Bypass RLS policies
const { data, error } = await supabase
  .from("users")
  .update({ credits: 100 })
  .eq("id", userId);
```

### Real-time Subscriptions

Subscribe to database changes for live updates:

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PhotoStatus({ photoId }: { photoId: string }) {
  const [status, setStatus] = useState<string>("processing");
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`photo-${photoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "data",
          filter: `id=eq.${photoId}`,
        },
        (payload) => {
          if (payload.new.output) {
            setStatus("complete");
          } else if (payload.new.failed) {
            setStatus("failed");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId, supabase]);

  return <div>Status: {status}</div>;
}
```

### Custom Hooks

#### useUser Hook

```typescript
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading };
}
```

#### useUserData Hook

```typescript
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserData } from "@/lib/types";

export function useUserData(userId: string | undefined) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setUserData(data);
      }
      setLoading(false);
    };

    fetchUserData();

    // Subscribe to changes
    const channel = supabase
      .channel(`user-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setUserData(payload.new as UserData);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { userData, loading };
}
```

### State Management with Zustand

#### Dialog State

```typescript
import { create } from "zustand";

type DialogStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useUploadDialog = create<DialogStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

// Usage in component
function UploadButton() {
  const setOpen = useUploadDialog((s) => s.setOpen);

  return (
    <button onClick={() => setOpen(true)}>
      Upload Photo
    </button>
  );
}
```

### Working with Images

#### Upload to Supabase Storage

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

async function uploadImage(file: File, userId: string, key: string) {
  const supabase = createAdminClient();
  const buffer = await file.arrayBuffer();

  const { data, error } = await supabase.storage
    .from("input")
    .upload(`/${userId}/${key}`, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/input/${data.path}`;
}
```

#### Get Public URL

```typescript
const publicUrl = supabase.storage
  .from("output")
  .getPublicUrl(`${userId}/${photoId}`);
```

### Replicate Integration

#### Create Prediction

```typescript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const prediction = await replicate.predictions.create({
  version: "9222a21c181b707209ef12b5e0d7e94c994b58f01c7b2fec075d2e892362f13c",
  input: {
    image: imageUrl,
    target_age: "default",
  },
  webhook: `${domain}/api/webhooks/replicate/${photoId}`,
  webhook_events_filter: ["completed"],
});
```

### Stripe Integration

#### Create Checkout Session

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],
  success_url: `${domain}/?success=true`,
  cancel_url: `${domain}/?canceled=true`,
  metadata: {
    userId: user.id,
  },
});
```

### Middleware

The application uses middleware to protect routes:

```typescript
// middleware.ts
import { createClient } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect routes
  if (!user && request.nextUrl.pathname.startsWith("/gallery")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await someAction();
  if (result.status !== 200) {
    toast.error(result.message);
  }
} catch (error) {
  console.error(error);
  toast.error("An unexpected error occurred");
}
```

### 2. Loading States

Show loading indicators for async operations:

```typescript
const [loading, setLoading] = useState(false);

async function handleSubmit() {
  setLoading(true);
  try {
    await someAction();
  } finally {
    setLoading(false);
  }
}
```

### 3. Type Safety

Use TypeScript types for all data:

```typescript
import type { DataProps, UserData } from "@/lib/types";

function PhotoCard({ photo }: { photo: DataProps }) {
  // TypeScript ensures photo has correct properties
}
```

### 4. Optimistic Updates

Update UI optimistically for better UX:

```typescript
// Update UI immediately
setCredits(credits - 10);

// Then sync with server
await updateCredits(userId, -10);
```

## Next Steps

- [API Reference](./04-api-reference.md) - Detailed API documentation
- [Examples](./05-examples.md) - More code examples
- [Troubleshooting](./06-troubleshooting.md) - Common issues
