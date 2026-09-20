import { Type } from 'class-transformer';
import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateUploadIntentDto {
  @IsString()
  @MaxLength(255)
  originalName!: string;

  @IsString()
  @MaxLength(150)
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100 * 1024 * 1024)
  sizeBytes!: number;

  // Base64-encoded SHA-256 value. The browser must calculate this before asking
  // for an upload URL so the API can verify the object stored by R2.
  @IsString()
  @Matches(/^[A-Za-z0-9+/]{43}=$/)
  checksumSha256!: string;
}
