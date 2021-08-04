import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TradingSessionService } from './tradingPosition/tradingSession.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);

  const tradingPositionService = app.get(TradingSessionService);
  let ret = await tradingPositionService.exportPos();
  console.log(ret);
}

bootstrap();
