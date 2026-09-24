import { IsEnum, IsOptional } from 'class-validator';

import { CursorPaginationQueryDto } from '../../common/pagination';
import { ApplicationStatus } from '../types/application.types';

/** Query params for `GET /applications`: cursor pagination + optional status filter. */
export class ListApplicationsQueryDto extends CursorPaginationQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  readonly status?: ApplicationStatus;
}
