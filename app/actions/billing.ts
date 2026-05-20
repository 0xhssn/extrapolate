"use server";

import { cookies } from "next/headers";
import { getDomain } from "@/lib/utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient, getStripeCustomerField } from "@/lib/stripe";

export async function billing() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const stripe = getStripeClient();

  const { data: userData, error } = await supabase
    .from("users")
    .select("*")
    .single();
  if (error) {
    return { message: "Unable to get user data", status: 400 };
  }

  const stripeBillingSession = await stripe.billingPortal.sessions.create({
    customer: getStripeCustomerField(userData),
    return_url: getDomain(),
  });

  redirect(stripeBillingSession.url);
}
