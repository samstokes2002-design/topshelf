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
          base44.auth.redirectToLogin(createPageUrl("Home"));
        } else {
          setIsAuthenticated(true);
          
          // After login, always redirect to Home if user is on Settings
          if (window.location.pathname.includes('Settings')) {
            window.location.href = createPageUrl("Home");
          }
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Home"));
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