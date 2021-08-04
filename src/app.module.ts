import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import ConfigParser from './common/app.config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConsoleModule } from 'nestjs-console';
import { AppCommand } from './app.command';
import { TradingSessionModule } from './tradingPosition/tradingSession.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.local', '.env'],
      load: [ConfigParser],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
      serveRoot: '/ui',
    }),
    ConsoleModule,
    TradingSessionModule,
  ],
  providers: [AppCommand],
  exports: [ConfigModule],
})
export class AppModule {}
