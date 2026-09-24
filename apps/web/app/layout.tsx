import type { Metadata } from "next";
import type { ReactNode } from "react";

// Cloudscape global design tokens + reset. Must be imported once, app-wide.
import "@cloudscape-design/global-styles/index.css";
import "./globals.css";

import { AppShell } from "./components/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "HireX",
    template: "%s · HireX",
  },
  description: "HireX — your AI job-application copilot.",
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
