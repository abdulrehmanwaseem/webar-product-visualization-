import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { GetPresignedUrlDto } from './dto/upload.dto';
import { PresignedUrlResponseDto } from './dto/upload-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get a presigned URL for direct upload to R2' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    type: PresignedUrlResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPresignedUrl(
    @CurrentUser() user: JwtUser,
    @Body() dto: GetPresignedUrlDto,
  ): Promise<PresignedUrlResponseDto> {
    return await this.uploadService.getPresignedUploadUrl(
      user.userId,
      dto.fileName,
      dto.fileType,
      dto.contentType,
    );
  }

  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a file from storage' })
  @ApiParam({ name: 'key', description: 'File key (URL-encoded)' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteFile(@Param('key') key: string) {
    const decodedKey = decodeURIComponent(key);
    await this.uploadService.deleteFile(decodedKey);
    return { message: 'File deleted successfully' };
  }

  @Post('direct')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload file directly through the server (bypasses CORS)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileType: {
          type: 'string',
          enum: ['glb', 'usdz', 'thumbnail'],
        },
      },
      required: ['file', 'fileType'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        publicUrl: { type: 'string' },
        key: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDirect(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('fileType') fileType: 'glb' | 'usdz' | 'thumbnail',
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!['glb', 'usdz', 'thumbnail'].includes(fileType)) {
      throw new BadRequestException(
        'Invalid file type. Must be glb, usdz, or thumbnail',
      );
    }

    return await this.uploadService.uploadFile(
      user.userId,
      file.originalname,
      fileType,
      file.buffer,
      file.mimetype,
    );
  }
}
