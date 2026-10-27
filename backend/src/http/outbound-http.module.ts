import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import axios from 'axios';

import { parseHttpData } from './parse-http-data';
import { ExternalHttpError } from './external-http.error';

@Module({
  imports: [
    HttpModule.register({
      // Shared stateless provider transport, never global Axios defaults or credentials.
      responseType: 'json',
      transitional: { silentJSONParsing: false },
      transformResponse: [parseHttpData],
      maxRedirects: 20,
      // Native fetch did not pick up HTTP_PROXY implicitly.
      proxy: false,
    }),
  ],
  exports: [HttpModule],
})
export class OutboundHttpModule {
  constructor(http: HttpService) {
    http.axiosRef.interceptors.response.use(undefined, (error: unknown) => {
      if (axios.isAxiosError(error)) {
        if (error.response) throw new ExternalHttpError(error.response.status);
        // Axios config can contain Google id tokens and provider API keys.
        throw new Error('External HTTP request failed.');
      }
      throw error;
    });
  }
}
