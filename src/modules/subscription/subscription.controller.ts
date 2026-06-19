import { Response } from "express";

import {
  getSubscriptionStatus,
  createCheckoutSession,
} from "./subscription.service";

export const getStatus = async (
  req: any,
  res: Response
) => {
  try {
    const auth = req.auth();

    const clerkId = auth.userId;

    if (!clerkId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const subscription =
      await getSubscriptionStatus(clerkId);

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error(
      "SUBSCRIPTION STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

export const createCheckout = async (
  req: any,
  res: Response
) => {
  try {
    const auth = req.auth();
    const clerkId = auth.userId;

    if (!clerkId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const planRaw: string = req.body?.plan ?? "";

    const result = await createCheckoutSession(clerkId, planRaw);

    if (result.blocked) {
      console.log(
        "[create-checkout] ⛔ Blocked duplicate checkout for clerk_id:",
        clerkId
      );
      return res.status(409).json({
        success: false,
        code: result.code,
        message: result.message,
      });
    }

    console.log("[create-checkout] ✅ payment_link:", result.url);

    return res.status(200).json({
      success: true,
      url: result.url,
      subscriptionId: result.subscriptionId,
    });
  } catch (error: any) {
    console.error("CREATE CHECKOUT ERROR:", error?.message || error);
    console.error(
      "CREATE CHECKOUT ERROR BODY:",
      JSON.stringify(error?.error ?? error?.body ?? {}, null, 2)
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Could not create checkout session. Please try again.",
    });
  }
};