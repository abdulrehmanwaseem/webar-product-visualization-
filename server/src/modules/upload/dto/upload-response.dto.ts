import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ description: 'Public URL of the uploaded file' })
  url: string;

  @ApiProperty({ description: 'File key in storage' })
  key: string;
}

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL for direct upload' })
  uploadUrl: string;

  @ApiProperty({ description: 'Public URL after upload completes' })
  publicUrl: string;

  @ApiProperty({ description: 'File key in storage' })
  key: string;

  @ApiProperty({ description: 'Expiration time in seconds' })
  expiresIn: number;
}
