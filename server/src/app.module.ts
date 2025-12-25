import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ItemsModule } from './modules/items/items.module';
import { UploadModule } from './modules/upload/upload.module';
import { QrModule } from './modules/qr/qr.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { KeepAliveService } from './common/services/keep-alive.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UserModule,
    ItemsModule,
    UploadModule,
    QrModule,
    AnalyticsModule,
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppService, KeepAliveService],
})
export class AppModule {}
