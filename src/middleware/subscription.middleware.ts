import { supabaseAdmin } from "../config/supabase";

const requireProPlan = async (
  req: any,
  res: any,
  next: any
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

    const { data, error } =
      await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("clerk_id", clerkId)
        .single();

    if (error || !data) {
      return res.status(403).json({
        success: false,
        message: "No subscription found",
      });
    }

    if (
      data.plan !== "pro" ||
      data.status !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Pro subscription required",
      });
    }

    req.subscription = data;

    next();
  } catch (error) {
    console.error(
      "SUBSCRIPTION MIDDLEWARE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export default requireProPlan;
