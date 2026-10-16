import { logFailedResponse } from './index';

describe('logFailedResponse', () => {
  let log: jest.SpyInstance;
  beforeEach(() => {
    log = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());
  it('logs body/status metadata and consumes the response body', async () => {
    const response = new Response('Unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });
    await expect(
      logFailedResponse('registerPushToken', response),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      '[LearningRemindersApi] registerPushToken failed',
      {
        body: 'Unavailable',
        status: 503,
        statusText: 'Service Unavailable',
        url: '',
      },
    );
    expect(response.bodyUsed).toBe(true);
  });
  it('still logs status when reading the body fails', async () => {
    const response = new Response('Consumed', { status: 400 });
    const error = new Error('Body already read');
    jest.spyOn(response, 'text').mockRejectedValue(error);
    await expect(
      logFailedResponse('dispatch', response),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      '[LearningRemindersApi] dispatch failed to read error body',
      error,
    );
    expect(log).toHaveBeenLastCalledWith(
      '[LearningRemindersApi] dispatch failed',
      expect.objectContaining({ status: 400, body: '' }),
    );
  });
});
