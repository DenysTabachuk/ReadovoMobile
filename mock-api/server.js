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
  const match = req.path.match(/^\/streak\/profile\/([^/]+)(?:\/(activity-completed|restore)|\/calendar\/month)?$/);

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
