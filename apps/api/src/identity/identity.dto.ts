import { Type } from 'class-transformer';
import {
  IsEnum,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RoleScopeType, TeamStatus, UserStatus } from '../generated/prisma/enums';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

export class UserListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;

  @IsOptional()
  @IsUUID()
  replacementOwnerId?: string;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsEnum(TeamStatus)
  status?: TeamStatus;
}

export class AssignUserRoleDto {
  @IsUUID()
  roleId!: string;

  @IsEnum(RoleScopeType)
  scopeType!: RoleScopeType;

  @IsUUID()
  scopeId!: string;
}

export class CreateTeamDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @IsOptional() @IsUUID() ownerId?: string;
}

export class CreateUserDto {
  @IsEmail() @MaxLength(320) email!: string;
  @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @IsUUID() roleId!: string;
  @IsUUID() teamId!: string;
}

export class UpdateUserNameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class UpdateUserDto extends UpdateUserStatusDto {
  @IsOptional() @IsEmail() @MaxLength(320) email?: string;
  @IsOptional() @IsUUID() teamId?: string | null;
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}
