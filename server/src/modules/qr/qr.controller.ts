import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { QrService } from './qr.service';
import { QrOptionsDto } from './dto/qr-options.dto';
import { ItemsService } from '../items/items.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('QR Codes')
@Controller('qr')
@UseGuards(JwtAuthGuard)
export class QrController {
  constructor(
    private readonly qrService: QrService,
    private readonly itemsService: ItemsService,
  ) {}

  @Get('items/:id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Generate QR code for an item' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiProduces('image/png', 'image/svg+xml', 'application/json')
  @ApiResponse({ status: 200, description: 'QR code generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async generateQr(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Query() options: QrOptionsDto,
    @Res() res: Response,
  ) {
    // Verify ownership and get item
    const item = await this.itemsService.findByIdWithStats(id, user.userId);

    const format = options.format || 'png';

    if (format === 'svg') {
      const svg = await this.qrService.generateSvg(item.slug, {
        errorCorrectionLevel: options.errorCorrectionLevel,
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${item.slug}-qr.svg"`,
      );
      return res.send(svg);
    }

    const png = await this.qrService.generatePng(item.slug, {
      size: options.size,
      errorCorrectionLevel: options.errorCorrectionLevel,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${item.slug}-qr.png"`,
    );
    return res.send(png);
  }

  @Get('items/:id/preview')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get QR code preview as data URL' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({
    status: 200,
    description: 'QR code data URL',
    schema: {
      type: 'object',
      properties: {
        dataUrl: { type: 'string' },
        arUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getQrPreview(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Query() options: QrOptionsDto,
  ) {
    // Verify ownership and get item
    const item = await this.itemsService.findByIdWithStats(id, user.userId);

    const dataUrl = await this.qrService.generateDataUrl(item.slug, {
      size: options.size,
      errorCorrectionLevel: options.errorCorrectionLevel,
    });

    return {
      dataUrl,
      arUrl: this.qrService.getArUrl(item.slug),
    };
  }
}
