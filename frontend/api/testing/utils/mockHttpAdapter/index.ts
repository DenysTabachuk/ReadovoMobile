import {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { httpClient } from '../../../httpClient';

jest.mock('@/api/config', () => ({ API_BASE_URL: 'https://api.example.test' }));

/** Installs a deterministic adapter, keeping Axios transforms/interceptors active.
 * @param clients - Additional instances to intercept alongside the public client.
 * @returns A mock adapter; unexpected requests fail without reaching the network.
 * @example const adapter = mockHttpAdapter(); adapter.mockResolvedValue(createHttpResponse([]));
 */
export function mockHttpAdapter(...clients: AxiosInstance[]) {
  const adapter = jest
    .fn<Promise<AxiosResponse<unknown>>, [InternalAxiosRequestConfig]>()
    .mockRejectedValue(new Error('Unexpected HTTP request in test'));
  // Real Axios adapters settle HTTP statuses before response interceptors run.
  const transport = async (config: InternalAxiosRequestConfig) => {
    const response = await adapter(config);
    response.config = config;
    if (config.validateStatus && !config.validateStatus(response.status)) {
      throw new AxiosError(
        'HTTP failure',
        AxiosError.ERR_BAD_RESPONSE,
        config,
        undefined,
        response,
      );
    }
    return response;
  };
  httpClient.defaults.adapter = transport;
  for (const client of clients) client.defaults.adapter = transport;
  return adapter;
}
