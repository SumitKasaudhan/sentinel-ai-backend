import DodoPayments from "dodopayments";

if (!process.env.DODO_SECRET_KEY) {
  throw new Error(
    "DODO_SECRET_KEY is not set in environment variables"
  );
}

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_SECRET_KEY,
  environment: "test_mode", // switch to "live_mode" in production
});

export const DODO_PRODUCT_IDS = {
  pro_monthly: process.env.DODO_PRICE_ID_PRO_MONTHLY!,
  pro_yearly:  process.env.DODO_PRICE_ID_PRO_YEARLY!,
} as const;

export type PlanKey = keyof typeof DODO_PRODUCT_IDS;