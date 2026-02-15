import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) {
          base44.auth.redirectToLogin(window.location.pathname + window.location.search);
        } else {
          setIsAuthenticated(true);
          
          // Redirect to Home if user just logged in and is on Settings
          const urlParams = new URLSearchParams(window.location.search);
          const justLoggedIn = urlParams.get('just_logged_in');
          if (justLoggedIn && window.location.pathname.includes('Settings')) {
            window.location.href = createPageUrl("Home");
          }
        }
      } catch (error) {
        base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}