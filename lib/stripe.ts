import Stripe from "stripe";

/**
 * Creates and returns a Stripe client initialised with the correct secret key
 * for the current environment. Uses the live key when
 * `NEXT_PUBLIC_VERCEL_ENV === "production"` and the test key otherwise.
 */
export const createStripeClient = () =>
  new Stripe(
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
      ? process.env.STRIPE_SECRET_KEY!
      : process.env.STRIPE_SECRET_KEY_TEST!,
  );
