"use client";

import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { useRouter } from "next/navigation";

import { DataState } from "@/app/components/DataState";
import { PageShell } from "@/app/components/PageShell";
import { useApplications } from "@/src/hooks/useApplications";
import { useMatches } from "@/src/hooks/useMatches";
import { statusIndicatorType, statusLabel } from "@/src/lib/format";
import type { Application } from "@/src/types/domain";

function MetricTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <Box variant="awsui-key-label">{label}</Box>
      <Box variant="awsui-value-large">{value}</Box>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const matches = useMatches();
  const applications = useApplications();

  return (
    <PageShell
      title="Dashboard"
      description="Your job search at a glance — new matches and where each application stands."
      actions={
        <Button variant="primary" onClick={() => router.push("/matches")}>
          Review matches
        </Button>
      }
    >
      <Container header={<Header variant="h2">This week</Header>}>
        <DataState
          isLoading={matches.isLoading || applications.isLoading}
          error={(matches.error ?? applications.error) as Error | null}
          data={
            matches.data && applications.data
              ? { matches: matches.data, applications: applications.data }
              : undefined
          }
          isEmpty={() => false}
          onRetry={() => {
            void matches.refetch();
            void applications.refetch();
          }}
          loadingText="Loading your summary"
        >
          {({ matches: matchList, applications: appList }) => {
            const active = appList.filter(
              (application) => !["offer", "rejected"].includes(application.status),
            ).length;
            const offers = appList.filter((application) => application.status === "offer").length;
            return (
              <ColumnLayout columns={4} variant="text-grid">
                <MetricTile label="New matches" value={matchList.length} />
                <MetricTile label="Active applications" value={active} />
                <MetricTile label="Offers" value={offers} />
                <MetricTile label="Total tracked" value={appList.length} />
              </ColumnLayout>
            );
          }}
        </DataState>
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            actions={
              <Button onClick={() => router.push("/applications")}>View all</Button>
            }
          >
            Recent activity
          </Header>
        }
      >
        <DataState<Application[]>
          isLoading={applications.isLoading}
          error={applications.error}
          data={applications.data}
          onRetry={() => void applications.refetch()}
          loadingText="Loading recent activity"
          emptyTitle="No applications yet"
          emptyMessage="Approve a match to start tracking your applications here."
          emptyAction={
            <Button onClick={() => router.push("/matches")}>Find matches</Button>
          }
        >
          {(appList) => (
            <SpaceBetween size="s">
              {appList.slice(0, 4).map((application) => (
                <Box key={application.id}>
                  <SpaceBetween direction="horizontal" size="xs">
                    <StatusIndicator type={statusIndicatorType(application.status)}>
                      {statusLabel(application.status)}
                    </StatusIndicator>
                    <Link
                      href="/applications"
                      onFollow={(event) => {
                        event.preventDefault();
                        router.push("/applications");
                      }}
                    >
                      {application.jobTitle}
                    </Link>
                    <Box variant="span" color="text-body-secondary">
                      · {application.company}
                    </Box>
                    <Badge>{application.source}</Badge>
                  </SpaceBetween>
                </Box>
              ))}
            </SpaceBetween>
          )}
        </DataState>
      </Container>
    </PageShell>
  );
}
