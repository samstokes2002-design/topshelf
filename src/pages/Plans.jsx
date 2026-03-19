import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Check, Lock, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

const FREE_FEATURES = [
  "1 profile per account",
  "Log game, practice & training sessions",
  "Scoring stats only (Goals, Assists, Shots, +/-)",
  "Season Stats tab only",
  "5 AI messages per week",
];

const PRO_FEATURES = [
  "Unlimited profiles",
  "All session types (incl. Shift Tracker)",
  "All stats categories (Defensive, Discipline, Advanced)",
  "All Stats tabs (Weekly, Monthly, Career)",
  "Unlimited AI messages",
  "Period breakdowns & advanced analytics",
];

export default function Plans() {
  const navigate = useNavigate();
  const { isPro, isLoading, currentPeriodEnd, refetch } = useSubscription();
  const [checkingOut, setCheckingOut] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await base44.functions.invoke('cancelSubscription', {});
      if (res.data?.success) {
        setCancelSuccess(true);
        setShowCancelConfirm(false);
        refetch && refetch();
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (e) {
      alert("Something went wrong. Please try again.");
    }
    setCancelling(false);
  };

  const handleUpgrade = async () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      alert("Checkout only works from the published app. Please open the app directly.");
      return;
    }

    setCheckingOut(true);
    const res = await base44.functions.invoke('createCheckoutSession', {
      successUrl: window.location.origin + createPageUrl("Profile") + "?subscribed=1",
      cancelUrl: window.location.origin + createPageUrl("Plans"),
    });
    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      alert("Something went wrong. Please try again.");
      setCheckingOut(false);
    }
  };

  return (
    <div className="px-4 pb-24">
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-xl">Plans</h1>
      </div>

      {/* Hero */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-white font-bold text-2xl mb-1">Upgrade to Pro</h2>
        <p className="text-slate-400 text-sm">Unlock everything TopShelf has to offer</p>
      </div>

      {/* Current Plan Badge */}
      {isPro && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
          <Crown className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">You're on Pro</p>
            {currentPeriodEnd && (
              <p className="text-slate-400 text-xs">Renews {new Date(currentPeriodEnd).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      )}

      {/* Cancel Success Banner */}
      {cancelSuccess && (
        <div className="bg-slate-700/60 border border-slate-600/50 rounded-2xl px-4 py-3 mb-5">
          <p className="text-slate-300 font-semibold text-sm">Subscription Cancelled</p>
          <p className="text-slate-400 text-xs mt-0.5">
            Your Pro access continues until {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : "the end of your billing period"} and won't renew.
          </p>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-2">Cancel Pro?</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Your Pro access will remain active until{" "}
              <span className="text-white font-medium">
                {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : "the end of your billing period"}
              </span>
              . After that, your account will revert to the Free plan and won't be charged again.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelConfirm(false)}
                variant="outline"
                className="flex-1 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700 rounded-xl"
              >
                Keep Pro
              </Button>
              <Button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-500/80 hover:bg-red-500 text-white rounded-xl"
              >
                {cancelling ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Yes, Cancel"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Free Plan */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Free</h3>
            <p className="text-slate-400 text-sm">Get started at no cost</p>
          </div>
          <div className="text-right">
            <span className="text-white font-bold text-2xl">$0</span>
            <p className="text-slate-500 text-xs">forever</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {FREE_FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300 text-sm">{f}</span>
            </div>
          ))}
        </div>
        {!isPro && (
          <div className="mt-4 py-2.5 rounded-xl bg-slate-700/50 text-center">
            <span className="text-slate-400 text-sm font-medium">Current Plan</span>
          </div>
        )}
      </div>

      {/* Pro Plan */}
      <div className="bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/40 rounded-2xl p-5 mb-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="text-white font-bold text-lg">Pro</h3>
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">RECOMMENDED</span>
            </div>
            <p className="text-slate-400 text-sm">Full access, no limits</p>
          </div>
          <div className="text-right">
            <span className="text-white font-bold text-2xl">$4.99</span>
            <p className="text-slate-500 text-xs">per month</p>
          </div>
        </div>
        <div className="space-y-2.5 mb-5">
          {PRO_FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-white text-sm">{f}</span>
            </div>
          ))}
        </div>

        {isPro ? (
          <div className="space-y-3">
            <div className="py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-center">
              <span className="text-amber-300 font-semibold text-sm flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" /> Active Pro Plan
              </span>
            </div>
            {!cancelSuccess && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full text-slate-500 hover:text-slate-300 text-xs text-center py-1 transition-colors"
              >
                Cancel subscription
              </button>
            )}
          </div>
        ) : (
          <Button
            onClick={handleUpgrade}
            disabled={checkingOut || isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl h-12 text-base shadow-lg shadow-amber-500/30"
          >
            {checkingOut ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro — $4.99/mo
              </>
            )}
          </Button>
        )}
      </div>

      {/* Feature comparison note */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-slate-400 text-xs leading-relaxed">
            Pro features are locked on the Free plan. If your Pro subscription expires, your account automatically returns to Free restrictions. Resubscribing instantly restores full access.
          </p>
        </div>
      </div>
    </div>
  );
}