import {
  DEFAULT_ARTICLE_LIMIT,
  LOG_PREFIX,
  WIKIMEDIA_USER_AGENT,
} from './constants';
import {
  type WikipediaArticle,
  type WikipediaRandomArticlesResponse,
} from './types';

export type { WikipediaArticle } from './types';

export async function fetchRandomWikipediaArticles(
  languageCode: string,
  limit = DEFAULT_ARTICLE_LIMIT
): Promise<WikipediaArticle[]> {
  const params = new URLSearchParams({
    // MediaWiki API operation: fetch page data.
    action: 'query',
    // Return only the intro section and strip wiki/html markup from extracts.
    exintro: '1',
    explaintext: '1',
    // Keep article previews short for the list UI.
    exsentences: '2',
    // Ask for JSON instead of XML.
    format: 'json',
    // Use random article pages as the source.
    generator: 'random',
    // Number of random pages to request.
    grnlimit: String(limit),
    // Namespace 0 means regular article pages, not talk/user/category pages.
    grnnamespace: '0',
    // Include canonical/full page URLs.
    inprop: 'url',
    // Allow browser/web requests from any origin.
    origin: '*',
    // Include thumbnail images when Wikipedia has one.
    piprop: 'thumbnail',
    pithumbsize: '320',
    // Page fields we need: extract text, image info, and URLs.
    prop: 'extracts|pageimages|info',
    // Resolve redirects to the final article.
    redirects: '1',
  });

  const url = `https://${languageCode}.wikipedia.org/w/api.php?${params.toString()}`;

  console.log(`${LOG_PREFIX} URL:`, url);

  const response = await fetch(url, {
    headers: {
      'Api-User-Agent': WIKIMEDIA_USER_AGENT,
      'User-Agent': WIKIMEDIA_USER_AGENT,
    },
  });
  const responseText = await response.text();

  console.log(`${LOG_PREFIX} status:`, response.status);
  console.log(`${LOG_PREFIX} response:`, responseText);

  if (!response.ok) {
    throw new Error('Failed to fetch Wikipedia articles.');
  }

  const data = JSON.parse(responseText) as WikipediaRandomArticlesResponse;
  const pages = Object.values(data.query?.pages ?? {});

  return pages
    .filter((page) => Boolean(page.extract && page.fullurl))
    .map((page) => ({
      id: page.pageid,
      title: page.title,
      extract: page.extract ?? '',
      url: page.fullurl ?? '',
      thumbnailUrl: page.thumbnail?.source,
    }));
}
