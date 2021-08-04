import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import * as _ from 'lodash';
import { TradingSessionService } from './tradingSession.service';

@Controller('plotting')
export class TradingPositionController {
  constructor(private readonly tradingSessionService: TradingSessionService) {}

  @Get()
  async getPool() {
    // const ret = _.cloneDeep(this.plottingService.pool);
    // ret.workers.forEach((w) => {
    //   delete w.console;
    //   delete w._process$;
    // });
    // return ret;
  }

  @Get(':id/console')
  findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
    @Query('skip')
    skip?: number,
  ) {
    //   const ret = this.plottingService.pool.workers.find((w) => w.uuid == id);
    //   if (!ret) {
    //     throw new NotFoundException('Invalid worker');
    //   }
    //   return ret.console.slice(skip);
  }
}
