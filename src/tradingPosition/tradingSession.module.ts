import { Module } from '@nestjs/common';
import { TradingSessionService } from './tradingSession.service';

import { ConfigService } from '@nestjs/config';
import { TradingSessionCommand } from './tradingSession.command';
import { TradingPositionController } from './tradingSession.controller';

@Module({
  imports: [],
  controllers: [TradingPositionController],
  providers: [TradingSessionCommand, TradingSessionService],
  exports: [TradingSessionService],
})
export class TradingSessionModule {
  constructor(private readonly configService: ConfigService) {
    // console.log('MNT_TMP_ROOT:', this.configService.get<string>('MNT_TMP_ROOT'));
  }

  async init() {
    console.log('INIT called');
  }
}
