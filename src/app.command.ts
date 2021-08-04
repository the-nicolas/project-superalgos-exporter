import { InternalServerErrorException } from '@nestjs/common';
import { Console, Command, createSpinner } from 'nestjs-console';
import * as commander from 'commander';

@Console()
export class AppCommand {
  constructor() {}

  @Command({
    description: 'A complete command handler' + 'xxx',
    command: 'test <what>',

    options: [
      {
        flags: '-o1, --option1 <o1Value>',
        required: false,
        description: 'xfdfdsfdsfdsf',
      },
      {
        flags:
          '-o2, --option2 [o2Value] (opt-arg not required, gives true if missing)',
        required: false,
      },
    ],
  })
  async test(what: string, command: commander.Command) {
    const options = command.opts();
    console.log(`TEST ${what}`, options);

    const spin = createSpinner();

    spin.start(`Doing something`);
    const files = await new Promise((done) =>
      setTimeout(() => done(['fileA', 'fileB']), 10000),
    );

    spin.succeed('Listing done');

    // throw new InternalServerErrorException(`test ${what}`);
  }
}
