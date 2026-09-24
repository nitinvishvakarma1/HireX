"use client";

import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Cards from "@cloudscape-design/components/cards";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRouter } from "next/navigation";

import { DataState } from "@/app/components/DataState";
import { PageShell } from "@/app/components/PageShell";
import { useMatches } from "@/src/hooks/useMatches";
import { formatDate } from "@/src/lib/format";
import type { Match } from "@/src/types/domain";

const WORK_ARRANGEMENT_LABEL: Record<Match["workArrangement"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

function scoreColor(score: number): "green" | "blue" | "grey" {
  if (score >= 90) return "green";
  if (score >= 80) return "blue";
  return "grey";
}

export default function MatchesPage() {
  const router = useRouter();
  const matches = useMatches();

  return (
    <PageShell
      title="Matches"
      description="Roles ranked by an explainable fit score. Review and approve the ones worth applying to."
      counter={matches.data ? `(${matches.data.length})` : undefined}
    >
      <DataState<Match[]>
        isLoading={matches.isLoading}
        error={matches.error}
        data={matches.data}
        onRetry={() => void matches.refetch()}
        loadingText="Finding your best-fit roles"
        emptyTitle="No matches yet"
        emptyMessage="We're still searching for roles that fit your preferences. Check back soon."
        emptyAction={<Button onClick={() => router.push("/")}>Back to dashboard</Button>}
      >
        {(matchList) => (
          <Cards<Match>
            items={matchList}
            trackBy="id"
            ariaLabels={{
              itemSelectionLabel: (_data, item) => `Select ${item.jobTitle}`,
              selectionGroupLabel: "Match selection",
            }}
            cardDefinition={{
              header: (match) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <span>{match.jobTitle}</span>
                  <Badge color={scoreColor(match.matchScore)}>{match.matchScore}% match</Badge>
                </SpaceBetween>
              ),
              sections: [
                {
                  id: "company",
                  header: "Company",
                  content: (match) => match.company,
                },
                {
                  id: "location",
                  header: "Location",
                  content: (match) =>
                    `${match.location} · ${WORK_ARRANGEMENT_LABEL[match.workArrangement]}`,
                },
                {
                  id: "salary",
                  header: "Salary range",
                  content: (match) => match.salaryRange ?? "Not disclosed",
                },
                {
                  id: "reasons",
                  header: "Why it fits",
                  content: (match) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      {match.matchReasons.map((reason) => (
                        <Badge key={reason}>{reason}</Badge>
                      ))}
                    </SpaceBetween>
                  ),
                },
                {
                  id: "discovered",
                  header: "Discovered",
                  content: (match) => (
                    <Box color="text-body-secondary">{formatDate(match.discoveredAt)}</Box>
                  ),
                },
                {
                  id: "actions",
                  content: (match) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="primary" ariaLabel={`Review ${match.jobTitle}`}>
                        Review &amp; approve
                      </Button>
                      <Button variant="link" ariaLabel={`Dismiss ${match.jobTitle}`}>
                        Dismiss
                      </Button>
                    </SpaceBetween>
                  ),
                },
              ],
            }}
            cardsPerRow={[{ cards: 1 }, { minWidth: 640, cards: 2 }, { minWidth: 1100, cards: 3 }]}
          />
        )}
      </DataState>
    </PageShell>
  );
}
