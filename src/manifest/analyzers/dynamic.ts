import playwright from 'playwright';
import type { Browser, Page } from 'playwright';

interface DynamicAnalysisOptions {
  viewports?: Array<{ width: number; height: number }>;
  networkConditions?: Array<{ latency: number; throughput: number }>;
  timeout?: number;
  maxConcurrency?: number;
}

interface ResourceInfo {
  url: string;
  type: string;
  size: number;
  timing: number;
}

export class DynamicAnalyzer {
  private browser: Browser | null = null;
  private pages: Page[] = [];

  constructor(
    private baseUrl: string,
    private options: DynamicAnalysisOptions = {}
  ) {
    this.options = {
      viewports: [{ width: 1920, height: 1080 }],
      networkConditions: [{ latency: 0, throughput: -1 }],
      timeout: 30000,
      maxConcurrency: 3,
      ...options
    };
  }

  private async initialize() {
    if (!this.browser) {
      this.browser = await playwright.chromium.launch({
        headless: true
      });
    }
  }

  private async createPage(viewport: { width: number; height: number }) {
    const page = await this.browser!.newPage();
    await page.setViewportSize(viewport);
    this.pages.push(page);
    return page;
  }

  private async cleanup() {
    for (const page of this.pages) {
      await page.close();
    }
    this.pages = [];
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  public async analyzeRoute(route: string): Promise<{
    resources: ResourceInfo[];
    timing: number;
  }> {
    await this.initialize();
    const resources = new Map<string, ResourceInfo>();
    let totalTiming = 0;

    // Analyze route under different viewport conditions
    for (const viewport of this.options.viewports!) {
      const page = await this.createPage(viewport);
      
      // Track network requests
      page.on('request', request => {
        const url = request.url();
        if (!resources.has(url)) {
          resources.set(url, {
            url,
            type: request.resourceType(),
            size: 0,
            timing: 0
          });
        }
      });

      page.on('response', async response => {
        const url = response.url();
        const resource = resources.get(url);
        if (resource) {
          const buffer = await response.body().catch(() => Buffer.from([]));
          resource.size = buffer.length;
          resource.timing = response.timing()?.responseEnd || 0;
          totalTiming = Math.max(totalTiming, resource.timing);
        }
      });

      // Navigate and wait for network idle
      const url = new URL(route, this.baseUrl).toString();
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Scroll and interact to trigger lazy loads
      await page.evaluate(() => {
        return new Promise<void>(resolve => {
          let lastScroll = window.scrollY;
          const interval = setInterval(() => {
            window.scrollBy(0, 100);
            if (window.scrollY === lastScroll) {
              clearInterval(interval);
              resolve();
            }
            lastScroll = window.scrollY;
          }, 100);
        });
      });

      // Wait for any final network requests
      await page.waitForLoadState('networkidle');
    }

    return {
      resources: Array.from(resources.values()),
      timing: totalTiming
    };
  }

  public async dispose() {
    await this.cleanup();
  }
}
