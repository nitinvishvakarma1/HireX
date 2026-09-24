"use client";

import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";

export default function NotFound() {
  return (
    <Box padding="xxl">
      <Container header={<Header variant="h1">Page not found</Header>}>
        <SpaceBetween size="m">
          <Box variant="p">
            We couldn&apos;t find the page you were looking for. It may have moved or no
            longer exists.
          </Box>
          <Link href="/">Back to dashboard</Link>
        </SpaceBetween>
      </Container>
    </Box>
  );
}
