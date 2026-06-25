"use client";

import { useEffect } from "react";

export function SentryUserInit() {
  useEffect(() => {
    import("@sentry/nextjs").then(({ setUser }) => {
      setUser({ id: "demo-user-1", username: "demo-user", email: "demo@werkdone.com" });
    });
  }, []);
  return null;
}
