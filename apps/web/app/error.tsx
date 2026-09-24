"use client";

// App Router route-level error boundary (complements the React ErrorBoundary in
// layout.tsx). Next.js renders this on errors thrown in a route segment.
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO(observability): forward to Sentry (ENGINEERING_GUIDELINES §9).
    // eslint-disable-next-line no-console
    console.error("Route error", error);
  }, [error]);

  return (
    <Box padding="xxl">
      <Container>
        <SpaceBetween size="m">
          <Alert type="error" header="This page couldn't be loaded">
            Something went wrong while loading this view. Please try again.
          </Alert>
          <Button variant="primary" onClick={reset} iconName="refresh">
            Try again
          </Button>
        </SpaceBetween>
      </Container>
    </Box>
  );
}
