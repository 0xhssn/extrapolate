import { NextRequest } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StripePrice, StripeProduct } from "@/lib/types";
import type { PostgrestError } from "@supabase/supabase-js";

export const runtime = "edge";

/**
 * Stripe webhook handler for syncing product catalog and processing payments
 * 
 * This endpoint receives webhooks from Stripe and performs the following:
 * 1. Verifies webhook signature to ensure request authenticity
 * 2. Syncs product/price changes from Stripe to Supabase database
 * 3. Processes completed checkout sessions and credits user accounts
 * 
 * Handled events:
 * - product.created/updated/deleted: Sync product catalog
 * - price.created/updated/deleted: Sync pricing information
 * - checkout.session.completed: Add credits to user account after successful payment
 */
export async function POST(req: NextRequest) {
  // Parse raw body as text (required for webhook signature verification)
  const body = await req.text();
  let event: Stripe.Event;

  // Initialize Supabase admin client for database operations
  const supabase = createAdminClient();
  
  // Initialize Stripe client with environment-specific API key
  // Production uses live keys, all other environments use test keys
  const stripe = new Stripe(
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
      ? process.env.STRIPE_SECRET_KEY!
      : process.env.STRIPE_SECRET_KEY_TEST!,
  );

  // Verify webhook signature to prevent unauthorized requests
  // Use environment-specific webhook secret to match the Stripe dashboard configuration
  const webhookSecret =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
      ? process.env.STRIPE_WEBHOOK_SECRET
      : process.env.STRIPE_WEBHOOK_SECRET_TEST;
  const signature = req.headers.get("stripe-signature");
  
  try {
    // Validate that both webhook secret and signature are present
    if (!webhookSecret || !signature) {
      console.log("Webhook secret not found.");
      return new Response("Webhook secret not found.", { status: 400 });
    }
    
    // Construct and verify the Stripe event using the signature
    // This ensures the webhook came from Stripe and hasn't been tampered with
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (error) {
    // Signature verification failed - reject the request
    console.log(`Webhook Error: ${error}`);
    return new Response(`Webhook Error: ${error}`, { status: 400 });
  }

  // Type cast event data to expected types for different event handlers
  // Note: Only one of these will be used depending on event.type
  const product = event.data.object as StripeProduct;
  const price = event.data.object as StripePrice;
  const checkout = event.data.object as Stripe.Checkout.Session;

  // Track database errors across all event handlers
  let error: PostgrestError | null = null;

  // Route webhook event to appropriate handler based on event type
  switch (event.type) {
    // Product lifecycle events - sync Stripe product catalog to Supabase
    case "product.created":
      // Insert new product into database when created in Stripe
      const { error: product_insert_error } = await supabase
        .from("products")
        .insert(product);
      error = product_insert_error;
      break;
      
    case "product.updated":
      // Update existing product when modified in Stripe dashboard
      const { error: product_update_error } = await supabase
        .from("products")
        .update(product)
        .eq("id", product.id);
      error = product_update_error;
      break;
      
    case "product.deleted":
      // Remove product from database when archived/deleted in Stripe
      const { error: product_delete_error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);
      error = product_delete_error;
      break;

    // Price lifecycle events - sync Stripe pricing to Supabase
    case "price.created":
      // Insert new price point when created in Stripe
      const { error: price_insert_error } = await supabase
        .from("prices")
        .insert(price);
      error = price_insert_error;
      break;
      
    case "price.updated":
      // Update existing price when modified in Stripe
      const { error: price_update_error } = await supabase
        .from("prices")
        .update(price)
        .eq("id", price.id);
      error = price_update_error;
      break;
      
    case "price.deleted":
      // Remove price from database when archived in Stripe
      const { error: price_delete_error } = await supabase
        .from("prices")
        .delete()
        .eq("id", price.id);
      error = price_delete_error;
      break;

    // Checkout completion - process successful payments
    case "checkout.session.completed":
      // Only process if payment was successful
      // Both status and payment_status must be verified to prevent crediting unpaid sessions
      if (
        checkout.status === "complete" &&
        checkout.payment_status === "paid"
      ) {
        // Add credits to user account using stored procedure
        // client_reference_id contains the user_id set during checkout creation
        // credits amount is stored in session metadata
        const { error: checkout_error } = await supabase.rpc("update_credits", {
          user_id: checkout.client_reference_id!,
          credit_amount: Number(checkout.metadata?.credits),
        });
        error = checkout_error;
      }
      break;
      
    default:
      // Log unhandled event types for monitoring
      // This helps identify new Stripe events that may need handling
      console.log(`Unhandled event type ${event.type}.`);
      error = null;
      break;
  }

  // Check if any database operation failed
  if (error) {
    console.log(`Database Sync Error: ${error.message}`);
    return new Response(`Database Sync Error: ${error.message}`, {
      status: 400,
    });
  }

  // Acknowledge successful webhook processing to Stripe
  return new Response("OK", { status: 200 });
}
