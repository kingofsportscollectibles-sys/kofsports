"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

export type SaleActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const allowedSources = new Set([
  "website",
  "manual",
  "referral",
  "promotion",
  "partner",
  "giveaway",
  "import",
  "other",
]);

function readString(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

async function getOrderProtection(orderId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      source,
      metadata,
      payments (
        processor
      )
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Sale not found.");
  }

  const payments = Array.isArray(data.payments)
    ? data.payments
    : [];

  const hasStripePayment = payments.some(
    (payment) => payment.processor === "stripe",
  );

  return {
    order: data,
    hasStripePayment,
    isProtectedStripeSale:
      hasStripePayment && data.source === "website",
  };
}

export async function updateSaleAction(
  orderId: string,
  _previousState: SaleActionState,
  formData: FormData,
): Promise<SaleActionState> {
  try {
    const protection =
      await getOrderProtection(orderId);

    if (protection.isProtectedStripeSale) {
      return {
        status: "error",
        message:
          "Stripe website sales cannot be edited here. Use a refund or cancellation workflow instead.",
      };
    }

    const customerName = readString(
      formData,
      "customerName",
    );

    const customerEmail = readString(
      formData,
      "customerEmail",
    );

    const source = readString(formData, "source");
    const notes = readString(formData, "notes");
    const amountText = readString(formData, "amount");
    const soldAtText = readString(formData, "soldAt");

    if (!allowedSources.has(source)) {
      return {
        status: "error",
        message: "Select a valid sale source.",
      };
    }

    const amount = Number(amountText);

    if (!Number.isFinite(amount) || amount < 0) {
      return {
        status: "error",
        message: "Enter a valid sale amount.",
      };
    }

    const soldAt = new Date(soldAtText);

    if (Number.isNaN(soldAt.getTime())) {
      return {
        status: "error",
        message: "Enter a valid sale date.",
      };
    }

    const supabase = createAdminClient();

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        customer_name: customerName || null,
        customer_email:
          customerEmail.toLowerCase() || null,
        source,
        subtotal: amount,
        discount: 0,
        total: amount,
        notes: notes || null,
        sold_at: soldAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (orderError) {
      throw new Error(orderError.message);
    }

    const { error: itemError } = await supabase
      .from("order_items")
      .update({
        unit_price: amount,
      })
      .eq("order_id", orderId);

    if (itemError) {
      throw new Error(itemError.message);
    }

    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        amount,
        paid_at: soldAt.toISOString(),
      })
      .eq("order_id", orderId)
      .neq("processor", "stripe");

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    revalidatePath("/admin/sales");
    revalidatePath(`/admin/sales/${orderId}`);

    return {
      status: "success",
      message: "Sale updated successfully.",
    };
  } catch (error) {
    console.error("Unable to update sale:", error);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to update the sale.",
    };
  }
}

export async function deleteSaleAction(
  orderId: string,
  _previousState: SaleActionState,
  formData: FormData,
): Promise<SaleActionState> {
  try {
    const confirmation = readString(
      formData,
      "confirmation",
    );

    if (confirmation !== "DELETE") {
      return {
        status: "error",
        message:
          'Type "DELETE" to confirm removal of this sale.',
      };
    }

    const protection =
      await getOrderProtection(orderId);

    if (protection.isProtectedStripeSale) {
      return {
        status: "error",
        message:
          "Live Stripe website sales cannot be permanently deleted. They should be refunded or canceled.",
      };
    }

    const supabase = createAdminClient();

    /*
     * Remove records that reference the order before
     * deleting the order itself.
     *
     * This does not change the customer’s current profile
     * membership. That must be reviewed separately.
     */

    const { error: activityError } = await supabase
      .from("growth_activities")
      .delete()
      .eq("metadata->>order_id", orderId);

    if (activityError) {
      throw new Error(activityError.message);
    }

    const { error: membershipError } = await supabase
      .from("membership_events")
      .delete()
      .eq("order_id", orderId);

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    const { error: paymentError } = await supabase
      .from("payments")
      .delete()
      .eq("order_id", orderId);

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    const { error: itemError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemError) {
      throw new Error(itemError.message);
    }

    const { error: orderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (orderError) {
      throw new Error(orderError.message);
    }
  } catch (error) {
    console.error("Unable to delete sale:", error);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to delete the sale.",
    };
  }

  revalidatePath("/admin/sales");
  redirect("/admin/sales");
}