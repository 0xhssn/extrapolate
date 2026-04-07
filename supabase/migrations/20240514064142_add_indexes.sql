/*
  INDEXES FOR COMMON QUERY PATTERNS
  ==================================

  This migration adds indexes to eliminate full table scans across all
  hot query paths identified in the application:

  1. data.user_id  — gallery page, deleteAccount action, Replicate webhook
  2. data.user_id + failed + created_at — gallery compound filter/sort
  3. data.created_at — ORDER BY created_at DESC within per-user queries
  4. users.id      — navbar SWR fetch, upload credit check, Stripe webhook, update_credits RPC
  5. users.stripe_id — Supabase customer webhook DELETE (stripe.customers.del lookup)
  6. prices.product — get_products() JOIN prices ON products.id = prices.product
  7. products.active — get_products() WHERE products.active = true
*/

-- ---------------------------------------------------------------------------
-- TABLE: data
-- ---------------------------------------------------------------------------

-- Index 1: Gallery page query
--   .from("data")
--   .select("*")
--   .order("created_at", { ascending: false })
--   .match({ user_id: session.user.id, failed: false })
--
-- Also covers:
--   - deleteAccount: .delete().eq("user_id", user.id)
--   - Replicate webhook (failed path): second .select("user_id").eq("id", id)
--     already hits the PK; this index speeds up the RLS-filtered table scan
--
-- A partial index on (user_id, created_at DESC) WHERE failed = false lets the
-- planner satisfy the equality on user_id, filter on failed, and return rows
-- pre-sorted — avoiding a separate sort step for the gallery ORDER BY.
CREATE INDEX IF NOT EXISTS idx_data_user_id_created_at
    ON public.data (user_id, created_at DESC);

-- Index 2: Partial index used exclusively for non-failed gallery rows.
-- Keeps the index smaller and more selective than the full compound index.
CREATE INDEX IF NOT EXISTS idx_data_user_id_failed_created_at
    ON public.data (user_id, created_at DESC)
    WHERE failed = false;

-- Index 3: Realtime / photo page
--   .from("data").select("*").eq("id", id).single()
--   The primary key (data_pkey) already covers this; listed here for clarity —
--   no extra index needed.

-- ---------------------------------------------------------------------------
-- TABLE: users
-- ---------------------------------------------------------------------------

-- Index 4: Navbar SWR fetch, upload credit check, billing/checkout actions,
--          update_credits RPC, Supabase customer webhook UPDATE
--   .from("users").select("*").single()              ← RLS WHERE id = auth.uid()
--   .from("users").select("credits").eq("id", user_id)
--   .from("users").update({stripe_id}).eq("id", record.id)
--   SELECT credits … WHERE id = user_id (inside update_credits function)
--
-- The primary key (users_pkey) on id already provides O(log n) lookup by UUID.
-- An explicit B-tree index is redundant for PK columns in PostgreSQL, but we
-- document the access pattern here for completeness.  No additional index needed.

-- Index 5: Supabase customer webhook DELETE path
--   stripe.customers.del(old_record.stripe_id)   ← resolved client-side, not a DB query
--   .from("users").update({ stripe_id }).eq("id", record.id)  ← hits PK
--
-- However, if code ever needs to look up a user BY stripe_id (e.g. for future
-- subscription management or idempotency checks), a covering index is valuable.
CREATE INDEX IF NOT EXISTS idx_users_stripe_id
    ON public.users (stripe_id)
    WHERE stripe_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- TABLE: prices
-- ---------------------------------------------------------------------------

-- Index 6: get_products() function
--   JOIN prices ON products.id = prices.product
--   The join key prices.product (FK → products.id) has no index, forcing a
--   sequential scan of prices for every call to get_products().
CREATE INDEX IF NOT EXISTS idx_prices_product
    ON public.prices (product);

-- Index 7: Stripe webhook price lookups
--   .from("prices").update(price).eq("id", price.id)
--   .from("prices").delete().eq("id", price.id)
--   Already covered by prices_pkey — no additional index required.

-- ---------------------------------------------------------------------------
-- TABLE: products
-- ---------------------------------------------------------------------------

-- Index 8: get_products() WHERE products.active = true
--   Partial index so only active products are indexed; the set is expected to
--   be small (3 tiers), but adding this makes the query planner's choice
--   explicit and future-proofs the table if many inactive products accumulate.
CREATE INDEX IF NOT EXISTS idx_products_active
    ON public.products (active)
    WHERE active = true;
