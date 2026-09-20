import type { RoleScopeType, UserStatus } from '../generated/prisma/enums';

export interface ExternalIdentity {
  ppcb?: { owner: boolean; permissions: string[] };
  email: string;
  name?: string;
  employeeId?: string;
  organizationCode?: string;
}

export interface AuthenticatedRole {
  code: string;
  scopeType: RoleScopeType;
  scopeId: string;
}

export interface AuthenticatedPermissionScope {
  code: string;
  scopeType: RoleScopeType;
  scopeId: string;
}

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  primaryTeamId: string | null;
  employeeId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: UserStatus;
  locale: string;
  roles: AuthenticatedRole[];
  permissions: string[];
  permissionScopes: AuthenticatedPermissionScope[];
}

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}

export interface AuthenticationAdapter {
  authenticate(request: AuthenticatedRequest): ExternalIdentity | Promise<ExternalIdentity>;
}

export const AUTHENTICATION_ADAPTER = Symbol('AUTHENTICATION_ADAPTER');
