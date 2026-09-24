"use client";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import { useRouter } from "next/navigation";

import { DataState } from "@/app/components/DataState";
import { PageShell } from "@/app/components/PageShell";
import { useApplications } from "@/src/hooks/useApplications";
import { formatDate, statusIndicatorType, statusLabel } from "@/src/lib/format";
import type { Application } from "@/src/types/domain";

export default function ApplicationsPage() {
  const router = useRouter();
  const applications = useApplications();

  return (
    <PageShell
      title="Applications"
      description="Track every application from matched through to offer."
      counter={applications.data ? `(${applications.data.length})` : undefined}
    >
      <DataState<Application[]>
        isLoading={applications.isLoading}
        error={applications.error}
        data={applications.data}
        onRetry={() => void applications.refetch()}
        loadingText="Loading your applications"
        emptyTitle="No applications yet"
        emptyMessage="Approve a match and your applications will appear here as they progress."
        emptyAction={<Button onClick={() => router.push("/matches")}>Find matches</Button>}
      >
        {(appList) => (
          <Table<Application>
            items={appList}
            trackBy="id"
            variant="container"
            resizableColumns
            stickyHeader
            ariaLabels={{
              tableLabel: "Applications",
            }}
            header={
              <Header variant="h2" counter={`(${appList.length})`}>
                All applications
              </Header>
            }
            columnDefinitions={[
              {
                id: "jobTitle",
                header: "Role",
                cell: (item) => item.jobTitle,
                sortingField: "jobTitle",
                isRowHeader: true,
              },
              {
                id: "company",
                header: "Company",
                cell: (item) => item.company,
                sortingField: "company",
              },
              {
                id: "location",
                header: "Location",
                cell: (item) => item.location,
              },
              {
                id: "status",
                header: "Status",
                cell: (item) => (
                  <StatusIndicator type={statusIndicatorType(item.status)}>
                    {statusLabel(item.status)}
                  </StatusIndicator>
                ),
                sortingField: "status",
              },
              {
                id: "source",
                header: "Source",
                cell: (item) => item.source,
              },
              {
                id: "submittedAt",
                header: "Submitted",
                cell: (item) => formatDate(item.submittedAt),
              },
              {
                id: "lastUpdatedAt",
                header: "Last updated",
                cell: (item) => formatDate(item.lastUpdatedAt),
              },
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No applications</b>
              </Box>
            }
          />
        )}
      </DataState>
    </PageShell>
  );
}
