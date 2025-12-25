import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RecordScanDto {
  @ApiProperty({
    description: 'Item ID being scanned',
    example: 'uuid-here',
  })
  @IsString()
  itemId: string;

  @ApiProperty({
    description: 'Device type (ios, android, desktop, other)',
    example: 'ios',
  })
  @IsString()
  @MaxLength(50)
  deviceType: string;

  @ApiProperty({
    description: 'Unique session identifier',
    example: 'session-uuid',
  })
  @IsString()
  @MaxLength(100)
  sessionId: string;

  @ApiPropertyOptional({
    description: 'User agent string',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;
}

export class UpdateScanDurationDto {
  @ApiProperty({
    description: 'Scan event ID',
    example: 'uuid-here',
  })
  @IsString()
  scanEventId: string;

  @ApiProperty({
    description: 'Duration in seconds',
    example: 45,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration: number;
}
