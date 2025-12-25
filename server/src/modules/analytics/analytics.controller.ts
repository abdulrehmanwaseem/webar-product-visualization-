import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RecordScanDto, UpdateScanDurationDto } from './dto/record-scan.dto';
import {
  ScanEventResponseDto,
  ItemAnalyticsResponseDto,
} from './dto/analytics-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('scan')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a scan event (public endpoint)' })
  @ApiResponse({
    status: 201,
    description: 'Scan event recorded',
    type: ScanEventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async recordScan(@Body() dto: RecordScanDto) {
    return await this.analyticsService.recordScan(dto);
  }

  @Public()
  @Patch('scan/duration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update scan duration (public endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'Duration updated',
    type: ScanEventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Scan event not found' })
  async updateDuration(@Body() dto: UpdateScanDurationDto) {
    return await this.analyticsService.updateDuration(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('items/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get analytics for a specific item' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({
    status: 200,
    description: 'Item analytics',
    type: ItemAnalyticsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getItemAnalytics(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ) {
    return await this.analyticsService.getItemAnalytics(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('overview')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get merchant analytics overview' })
  @ApiResponse({
    status: 200,
    description: 'Merchant analytics overview',
    schema: {
      type: 'object',
      properties: {
        totalItems: { type: 'number' },
        totalScans: { type: 'number' },
        recentScans: { type: 'number' },
        topItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              scans: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMerchantOverview(@CurrentUser() user: JwtUser) {
    return await this.analyticsService.getMerchantOverview(user.userId);
  }
}
