const http = require('http');
const https = require('https');
const { URL } = require('url');

const backendBaseUrl = process.env.MOCK_PROXY_TARGET ?? 'http://localhost:3000';
const backendUrl = new URL(backendBaseUrl);
const transport = backendUrl.protocol === 'https:' ? https : http;

function buildNeutralCalendarMonth(year, month) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => ({
    date: `${year}-${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
    dayOfMonth: index + 1,
    status: 'neutral',
  }));

  return {
    days,
    month,
    monthLabel: `${year}-${String(month).padStart(2, '0')}`,
    serverNow: '2026-05-14T12:00:00.000Z',
    timezone: 'Europe/Kyiv',
    year,
  };
}

const STREAK_MILESTONES = [
  { milestone: 3, rewardCoins: 30 },
  { milestone: 7, rewardCoins: 70 },
  { milestone: 14, rewardCoins: 150 },
  { milestone: 30, rewardCoins: 400 },
  { milestone: 100, rewardCoins: 1500 },
];

const MOCK_DICTIONARY_WORDS = [
  {
    context: 'The sun rises early in summer.',
    correctAnswersCount: 0,
    createdAt: '2026-05-14T12:00:00.000Z',
    id: 'mock-word-sun',
    progress: 'new',
    requiredCorrectAnswers: 3,
    translation: 'сонце',
    word: 'sun',
  },
  {
    context: 'A book can open a new world.',
    correctAnswersCount: 0,
    createdAt: '2026-05-14T12:00:00.000Z',
    id: 'mock-word-book',
    progress: 'new',
    requiredCorrectAnswers: 3,
    translation: 'книга',
    word: 'book',
  },
  {
    context: 'Water is clear and cold.',
    correctAnswersCount: 0,
    createdAt: '2026-05-14T12:00:00.000Z',
    id: 'mock-word-water',
    progress: 'new',
    requiredCorrectAnswers: 3,
    translation: 'вода',
    word: 'water',
  },
  {
    context: 'The city is quiet at night.',
    correctAnswersCount: 0,
    createdAt: '2026-05-14T12:00:00.000Z',
    id: 'mock-word-city',
    progress: 'new',
    requiredCorrectAnswers: 3,
    translation: 'місто',
    word: 'city',
  },
];

const ACHIEVEMENT_DEFINITIONS = [
  {
    badgeKey: 'first-test-completed',
    coinsReward: 20,
    descriptionKey: 'profile.achievements.first_test_completed.description',
    id: 'first_test_completed',
    targetValue: 1,
    titleKey: 'profile.achievements.first_test_completed.title',
    valueKey: 'testsCompleted',
  },
  {
    badgeKey: 'first-test-completed',
    coinsReward: 80,
    descriptionKey: 'profile.achievements.ten_tests_completed.description',
    id: 'ten_tests_completed',
    targetValue: 10,
    titleKey: 'profile.achievements.ten_tests_completed.title',
    valueKey: 'testsCompleted',
  },
  {
    badgeKey: 'first-test-completed',
    coinsReward: 50,
    descriptionKey: 'profile.achievements.ten_words_learned.description',
    id: 'ten_words_learned',
    targetValue: 10,
    titleKey: 'profile.achievements.ten_words_learned.title',
    valueKey: 'wordsLearned',
  },
  {
    badgeKey: 'first-test-completed',
    coinsReward: 100,
    descriptionKey: 'profile.achievements.first_thousand_coins.description',
    id: 'first_thousand_coins',
    targetValue: 1000,
    titleKey: 'profile.achievements.first_thousand_coins.title',
    valueKey: 'balance',
  },
];

function buildAchievementsProfile(userId, progress, previousAchievements = []) {
  const previousMap = new Map(
    previousAchievements.map((achievement) => [achievement.id, achievement]),
  );

  return {
    achievements: ACHIEVEMENT_DEFINITIONS.map((definition) => {
      const progressValue = progress[definition.valueKey] ?? 0;
      const previous = previousMap.get(definition.id);
      const isUnlocked = Boolean(previous?.isUnlocked) || progressValue >= definition.targetValue;

      return {
        badgeKey: definition.badgeKey,
        claimedAt: previous?.claimedAt ?? null,
        coinsReward: definition.coinsReward,
        descriptionKey: definition.descriptionKey,
        id: definition.id,
        isClaimed: previous?.isClaimed ?? false,
        isUnlocked,
        progressValue,
        targetValue: definition.targetValue,
        titleKey: definition.titleKey,
        unlockedAt: isUnlocked
          ? previous?.unlockedAt ?? '2026-05-14T12:00:00.000Z'
          : null,
      };
    }),
    progress,
    userId,
  };
}

function buildStreakAchievements(currentStreak, previousAchievements = []) {
  const previousMap = new Map(
    previousAchievements.map((achievement) => [achievement.milestone, achievement]),
  );

  return STREAK_MILESTONES.map((milestone) => {
    const previous = previousMap.get(milestone.milestone);
    const isUnlocked = Boolean(previous?.isUnlocked) || currentStreak >= milestone.milestone;

    return {
      claimedAt: isUnlocked
        ? previous?.claimedAt ?? '2026-05-14T12:00:00.000Z'
        : null,
      isUnlocked,
      milestone: milestone.milestone,
      rewardCoins: milestone.rewardCoins,
    };
  });
}

function resolveNextMilestone(currentStreak) {
  return STREAK_MILESTONES.find((item) => item.milestone > currentStreak)?.milestone ?? 100;
}

function buildMockDictionaryWords(userId) {
  return MOCK_DICTIONARY_WORDS.map((word) => ({
    ...word,
    userId,
  }));
}

function buildMockDictionaryTest(userId) {
  const words = buildMockDictionaryWords(userId);

  return {
    questions: words.map((word) => ({
      options: words.map((optionWord) => ({
        id: optionWord.id,
        translation: optionWord.translation,
      })),
      word: word.word,
      wordId: word.id,
    })),
  };
}

function buildMockArticleDetail(id) {
  const articleId = Number(id) || 1001;
  const title = 'Mock Learning Article';
  const content = 'The sun gives light. People read books and drink water in a quiet city.';

  return {
    blocks: [
      {
        level: 1,
        text: title,
        type: 'heading',
      },
      {
        children: [
          {
            text: content,
            type: 'text',
          },
        ],
        type: 'paragraph',
      },
    ],
    content,
    id: articleId,
    title,
    url: `https://example.test/articles/${articleId}`,
  };
}

