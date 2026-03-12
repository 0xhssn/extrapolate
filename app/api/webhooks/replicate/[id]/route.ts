import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

/**
 * Replicate webhook handler for processing AI model prediction results
 * 
 * This endpoint receives callbacks from Replicate when predictions complete.
 * It handles three scenarios:
 * 1. Success: Downloads output, uploads to Supabase storage, updates database
 * 2. Failure: Marks prediction as failed, refunds credits to user
 * 3. Cancellation: Same as failure - marks failed and refunds credits
 * 
 * The prediction ID is extracted from the URL path: /api/webhooks/replicate/[id]
 * Users receive real-time updates via Supabase realtime subscriptions
 */
export async function POST(req: NextRequest) {
  // Extract prediction ID from URL path
  // URL format: /api/webhooks/replicate/[id] -> split by "/" and get 5th element (index 4)
  const id = req.nextUrl.pathname.split("/")[4];
  
  // Parse webhook payload containing prediction status and output URL
  const { output, status } = await req.json();

  // Initialize Supabase admin client for database and storage operations
  const supabase = createAdminClient();

  // Retrieve user_id associated with this prediction
  // This is needed for organizing storage and processing credit refunds
  const { data, error } = await supabase
    .from("data")
    .select("user_id")
    .eq("id", id)
    .single();
    
  if (error)
    return new Response(`Error getting user_id: ${error.message}`, {
      status: 400,
    });

  // Handle successful prediction completion
  // Flow: Download output -> Upload to Supabase storage -> Update database with public URL
  // User receives the output URL via Supabase realtime subscription
  if (status === "succeeded") {
    // Download the prediction output from Replicate's CDN
    // Output is typically an image URL that needs to be persisted to our storage
    const blob = await fetch(output).then((res) => res.blob());
    
    // Upload output to Supabase storage bucket organized by user_id and prediction_id
    // This ensures outputs are isolated per user and easily retrievable
    const { data: storageData, error: storageError } = await supabase.storage
      .from("output")
      .upload(`/${data?.user_id}/${id}`, blob, {
        contentType: blob.type, // Preserve original content type (image/png, image/jpeg, etc.)
        cacheControl: "3600", // Cache for 1 hour to reduce bandwidth costs
        upsert: true, // Overwrite if prediction was retried with same ID
      });
      
    if (storageError)
      new Response(`Error saving output: ${storageError.message}`, {
        status: 400,
      });
      
    // Construct public URL for the uploaded output
    // This URL is accessible without authentication and can be displayed to users
    const outputURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/output/${storageData?.path}`;

    // Update database record with the public output URL
    // Supabase realtime will notify the user's browser of this update
    const { error } = await supabase
      .from("data")
      .update({
        output: outputURL,
      })
      .eq("id", id);
      
    if (error)
      new Response(`Error updating output url: ${error.message}`, {
        status: 400,
      });
  }

  // Handle failed or cancelled predictions
  // Flow: Mark as failed in database -> Refund credits to user
  // User receives failure notification via Supabase realtime
  else if (status === "failed" || status === "cancelled") {
    // Mark prediction as failed in database
    // This triggers UI updates to show error state to the user
    const { error } = await supabase
      .from("data")
      .update({ failed: true })
      .eq("id", id);
      
    if (error)
      new Response(`Error updating failed: ${error.message}`, { status: 400 });

    // Re-fetch user_id for credit refund operation
    // Note: This is redundant as we already have user_id from line 13
    // Keeping for consistency with existing code structure
    const { data, error: user_id_error } = await supabase
      .from("data")
      .select("user_id")
      .eq("id", id)
      .single();
      
    if (user_id_error || !data.user_id)
      new Response(`Error getting user_id: ${user_id_error?.message}`, {
        status: 400,
      });

    // Refund credits to user since prediction failed
    // Standard refund is 10 credits (the cost of one prediction)
    // Uses stored procedure to ensure atomic credit updates
    if (data?.user_id) {
      const { error } = await supabase.rpc("update_credits", {
        user_id: data.user_id,
        credit_amount: 10, // Refund amount matches prediction cost
      });
      
      if (error)
        new Response(`Error returning credits: ${error.message}`, {
          status: 400,
        });
    }
  }

  // Acknowledge successful webhook processing to Replicate
  return new Response("OK", { status: 200 });
}
