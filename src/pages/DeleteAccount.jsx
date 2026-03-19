import React, { useState } from "react";
import { Shield, Trash2, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function DeleteAccount() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [faqOpen, setFaqOpen] = useState(null);

  const faqs = [
    {
      q: "What data will be deleted?",
      a: "All data associated with your account will be permanently deleted, including: your account profile, all player profiles, all session logs (games, practices, training), all season records and statistics, and any subscription information. Nothing is kept.",
    },
    {
      q: "Is deletion permanent?",
      a: "Yes. Account deletion is permanent and cannot be undone. Once your account is deleted, all your data is gone and cannot be recovered.",
    },
    {
      q: "Can I sign up again with the same email?",
      a: "Yes. After your account is fully deleted, you are free to create a new account using the same email address. It will start completely fresh with no previous data.",
    },
    {
      q: "Is any data retained after deletion?",
      a: "In most cases, no data is retained. However, for legal, security, or fraud-prevention purposes, some anonymized or minimal transactional records (e.g., payment receipts) may be retained for up to 90 days as required by law or our payment processor (Stripe). No personal profile or app data is kept.",
    },
    {
      q: "How long does it take to process my request?",
      a: "Deletion requests submitted through this form are processed within 30 days. You will receive an email confirmation once your account has been deleted. If you need faster deletion, you can delete your account instantly from within the app (Settings → Delete Account).",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your account email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError("Please enter a valid email address."); return; }
    setError("");
    setSubmitting(true);
    try {
      await base44.functions.invoke('submitDeletionRequest', { email: email.trim(), message: message.trim() });
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again or contact support@topshelfapp.com directly.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/80 border-b border-slate-700/50">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">TopShelf</h1>
            <p className="text-slate-400 text-xs">Hockey Performance Tracker · Account Deletion</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-2">Request Account Deletion</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
            Use this form to submit a request to permanently delete your <strong className="text-white">TopShelf</strong> account and all associated data. Requests are processed within 30 days.
          </p>
        </div>

        {/* In-app tip */}
        <div className="bg-sky-500/10 border border-sky-500/25 rounded-2xl px-4 py-4 mb-6 flex gap-3 items-start">
          <Shield className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sky-300 font-semibold text-sm">Want instant deletion?</p>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
              If you have access to the app, you can delete your account immediately from <strong className="text-white">Settings → Delete Account</strong>. No waiting period required.
            </p>
          </div>
        </div>

        {/* Form */}
        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Request Received</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              We've received your deletion request for <strong className="text-white">{email}</strong>. Your account and all associated data will be permanently deleted within <strong className="text-white">30 days</strong>. You'll receive a confirmation email when complete.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
            <h3 className="text-white font-semibold mb-4">Deletion Request Form</h3>

            <div className="mb-4">
              <Label className="text-slate-400 text-xs mb-1.5 block">Account Email Address *</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl placeholder:text-slate-600"
              />
              <p className="text-slate-500 text-xs mt-1">Enter the email address associated with your TopShelf account.</p>
            </div>

            <div className="mb-5">
              <Label className="text-slate-400 text-xs mb-1.5 block">Additional Message (Optional)</Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any additional context or reason for deletion (optional)..."
                className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl p-3 text-sm resize-none h-24 outline-none focus:border-sky-500/50 placeholder:text-slate-600"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-slate-900/40 border border-slate-700/30 rounded-xl px-4 py-3 mb-4">
              <p className="text-slate-400 text-xs leading-relaxed">
                By submitting this form, you confirm you are requesting <strong className="text-red-400">permanent deletion</strong> of your TopShelf account and all associated data. This action cannot be undone.
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-500/80 hover:bg-red-500 text-white font-bold rounded-xl h-12"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Submit Deletion Request
                </>
              )}
            </Button>
          </form>
        )}

        {/* What gets deleted */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-3">What will be deleted</h3>
          <ul className="space-y-2">
            {[
              "Your TopShelf account and login credentials",
              "All player profiles and personal information",
              "All session logs (games, practices, training)",
              "All season records and statistics",
              "All AI conversation history",
              "Subscription and billing information",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Trash2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-3">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-white text-sm font-medium">{faq.q}</span>
                  {faqOpen === i
                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {faqOpen === i && (
                  <div className="px-4 pb-4">
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-600 text-xs">
          <p>TopShelf Hockey Performance Tracker</p>
          <p className="mt-1">Questions? Email us at <a href="mailto:support@topshelfapp.com" className="text-sky-400 hover:text-sky-300">support@topshelfapp.com</a></p>
        </div>
      </div>
    </div>
  );
}