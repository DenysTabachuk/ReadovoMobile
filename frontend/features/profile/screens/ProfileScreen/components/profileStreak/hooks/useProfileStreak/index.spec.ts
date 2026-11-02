import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useStreakProfileQuery,
  getStreakProfile,
  restoreBrokenStreak,
  applyStreakFreeze,
  purchaseStreakFreezeToken,
  type StreakState,
} from '@/features/streak';
import { useProfileStreak } from '.';

type ProfileContentProps = {
  showStreak: boolean;
};

// Keep the real query/mutation hooks and their React Query observers. Replace
// transport and banner presentation so this exercises the screen callback lifetime.
jest.mock('@/features/auth', () => ({
  api: jest.fn(),
  useAuthenticatedUser: () => ({ id: 'reader-a' }),
}));
jest.mock('@/features/streak', () => ({
  ...jest.requireActual('@/features/streak/api/requests'),
  ...jest.requireActual('@/features/streak/api/queries/useStreakProfileQuery'),
  ...jest.requireActual(
    '@/features/streak/api/mutations/useRestoreStreakMutation',
  ),
  ...jest.requireActual(
    '@/features/streak/api/mutations/useApplyStreakFreezeMutation',
  ),
  ...jest.requireActual(
    '@/features/streak/api/mutations/usePurchaseStreakFreezeTokenMutation',
  ),
  ...jest.requireActual('@/features/streak/utils/getStreakErrorMessageKey'),
  useStreakAchievementFeedback: () => mockAchievementFeedback,
}));
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockBanner }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/features/streak/api/requests/getStreakProfile', () => ({
  getStreakProfile: jest.fn(),
}));
jest.mock('@/features/streak/api/requests/restoreBrokenStreak', () => ({
  restoreBrokenStreak: jest.fn(),
}));
jest.mock('@/features/streak/api/requests/applyStreakFreeze', () => ({
  applyStreakFreeze: jest.fn(),
}));
jest.mock('@/features/streak/api/requests/purchaseStreakFreezeToken', () => ({
  purchaseStreakFreezeToken: jest.fn(),
}));

const INITIAL_STREAK: StreakState = {
  activityHistory: [],
  brokenStreakInfo: {
    brokenAt: '2026-11-01',
    canRestore: true,
    previousStreak: 3,
  },
  claimedStreakAchievements: [],
  coinBalance: 100,
  currentStreak: 0,
  freezeTokenPrice: 20,
  freezeTokens: 1,
  lastActivityDate: '2026-10-31',
  longestStreak: 3,
  nextBonusInDays: 3,
  nextMilestone: 3,
  restorePrice: 50,
  serverNow: '2026-11-02T12:00:00Z',
  todayStatus: 'broken',
};
const mockBanner = jest.fn();
const mockAchievementFeedback = jest.fn();
let client: QueryClient;
let renderer: Root | undefined;
let latestControls: ReturnType<typeof useProfileStreak> | undefined;

function Probe() {
  latestControls = useProfileStreak();
  return null;
}

function ProfileContent({ showStreak }: ProfileContentProps) {
  const { data: streak } = useStreakProfileQuery();
  return createElement(
    'div',
    { 'data-current-streak': streak?.currentStreak },
    showStreak ? createElement(Probe) : null,
  );
}

function controls() {
  if (!latestControls) throw new Error('Profile streak has not mounted.');
  return latestControls;
}

async function mount() {
  await act(async () => {
    renderer = createRoot();
    renderer.render(
      createElement(QueryClientProvider, { client }, createElement(Probe)),
    );
  });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.clearAllMocks();
  latestControls = undefined;
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(['streak-profile', 'reader-a'], INITIAL_STREAK);
  jest.mocked(getStreakProfile).mockResolvedValue(INITIAL_STREAK);
});

afterEach(async () => {
  await act(async () => {
    renderer?.unmount();
  });
  client.clear();
  jest.restoreAllMocks();
});

it('closes confirmations through UI actions without submitting a mutation', async () => {
  await mount();
  await act(async () => {
    controls().openRestoreModal();
    controls().openPurchaseFreezeModal();
    controls().selectFreezeDate('2026-11-01');
  });
  expect(controls()).toMatchObject({
    isRestoreModalOpen: true,
    isPurchaseFreezeModalOpen: true,
    freezeDate: '2026-11-01',
  });
  await act(async () => {
    controls().closeRestoreModal();
    controls().closePurchaseFreezeModal();
    controls().closeFreezeModal();
  });
  expect(controls()).toMatchObject({
    isRestoreModalOpen: false,
    isPurchaseFreezeModalOpen: false,
    freezeDate: null,
  });
  expect(restoreBrokenStreak).not.toHaveBeenCalled();
  expect(purchaseStreakFreezeToken).not.toHaveBeenCalled();
  expect(applyStreakFreeze).not.toHaveBeenCalled();
});

