import { NextRequest } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserData } from "@/lib/types";

export const runtime = "edge";

/**
 * Supabase webhook payload structure
 * Sent by Supabase database webhooks when table rows are modified
 */
type SupabaseWebhook = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: { [key: string]: any } | null; // New/updated record data
  schema: string;
  old_record: { [key: string]: any } | null; // Previous record data (for UPDATE/DELETE)
};

/**
 * Supabase customer webhook handler for syncing user lifecycle with Stripe
 * 
 * This endpoint receives webhooks from Supabase when users table is modified.
 * It maintains bidirectional sync between Supabase users and Stripe customers:
 * 
 * INSERT: Creates corresponding Stripe customer and links via stripe_id
 * DELETE: Removes Stripe customer when user account is deleted
 * UPDATE: Currently not handled (no Stripe sync needed for user updates)
 * 
 * This ensures every user has a Stripe customer record for payment processing,
 * and cleanup happens automatically when users are removed.
 */
export async function POST(req: NextRequest) {
  // Parse Supabase webhook payload
  const body = (await req.json()) as SupabaseWebhook;

  // Initialize Supabase admin client for database operations
  const supabase = createAdminClient();
  
  // Initialize Stripe client with environment-specific API key
  // Production uses live keys, all other environments use test keys
  const stripe = new Stripe(
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
      ? process.env.STRIPE_SECRET_KEY!
      : process.env.STRIPE_SECRET_KEY_TEST!,
  );

  // Type cast webhook records to UserData for type safety
  const record = body.record as UserData; // New/current user data
  const old_record = body.old_record as UserData; // Previous user data (for DELETE)

  // Route webhook to appropriate handler based on operation type
  switch (body.type) {
    case "INSERT":
      // User registration flow: Create Stripe customer and link to Supabase user
      // This happens when a new user signs up via Supabase Auth
      
      // Create Stripe customer with user's name and email
      // Store user_id in metadata to enable reverse lookups from Stripe to Supabase
      const customer = await stripe.customers.create({
        name: record.name,
        email: record.email,
        metadata: {
          user_id: record.id, // Critical: Links Stripe customer back to Supabase user
        },
      });

      // Update Supabase user record with Stripe customer ID
      // This enables payment operations by linking user to their Stripe customer
      await supabase
        .from("users")
        .update({ stripe_id: customer.id })
        .eq("id", record.id);

      // TODO: send welcome email?

      break;

    case "DELETE":
      // User deletion flow: Remove corresponding Stripe customer
      // This ensures GDPR compliance and prevents orphaned Stripe records
      
      // Delete Stripe customer using stripe_id from the deleted user record
      // old_record contains the user data before deletion, including stripe_id
      await stripe.customers.del(old_record?.stripe_id!);

      // TODO: send bye email?

      break;
      
    // UPDATE case intentionally not handled
    // User profile updates (name, email) don't require Stripe sync
    // Stripe customer data is only used for payment processing metadata
  }

  // Acknowledge successful webhook processing to Supabase
  return new Response("OK", { status: 200 });
}
