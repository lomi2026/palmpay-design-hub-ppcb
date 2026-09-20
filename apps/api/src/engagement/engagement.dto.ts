import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { ContentRelationType, ContentType } from '../generated/prisma/enums';

export class SearchQueryDto {
  @IsString()
  @MaxLength(200)
  q!: string;

  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tag?: string;

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

export class SearchClickDto {
  @IsUUID()
  contentId!: string;
}

export class CreateUsageConfirmationDto {
  @IsOptional()
  @IsUUID()
  projectContentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  projectName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourcePage?: string;
}

export class CreateContentRelationDto {
  @IsUUID()
  targetContentId!: string;

  @IsEnum(ContentRelationType)
  relationType!: ContentRelationType;
}
