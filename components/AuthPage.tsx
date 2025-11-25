
import React, { useState } from "react";
import { supabase } from "../supabaseClient"; 

type AuthStep = "email" | "code";

const AuthPage: React.FC = () => {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1) Ask Supabase to send a 6-digit OTP to the email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // We are using email OTP – no redirects or magic links
          shouldCreateUser: true, // set false if you only want existing users to log in
        },
      });

      if (error) {
        console.error("Error sending OTP:", error);
        setError(error.message || "Could not send login code. Please try again.");
      } else {
        setMessage("We’ve sent a 6-digit code to your email.");
        setStep("code");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2) Verify the 6-digit OTP and log the user in
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim() || !code.trim()) {
      setError("Please enter both your email and the code.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email", // <- important: email OTP (not magic link)
      });

      if (error) {
        console.error("Error verifying OTP:", error);
        setError(error.message || "Invalid or expired code. Please try again.");
        return;
      }

      if (data.session) {
        // User is now logged in – redirect inside your app
        // For example: window.location.href = "/app";
        setMessage("Logged in successfully. Redirecting…");
        window.location.href = "/"; // change to your dashboard route
      } else {
        setError("Login failed – no session returned.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Optional: allow user to go back and change email
  const handleBackToEmail = () => {
    setStep("email");
    setCode("");
    setMessage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF5EF]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-center mb-2">
          Welcome to olooAI
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Your AI business assistant, Walter, is waiting.
        </p>

        {message && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Email address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="you@example.com"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-md bg-black text-white py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Sending code…" : "Send login code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <>
            <p className="text-xs text-gray-600 mb-4">
              Enter the 6-digit code we sent to <strong>{email}</strong>.
            </p>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Login code
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="123456"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center rounded-md bg-black text-white py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Log in"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleBackToEmail}
              className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-700"
            >
              Use a different email
            </button>
          </>
        )}

        {/* If you still have a Google button somewhere, you can comment it out for now
        <div className="mt-6 text-center">
          <button className="text-xs text-gray-400" disabled>
            Google login temporarily disabled
          </button>
        </div>
        */}
      </div>
    </div>
  );
};

export default AuthPage;
