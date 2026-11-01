import { HttpError } from '@/api/httpError';
import { useDictionaryMutationFeedback } from '.';

const mockBanner = jest.fn();
jest.mock('@/components/banner', () => ({
  useBanner: () => ({ showBanner: mockBanner }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => jest.clearAllMocks());

it('presents saves and deletes with their translated success messages', () => {
  const { onSaved: showWordSavedBanner, onDeleted: showWordDeletedBanner } =
    useDictionaryMutationFeedback();
  showWordSavedBanner();
  showWordDeletedBanner();
  expect(mockBanner.mock.calls).toEqual([
    [{ title: 'dictionary.saved', variant: 'success' }],
    [{ title: 'dictionary.deleted', variant: 'success', durationMs: 3200 }],
  ]);
});

it('presents duplicate words as information', () => {
  useDictionaryMutationFeedback().onError(
    new HttpError({
      status: 400,
      data: {
        code: 'DICTIONARY_WORD_ALREADY_EXISTS',
        message: 'Private details',
      },
    }),
  );
  expect(mockBanner).toHaveBeenCalledWith({
    title: 'dictionary.alreadyExists',
    variant: 'info',
    durationMs: 4200,
  });
});

it('uses generic feedback for an unexpected failure', () => {
  useDictionaryMutationFeedback().onError(null);
  expect(mockBanner).toHaveBeenCalledWith({
    title: 'errors.generic',
    variant: 'error',
    durationMs: 4200,
  });
});

it('keeps session cancellation silent while the observer is still mounted', () => {
  useDictionaryMutationFeedback().onError(
    Object.assign(new Error(), { name: 'AbortError' }),
  );
  expect(mockBanner).not.toHaveBeenCalled();
});
