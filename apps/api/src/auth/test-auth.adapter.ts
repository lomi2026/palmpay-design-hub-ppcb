import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { AuthenticatedRequest, AuthenticationAdapter, ExternalIdentity } from './auth.types';

type TestSessionPayload = {
  email: string;
  expiresAt: number;
  issuedAt: number;
  sessionId: string;
};

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

@Injectable()
export class TestAuthAdapter implements AuthenticationAdapter {
  constructor(private readonly config: ConfigService) {}

  isEnabled() {
    return this.config.get<string>('AUTH_MODE') === 'test';
  }

  issueSession(input: { email: string }) {
    if (!this.isEnabled()) throw new ServiceUnavailableException('Test authentication is not enabled.');

    const issuedAt = Date.now();
    const expiresAt = issuedAt + this.sessionTtlSeconds() * 1000;
    const payload: TestSessionPayload = {
      email: input.email.trim().toLowerCase(),
      expiresAt,
      issuedAt,
      sessionId: randomUUID(),
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return {
      accessToken: `v1.${encodedPayload}.${this.sign(encodedPayload)}`,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  authenticate(request: AuthenticatedRequest): ExternalIdentity {
    const authorization = firstHeader(request.headers.authorization);
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('A test session is required.');
    }

    const tokenParts = authorization.slice('Bearer '.length).split('.');
    const [version, encodedPayload, signature] = tokenParts;
    if (
      tokenParts.length !== 3 ||
      version !== 'v1' ||
      !encodedPayload ||
      !signature ||
      !this.signaturesMatch(encodedPayload, signature)
    ) {
      throw new UnauthorizedException('The test session is invalid.');
    }

    let payload: TestSessionPayload;
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TestSessionPayload;
    } catch {
      throw new UnauthorizedException('The test session is invalid.');
    }

    if (!payload.email || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) {
      throw new UnauthorizedException('The test session has expired.');
    }

    return { email: payload.email.trim().toLowerCase() };
  }

  private signaturesMatch(encodedPayload: string, receivedSignature: string) {
    const received = Buffer.from(receivedSignature);
    const expected = Buffer.from(this.sign(encodedPayload));
    return received.length === expected.length && timingSafeEqual(received, expected);
  }

  private sign(encodedPayload: string) {
    const secret = this.config.get<string>('TEST_AUTH_SESSION_SECRET');
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException('TEST_AUTH_SESSION_SECRET must contain at least 32 characters.');
    }
    return createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  }

  private sessionTtlSeconds() {
    const configured = Number(this.config.get<string>('TEST_AUTH_SESSION_TTL_SECONDS') ?? 28_800);
    if (!Number.isFinite(configured)) return 28_800;
    return Math.max(300, Math.min(configured, 86_400));
  }
}
