import { Console, Command, createSpinner } from 'nestjs-console';
import * as commander from 'commander';
import { TradingSessionService } from './tradingSession.service';
import { interval } from 'rxjs';

@Console()
export class TradingSessionCommand {
  constructor(private readonly tradingSessionService: TradingSessionService) {}

  wait(ms = 1000) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  @Command({
    description: 'Export positions',
    command: 'pos',

    options: [
      {
        flags: '-c, --count <count>',
        description: 'Create <count> plots or unlimited if not set',
        required: false,
      },
      {
        flags: '-s, --size <plotsize>',
        required: false,
      },
    ],
  })
  async posExport(command: commander.Command) {
    const options = command.opts();
    const count = options.count | 0;

    // await this.plottingService.start();
    // await this.plottingService.startPlotting(count);

    interval(60000).subscribe({
      next: () => {
        // console.log(this.plottingService.pool);
      },
    });

    await this.wait(1000);
    //while (this.plottingService.pool.status != PlottingPoolStatus.IDLE) {
    //      await this.wait(1000);
    //}
    console.log('FINISHED');
  }
}
