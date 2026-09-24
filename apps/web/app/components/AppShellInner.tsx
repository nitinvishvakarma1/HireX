"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation, {
  type SideNavigationProps,
} from "@cloudscape-design/components/side-navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";

/** Primary navigation model — single source of truth for top + side nav. */
const NAV_ITEMS: ReadonlyArray<{ text: string; href: string }> = [
  { text: "Dashboard", href: "/" },
  { text: "Matches", href: "/matches" },
  { text: "Applications", href: "/applications" },
];

const SIDE_NAV_ITEMS: SideNavigationProps.Item[] = [
  { type: "link", text: "Dashboard", href: "/" },
  { type: "link", text: "Matches", href: "/matches" },
  { type: "link", text: "Applications", href: "/applications" },
];

/**
 * Application shell body: Cloudscape AppLayout with a TopNavigation header and a
 * SideNavigation, wired to the Next.js App Router (ENGINEERING_GUIDELINES §11).
 * Navigation is handled client-side via `router.push` while preserving the
 * browser's accessible link semantics.
 *
 * Rendered client-only via {@link AppShell} (`next/dynamic`, `ssr: false`):
 * Cloudscape's visual-refresh AppLayout computes its layout from the live DOM,
 * so server-rendering it produces markup that never matches the client and
 * triggers hydration errors. The app's data is fetched client-side anyway.
 */
export function AppShellInner({ children }: { children: ReactNode }): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(true);

  const activeHref = useMemo(() => {
    // Longest matching nav href wins so "/matches/123" highlights "Matches".
    const match = [...NAV_ITEMS]
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.href ?? "/";
  }, [pathname]);

  return (
    <>
      <div id="top-navigation">
        <TopNavigation
          identity={{
            href: "/",
            title: "HireX",
            onFollow: (event) => {
              event.preventDefault();
              router.push("/");
            },
          }}
          utilities={[
            {
              type: "button",
              iconName: "notification",
              ariaLabel: "Notifications",
              badge: true,
              disableUtilityCollapse: false,
            },
            {
              type: "menu-dropdown",
              text: "Candidate",
              description: "candidate@example.com",
              iconName: "user-profile",
              ariaLabel: "Account menu",
              items: [
                { id: "profile", text: "Profile" },
                { id: "preferences", text: "Job preferences" },
                { id: "signout", text: "Sign out" },
              ],
            },
          ]}
        />
      </div>
      <AppLayout
        headerSelector="#top-navigation"
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
        toolsHide
        ariaLabels={{
          navigation: "Primary navigation",
          navigationToggle: "Open navigation",
          navigationClose: "Close navigation",
        }}
        navigation={
          <SideNavigation
            activeHref={activeHref}
            header={{ href: "/", text: "HireX" }}
            items={SIDE_NAV_ITEMS}
            onFollow={(event) => {
              if (!event.detail.external) {
                event.preventDefault();
                router.push(event.detail.href);
              }
            }}
          />
        }
        content={children}
      />
    </>
  );
}
