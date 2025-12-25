import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetPresignedUrlDto {
  @ApiProperty({
    description: 'File name',
    example: 'burger-model.glb',
  })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    description: 'File type',
    enum: ['glb', 'usdz', 'thumbnail'],
    example: 'glb',
  })
  @IsIn(['glb', 'usdz', 'thumbnail'])
  fileType: 'glb' | 'usdz' | 'thumbnail';

  @ApiPropertyOptional({
    description: 'Content type (auto-detected if not provided)',
    example: 'model/gltf-binary',
  })
  @IsOptional()
  @IsString()
  contentType?: string;
}
