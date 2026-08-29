import { Test, TestingModule } from '@nestjs/testing';
import { BrowserService } from './browser.service';
import { ConfigModule } from '@nestjs/config';

describe('BrowserService', () => {
  let service: BrowserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [BrowserService],
    }).compile();

    service = module.get<BrowserService>(BrowserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should search using DuckDuckGo parser', async () => {
    const results = await service.search('Solana blockchain');
    expect(results).toBeInstanceOf(Array);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('link');
    }
  });

  it('should scrape a page using axios', async () => {
    const pageData = await service.scrapePage('https://en.wikipedia.org/wiki/Solana_(blockchain_platform)');
    expect(pageData).toHaveProperty('title');
    expect(pageData).toHaveProperty('content');
    expect(pageData.usedFallback).toBe(false);
  });
});
