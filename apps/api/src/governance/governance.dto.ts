import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CategoryStatus, ContentStatus, ContentType, TagStatus } from '../generated/prisma/enums';

export const EVENT_TYPES = [
  'page_view',
  'content_view',
  'search_submit',
  'search_result_click',
  'search_no_result',
  'favorite_add',
  'favorite_remove',
  'prompt_copy',
  'file_download',
  'content_share',
  'usage_confirmed',
  'project_referenced',
  'content_create',
  'content_submit',
  'ai_run_start',
  'ai_run_success',
  'ai_run_fail',
  'ai_result_confirm',
  'feedback_submit',
] as const;

export class RecordEventDto {
  @IsIn(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];

  @IsOptional()
  @IsUUID()
  contentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourcePage?: string;
}

export class AdminContentQueryDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() tagId?: string;

  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

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

export class CreateCategoryDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsArray()
  @IsEnum(ContentType, { each: true })
  contentTypes!: ContentType[];

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsArray() @IsEnum(ContentType, { each: true }) contentTypes?: ContentType[];
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsEnum(CategoryStatus) status?: CategoryStatus;
}

export class CreateTagDto {
  @IsOptional() @IsArray() @IsEnum(ContentType, { each: true }) contentTypes?: ContentType[];
  @IsString() @MaxLength(100) name!: string;
}
export class UpdateTagDto {
  @IsOptional() @IsArray() @IsEnum(ContentType, { each: true }) contentTypes?: ContentType[];
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsEnum(TagStatus) status?: TagStatus;
}

export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 50;
}
