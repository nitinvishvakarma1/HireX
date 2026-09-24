import { Injectable } from '@nestjs/common';

import {
  buildCursorPage,
  CursorPage,
  decodeCursor,
} from '../common/pagination';
import { NotFoundError } from '../common/errors';
import { ApplicationsRepository } from './applications.repository';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';
import {
  ApplicationResponseDto,
  toApplicationResponse,
} from './dto/application-response.dto';
import { Application } from './types/application.types';

const APPLICATION_RESOURCE = 'Application';

/**
 * Business logic for applications (Rulebook §3: services own logic; controllers
 * stay thin; DB access is delegated to the repository). All reads/writes are
 * scoped by `userId` for multi-tenancy isolation (Rulebook §7).
 */
@Injectable()
export class ApplicationsService {
  constructor(private readonly repository: ApplicationsRepository) {}

  /** List a user's applications with cursor pagination and an optional status filter. */
  async list(
    userId: string,
    query: ListApplicationsQueryDto,
  ): Promise<CursorPage<ApplicationResponseDto>> {
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;

    // Fetch one extra row so pagination can detect a following page.
    const rows = await this.repository.findMany({
      filter: { userId, status: query.status },
      take: query.limit + 1,
      cursor,
    });

    const page = buildCursorPage<Application>(rows, query.limit);
    return {
      items: page.items.map(toApplicationResponse),
      pageInfo: page.pageInfo,
    };
  }

  /** Fetch a single application owned by the user, or throw {@link NotFoundError}. */
  async getById(userId: string, id: string): Promise<ApplicationResponseDto> {
    const application = await this.repository.findById(userId, id);
    if (!application) {
      throw new NotFoundError(APPLICATION_RESOURCE, id);
    }
    return toApplicationResponse(application);
  }

  /** Create an application for the user. */
  async create(
    userId: string,
    dto: CreateApplicationDto,
  ): Promise<ApplicationResponseDto> {
    const application = await this.repository.create({
      userId,
      jobId: dto.jobId,
      company: dto.company,
      roleTitle: dto.roleTitle,
      matchScore: dto.matchScore,
      status: dto.status,
      notes: dto.notes ?? null,
    });
    return toApplicationResponse(application);
  }
}
