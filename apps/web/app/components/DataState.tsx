"use client";

import type { ReactNode } from "react";

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Spinner from "@cloudscape-design/components/spinner";

export interface DataStateProps<TData> {
  /** Whether the underlying query is loading for the first time. */
  isLoading: boolean;
  /** Error thrown by the query, if any. */
  error: Error | null;
  /** The resolved data, if any. */
  data: TData | undefined;
  /** Predicate deciding whether `data` should be treated as empty. */
  isEmpty?: (data: TData) => boolean;
  /** Retry handler wired to the query's `refetch`. */
  onRetry?: () => void;
  /** Accessible label describing what is loading (e.g. "Loading matches"). */
  loadingText?: string;
  /** Heading shown in the empty state. */
  emptyTitle?: string;
  /** Supporting copy shown in the empty state. */
  emptyMessage?: string;
  /** Optional action rendered in the empty state (e.g. a "Refresh" button). */
  emptyAction?: ReactNode;
  /** Renders the successful, non-empty state. */
  children: (data: TData) => ReactNode;
}

const DEFAULT_EMPTY = <T,>(data: T): boolean =>
  Array.isArray(data) ? data.length === 0 : data == null;

/**
 * Typed wrapper that renders explicit loading / empty / error states around any
 * async view, so a screen is never blank and a raw error is never shown
 * (ENGINEERING_GUIDELINES §5, §9-FE). Pass a React Query result's fields
 * straight in.
 */
export function DataState<TData>({
  isLoading,
  error,
  data,
  isEmpty = DEFAULT_EMPTY,
  onRetry,
  loadingText = "Loading",
  emptyTitle = "Nothing here yet",
  emptyMessage = "There's no data to show right now.",
  emptyAction,
  children,
}: DataStateProps<TData>): ReactNode {
  if (isLoading) {
    return (
      <Box textAlign="center" padding={{ vertical: "xxl" }} color="text-status-inactive">
        <Spinner size="large" />
        <Box variant="p" padding={{ top: "s" }}>
          <span role="status" aria-live="polite">
            {loadingText}…
          </span>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        header="Something went wrong"
        action={
          onRetry ? (
            <Button onClick={onRetry} iconName="refresh">
              Retry
            </Button>
          ) : undefined
        }
      >
        {error.message || "We couldn't load this content. Please try again."}
      </Alert>
    );
  }

  if (data === undefined || isEmpty(data)) {
    return (
      <Box textAlign="center" padding={{ vertical: "xxl" }} color="inherit">
        <Box variant="strong" color="inherit">
          {emptyTitle}
        </Box>
        <Box variant="p" color="inherit" padding={{ bottom: "s" }}>
          {emptyMessage}
        </Box>
        {emptyAction}
      </Box>
    );
  }

  return <>{children(data)}</>;
}
