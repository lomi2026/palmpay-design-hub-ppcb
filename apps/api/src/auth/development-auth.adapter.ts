import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedRequest, AuthenticationAdapter, ExternalIdentity } from './auth.types';

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

@Injectable()
export class DevelopmentAuthAdapter implements AuthenticationAdapter {
  constructor(private readonly config: ConfigService) {}

  authenticate(request: AuthenticatedRequest): ExternalIdentity {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new Error(
        'The development authentication adapter cannot run in production. Configure an enterprise OIDC adapter.',
      );
    }
    const email = firstHeader(request.headers['x-dev-user-email'])?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException(
        'Development authentication requires the x-dev-user-email header.',
      );
    }

    return {
      email,
      name: firstHeader(request.headers['x-dev-user-name'])?.trim(),
      employeeId: firstHeader(request.headers['x-dev-employee-id'])?.trim(),
      organizationCode: firstHeader(request.headers['x-dev-organization-code'])?.trim(),
    };
  }
}
