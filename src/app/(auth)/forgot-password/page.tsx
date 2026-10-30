"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [demoToken, setDemoToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process request");

      setIsSent(true);
      if (data.demoResetToken) {
        setDemoToken(data.demoResetToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcf9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Logo size="lg" href="/" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-stone-900">Reset Password</h2>
        <p className="mt-1 text-sm text-stone-500">We&apos;ll generate a secure token to reset your password</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-stone-200 shadow-sm">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSent ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  Reset Token Generated
                </div>
                <p className="text-xs text-emerald-800">
                  A reset request has been processed for <span className="font-semibold">{email}</span>.
                </p>
                {demoToken && (
                  <div className="mt-3 p-2.5 rounded-lg bg-white border border-emerald-300 text-xs font-mono break-all text-stone-700">
                    <span className="font-bold text-stone-900 block mb-1">Hackathon Demo Link:</span>
                    <Link
                      href={`/reset-password?token=${demoToken}`}
                      className="text-emerald-700 underline font-semibold"
                    >
                      Click here to reset password directly &rarr;
                    </Link>
                  </div>
                )}
              </div>
              <Link href="/login" className="block text-center text-sm font-semibold text-emerald-700 mt-4">
                &larr; Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3.5 top-3 text-stone-400" />
                  <Input
                    type="email"
                    required
                    placeholder="alex@household.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full">
                Generate Reset Link
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
