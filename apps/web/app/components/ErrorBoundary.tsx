"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback; receives a reset callback to retry rendering. */
  fallback?: (reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level React error boundary with a friendly fallback and a recovery action
 * (ENGINEERING_GUIDELINES §5, §9-FE). Catches render-time errors anywhere in the
 * tree so the user sees an actionable message instead of a blank screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // TODO(observability): forward to Sentry once wired (ENGINEERING_GUIDELINES §9).
    // Never swallow: surface to the console for now so it is not lost.
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error caught by ErrorBoundary", error, info);
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) {
        return fallback(this.reset);
      }

      return (
        <Box padding="xxl">
          <Container>
            <SpaceBetween size="m">
              <Alert type="error" header="This page hit an unexpected error">
                We're sorry — something went wrong while rendering this view. You can try
                again, and if it keeps happening please contact support.
              </Alert>
              <Button variant="primary" onClick={this.reset} iconName="refresh">
                Try again
              </Button>
            </SpaceBetween>
          </Container>
        </Box>
      );
    }

    return children;
  }
}
