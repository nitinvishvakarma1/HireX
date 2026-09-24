import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUserId } from '../common/auth/current-user.decorator';
import { CursorPage } from '../common/pagination';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';
import { ApplicationResponseDto } from './dto/application-response.dto';

/**
 * Thin HTTP layer for applications (Rulebook §10): no business logic, no DB access —
 * validate input via DTOs and delegate to the service.
 *
 * SECURITY: currently unauthenticated. `@CurrentUserId()` is a placeholder that
 * trusts an `x-user-id` header and MUST be replaced by an auth guard before launch
 * (see CurrentUserId decorator and README security note).
 */
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Query() query: ListApplicationsQueryDto,
  ): Promise<CursorPage<ApplicationResponseDto>> {
    return this.applicationsService.list(userId, query);
  }

  @Get(':id')
  getById(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.getById(userId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateApplicationDto,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.create(userId, dto);
  }
}
