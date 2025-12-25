import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

interface QrGenerationOptions {
  format: 'png' | 'svg';
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

@Injectable()
export class QrService {
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
  }

  getArUrl(slug: string): string {
    return `${this.frontendUrl}/ar/${slug}`;
  }

  async generatePng(
    slug: string,
    options: Partial<QrGenerationOptions> = {},
  ): Promise<Buffer> {
    const url = this.getArUrl(slug);
    const size = options.size || 300;
    const errorCorrectionLevel = options.errorCorrectionLevel || 'M';

    const qrBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: size,
      errorCorrectionLevel,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrBuffer;
  }

  async generateSvg(
    slug: string,
    options: Partial<QrGenerationOptions> = {},
  ): Promise<string> {
    const url = this.getArUrl(slug);
    const errorCorrectionLevel = options.errorCorrectionLevel || 'M';

    const svgString = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return svgString;
  }

  async generateDataUrl(
    slug: string,
    options: Partial<QrGenerationOptions> = {},
  ): Promise<string> {
    const url = this.getArUrl(slug);
    const size = options.size || 300;
    const errorCorrectionLevel = options.errorCorrectionLevel || 'M';

    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      errorCorrectionLevel,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return dataUrl;
  }
}
