"use client";

import { useEffect } from "react";

export function ErudaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize eruda in development mode
    if (process.env.NODE_ENV === 'development') {
      // Dynamic import for client-side only
      import("eruda").then((eruda) => {
        eruda.default.init();
      });
    }
  }, []);

  return <>{children}</>;
}
