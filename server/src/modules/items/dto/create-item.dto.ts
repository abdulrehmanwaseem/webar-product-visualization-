import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Delicious Burger',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'delicious-burger',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase and contain only letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'A juicy beef burger with fresh vegetables',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'URL to the GLB 3D model file',
    example: 'https://cdn.example.com/models/burger.glb',
  })
  @IsUrl()
  modelUrl: string;

  @ApiPropertyOptional({
    description: 'URL to the USDZ 3D model file for iOS AR',
    example: 'https://cdn.example.com/models/burger.usdz',
  })
  @IsOptional()
  @IsUrl()
  usdzUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to the thumbnail image',
    example: 'https://cdn.example.com/thumbnails/burger.webp',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}
