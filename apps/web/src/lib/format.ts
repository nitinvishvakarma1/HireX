import type { ApplicationStatus } from "@/src/types/domain";

/** Formats an ISO-8601 timestamp as a short, locale-aware date. */
export function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Cloudscape Badge/StatusIndicator color for a given application status. */
export type StatusIndicatorType = "success" | "info" | "in-progress" | "error" | "pending";

export function statusIndicatorType(status: ApplicationStatus): StatusIndicatorType {
  switch (status) {
    case "offer":
      return "success";
    case "interview":
    case "screening":
      return "in-progress";
    case "applied":
      return "info";
    case "matched":
      return "pending";
    case "rejected":
      return "error";
  }
}

/** Human-readable label for an application status. */
export function statusLabel(status: ApplicationStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