it('restores the streak, closes confirmation, and reports the previous state for achievement feedback', async () => {
  const restored = {
    ...INITIAL_STREAK,
    currentStreak: 3,
    todayStatus: 'restored' as const,
  };
  jest.mocked(restoreBrokenStreak).mockResolvedValue(restored);
  await mount();
  await act(async () => {
    controls().openRestoreModal();
  });
  expect(controls().isRestoreModalOpen).toBe(true);
  await act(async () => {
    controls().restoreStreak();
  });
  expect(controls().isRestoreModalOpen).toBe(false);
  expect(mockAchievementFeedback).toHaveBeenCalledWith(
    restored,
    INITIAL_STREAK,
  );
  expect(mockBanner).toHaveBeenCalledWith({
    title: 'streak.restore.success',
    variant: 'success',
  });
});

it('only opens restoration for a broken streak that the server allows restoring', async () => {
  client.setQueryData(['streak-profile', 'reader-a'], {
    ...INITIAL_STREAK,
    brokenStreakInfo: { ...INITIAL_STREAK.brokenStreakInfo, canRestore: false },
  });
  await mount();
  await act(async () => {
    controls().openRestoreModal();
  });
  expect(controls().isRestoreModalOpen).toBe(false);
});

it('requires a selected freeze date and clears it only after a successful freeze', async () => {
  jest.mocked(applyStreakFreeze).mockResolvedValue(INITIAL_STREAK);
  await mount();
  await act(async () => {
    controls().applyFreeze();
  });
  expect(applyStreakFreeze).not.toHaveBeenCalled();
  await act(async () => {
    controls().selectFreezeDate('2026-11-01');
  });
  await act(async () => {
    controls().applyFreeze();
  });
  expect(applyStreakFreeze).toHaveBeenCalledWith({ date: '2026-11-01' });
  expect(controls().freezeDate).toBeNull();
});

it('keeps purchase confirmation open on failure and closes it after a successful retry', async () => {
  jest
    .mocked(purchaseStreakFreezeToken)
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValueOnce(INITIAL_STREAK);
  await mount();
  await act(async () => {
    controls().openPurchaseFreezeModal();
  });
  await act(async () => {
    controls().purchaseFreezeToken();
  });
  expect(controls().isPurchaseFreezeModalOpen).toBe(true);
  expect(mockBanner).toHaveBeenCalledWith({
    title: 'errors.generic',
    variant: 'error',
  });
  await act(async () => {
    controls().purchaseFreezeToken();
  });
  expect(controls().isPurchaseFreezeModalOpen).toBe(false);
});

it('keeps canceled mutations silent', async () => {
  jest
    .mocked(restoreBrokenStreak)
    .mockRejectedValue(
      Object.assign(new Error('Session changed'), { name: 'AbortError' }),
    );
  await mount();
  await act(async () => {
    controls().restoreStreak();
  });
  expect(mockBanner).not.toHaveBeenCalled();
  expect(mockAchievementFeedback).not.toHaveBeenCalled();
});

it('updates the owner cache but drops restore feedback after the screen unmounts', async () => {
  let finishRestore: (streak: StreakState) => void = () => {
    throw new Error('Restore not started.');
  };
  jest.mocked(restoreBrokenStreak).mockImplementation(
    () =>
      new Promise((resolve) => {
        finishRestore = resolve;
      }),
  );
  await mount();
  await act(async () => {
    controls().restoreStreak();
  });
  await act(async () => {
    renderer?.unmount();
  });
  const restored = { ...INITIAL_STREAK, currentStreak: 3 };
  await act(async () => {
    finishRestore(restored);
  });
  expect(client.getQueryData(['streak-profile', 'reader-a'])).toEqual(restored);
  expect(mockBanner).not.toHaveBeenCalled();
  expect(mockAchievementFeedback).not.toHaveBeenCalled();
});

it('shares the parent query cache and drops feedback when only the streak component unmounts', async () => {
  let finishRestore: (streak: StreakState) => void = () => {
    throw new Error('Restore not started.');
  };
  jest.mocked(restoreBrokenStreak).mockImplementation(
    () =>
      new Promise((resolve) => {
        finishRestore = resolve;
      }),
  );
  await act(async () => {
    renderer = createRoot();
    renderer.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ProfileContent, { showStreak: true }),
      ),
    );
  });
  expect(jest.mocked(getStreakProfile)).not.toHaveBeenCalled();
  await act(async () => {
    controls().restoreStreak();
  });
  await act(async () => {
    renderer?.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ProfileContent, { showStreak: false }),
      ),
    );
  });
  const restored = { ...INITIAL_STREAK, currentStreak: 3 };
  await act(async () => {
    finishRestore(restored);
  });
  expect(client.getQueryData(['streak-profile', 'reader-a'])).toEqual(restored);
  expect(mockBanner).not.toHaveBeenCalled();
  expect(mockAchievementFeedback).not.toHaveBeenCalled();
  await act(async () => {
    renderer?.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ProfileContent, { showStreak: false }),
      ),
    );
  });
  expect(
    renderer?.container.queryAll((node) => node.type === 'div')[0]?.props[
      'data-current-streak'
    ],
  ).toBe(3);
});
