import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AUTHENTICATION_ADAPTER,
  type AuthenticatedRequest,
  type AuthenticationAdapter,
} from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTHENTICATION_ADAPTER) private readonly adapter: AuthenticationAdapter,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const identity = await this.adapter.authenticate(request);
    request.user = await this.authService.resolveUser(identity);
    return true;
  }
}
