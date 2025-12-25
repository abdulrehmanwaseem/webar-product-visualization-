import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import {
  ItemResponseDto,
  ItemListResponseDto,
  ItemWithStatsResponseDto,
} from './dto/item-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({
    status: 201,
    description: 'Item created successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: JwtUser,
    @Body() createItemDto: CreateItemDto,
  ) {
    return await this.itemsService.create(user.userId, createItemDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get all items for the current merchant' })
  @ApiResponse({
    status: 200,
    description: 'List of items',
    type: ItemListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: JwtUser) {
    return await this.itemsService.findAllByMerchant(user.userId);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get item by slug (public)' })
  @ApiParam({ name: 'slug', description: 'Item slug' })
  @ApiResponse({
    status: 200,
    description: 'Item details',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findBySlug(@Param('slug') slug: string) {
    return await this.itemsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get item by ID with stats' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({
    status: 200,
    description: 'Item details with statistics',
    type: ItemWithStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findById(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return await this.itemsService.findByIdWithStats(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update an item' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return await this.itemsService.update(id, user.userId, updateItemDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete an item' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async delete(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return await this.itemsService.delete(id, user.userId);
  }
}
