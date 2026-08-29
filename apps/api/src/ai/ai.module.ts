import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { MarketplaceController } from './marketplace.controller';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';
import { BrowserModule } from '../browser/browser.module';
import { ModelRouterService } from './model-router.service';

@Module({
  imports: [ConfigModule, BrowserModule],
  controllers: [AiController, MarketplaceController],
  providers: [AiService, ModelRouterService],
  exports: [AiService, ModelRouterService],
})
export class AiModule {}
