import type Stripe from "stripe";
import { Tables } from "@/lib/supabase/types_db";

// ---------------------------------------------------------------------------
// Server Action return types
// ---------------------------------------------------------------------------

/**
 * HTTP-style status codes returned by server actions.
 * 0 is the initial/empty state used by useFormState before any submission.
 */
export type ActionStatus = 0 | 200 | 400 | 401 | 402 | 500 | 504;

/**
 * Consistent return type for all server actions.
 *
 * Actions that redirect on success (checkout, billing, upload) never reach a
 * return statement on the happy path, so they return `ActionResult` only on
 * the error path.  Actions that return on success (uploadAgePredict,
 * deleteAccount) use status 200 to indicate success.
 *
 * The initial state passed to `useFormState` should be:
 *   `{ message: "", status: 0 }`
 */
export type ActionResult = {
  message: string;
  status: ActionStatus;
};

// ---------------------------------------------------------------------------
// Database / domain types
// ---------------------------------------------------------------------------

export type DataProps = Tables<"data">;

export type UserData = Tables<"users">;

export interface Product {
  id: string;
  price_id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
}

export interface StripeProduct
  extends Omit<
    Stripe.Product,
    "default_price" | "marketing_features" | "package_dimensions" | "tax_code"
  > {
  default_price: string | null | undefined;
  marketing_features:
    | Array<{
        name: string;
      }>
    | null
    | undefined;
  package_dimensions:
    | {
        height: number;
        length: number;
        weight: number;
        width: number;
      }
    | null
    | undefined;
  tax_code: string | null | undefined;
}

export interface StripePrice
  extends Omit<
    Stripe.Price,
    "custom_unit_amount" | "product" | "recurring" | "transform_quantity"
  > {
  custom_unit_amount:
    | {
        maximum: number | null;
        minimum: number | null;
        preset: number | null;
      }
    | null
    | undefined;
  product: string | null | undefined;
  recurring:
    | {
        aggregate_usage: Stripe.Price.Recurring.AggregateUsage | null;
        interval: Stripe.Price.Recurring.Interval;
        interval_count: number;
        meter?: string | null;
        trial_period_days: number | null;
        usage_type: Stripe.Price.Recurring.UsageType;
      }
    | null
    | undefined;
  transform_quantity:
    | {
        divide_by: number;
        round: Stripe.Price.TransformQuantity.Round;
      }
    | null
    | undefined;
}