function buildMockArticleQuiz() {
  return {
    questions: [
      {
        correctOptionIds: ['light'],
        explanation: 'The text says the sun gives light.',
        id: 'mock-article-question-1',
        options: [
          { id: 'light', text: 'It gives light.' },
          { id: 'rain', text: 'It makes rain.' },
          { id: 'books', text: 'It writes books.' },
        ],
        prompt: 'What does the sun give?',
        type: 'single_choice',
      },
    ],
  };
}

function buildMockVocabularyQuiz() {
  return {
    questions: [
      {
        correctOptionIds: ['city'],
        explanation: 'City means місто.',
        format: 'translation',
        id: 'mock-vocabulary-question-1',
        options: [
          { id: 'city', text: 'місто' },
          { id: 'water', text: 'вода' },
          { id: 'book', text: 'книга' },
        ],
        prompt: 'Choose the translation of "city".',
        term: 'city',
        termKind: 'word',
        type: 'single_choice',
      },
    ],
    resolvedLevel: 'A2',
  };
}

function pipeToBackend(req, res) {
  const options = {
    headers: {
      ...req.headers,
      host: backendUrl.host,
    },
    hostname: backendUrl.hostname,
    method: req.method,
    path: `${req.originalUrl}`,
    port: backendUrl.port || (backendUrl.protocol === 'https:' ? 443 : 80),
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode || 502);
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        res.setHeader(key, value);
      }
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    res.status(502).jsonp({
      details: error.message,
      message: `Proxy request failed to ${backendBaseUrl}`,
    });
  });

  req.pipe(proxyReq);
}

