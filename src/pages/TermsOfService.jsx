import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pb-24 text-white">
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-xl">Terms of Service</h1>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-4 space-y-5 text-sm text-slate-300 leading-relaxed">
        <p>
          By using TopShelf, you agree to the following Terms of Service. Please read them carefully.
          If you do not agree, you may not use the app.
        </p>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">1. Eligibility</h2>
          <p>
            You must be at least 13 years of age to use TopShelf. By creating an account, you confirm that
            you meet this requirement. If you are under 18, you should have parental or guardian consent.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">2. Your Account</h2>
          <p>
            You are responsible for maintaining the security of your account and for all activity that
            occurs under it. Please keep your login credentials private and do not share your account
            with others. If you believe your account has been compromised, contact support immediately.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">3. Acceptable Use</h2>
          <p>When using TopShelf, you agree to:</p>
          <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
            <li>Provide accurate and truthful information when creating your account and profile.</li>
            <li>Use the app only for its intended purpose — tracking your hockey performance.</li>
            <li>Not attempt to access or modify another user's account or data.</li>
            <li>Not use the app for any unlawful or harmful purpose.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">4. Content You Provide</h2>
          <p>
            You are responsible for the content you submit to the app, including your profile information and
            session logs. You agree not to submit false, misleading, or inappropriate content.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">6. Zero-Tolerance Policy for Inappropriate Language</h2>
          <p>
            TopShelf maintains a strict zero-tolerance policy for inappropriate language or content. This policy applies to all areas of the app without exception.
          </p>
          <p className="mt-2">
            <strong>Prohibited Content:</strong> Users are strictly prohibited from entering, displaying, or sharing any offensive, abusive, hateful, sexual, or inappropriate language anywhere on the platform. This includes:
          </p>
          <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
            <li>Swear words and profanity</li>
            <li>Hate speech, slurs, and discriminatory terms</li>
            <li>Sexual or explicit language</li>
            <li>Harassment or abusive language</li>
            <li>References to extremist ideologies or figures</li>
            <li>Any other language intended to demean, insult, or harm others</li>
          </ul>
          <p className="mt-2">
            <strong>Filter Evasion Prohibited:</strong> Attempting to bypass our content filters through misspellings, altered spellings, spacing tricks, character substitutions (such as F*ck, sh!t, or niga), or any other workaround is strictly prohibited and will be treated as a violation of this policy.
          </p>
          <p className="mt-2">
            <strong>Scope:</strong> This rule applies to all user input fields throughout the app, including but not limited to usernames, profile information, season names, player notes, session details, team names, and any other text you submit.
          </p>
          <p className="mt-2">
            <strong>Enforcement:</strong> Any violation of this policy may result in immediate content removal, temporary account suspension, or permanent account termination at our discretion. We do not provide warnings or appeals for violations of this zero-tolerance policy.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">7. Reporting and Blocking</h2>
          <p>
            If you encounter a user who violates these Terms, you can block or report them through the app.
            We take reports seriously and will investigate all complaints. We reserve the right to suspend or
            remove any account that violates these Terms.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">8. Account Termination</h2>
          <p>
            You may request deletion of your account at any time by contacting our support team.
            We reserve the right to suspend or terminate accounts that violate these Terms of Service
            without prior notice.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">9. Disclaimer</h2>
          <p>
            TopShelf is provided "as is" without warranties of any kind. We do not guarantee that the app
            will be error-free or uninterrupted. We are not liable for any loss or damage resulting from
            your use of the app.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-2">10. Changes to These Terms</h2>
          <p>
            We may update these Terms of Service from time to time. Continued use of the app after changes
            are posted means you accept the updated terms. We recommend reviewing this page periodically.
          </p>
        </div>

        <p className="text-slate-500 text-xs pt-2 border-t border-slate-700/50">Last updated: March 10, 2026</p>
      </div>
    </div>
  );
}