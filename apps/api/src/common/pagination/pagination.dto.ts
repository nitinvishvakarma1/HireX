import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './cursor-pagination';

/**
 * Reusable query DTO for cursor-paginated list endpoints. Extend this per feature
 * to add filters. Validated at the boundary by the global `ValidationPipe`.
 */
export class CursorPaginationQueryDto {
  /** Max rows to return (1..{@link MAX_PAGE_SIZE}). Defaults to {@link DEFAULT_PAGE_SIZE}. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  readonly limit: number = DEFAULT_PAGE_SIZE;

  /** Opaque cursor returned by the previous page. Omit for the first page. */
  @IsOptional()
  @IsString()
  readonly cursor?: string;
}
