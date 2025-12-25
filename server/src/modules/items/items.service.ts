import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  private async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.item.findUnique({
        where: { slug: uniqueSlug },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) {
        return uniqueSlug;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  async create(merchantId: string, createItemDto: CreateItemDto) {
    const slug = createItemDto.slug || this.generateSlug(createItemDto.name);
    const uniqueSlug = await this.ensureUniqueSlug(slug);

    return await this.prisma.item.create({
      data: {
        merchantId,
        name: createItemDto.name,
        slug: uniqueSlug,
        description: createItemDto.description,
        modelUrl: createItemDto.modelUrl,
        usdzUrl: createItemDto.usdzUrl,
        thumbnailUrl: createItemDto.thumbnailUrl,
      },
    });
  }

  async findAllByMerchant(merchantId: string) {
    const items = await this.prisma.item.findMany({
      where: { merchantId },
      include: {
        _count: {
          select: { scanEvents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: items.map((item) => ({
        ...item,
        totalScans: item._count.scanEvents,
      })),
      total: items.length,
    };
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.item.findUnique({
      where: { slug },
    });

    if (!item) {
      throw new NotFoundException(`Item with slug "${slug}" not found`);
    }

    return item;
  }

  async findById(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Item with id "${id}" not found`);
    }

    return item;
  }

  async findByIdWithStats(id: string, merchantId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        _count: {
          select: { scanEvents: true },
        },
        scanEvents: {
          select: { sessionId: true },
          distinct: ['sessionId'],
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Item with id "${id}" not found`);
    }

    if (item.merchantId !== merchantId) {
      throw new ForbiddenException('You do not have access to this item');
    }

    return {
      ...item,
      totalScans: item._count.scanEvents,
      uniqueScans: item.scanEvents.length,
    };
  }

  async update(id: string, merchantId: string, updateItemDto: UpdateItemDto) {
    const item = await this.findById(id);

    if (item.merchantId !== merchantId) {
      throw new ForbiddenException('You do not have access to this item');
    }

    let slug = updateItemDto.slug;
    if (slug) {
      slug = await this.ensureUniqueSlug(slug, id);
    }

    return await this.prisma.item.update({
      where: { id },
      data: {
        ...(updateItemDto.name && { name: updateItemDto.name }),
        ...(slug && { slug }),
        ...(updateItemDto.description !== undefined && { description: updateItemDto.description }),
        ...(updateItemDto.modelUrl && { modelUrl: updateItemDto.modelUrl }),
        ...(updateItemDto.usdzUrl !== undefined && { usdzUrl: updateItemDto.usdzUrl }),
        ...(updateItemDto.thumbnailUrl !== undefined && { thumbnailUrl: updateItemDto.thumbnailUrl }),
      },
    });
  }

  async delete(id: string, merchantId: string) {
    const item = await this.findById(id);

    if (item.merchantId !== merchantId) {
      throw new ForbiddenException('You do not have access to this item');
    }

    await this.prisma.item.delete({
      where: { id },
    });

    return { message: 'Item deleted successfully' };
  }
}
