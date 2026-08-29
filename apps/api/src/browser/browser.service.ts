import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright-chromium';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface ScrapedPage {
  title: string;
  content: string;
  url: string;
  usedFallback: boolean;
}

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Performs a web search using a free search engine parser (DuckDuckGo HTML fallback)
   */
  async search(query: string): Promise<SearchResult[]> {
    try {
      this.logger.log(`Searching web for query: "${query}"`);
      const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(
        searchUrl,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        }
      );

      const $ = cheerio.load(response.data);
      const results: SearchResult[] = [];

      $('table.result-table').each((_, element) => {
        const linkEl = $(element).find('td.result-link a');
        const snippetEl = $(element).next('tr').find('td.result-snippet');

        const title = linkEl.text().trim();
        const link = linkEl.attr('href');
        const snippet = snippetEl.text().trim();

        if (title && link) {
          let cleanedLink = link;
          if (link.includes('//uddg.ddg.gg')) {
            const match = link.match(/uddg=([^&]+)/);
            if (match) {
              cleanedLink = decodeURIComponent(match[1]);
            }
          }
          results.push({ title, link: cleanedLink, snippet });
        }
      });

      if (results.length > 0) {
        return results.slice(0, 10);
      }
      throw new Error('DuckDuckGo returned empty results');
    } catch (error) {
      this.logger.warn(`DuckDuckGo Search blocked or failed: ${error.message}. Falling back to Wikipedia API.`);
      try {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=10&namespace=0&format=json`;
        const wikiResponse = await axios.get(wikiUrl, {
          headers: { 'User-Agent': 'VexiusAgent/1.0' },
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });
        
        const [, titles, snippets, links] = wikiResponse.data;
        const results: SearchResult[] = [];
        for (let i = 0; i < titles.length; i++) {
          results.push({
            title: titles[i],
            link: links[i],
            snippet: snippets[i] || `Wikipedia page for ${titles[i]}`
          });
        }
        return results;
      } catch (wikiError) {
        this.logger.error(`Wikipedia fallback search also failed`, wikiError);
        throw new Error(`Web search failed: ${error.message}`);
      }
    }
  }

  /**
   * Scrapes page text. Tries fast HTTP Scraper (Axios) first.
   * Falls back to Playwright Chromium if blocked or JS heavy.
   */
  async scrapePage(url: string): Promise<ScrapedPage> {
    try {
      this.logger.log(`Attempting fast HTTP scrap for URL: ${url}`);
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
      });

      const $ = cheerio.load(response.data);
      
      // Basic check if page blocked us (Cloudflare/Forbidden/Empty page)
      const title = $('title').text().trim();
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

      if (
        response.status === 403 || 
        bodyText.length < 200 || 
        title.toLowerCase().includes('cloudflare') || 
        title.toLowerCase().includes('attention required')
      ) {
        this.logger.warn(`Fast HTTP scrap blocked or empty for ${url}. Triggering Playwright fallback.`);
        return this.scrapeWithPlaywright(url);
      }

      this.logger.log(`Fast HTTP scrap successful for ${url}`);
      return {
        title,
        content: this.extractCleanText($),
        url,
        usedFallback: false
      };
    } catch (error) {
      this.logger.warn(`Fast HTTP scrap failed for ${url}: ${error.message}. Triggering Playwright fallback.`);
      return this.scrapeWithPlaywright(url);
    }
  }

  /**
   * Playwright Fallback runner with aggressive block configs (No images, css, media, fonts)
   */
  private async scrapeWithPlaywright(url: string): Promise<ScrapedPage> {
    this.logger.log(`Launching Playwright fallback for URL: ${url}`);
    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();

      // Block images, styles, media, and fonts to accelerate page load
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (['image', 'stylesheet', 'media', 'font', 'websocket'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      const title = await page.title();
      const bodyContent = await page.evaluate(() => document.body.innerText);

      return {
        title: title.trim(),
        content: bodyContent.replace(/\s+/g, ' ').trim().slice(0, 10000), // Cap content length
        url,
        usedFallback: true
      };
    } catch (error) {
      this.logger.error(`Playwright fallback failed for URL: ${url}`, error);
      throw new Error(`Failed to scrape page ${url}: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private extractCleanText($: cheerio.CheerioAPI): string {
    // Remove unwanted script, style, and navigation elements
    $('script, style, nav, footer, header, iframe, noscript').remove();
    return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000);
  }
}
