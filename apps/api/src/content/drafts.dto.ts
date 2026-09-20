import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ContentType, ContentVisibility } from '../generated/prisma/enums';

export class CreateDraftDto {
  @IsEnum(ContentType)
  contentType!: ContentType;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility: ContentVisibility = ContentVisibility.ORGANIZATION;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  versionLabel?: string;

  @IsObject()
  body!: Record<string, unknown>;
}

export class AutosaveDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  versionLabel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeSummary?: string | null;

  @IsOptional()
  @IsObject()
  @Type(() => Object)
  body?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attachmentFileIds?: string[];
}

export class DraftCoverDto {
  @IsOptional()
  @IsUUID()
  fileId?: string | null;
}
