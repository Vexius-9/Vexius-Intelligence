import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyMultipart from '@fastify/multipart';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 50 * 1024 * 1024 })
  );

  // Security Headers
  await app.register(helmet as any);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.register(fastifyMultipart as any);
  
  // Use port from environment (Railway sets PORT automatically)
  const port = process.env.PORT || 3000;
  
  // Listen on 0.0.0.0 so Railway can proxy traffic to the container
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
