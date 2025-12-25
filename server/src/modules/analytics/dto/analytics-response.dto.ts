import { ApiProperty } from '@nestjs/swagger';

export class ScanEventResponseDto {
  @ApiProperty({ description: 'Scan event ID' })
  id: string;

  @ApiProperty({ description: 'Item ID' })
  itemId: string;

  @ApiProperty({ description: 'Device type' })
  deviceType: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'View duration in seconds' })
  duration: number;

  @ApiProperty({ description: 'Timestamp' })
  createdAt: Date;
}

export class ItemAnalyticsResponseDto {
  @ApiProperty({ description: 'Item ID' })
  itemId: string;

  @ApiProperty({ description: 'Total number of scans' })
  totalScans: number;

  @ApiProperty({ description: 'Number of unique scans (by session)' })
  uniqueScans: number;

  @ApiProperty({ description: 'Average view duration in seconds' })
  avgDuration: number;

  @ApiProperty({
    description: 'Breakdown by device type',
    example: { ios: 45, android: 30, desktop: 25 },
  })
  deviceBreakdown: Record<string, number>;

  @ApiProperty({
    description: 'Daily scan counts for the last 30 days',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        count: { type: 'number' },
      },
    },
  })
  dailyScans: Array<{ date: string; count: number }>;
}
