"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage(
        "Account created. Check your email to confirm your account before logging in.",
      );
    } catch (error) {
      setIsError(true);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[72vh] items-center justify-center overflow-hidden bg-neutral-950 px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_38%)]" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-amber-400/20 bg-white p-8 shadow-2xl shadow-black/30 sm:p-10">
          <div className="flex justify-center">
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
              KofSports Premium
            </span>
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">
              {isLogin
                ? "Log in to access your KofSports member dashboard and premium picks."
                : "Create your account to begin your KofSports premium membership experience."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor={`${mode}-email`}
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                Email address
              </label>

              <input
                id={`${mode}-email`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor={`${mode}-password`}
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                Password
              </label>

              <input
                id={`${mode}-password`}
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-5 py-3.5 font-bold text-white transition hover:bg-amber-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isLogin
                  ? "Logging in..."
                  : "Creating account..."
                : isLogin
                  ? "Login"
                  : "Create Account"}
            </button>
          </form>

          {message && (
            <div
              role="status"
              className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                isError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>

            <Link
              href={isLogin ? "/signup" : "/login"}
              className="mt-2 inline-block font-bold text-amber-700 transition hover:text-amber-800"
            >
              {isLogin ? "Create an account" : "Log in"}
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/50">
          Premium sports analysis backed by a proven track record.
        </p>
      </div>
    </main>
  );
}