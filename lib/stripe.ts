import Stripe from "stripe";

/**
 * Determines whether the app is running in a production environment.
 */
function isProduction(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
}

/**
 * Returns the appropriate Stripe secret key based on the environment.
 */
function getStripeSecretKey(): string {
  return isProduction()
    ? process.env.STRIPE_SECRET_KEY!
    : process.env.STRIPE_SECRET_KEY_TEST!;
}

/**
 * Returns the appropriate Stripe webhook secret based on the environment.
 */
export function getStripeWebhookSecret(): string | undefined {
  return isProduction()
    ? process.env.STRIPE_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;
}

/**
 * Returns the appropriate Stripe customer ID field based on the environment.
 *
 * In production, uses `stripe_id`; in non-production, uses `stripe_id_dev`.
 */
export function getStripeCustomerField(userData: {
  stripe_id?: string | null;
  stripe_id_dev?: string | null;
}): string | undefined {
  return isProduction()
    ? (userData.stripe_id ?? undefined)
    : (userData.stripe_id_dev ?? undefined);
}

/**
 * Returns whether the current environment is production.
 */
export { isProduction };

/**
 * Creates and returns a Stripe client instance configured with the
 * correct secret key for the current environment.
 *
 * This is a shared utility to avoid duplicating env-check logic across
 * server actions and API routes.
 */
let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }
  return stripeClient;
}
