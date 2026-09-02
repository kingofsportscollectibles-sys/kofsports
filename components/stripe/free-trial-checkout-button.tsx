"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FreeTrialCheckoutButtonProps = {
  label?: string;
  className?: string;
  source?: string;
};

export function FreeTrialCheckoutButton({
  label = "Start My Free Week",
  className = "",
  source = "free-week",
}: FreeTrialCheckoutButtonProps) {
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
          plan: "weekly",
          trial: true,
          source,
        }),
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (response.status === 401) {
        const returnPath = `/free-week?source=${encodeURIComponent(source)}`;

        router.push(
          `/login?redirect=${encodeURIComponent(returnPath)}`,
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to start your free Premium trial.",
        );
      }

      if (!data.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Free trial checkout error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to start your trial. Please try again.",
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
        <p className="mt-3 text-center text-sm text-red-400">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
