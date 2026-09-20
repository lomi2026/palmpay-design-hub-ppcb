import { Body, Controller, Get, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthService } from './auth.service';
import { TestAuthAdapter } from './test-auth.adapter';
import type { AuthenticatedUser } from './auth.types';

class CreateTestSessionDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

@ApiTags('authentication')
@ApiSecurity('development-user-email')
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly testAuth: TestAuthAdapter,
  ) {}

  @Post('auth/test-sessions')
  async createTestSession(@Body() body: CreateTestSessionDto) {
    if (!this.testAuth.isEnabled()) throw new NotFoundException();
    const email = body.email.trim().toLowerCase();
    await this.auth.resolveUser({ email });
    return this.testAuth.issueSession({ email });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
