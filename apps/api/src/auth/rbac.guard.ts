import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './auth.types';
import { REQUIRED_PERMISSIONS } from './permissions.decorator';

export function hasEveryPermission(granted: readonly string[], required: readonly string[]) {
  const permissionSet = new Set(granted);
  return required.every((permission) => permissionSet.has(permission));
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user || !hasEveryPermission(user.permissions, required)) {
      throw new ForbiddenException('Insufficient permissions.');
    }

    return true;
  }
}
