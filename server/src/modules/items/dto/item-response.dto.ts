import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiProperty({ description: 'Merchant ID' })
  merchantId: string;

  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Item description' })
  description?: string;

  @ApiProperty({ description: 'URL to the GLB 3D model file' })
  modelUrl: string;

  @ApiPropertyOptional({ description: 'URL to the USDZ 3D model file for iOS AR' })
  usdzUrl?: string;

  @ApiPropertyOptional({ description: 'URL to the thumbnail image' })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class ItemWithStatsResponseDto extends ItemResponseDto {
  @ApiProperty({ description: 'Total number of scans' })
  totalScans: number;

  @ApiProperty({ description: 'Number of unique scans' })
  uniqueScans: number;
}

export class ItemListResponseDto {
  @ApiProperty({ type: [ItemResponseDto], description: 'List of items' })
  items: ItemResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}
