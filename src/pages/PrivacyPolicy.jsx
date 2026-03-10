import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pb-24 text-white">
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-xl">Privacy Policy</h1>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-4 space-y-5 text-sm text-slate-300 leading-relaxed">
        <p>
          Your privacy is important to us. This Privacy Policy explains what information we collect,
          how we use it, and how we protect your data when you use TopShelf.
        </p>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">1. Information We Collect</h2>
          <p>To create an account, we collect the following:</p>
          <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
            <li><span className="text-white font-medium">Name</span> — to personalize your experience.</li>
            <li><span className="text-white font-medium">Email address</span> — for account management and security.</li>
            <li><span className="text-white font-medium">Username</span> — a unique identifier that allows other users to find and connect with you.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">2. How We Use Your Information</h2>
          <p>We use your information only to operate the app's features, including:</p>
          <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
            <li>Creating and managing your account.</li>
            <li>Displaying your profile to you and your accepted friends.</li>
            <li>Enabling social connections through the friend system.</li>
            <li>Showing friends' logged sessions on your home feed.</li>
          </ul>
          <p className="mt-2">We do not sell, rent, or share your personal information with third parties.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">3. Social Connections</h2>
          <p>The app includes a friend system that allows you to:</p>
          <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
            <li>Search for other users by their username.</li>
            <li>Send, receive, accept, or decline friend requests.</li>
            <li>View your friends' profiles and logged sessions.</li>
          </ul>
          <p className="mt-2">
            You can only <span className="text-white font-medium">view</span> another user's profile.
            You cannot edit, modify, or change any information on another user's account.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">4. User Interaction Limits</h2>
          <p>
            TopShelf does not support direct messaging or private communication between users.
            The only interactions between users are sending, accepting, or declining friend requests.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">5. Safety Features</h2>
          <p>To help keep the community safe and respectful, you can:</p>
          <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
            <li><span className="text-white font-medium">Block</span> other users to prevent them from interacting with you.</li>
            <li><span className="text-white font-medium">Report</span> users for inappropriate behavior, which we will review.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">6. Your Data Control</h2>
          <p>
            You are in control of your own account and information. No other user can change or edit your data.
            You can manage your account through the Settings section of the app.
          </p>
          <p className="mt-2">
            If you wish to delete your account or request removal of your personal data, please contact our support team and we will assist you promptly.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be posted within the app.
            We encourage you to review this page periodically.
          </p>
        </div>

        <p className="text-slate-500 text-xs pt-2 border-t border-slate-700/50">Last updated: March 10, 2026</p>
      </div>
    </div>
  );
}