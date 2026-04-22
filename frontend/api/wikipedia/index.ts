export type WikipediaArticle = {
  id: number;
  title: string;
  extract: string;
  url: string;
  thumbnailUrl?: string;
};

type WikipediaPage = {
  extract?: string;
  fullurl?: string;
  pageid: number;
  thumbnail?: {
    source?: string;
  };
  title: string;
};

type WikipediaRandomArticlesResponse = {
  query?: {
    pages?: Record<string, WikipediaPage>;
  };
};

const DEFAULT_ARTICLE_LIMIT = 20;
const LOG_PREFIX = '[Wikipedia API]';
const WIKIMEDIA_USER_AGENT = 'SpeaklyMobile/1.0';

export async function fetchRandomWikipediaArticles(
  languageCode: string,
  limit = DEFAULT_ARTICLE_LIMIT
): Promise<WikipediaArticle[]> {
  const params = new URLSearchParams({
    action: 'query',
    exintro: '1',
    explaintext: '1',
    exsentences: '2',
    format: 'json',
    generator: 'random',
    grnlimit: String(limit),
    grnnamespace: '0',
    inprop: 'url',
    origin: '*',
    piprop: 'thumbnail',
    pithumbsize: '320',
    prop: 'extracts|pageimages|info',
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
