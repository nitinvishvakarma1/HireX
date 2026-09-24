"use client";

import type { ReactNode } from "react";

import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";

export interface PageShellProps {
  title: string;
  /** Supporting description rendered under the page title. */
  description?: string;
  /** Actions rendered on the right of the page header (e.g. buttons). */
  actions?: ReactNode;
  /** Optional counter shown next to the title (e.g. "(4)"). */
  counter?: string;
  children: ReactNode;
}

/**
 * Reusable page layout: a consistent Cloudscape ContentLayout + Header wrapper
 * so every route shares the same title/description/actions structure and
 * spacing (ENGINEERING_GUIDELINES §3 reuse, §11 composable components).
 */
export function PageShell({
  title,
  description,
  actions,
  counter,
  children,
}: PageShellProps): ReactNode {
  return (
    <ContentLayout
      header={
        <Header variant="h1" description={description} actions={actions} counter={counter}>
          {title}
        </Header>
      }
    >
      <SpaceBetween size="l">{children}</SpaceBetween>
    </ContentLayout>
  );
}
