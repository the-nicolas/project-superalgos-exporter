import { BootstrapConsole } from 'nestjs-console';
import { AppModule } from './app.module';

const bootstrap = new BootstrapConsole({
  module: AppModule,
  useDecorators: true,
});

bootstrap.init().then(async (app) => {
  try {
    app.enableShutdownHooks();
    // init your app
    await app.init();
    // boot the cli
    await bootstrap.boot();
    await app.close();
    process.exit(0);
  } catch (e) {
    await app.close();
    process.exit(1);
  }
});
