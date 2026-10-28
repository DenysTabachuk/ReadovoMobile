import { ApiException } from './api-exception';
import { COMMON_ERRORS } from './common-errors';

describe('ApiException', () => {
  it('does not expose extra metadata attached to a module definition', () => {
    const definition = {
      ...COMMON_ERRORS.INTERNAL_ERROR,
      internalDebug: 'secret-provider-details',
    };
    const error = new ApiException(definition);

    expect(error.getStatus()).toBe(500);
    expect(error.getResponse()).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
  });
});
