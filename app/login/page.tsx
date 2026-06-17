"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/my-trips";

  // createBrowserClient is memoized by @supabase/ssr for the same URL+key pair
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"
  );

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-5xl">📬</div>
        <h2 className="text-2xl font-black text-gray-900">Check your email</h2>
        <p className="text-gray-500 leading-relaxed">
          We sent a magic link to{" "}
          <strong className="text-gray-800">{email}</strong>.
          <br />
          Click it to sign in — no password needed.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="text-sm text-orange-600 hover:underline font-medium"
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3 select-none">✨</div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          Log in to TripVault
        </h1>
        <p className="text-gray-500 text-sm">
          We&apos;ll send a magic link — no password required
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-gray-900 placeholder-gray-400 transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg py-4 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Sending…
            </span>
          ) : (
            "Send Magic Link ✨"
          )}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#fff8f0] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-orange-300 to-pink-400 opacity-15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-300 to-orange-400 opacity-15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-8 transition-colors font-medium text-sm"
        >
          ← Back home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <Suspense
            fallback={
              <div className="h-64 flex items-center justify-center text-gray-400">
                Loading…
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
