"use server";

import Replicate from "replicate";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { waitUntil } from "@vercel/functions";

export async function uploadAgePredict(previousState: any, formData: FormData) {
  const replicate = new Replicate({
    // get your token from https://replicate.com/account
    auth: process.env.REPLICATE_API_TOKEN || "",
  });

  // Authenticate
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const user_id = user?.id;
  if (!user_id) return { message: "Please sign in to continue", status: 401 };

  // get image
  const image = formData.get("image") as File;
  if (!image) {
    return { message: "Missing image", status: 400 };
  }

  const buffer = await image.arrayBuffer();

  const supabaseAdmin = createAdminClient();

  const { data: storageData, error: storageError } = await supabaseAdmin.storage
    .from("temp")
    .upload(`/${user_id}/${nanoid()}`, buffer, {
      contentType: image.type,
      cacheControl: "3600",
      upsert: true,
    });
  if (storageError)
    return {
      message: "Unexpected error uploading image, please try again",
      status: 400,
    };

  try {
    // Create prediction and wait for completion using Replicate SDK
    // This keeps the API token secure on the server side
    const prediction = await replicate.predictions.create({
      version:
        "0c3080879f50097e4f7847c68a22d9586fd69196bed06239b85688d02c93d2eb",
      input: {
        image: `https://zufrwdcmaojotovkjeww.supabase.co/storage/v1/object/public/temp/${storageData?.path}`,
      },
    });

    if (
      prediction.error ||
      prediction.status === "failed" ||
      prediction.status === "canceled"
    ) {
      waitUntil(deleteImage({ path: storageData?.path }));
      return { message: "Prediction error generating age", status: 500 };
    }

    // Use Replicate SDK's wait method to poll securely on the server
    // This prevents API token exposure to the client
    const result = await replicate.wait(prediction, {
      interval: 500, // Poll every 500ms
    });

    // Clean up temp image
    waitUntil(deleteImage({ path: storageData?.path }));

    if (result.status === "succeeded" && result.output) {
      return {
        message: `You look like you are ${result.output} years old.`,
        status: 200,
      };
    } else if (result.status === "failed" || result.status === "canceled") {
      return { message: "Prediction failed to generate age", status: 500 };
    } else {
      return { message: "Unexpected prediction status", status: 500 };
    }
  } catch (e) {
    console.log("e", e);
    waitUntil(deleteImage({ path: storageData?.path }));
    return {
      message: "Unexpected error generating age, please try again",
      status: 500,
    };
  }
}

async function deleteImage({ path }: { path: string }) {
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.storage.from("temp").remove([path]);
}
