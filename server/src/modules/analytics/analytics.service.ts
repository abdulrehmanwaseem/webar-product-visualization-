import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RecordScanDto, UpdateScanDurationDto } from './dto/record-scan.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordScan(dto: RecordScanDto) {
    // Verify item exists
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException(`Item with id "${dto.itemId}" not found`);
    }

    const scanEvent = await this.prisma.scanEvent.create({
      data: {
        itemId: dto.itemId,
        deviceType: dto.deviceType.toLowerCase(),
        sessionId: dto.sessionId,
        userAgent: dto.userAgent,
        duration: 0,
      },
    });

    return scanEvent;
  }

  async updateDuration(dto: UpdateScanDurationDto) {
    const scanEvent = await this.prisma.scanEvent.findUnique({
      where: { id: dto.scanEventId },
    });

    if (!scanEvent) {
      throw new NotFoundException(`Scan event not found`);
    }

    return await this.prisma.scanEvent.update({
      where: { id: dto.scanEventId },
      data: { duration: dto.duration },
    });
  }

  async getItemAnalytics(itemId: string, merchantId: string) {
    // Verify ownership
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, merchantId: true },
    });

    if (!item) {
      throw new NotFoundException(`Item not found`);
    }

    if (item.merchantId !== merchantId) {
      throw new NotFoundException(`Item not found`);
    }

    // Get all scan events
    const scanEvents = await this.prisma.scanEvent.findMany({
      where: { itemId },
      select: {
        id: true,
        deviceType: true,
        sessionId: true,
        duration: true,
        createdAt: true,
      },
    });

    // Calculate metrics
    const totalScans = scanEvents.length;
    const uniqueSessions = new Set(scanEvents.map((e) => e.sessionId));
    const uniqueScans = uniqueSessions.size;

    // Average duration (only count completed sessions with duration > 0)
    const durationsWithValue = scanEvents
      .map((e) => e.duration)
      .filter((d) => d > 0);
    const avgDuration =
      durationsWithValue.length > 0
        ? Math.round(
            durationsWithValue.reduce((a, b) => a + b, 0) /
              durationsWithValue.length,
          )
        : 0;

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    for (const event of scanEvents) {
      const device = event.deviceType || 'unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    }

    // Daily scans for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyScansMap = new Map<string, number>();

    // Initialize all dates with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      dailyScansMap.set(date.toISOString().split('T')[0], 0);
    }

    // Count scans per day
    for (const event of scanEvents) {
      if (event.createdAt >= thirtyDaysAgo) {
        const dateKey = event.createdAt.toISOString().split('T')[0];
        if (dailyScansMap.has(dateKey)) {
          dailyScansMap.set(dateKey, (dailyScansMap.get(dateKey) || 0) + 1);
        }
      }
    }

    const dailyScans = Array.from(dailyScansMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      itemId,
      totalScans,
      uniqueScans,
      avgDuration,
      deviceBreakdown,
      dailyScans,
    };
  }

  async getMerchantOverview(merchantId: string) {
    // Get all items for this merchant with scan counts
    const items = await this.prisma.item.findMany({
      where: { merchantId },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { scanEvents: true },
        },
      },
    });

    const totalItems = items.length;
    const totalScans = items.reduce(
      (sum, item) => sum + item._count.scanEvents,
      0,
    );

    // Get recent scans (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentScans = await this.prisma.scanEvent.count({
      where: {
        item: { merchantId },
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Top items by scans
    const topItems = items
      .map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        scans: item._count.scanEvents,
      }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 5);

    return {
      totalItems,
      totalScans,
      recentScans,
      topItems,
    };
  }
}
