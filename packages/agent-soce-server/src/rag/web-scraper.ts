import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ScrapeResult {
  title: string;
  text: string;
  byline?: string;
  excerpt?: string;
  contentLength: number;
}

const BOT_UA = 'Mozilla/5.0 (compatible; AgentSOCE-Bot/1.0; +https://sercop.gob.ec)';
const SCRAPE_TIMEOUT_MS = 20_000;
const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Fetch a URL and extract clean article text using Readability (Firefox reader mode).
 * Strips navigation, ads, sidebars and returns only the main content.
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const parsed = new URL(url); // throws on invalid URL
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Protocol not allowed: ${parsed.protocol}`);
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': BOT_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es,en;q=0.9',
    },
    signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error(`Unsupported content type "${contentType}" for URL scraping. Only HTML pages are supported.`);
  }

  // Guard against huge pages
  const contentLength = Number(res.headers.get('content-length') ?? 0);
  if (contentLength > MAX_HTML_BYTES) {
    throw new Error(`Page too large (${Math.round(contentLength / 1024)}KB). Max is 5MB.`);
  }

  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document, {
    charThreshold: 20,
  });
  const article = reader.parse();

  if (!article?.textContent?.trim()) {
    throw new Error('Could not extract readable content from this page. It may be a JavaScript-rendered SPA or have insufficient text.');
  }

  const cleanText = article.textContent
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    title: article.title?.trim() || new URL(url).hostname,
    text: cleanText,
    byline: article.byline ?? undefined,
    excerpt: article.excerpt ?? undefined,
    contentLength: Buffer.byteLength(cleanText, 'utf-8'),
  };
}
