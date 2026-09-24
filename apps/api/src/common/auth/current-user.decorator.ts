import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

const USER_ID_HEADER = 'x-user-id';

/**
 * SECURITY TODO (Rulebook §8, Requirements FR-1): this is a PLACEHOLDER for real
 * authentication. It trusts an `x-user-id` header, which a client can forge — it
 * MUST NOT ship to production. Replace with an auth guard (NestJS JWT / OAuth per
 * PROJECT_PLAN §4.2) that verifies a token and attaches the authenticated user;
 * this decorator should then read `request.user.id`.
 *
 * Every feature endpoint is currently UNAUTHENTICATED and must be protected by
 * that guard before launch.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const userId = request.header(USER_ID_HEADER);
    if (!userId) {
      throw new UnauthorizedException(
        `Missing ${USER_ID_HEADER} header (auth not yet wired — see CurrentUserId).`,
      );
    }
    return userId;
  },
);
