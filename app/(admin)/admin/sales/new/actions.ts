"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

export type RecordSaleState = {
  error?: string;
};

function getRequiredString(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

export async function recordSaleAction(
  _previousState: RecordSaleState,
  formData: FormData,
): Promise<RecordSaleState> {
  try {
    const productId = getRequiredString(
      formData,
      "productId",
    );

    const customerName =
      formData.get("customerName")?.toString().trim() ??
      "";

    const customerEmail =
      formData.get("customerEmail")?.toString().trim() ??
      "";

    const paymentMethod = getRequiredString(
      formData,
      "paymentMethod",
    );

    const source = getRequiredString(
      formData,
      "source",
    );

    const amountValue = getRequiredString(
      formData,
      "amount",
    );

    const amount = Number(amountValue);

    if (!Number.isFinite(amount) || amount < 0) {
      return {
        error: "Enter a valid sale amount.",
      };
    }

    if (!customerName && !customerEmail) {
      return {
        error:
          "Enter at least a customer name or email address.",
      };
    }

    const saleDate = getRequiredString(
      formData,
      "saleDate",
    );

    const notes =
      formData.get("notes")?.toString().trim() || null;

    const soldAt = new Date(`${saleDate}T12:00:00`);

    if (Number.isNaN(soldAt.getTime())) {
      return {
        error: "Enter a valid sale date.",
      };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc(
      "record_manual_sale",
      {
        p_product_id: productId,
        p_customer_name: customerName || null,
        p_customer_email: customerEmail || null,
        p_payment_method: paymentMethod,
        p_source: source,
        p_amount: amount,
        p_sold_at: soldAt.toISOString(),
        p_notes: notes,
      },
    );

    if (error) {
      console.error("Unable to record sale:", error);

      return {
        error:
          error.message || "Unable to record the sale.",
      };
    }

    if (!data) {
      return {
        error: "The sale was not created.",
      };
    }
  } catch (error) {
    console.error("Record sale action failed:", error);

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to record the sale.",
    };
  }

  revalidatePath("/admin/sales");
  redirect("/admin/sales");
}