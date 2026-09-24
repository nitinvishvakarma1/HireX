import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { MATCH_SCORE_MAX, MATCH_SCORE_MIN } from '../applications.constants';
import { ApplicationStatus } from '../types/application.types';

/**
 * Request body to create an application. Validated at the boundary by the global
 * `ValidationPipe` (whitelist + forbidNonWhitelisted) before reaching the service.
 */
export class CreateApplicationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  readonly jobId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  readonly company!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  readonly roleTitle!: string;

  @IsInt()
  @Min(MATCH_SCORE_MIN)
  @Max(MATCH_SCORE_MAX)
  readonly matchScore!: number;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  readonly status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly notes?: string;
}
