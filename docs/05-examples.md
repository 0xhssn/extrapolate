# Examples

Practical code examples for common tasks in Extrapolate.

## Table of Contents

1. [Authentication](#authentication)
2. [Credit Management](#credit-management)
3. [Image Upload](#image-upload)
4. [Real-time Updates](#real-time-updates)
5. [Custom Components](#custom-components)
6. [Database Queries](#database-queries)
7. [Testing](#testing)

---

## Authentication

### Sign In Component

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function SignInButton() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSignIn} disabled={loading}>
      {loading ? "Signing in..." : "Sign In with Google"}
    </Button>
  );
}
```

### Protected Route Component

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

### Get User Server-Side

```typescript
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
    </div>
  );
}
```

---

## Credit Management

### Display Credit Balance

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserData } from "@/lib/types";

export function CreditBalance({ userId }: { userId: string }) {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCredits = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setCredits(data.credits);
      }
      setLoading(false);
    };

    fetchCredits();

    // Subscribe to credit updates
    const channel = supabase
      .channel(`credits-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setCredits((payload.new as UserData).credits);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold">{credits}</span>
      <span className="text-sm text-muted-foreground">credits</span>
    </div>
  );
}
```

### Purchase Credits Form

```typescript
"use client";

import { checkout } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";
import { useFormState, useFormStatus } from "react-dom";
import type { Product } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Processing..." : "Buy Now"}
    </Button>
  );
}

export function CreditPackage({ product }: { product: Product }) {
  const [state, formAction] = useFormState(checkout, { message: "", status: 0 });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="priceId" value={product.price_id} />

      <div className="border rounded-lg p-6">
        <h3 className="text-2xl font-bold">{product.name}</h3>
        <p className="text-muted-foreground">{product.description}</p>
        <p className="text-3xl font-bold mt-4">
          ${(product.price / 100).toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">
          {product.credits} credits
        </p>
      </div>

      <SubmitButton />

      {state.message && (
        <p className={state.status === 200 ? "text-green-600" : "text-red-600"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
```

---

## Image Upload

### Upload Form with Preview

```typescript
"use client";

import { upload } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { useFormState, useFormStatus } from "react-dom";
import { useState, ChangeEvent } from "react";
import Image from "next/image";

function UploadButton({ hasImage }: { hasImage: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={!hasImage || pending}>
      {pending ? "Uploading..." : "Generate"}
    </Button>
  );
}

export function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction] = useFormState(upload, { message: "", status: 0 });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form action={formAction} className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        {preview ? (
          <div className="relative w-full h-64">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, WEBP up to 10MB
            </p>
          </div>
        )}

        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-4"
          required
        />
      </div>

      <UploadButton hasImage={!!preview} />

      {state.message && (
        <p className={state.status === 200 ? "text-green-600" : "text-red-600"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
```

### Direct Upload to Storage

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";

export async function uploadToStorage(
  file: File,
  userId: string,
  bucket: "input" | "output" | "temp",
) {
  const supabase = createAdminClient();
  const key = nanoid();
  const buffer = await file.arrayBuffer();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(`/${userId}/${key}`, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}`;

  return { key, url: publicUrl };
}
```

---

## Real-time Updates

### Photo Processing Status

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DataProps } from "@/lib/types";

export function PhotoStatus({ photoId }: { photoId: string }) {
  const [photo, setPhoto] = useState<DataProps | null>(null);
  const [status, setStatus] = useState<"processing" | "complete" | "failed">("processing");
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchPhoto = async () => {
      const { data, error } = await supabase
        .from("data")
        .select("*")
        .eq("id", photoId)
        .single();

      if (!error && data) {
        setPhoto(data);
        if (data.output) setStatus("complete");
        if (data.failed) setStatus("failed");
      }
    };

    fetchPhoto();

    // Subscribe to updates
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
          const newData = payload.new as DataProps;
          setPhoto(newData);

          if (newData.output) {
            setStatus("complete");
          } else if (newData.failed) {
            setStatus("failed");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId, supabase]);

  return (
    <div>
      {status === "processing" && (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span>Processing your image...</span>
        </div>
      )}

      {status === "complete" && photo?.output && (
        <div>
          <p className="text-green-600 mb-4">Complete!</p>
          <img src={photo.output} alt="Generated" className="rounded-lg" />
        </div>
      )}

      {status === "failed" && (
        <p className="text-red-600">
          Processing failed. Your credits have been refunded.
        </p>
      )}
    </div>
  );
}
```

### Live User Count

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LiveUserCount() {
  const [count, setCount] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel("online-users");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-sm">{count} users online</span>
    </div>
  );
}
```

---

## Custom Components

### Loading Skeleton

```typescript
export function PhotoSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-64 rounded-lg" />
      <div className="space-y-2">
        <div className="bg-muted h-4 w-3/4 rounded" />
        <div className="bg-muted h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}
```

### Error Boundary

```typescript
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-500 rounded-lg">
            <h2 className="text-red-600 font-bold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message}
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Infinite Scroll Gallery

```typescript
"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DataProps } from "@/lib/types";

export function InfiniteGallery({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<DataProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("data")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(photos.length, photos.length + 9);

    if (!error && data) {
      setPhotos((prev) => [...prev, ...data]);
      setHasMore(data.length === 10);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [photos, loading, hasMore]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="border rounded-lg overflow-hidden">
            {photo.output && (
              <img src={photo.output} alt="Generated" className="w-full" />
            )}
          </div>
        ))}
      </div>

      {loading && <div className="text-center py-4">Loading...</div>}
      {!hasMore && <div className="text-center py-4">No more photos</div>}

      <div ref={observerRef} className="h-10" />
    </div>
  );
}
```

---

## Database Queries

### Get User's Photos

```typescript
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getUserPhotos(userId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("data")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching photos:", error);
    return [];
  }

  return data;
}
```

### Get Photo by ID

```typescript
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getPhotoById(photoId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("data")
    .select("*")
    .eq("id", photoId)
    .single();

  if (error) {
    console.error("Error fetching photo:", error);
    return null;
  }

  return data;
}
```

### Get Products with Prices

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

export async function getProducts() {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_products");

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data;
}
```

---

## Testing

### Playwright Test Example

```typescript
import { test, expect } from "@playwright/test";

test.describe("Photo Upload Flow", () => {
  test("should upload and process photo", async ({ page }) => {
    // Navigate to app
    await page.goto("/");

    // Sign in (mock or real)
    await page.getByRole("button", { name: /sign in/i }).click();
    // ... handle OAuth flow

    // Upload photo
    await page.getByRole("button", { name: /upload/i }).click();
    await page.setInputFiles('input[type="file"]', "./test-image.jpg");
    await page.getByRole("button", { name: /generate/i }).click();

    // Wait for processing
    await page.waitForSelector('[data-testid="output-image"]', {
      timeout: 60000,
    });

    // Verify result
    const output = await page.getByTestId("output-image");
    expect(output).toBeVisible();
  });
});
```

---

## Next Steps

- [Troubleshooting](./06-troubleshooting.md) - Debug common issues
- [API Reference](./04-api-reference.md) - Detailed API docs
