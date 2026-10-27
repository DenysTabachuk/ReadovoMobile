import { BadGatewayException } from '@nestjs/common';

import { ExternalHttpError } from './external-http.error';
import { mapProviderError } from './map-provider-error';

it('maps only rejected provider HTTP responses to the public exception', () => {
  const exception = new BadGatewayException('Provider unavailable.');
  expect(() => mapProviderError(exception)(new ExternalHttpError(503))).toThrow(
    exception,
  );
  const network = new Error('Network failure');
  expect(() => mapProviderError(exception)(network)).toThrow(network);
});
