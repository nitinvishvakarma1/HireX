import type { Application, Match } from "@/src/types/domain";

/**
 * Mock data for local development and the current scaffolding phase.
 *
 * TODO(api): Remove these fixtures once the NestJS endpoints are live; the
 * hooks in src/hooks are already shaped to call the real API via api-client.
 */

export const MOCK_MATCHES: Match[] = [
  {
    id: "match-1001",
    jobTitle: "Senior Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote (US)",
    workArrangement: "remote",
    matchScore: 94,
    salaryRange: "$150k–$185k",
    discoveredAt: "2026-09-23T14:12:00.000Z",
    matchReasons: ["React + TypeScript depth", "Design-systems experience", "Remote-first"],
  },
  {
    id: "match-1002",
    jobTitle: "Full-Stack Engineer",
    company: "Atlas Health",
    location: "Boston, MA",
    workArrangement: "hybrid",
    matchScore: 88,
    salaryRange: "$140k–$170k",
    discoveredAt: "2026-09-23T09:40:00.000Z",
    matchReasons: ["Node + Next.js stack match", "Healthcare domain interest"],
  },
  {
    id: "match-1003",
    jobTitle: "Platform Engineer",
    company: "Meridian Cloud",
    location: "Austin, TX",
    workArrangement: "onsite",
    matchScore: 81,
    salaryRange: "$145k–$175k",
    discoveredAt: "2026-09-22T18:05:00.000Z",
    matchReasons: ["Kubernetes exposure", "CI/CD ownership"],
  },
  {
    id: "match-1004",
    jobTitle: "UI Engineer, Design Systems",
    company: "Lumen Studio",
    location: "Remote (Global)",
    workArrangement: "remote",
    matchScore: 76,
    salaryRange: null,
    discoveredAt: "2026-09-22T11:30:00.000Z",
    matchReasons: ["Accessibility focus", "Component library authorship"],
  },
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: "app-2001",
    jobTitle: "Senior Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote (US)",
    status: "interview",
    lastUpdatedAt: "2026-09-23T16:00:00.000Z",
    submittedAt: "2026-09-18T10:00:00.000Z",
    source: "Greenhouse",
  },
  {
    id: "app-2002",
    jobTitle: "Full-Stack Engineer",
    company: "Atlas Health",
    location: "Boston, MA",
    status: "screening",
    lastUpdatedAt: "2026-09-22T13:20:00.000Z",
    submittedAt: "2026-09-19T08:45:00.000Z",
    source: "Lever",
  },
  {
    id: "app-2003",
    jobTitle: "Frontend Engineer",
    company: "Solara Systems",
    location: "Seattle, WA",
    status: "applied",
    lastUpdatedAt: "2026-09-21T17:10:00.000Z",
    submittedAt: "2026-09-21T17:10:00.000Z",
    source: "Workday",
  },
  {
    id: "app-2004",
    jobTitle: "Platform Engineer",
    company: "Meridian Cloud",
    location: "Austin, TX",
    status: "matched",
    lastUpdatedAt: "2026-09-22T18:05:00.000Z",
    submittedAt: null,
    source: "HireX match",
  },
  {
    id: "app-2005",
    jobTitle: "Software Engineer II",
    company: "Cobalt Analytics",
    location: "Remote (US)",
    status: "offer",
    lastUpdatedAt: "2026-09-20T12:00:00.000Z",
    submittedAt: "2026-09-05T09:00:00.000Z",
    source: "Greenhouse",
  },
  {
    id: "app-2006",
    jobTitle: "Frontend Developer",
    company: "Pinecrest Media",
    location: "New York, NY",
    status: "rejected",
    lastUpdatedAt: "2026-09-15T14:30:00.000Z",
    submittedAt: "2026-09-02T11:00:00.000Z",
    source: "Ashby",
  },
];
