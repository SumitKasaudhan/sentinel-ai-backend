import { supabaseAdmin } from "../../config/supabase";
import { dodo, DODO_PRODUCT_IDS } from "../../config/dodo";
import { clerkClient } from "@clerk/express";

// ── Read subscription ───────────────────────────────────────────────────
// Uses maybeSingle() instead of single() — a user with NO subscription row
// (free user who never checked out) is a valid, expected state, not an
// error. single() throws on zero rows; maybeSingle() returns null cleanly.
export const getSubscriptionStatus = async (
  clerkId: string
) => {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data; // null if no row — that's fine
};

const isActivePro = (sub: any) =>
  !!sub &&
  sub.plan === "pro" &&
  sub.status === "active";

// ── Create checkout session ─────────────────────────────────────────────
export const createCheckoutSession = async (
  clerkId: string,
  planRaw: string
) => {
  // 1. Duplicate-subscription guard
  const existingSub = await getSubscriptionStatus(clerkId);

  if (isActivePro(existingSub)) {
    return {
      blocked: true as const,
      code: "ALREADY_SUBSCRIBED",
      message: "Pro subscription already active.",
    };
  }

  // 2. Resolve product id
  const productId =
    planRaw.includes("yearly") || planRaw.includes("annual")
      ? DODO_PRODUCT_IDS.pro_yearly
      : DODO_PRODUCT_IDS.pro_monthly;

  if (!productId) {
    throw new Error(
      "Payment not configured — missing DODO price ID env vars"
    );
  }

  // 3. Clerk user details
  const user = await clerkClient.users.getUser(clerkId);
  const email = user.emailAddresses?.[0]?.emailAddress ?? "";
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

  if (!email) {
    throw new Error("No email found on user account.");
  }

  // 4. Create Dodo checkout
  const subscription = await dodo.subscriptions.create({
    billing: {
      city:    "NA",
      country: "US",
      state:   "NA",
      street:  "NA",
      zipcode: "00000",
    },
    customer:     { email, name },
    payment_link: true,
    product_id:   productId,
    quantity:     1,
    return_url:   `${process.env.FRONTEND_URL}/payment/success`,
    metadata:     { clerk_id: clerkId, plan: planRaw },
  });

  return {
    blocked: false as const,
    url: subscription.payment_link,
    subscriptionId: subscription.subscription_id,
  };
};