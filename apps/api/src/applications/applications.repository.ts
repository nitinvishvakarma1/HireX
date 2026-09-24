import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { Cursor } from '../common/pagination';
import {
  Application,
  ApplicationStatus,
  CreateApplicationInput,
  ListApplicationsFilter,
} from './types/application.types';

interface FindManyArgs {
  readonly filter: ListApplicationsFilter;
  /** Fetch up to this many rows; callers pass `limit + 1` to detect a next page. */
  readonly take: number;
  readonly cursor?: Cursor;
}

/**
 * Data-access layer for applications (Rulebook §3/§12: repositories own DB access;
 * services never touch the DB directly).
 *
 * TODO(prisma): the Prisma `Application` model is not generated yet (schema owned by
 * another agent). This uses a deterministic in-memory store meanwhile, ordered and
 * cursor-paged exactly like the intended Prisma query. Each method documents the
 * real Prisma call so swapping in `this.prisma.application.*` is mechanical.
 */
@Injectable()
export class ApplicationsRepository {
  private readonly store = new Map<string, Application>();

  constructor(private readonly prisma: PrismaService) {
    void this.prisma; // reserved: replaces the in-memory store (see TODOs below).
    this.seedDemoData();
  }

  /**
   * Cursor-paginated fetch, ordered by (createdAt desc, id desc).
   *
   * Prisma equivalent:
   * ```ts
   * return this.prisma.application.findMany({
   *   where: { userId: filter.userId, ...(filter.status ? { status: filter.status } : {}) },
   *   orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
   *   take,
   *   ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
   * });
   * ```
   */
  findMany({ filter, take, cursor }: FindManyArgs): Promise<Application[]> {
    const ordered = [...this.store.values()]
      .filter((app) => app.userId === filter.userId)
      .filter((app) => !filter.status || app.status === filter.status)
      .sort(compareByCursorDesc);

    const afterCursor = cursor
      ? ordered.filter((app) => isBeforeCursor(app, cursor))
      : ordered;

    return Promise.resolve(afterCursor.slice(0, take));
  }

  /**
   * Prisma equivalent:
   * ```ts
   * return this.prisma.application.findFirst({ where: { id, userId } });
   * ```
   */
  findById(userId: string, id: string): Promise<Application | null> {
    const found = this.store.get(id);
    return Promise.resolve(found && found.userId === userId ? found : null);
  }

  /**
   * Prisma equivalent:
   * ```ts
   * return this.prisma.application.create({ data: { ...input, status: input.status ?? ApplicationStatus.Matched } });
   * ```
   */
  create(input: CreateApplicationInput): Promise<Application> {
    const now = new Date();
    const application: Application = {
      id: randomUUID(),
      userId: input.userId,
      jobId: input.jobId,
      company: input.company,
      roleTitle: input.roleTitle,
      matchScore: input.matchScore,
      status: input.status ?? ApplicationStatus.Matched,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(application.id, application);
    return Promise.resolve(application);
  }

  /** Seed a small, deterministic dataset for the demo user so the API is explorable. */
  private seedDemoData(): void {
    const userId = 'demo-user';
    const base = Date.parse('2026-09-01T00:00:00.000Z');
    const seeds: ReadonlyArray<Omit<Application, 'id' | 'createdAt' | 'updatedAt'>> =
      [
        {
          userId,
          jobId: 'job-anthropic-be',
          company: 'Anthropic',
          roleTitle: 'Senior Backend Engineer',
          status: ApplicationStatus.Applied,
          matchScore: 92,
          notes: 'Strong TS + distributed systems fit.',
        },
        {
          userId,
          jobId: 'job-supabase-plat',
          company: 'Supabase',
          roleTitle: 'Platform Engineer',
          status: ApplicationStatus.Screening,
          matchScore: 87,
          notes: null,
        },
        {
          userId,
          jobId: 'job-vercel-fe',
          company: 'Vercel',
          roleTitle: 'Full-Stack Engineer',
          status: ApplicationStatus.Matched,
          matchScore: 81,
          notes: null,
        },
      ];

    seeds.forEach((seed, index) => {
      const id = `seed-${index + 1}`;
      const createdAt = new Date(base + index * 60_000);
      this.store.set(id, { ...seed, id, createdAt, updatedAt: createdAt });
    });
  }
}

/** Sort comparator: newest first, `id` desc as a stable tiebreak. */
function compareByCursorDesc(a: Application, b: Application): number {
  const byTime = b.createdAt.getTime() - a.createdAt.getTime();
  if (byTime !== 0) {
    return byTime;
  }
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/** True when `app` sorts strictly after the cursor in (createdAt desc, id desc) order. */
function isBeforeCursor(app: Application, cursor: Cursor): boolean {
  const cursorTime = Date.parse(cursor.createdAt);
  const appTime = app.createdAt.getTime();
  if (appTime !== cursorTime) {
    return appTime < cursorTime;
  }
  return app.id < cursor.id;
}
