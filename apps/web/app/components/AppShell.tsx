"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

/**
 * Client-only application shell.
 *
 * Cloudscape's visual-refresh `AppLayout` derives its layout from the live DOM
 * and cannot be server-rendered without hydration mismatches, so the shell body
 * is loaded with `ssr: false`. A minimal, dependency-free placeholder is shown
 * for the brief moment before the client bundle mounts (the shell renders no
 * data itself — pages fetch client-side).
 */
const AppShellInner = dynamic(
  () => import("./AppShellInner").then((m) => m.AppShellInner),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Loading HireX"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#5f6b7a",
          font: "500 14px/1.4 system-ui, sans-serif",
        }}
      >
        Loading HireX…
      </div>
    ),
  },
);

export function AppShell({ children }: { children: ReactNode }): ReactNode {
  return <AppShellInner>{children}</AppShellInner>;
}
