import { type WikipediaArticleCategory } from '../contracts/types';

export const MAX_ARTICLE_LIMIT = 50;

const CATEGORY_TITLES = {
  biography: 'Biography',
  culture: 'Culture',
  food: 'Food and drink',
  geography: 'Geography',
  history: 'History',
  nature: 'Nature',
  science: 'Science',
  space: 'Outer space',
  sports: 'Sports',
  technology: 'Technology',
} as const satisfies Record<Exclude<WikipediaArticleCategory, 'all'>, string>;

const CATEGORY_DISCOVERY_TERMS = {
  biography: 'famous biography',
  culture: 'culture art',
  food: 'food cuisine',
  geography: 'geography places',
  history: 'history civilization',
  nature: 'nature environment',
  science: 'science discovery',
  space: 'space astronomy',
  sports: 'sport championship',
  technology: 'technology invention',
} as const satisfies Record<Exclude<WikipediaArticleCategory, 'all'>, string>;

const EXCLUDED_TITLE_PATTERNS = [
  /^Category:/i,
  /^Glossary of/i,
  /^Index of/i,
  /^List of/i,
  /^Outline of/i,
  /^Timeline of/i,
  /\(disambiguation\)$/i,
];

// This is editorial product data, not article-service logic. Keeping it here
// makes the curated catalog reviewable and replaceable without touching the
// Wikipedia integration or application orchestration.
const RECOMMENDED_ARTICLE_TITLES = {
  biography: [
    'Albert Einstein',
    'Marie Curie',
    'Nikola Tesla',
    'Ada Lovelace',
    'Cleopatra',
    'Nelson Mandela',
    'Mahatma Gandhi',
    'Frida Kahlo',
    'Charles Darwin',
    'Amelia Earhart',
    'Leonardo da Vinci',
    'William Shakespeare',
    'Isaac Newton',
    'Martin Luther King Jr.',
    'Florence Nightingale',
    'Alan Turing',
    'Jane Austen',
    'Galileo Galilei',
    'Alexander the Great',
    'Queen Victoria',
  ],
  culture: [
    'Renaissance',
    'Impressionism',
    'Jazz',
    'Cinema',
    'Architecture',
    'Greek mythology',
    'Photography',
    'Ballet',
    'Opera',
    'Hip hop music',
    'Modern art',
    'Theatre',
    'Calligraphy',
    'Fashion',
    'Manga',
    'Museum',
    'Street art',
    'Classical music',
    'Animation',
    'World Heritage Site',
  ],
  food: [
    'Coffee',
    'Chocolate',
    'Pizza',
    'Sushi',
    'Tea',
    'Bread',
    'Wine',
    'Cheese',
    'Curry',
    'Ice cream',
    'Pasta',
    'Honey',
    'Rice',
    'Olive oil',
    'Fermentation',
    'Cuisine',
    'Hamburger',
    'Apple',
    'Spice',
    'Baking',
  ],
  geography: [
    'Grand Canyon',
    'Sahara',
    'Nile',
    'Himalayas',
    'New York City',
    'London',
    'Japan',
    'Ukraine',
    'Mediterranean Sea',
    'Great Wall of China',
    'Amazon River',
    'Alps',
    'Iceland',
    'Venice',
    'Pacific Ocean',
    'Istanbul',
    'Machu Picchu',
    'Yellowstone National Park',
    'Arctic',
    'Singapore',
  ],
  history: [
    'Ancient Egypt',
    'Roman Empire',
    'Vikings',
    'Silk Road',
    'World War II',
    'Cold War',
    'Industrial Revolution',
    'French Revolution',
    'Byzantine Empire',
    'Mongol Empire',
    'History of writing',
    'Age of Discovery',
    'American Revolution',
    'Ottoman Empire',
    'Maya civilization',
    'Great Fire of London',
    'Berlin Wall',
    'Space Race',
    'Renaissance',
    'Printing press',
  ],
  nature: [
    'Amazon rainforest',
    'Great Barrier Reef',
    'Mount Everest',
    'Ocean',
    'Volcano',
    'Antarctica',
    'Rainforest',
    'Coral reef',
    'Yellowstone National Park',
    'Water cycle',
    'Earthquake',
    'Desert',
    'Glacier',
    'Climate change',
    'Biodiversity',
    'Tsunami',
    'Aurora',
    'Monsoon',
    'Wetland',
    'Everglades',
  ],
  science: [
    'Evolution',
    'Periodic table',
    'Photosynthesis',
    'DNA',
    'Quantum mechanics',
    'Plate tectonics',
    'Vaccine',
    'Human brain',
    'Electricity',
    'Gravity',
    'Atom',
    'Dinosaur',
    'Penicillin',
    'Relativity',
    'Ecosystem',
    'Microscope',
    'Gene',
    'Radioactivity',
    'Fossil',
    'Scientific method',
  ],
  space: [
    'Moon',
    'Mars',
    'Jupiter',
    'Milky Way',
    'International Space Station',
    'Hubble Space Telescope',
    'Space exploration',
    'Apollo 11',
    'James Webb Space Telescope',
    'Exoplanet',
    'Solar System',
    'Sun',
    'Saturn',
    'Black hole',
    'Comet',
    'Asteroid belt',
    'Space Shuttle',
    'Voyager program',
    'Nebula',
    'Big Bang',
  ],
  sports: [
    'Association football',
    'Basketball',
    'Olympic Games',
    'Tennis',
    'Formula One',
    'Cricket',
    'Baseball',
    'Rugby union',
    'Swimming (sport)',
    'Athletics (sport)',
    'Boxing',
    'Ice hockey',
    'Volleyball',
    'Cycling',
    'Skiing',
    'Surfing',
    'Chess',
    'Marathon',
    'FIFA World Cup',
    'Tour de France',
  ],
  technology: [
    'Internet',
    'Artificial intelligence',
    'Smartphone',
    'Electric car',
    'Robotics',
    'Computer',
    'Renewable energy',
    'Printing press',
    'Steam engine',
    'Blockchain',
    'Video game',
    'Virtual reality',
    'Satellite',
    '3D printing',
    'Semiconductor',
    'Battery',
    'Electricity generation',
    'Telephone',
    'World Wide Web',
    'Machine learning',
  ],
} as const satisfies Record<
  Exclude<WikipediaArticleCategory, 'all'>,
  readonly string[]
>;

export function getCategorySearchQuery(
  search: string,
  category: WikipediaArticleCategory,
): string {
  return category === 'all'
    ? search
    : `${search} incategory:"${CATEGORY_TITLES[category]}"`;
}

export function getCategoryDiscoveryTerm(
  category: Exclude<WikipediaArticleCategory, 'all'>,
): string {
  return CATEGORY_DISCOVERY_TERMS[category];
}

export function isExcludedWikipediaTitle(title: string): boolean {
  return EXCLUDED_TITLE_PATTERNS.some((pattern) => pattern.test(title));
}

export function selectRecommendedArticleTitles(
  category: WikipediaArticleCategory,
  limit: number,
  random: () => number = Math.random,
): string[] {
  const pool =
    category === 'all'
      ? Object.values(RECOMMENDED_ARTICLE_TITLES).flat()
      : RECOMMENDED_ARTICLE_TITLES[category];
  const shuffledTitles = shuffle(Array.from(new Set<string>(pool)), random);
  const titleCount = Math.min(
    shuffledTitles.length,
    Math.max(limit, Math.min(MAX_ARTICLE_LIMIT, limit * 3)),
  );

  return shuffledTitles.slice(0, titleCount);
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [
      shuffled[targetIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}
