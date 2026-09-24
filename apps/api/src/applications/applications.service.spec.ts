import { NotFoundError } from '../common/errors';
import { Cursor } from '../common/pagination';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';
import {
  Application,
  ApplicationStatus,
  CreateApplicationInput,
  ListApplicationsFilter,
} from './types/application.types';

const DEMO_USER = 'demo-user';

/**
 * Prisma-free in-memory fake of {@link ApplicationsRepository} so the service is
 * unit-tested in isolation (Rulebook §9) without generating `@prisma/client`.
 * It reproduces the repository's ordering (createdAt desc, id desc) and cursor
 * semantics so the service's pagination orchestration is genuinely exercised.
 */
class FakeApplicationsRepository {
  private readonly rows: Application[];
  private sequence = 0;

  constructor() {
    const base = Date.parse('2026-09-01T00:00:00.000Z');
    this.rows = [
      ['seed-1', 'Anthropic', ApplicationStatus.Applied, 92],
      ['seed-2', 'Supabase', ApplicationStatus.Screening, 87],
      ['seed-3', 'Vercel', ApplicationStatus.Matched, 81],
    ].map(([id, company, status, matchScore], index) => {
      const createdAt = new Date(base + index * 60_000);
      return {
        id: id as string,
        userId: DEMO_USER,
        jobId: `job-${id as string}`,
        company: company as string,
        roleTitle: 'Engineer',
        status: status as ApplicationStatus,
        matchScore: matchScore as number,
        notes: null,
        createdAt,
        updatedAt: createdAt,
      };
    });
  }

  findMany(args: {
    filter: ListApplicationsFilter;
    take: number;
    cursor?: Cursor;
  }): Promise<Application[]> {
    const ordered = this.rows
      .filter((app) => app.userId === args.filter.userId)
      .filter((app) => !args.filter.status || app.status === args.filter.status)
      .sort((a, b) => {
        const byTime = b.createdAt.getTime() - a.createdAt.getTime();
        return byTime !== 0 ? byTime : a.id < b.id ? 1 : -1;
      });

    const afterCursor = args.cursor
      ? ordered.filter((app) => {
          const cursorTime = Date.parse(args.cursor!.createdAt);
          const appTime = app.createdAt.getTime();
          return appTime !== cursorTime
            ? appTime < cursorTime
            : app.id < args.cursor!.id;
        })
      : ordered;

    return Promise.resolve(afterCursor.slice(0, args.take));
  }

  findById(userId: string, id: string): Promise<Application | null> {
    const found = this.rows.find((app) => app.id === id);
    return Promise.resolve(found && found.userId === userId ? found : null);
  }

  create(input: CreateApplicationInput): Promise<Application> {
    const now = new Date(Date.parse('2026-10-01T00:00:00.000Z') + this.sequence++);
    const application: Application = {
      id: `created-${this.sequence}`,
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
    this.rows.push(application);
    return Promise.resolve(application);
  }
}

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  beforeEach(() => {
    const repository = new FakeApplicationsRepository();
    service = new ApplicationsService(
      repository as unknown as ApplicationsRepository,
    );
  });

  const query = (
    overrides: Partial<ListApplicationsQueryDto> = {},
  ): ListApplicationsQueryDto =>
    ({ limit: 20, ...overrides }) as ListApplicationsQueryDto;

  describe('list', () => {
    it('returns the owner’s applications newest-first as response DTOs', async () => {
      const page = await service.list(DEMO_USER, query());

      expect(page.items).toHaveLength(3);
      expect(page.pageInfo.hasNextPage).toBe(false);
      expect(page.pageInfo.nextCursor).toBeNull();
      // DTO serializes dates to ISO strings and omits internal fields (userId).
      expect(typeof page.items[0]?.createdAt).toBe('string');
      expect(page.items[0]).not.toHaveProperty('userId');
    });

    it('paginates with an opaque cursor across pages without overlap', async () => {
      const first = await service.list(DEMO_USER, query({ limit: 2 }));
      expect(first.items).toHaveLength(2);
      expect(first.pageInfo.hasNextPage).toBe(true);
      expect(first.pageInfo.nextCursor).toEqual(expect.any(String));

      const second = await service.list(
        DEMO_USER,
        query({ limit: 2, cursor: first.pageInfo.nextCursor ?? undefined }),
      );
      expect(second.items).toHaveLength(1);
      expect(second.pageInfo.hasNextPage).toBe(false);

      const firstIds = first.items.map((item) => item.id);
      expect(firstIds).not.toContain(second.items[0]?.id);
    });

    it('filters by status', async () => {
      const page = await service.list(
        DEMO_USER,
        query({ status: ApplicationStatus.Applied }),
      );

      expect(page.items).toHaveLength(1);
      expect(page.items[0]?.status).toBe(ApplicationStatus.Applied);
    });

    it('does not leak other users’ applications', async () => {
      const page = await service.list('someone-else', query());
      expect(page.items).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('throws NotFoundError for an unknown id', async () => {
      await expect(service.getById(DEMO_USER, 'missing')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws NotFoundError when the application belongs to another user', async () => {
      await expect(
        service.getById('someone-else', 'seed-1'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('create', () => {
    it('creates an application scoped to the user and returns its DTO', async () => {
      const created = await service.create(DEMO_USER, {
        jobId: 'job-new',
        company: 'Stripe',
        roleTitle: 'Backend Engineer',
        matchScore: 88,
      });

      expect(created.id).toEqual(expect.any(String));
      expect(created.company).toBe('Stripe');
      // Defaults to the first pipeline stage when status is omitted.
      expect(created.status).toBe(ApplicationStatus.Matched);

      const fetched = await service.getById(DEMO_USER, created.id);
      expect(fetched).toEqual(created);
    });
  });
});
