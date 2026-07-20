"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PlanKey = "one_day" | "weekly" | "monthly" | "ninety_day";

type CheckoutButtonProps = {
  plan: PlanKey;
  label: string;
  className?: string;
};

export function CheckoutButton({
  plan,
  label,
  className = "",
}: CheckoutButtonProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCheckout() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
        }),
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (response.status === 401) {
        const redirectPath = `/plans?purchase=${plan}`;

        router.push(
          `/login?redirect=${encodeURIComponent(redirectPath)}`,
        );

        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to start checkout.");
      }

      if (!data.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout button error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to start checkout. Please try again.",
      );

      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className={`w-full disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {isLoading ? "Opening secure checkout..." : label}
      </button>

      {errorMessage ? (
        <p className="mt-3 text-center text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}