module.exports = (req, res, next) => {
  const method = req.method.toUpperCase();
  const achievementsMatch = req.path.match(/^\/achievements\/profile\/([^/]+)(?:\/progress)?$/);
  const dictionaryMatch = req.path.match(/^\/api\/dictionary\/users\/([^/]+)\/(words|test)(?:\/([^/]+)|\/answer)?(?:\/progress)?$/);
  const articleDetailMatch = req.path.match(/^\/articles\/([^/]+)$/);
  const match = req.path.match(/^\/streak\/profile\/([^/]+)(?:\/(activity-completed|restore)|\/calendar\/month)?$/);

  if (method === 'GET' && req.path === '/articles') {
    res.jsonp([
      {
        availableAdaptations: [],
        extract: 'A short mock article for testing quiz completion and banner ordering.',
        id: 1001,
        pageLength: 320,
        title: 'Mock Learning Article',
        url: 'https://example.test/articles/1001',
      },
    ]);
    return;
  }

  if (method === 'GET' && articleDetailMatch) {
    res.jsonp(buildMockArticleDetail(articleDetailMatch[1]));
    return;
  }

  if (method === 'GET' && req.path === '/api/articles/adaptations') {
    res.jsonp({});
    return;
  }

  if (method === 'POST' && req.path === '/api/articles/simplify') {
    const article = buildMockArticleDetail(req.body?.articleId ?? 1001);
    const transformationType = req.body?.transformationType ?? 'adaptation';

    res.jsonp({
      adaptedBlocks: article.blocks,
      adaptedLength: article.content.length,
      level: req.body?.level ?? 'A2',
      originalLength: req.body?.text?.length ?? article.content.length,
      questions: buildMockArticleQuiz().questions,
      title: article.title,
      transformationType,
    });
    return;
  }

  if (method === 'POST' && req.path === '/api/articles/quiz') {
    res.jsonp(buildMockArticleQuiz());
    return;
  }

  if (method === 'POST' && req.path === '/api/articles/vocabulary-quiz') {
    res.jsonp(buildMockVocabularyQuiz());
    return;
  }

  if (dictionaryMatch) {
    const userId = decodeURIComponent(dictionaryMatch[1]);
    const resource = dictionaryMatch[2];
    const words = buildMockDictionaryWords(userId);

    if (method === 'GET' && resource === 'words') {
      res.jsonp(words);
      return;
    }

    if (method === 'POST' && resource === 'words') {
      res.jsonp({
        context: req.body?.context ?? '',
        correctAnswersCount: 0,
        createdAt: '2026-05-14T12:00:00.000Z',
        id: `mock-word-${Date.now()}`,
        progress: 'new',
        requiredCorrectAnswers: 3,
        translation: req.body?.translation ?? '',
        userId,
        word: req.body?.word ?? '',
      });
      return;
    }

    if (method === 'GET' && resource === 'test') {
      res.jsonp(buildMockDictionaryTest(userId));
      return;
    }

    if (method === 'POST' && req.path.endsWith('/test/answer')) {
      const word = words.find((item) => item.id === req.body?.wordId) ?? words[0];
      const isCorrect = req.body?.selectedOptionId === word.id;

      res.jsonp({
        correctOptionId: word.id,
        correctTranslation: word.translation,
        isCorrect,
        word: {
          ...word,
          correctAnswersCount: isCorrect ? word.correctAnswersCount + 1 : word.correctAnswersCount,
          lastReviewedAt: '2026-05-14T12:00:00.000Z',
          progress: isCorrect ? 'in_progress' : word.progress,
        },
      });
      return;
    }

    if (method === 'PATCH' && req.path.endsWith('/progress')) {
      const wordId = dictionaryMatch[3];
      const word = words.find((item) => item.id === wordId) ?? words[0];

      res.jsonp({
        ...word,
        progress: req.body?.progress ?? word.progress,
      });
      return;
    }
  }

  if (achievementsMatch) {
    try {
      const userId = decodeURIComponent(achievementsMatch[1]);
      const isProgressUpdate = req.path.endsWith('/progress');
      const db = req.app.db;
      const state = db.getState();
      const profiles = state.achievementsProfiles ?? {};
      const defaultProgress = {
        balance: 0,
        lessonsCompleted: 0,
        testsCompleted: 0,
        wordsLearned: 0,
      };
      const profile = profiles[userId] ?? buildAchievementsProfile(userId, defaultProgress);

      if (method === 'GET' && !isProgressUpdate) {
        res.jsonp(profile);
        return;
      }

      if (method === 'PATCH' && isProgressUpdate) {
        const progress = {
          ...profile.progress,
          ...(req.body ?? {}),
        };
        const nextProfile = buildAchievementsProfile(userId, progress, profile.achievements);

        db.get('achievementsProfiles')
          .assign({ [userId]: nextProfile })
          .write();

        res.jsonp(nextProfile);
        return;
      }
    } catch (error) {
      res.status(500).jsonp({
        details: error instanceof Error ? error.message : String(error),
        message: 'Mock achievements handler failed',
      });
      return;
    }
  }

  if (!match) {
    pipeToBackend(req, res);
    return;
  }

  const userId = decodeURIComponent(match[1]);
  const action = match[2] ?? (req.path.endsWith('/calendar/month') ? 'calendar-month' : 'profile');
  const db = req.app.db;
  const state = db.getState();

  const defaultProfile = {
    activityHistory: [],
    brokenStreakInfo: null,
    claimedStreakAchievements: buildStreakAchievements(2),
    coinBalance: 100,
    currentStreak: 2,
    freezeTokens: 0,
    lastActivityDate: '2026-05-13',
    longestStreak: 2,
    nextBonusInDays: 1,
    nextMilestone: 3,
    serverNow: '2026-05-14T12:00:00.000Z',
    todayStatus: 'pending',
  };

  const profiles = state.streakProfiles ?? {};
  const profile = profiles[userId] ?? defaultProfile;

  if (method === 'GET' && action === 'profile') {
    res.jsonp(profile);
    return;
  }

  if (method === 'GET' && action === 'calendar-month') {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const key = `${userId}-${year}-${month}`;
    const calendars = state.streakCalendars ?? {};

    if (calendars[key]) {
      res.jsonp(calendars[key]);
      return;
    }

    const demoFallbackKey = `demo-user-${year}-${month}`;
    if (calendars[demoFallbackKey]) {
      res.jsonp(calendars[demoFallbackKey]);
      return;
    }

    res.jsonp(buildNeutralCalendarMonth(year, month));
    return;
  }

  if (method === 'POST' && action === 'activity-completed') {
    const nextStreak = profile.todayStatus === 'completed'
      ? profile.currentStreak
      : profile.currentStreak + 1;
    const claimedStreakAchievements = buildStreakAchievements(
      nextStreak,
      profile.claimedStreakAchievements,
    );
    const nextMilestone = resolveNextMilestone(nextStreak);
    const newlyUnlockedReward = claimedStreakAchievements.reduce((sum, achievement) => {
      const previous = (profile.claimedStreakAchievements ?? []).find(
        (item) => item.milestone === achievement.milestone,
      );

      if (achievement.isUnlocked && !previous?.isUnlocked) {
        return sum + achievement.rewardCoins;
      }

      return sum;
    }, 0);
    const next = {
      ...profile,
      claimedStreakAchievements,
      coinBalance: profile.coinBalance + newlyUnlockedReward,
      currentStreak: nextStreak,
      lastActivityDate: '2026-05-14',
      longestStreak: Math.max(profile.longestStreak, nextStreak),
      nextBonusInDays: Math.max(0, nextMilestone - nextStreak),
      nextMilestone,
      todayStatus: 'completed',
    };

    db.get('streakProfiles')
      .assign({ [userId]: next })
      .write();

    res.jsonp({
      pendingSync: false,
      streak: next,
    });
    return;
  }

  if (method === 'POST' && action === 'restore') {
    const next = {
      ...profile,
      brokenStreakInfo: null,
      currentStreak: profile.brokenStreakInfo?.previousStreak ?? profile.currentStreak,
      todayStatus: 'restored',
    };

    res.jsonp(next);
    return;
  }

  next();
};
