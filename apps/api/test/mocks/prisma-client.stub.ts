/**
 * Test stub for `@prisma/client`, mapped in via Jest `moduleNameMapper`.
 *
 * Unit tests exercise business logic in isolation and never touch the database,
 * but NestJS decorator metadata pulls `PrismaService` (which extends `PrismaClient`)
 * into the module graph. This stub lets tests run WITHOUT `prisma generate`, so the
 * suite is green out-of-the-box. It is NOT used by the running app.
 */
export class PrismaClient {
  constructor(..._args: unknown[]) {
    // no-op
  }

  $connect(): Promise<void> {
    return Promise.resolve();
  }

  $disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
