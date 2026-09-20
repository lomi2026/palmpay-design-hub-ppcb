import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AUTHENTICATION_ADAPTER } from './auth.types';
import { DevelopmentAuthAdapter } from './development-auth.adapter';
import { OptionalAuthGuard } from './optional-auth.guard';
import { RbacGuard } from './rbac.guard';
import { TestAuthAdapter } from './test-auth.adapter';
import { PpcbAuthAdapter } from './ppcb-auth.adapter';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    RbacGuard,
    OptionalAuthGuard,
    DevelopmentAuthAdapter,
    TestAuthAdapter,
    PpcbAuthAdapter,
    {
      provide: AUTHENTICATION_ADAPTER,
      inject: [ConfigService, DevelopmentAuthAdapter, TestAuthAdapter, PpcbAuthAdapter],
      useFactory: (
        config: ConfigService,
        developmentAdapter: DevelopmentAuthAdapter,
        testAdapter: TestAuthAdapter,
        ppcbAdapter: PpcbAuthAdapter,
      ) => {
        const mode = config.get('AUTH_MODE') ?? 'development';
        if (mode === 'development') return developmentAdapter;
        if (mode === 'test') return testAdapter;
        if (mode === 'ppcb') return ppcbAdapter;
        if (mode !== 'oidc') {
          throw new Error(
            `Unsupported AUTH_MODE: ${mode}. Configure an enterprise OIDC adapter before use.`,
          );
        }
        throw new Error('AUTH_MODE=oidc is reserved until the enterprise OIDC adapter is configured.');
      },
    },
  ],
  exports: [AUTHENTICATION_ADAPTER, AuthService, AuthGuard, OptionalAuthGuard, RbacGuard],
})
export class AuthModule {}
