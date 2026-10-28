import { API_ERROR_CATALOGUE } from './api-error-catalogue';

describe('API error catalogue', () => {
  it('has globally unique public codes across all registered modules', () => {
    const codes = API_ERROR_CATALOGUE.map((definition) => definition.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
