import { exportOpenApi } from '../openapi/export-openapi';

describe('Auth OpenAPI contract', () => {
  it('documents credential exchanges without access-token security and preserves 201 statuses', async () => {
    const document = await exportOpenApi();
    const operations = Object.entries(document.paths)
      .filter(([path]) => path.startsWith('/auth/'))
      .map(([, item]) => item?.post);
    expect(operations).toHaveLength(9);
    for (const operation of operations) {
      expect(operation?.security).toEqual([]);
      expect(operation?.responses).toHaveProperty('201');
      expect(operation?.responses).not.toHaveProperty('200');
    }
    const schemas = document.components?.schemas;
    expect(schemas?.AuthSessionResponse).toMatchObject({
      required: [
        'accessToken',
        'accessTokenExpiresAt',
        'refreshToken',
        'refreshTokenExpiresAt',
        'user',
      ],
      properties: {
        accessTokenExpiresAt: { type: 'string', format: 'date-time' },
        refreshTokenExpiresAt: { type: 'string', format: 'date-time' },
      },
    });
    expect(schemas?.AuthUser).not.toHaveProperty('properties.passwordHash');
    expect(schemas?.AuthUser).not.toHaveProperty('properties.passwordSalt');
    expect(schemas?.LoginUserRequest).toMatchObject({
      additionalProperties: false,
      properties: {
        password: { writeOnly: true, minLength: 1, maxLength: 128 },
      },
    });
    expect(schemas?.RegisterUserRequest).toMatchObject({
      properties: { password: { minLength: 8, maxLength: 128 } },
    });
    expect(schemas?.VerifyAuthCodeRequest).toMatchObject({
      properties: { code: { pattern: '^\\d{6}$' } },
    });
  });
});
