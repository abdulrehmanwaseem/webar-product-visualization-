import { IsIn, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QrOptionsDto {
  @ApiPropertyOptional({
    description: 'Output format',
    enum: ['png', 'svg'],
    default: 'png',
  })
  @IsOptional()
  @IsIn(['png', 'svg'])
  format?: 'png' | 'svg';

  @ApiPropertyOptional({
    description: 'QR code size in pixels (for PNG)',
    default: 300,
    minimum: 100,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(1000)
  size?: number;

  @ApiPropertyOptional({
    description: 'Error correction level',
    enum: ['L', 'M', 'Q', 'H'],
    default: 'M',
  })
  @IsOptional()
  @IsIn(['L', 'M', 'Q', 'H'])
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}
