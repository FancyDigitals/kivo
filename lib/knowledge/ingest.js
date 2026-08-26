import { logger } from '../utils/logger.js';

/**
 * Scrapes a website URL, extracts main visible text, cleans HTML boilerplate,
 * and structures it into knowledge chunks for AI retrieval.
 */
export async function scrapeWebsiteUrl(url) {
  try {
    logger.info(`Starting knowledge ingestion for URL: ${url}`);

    // Ensure valid URL scheme
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KivoBotIndexer/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Website returned status HTTP ${response.status}`);
    }

    const html = await response.text();

    // Clean HTML scripts, styles, and tags
    let cleanText = html
      .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<head\b[^<]*>([\s\S]*?)<\/head>/gi, '')
      .replace(/<header\b[^<]*>([\s\S]*?)<\/header>/gi, '')
      .replace(/<footer\b[^<]*>([\s\S]*?)<\/footer>/gi, '')
      .replace(/<nav\b[^<]*>([\s\S]*?)<\/nav>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit chunk size to preserve tokens
    if (cleanText.length > 3000) {
      cleanText = cleanText.substring(0, 3000) + '...';
    }

    logger.info(`Successfully ingested ${cleanText.length} characters from ${formattedUrl}`);

    return {
      success: true,
      url: formattedUrl,
      title: new URL(formattedUrl).hostname,
      extractedContent: cleanText,
    };
  } catch (error) {
    logger.error(`Failed to ingest website URL: ${url}`, error);
    return {
      success: false,
      error: error.message || 'Failed to fetch and clean website content',
    };
  }
}