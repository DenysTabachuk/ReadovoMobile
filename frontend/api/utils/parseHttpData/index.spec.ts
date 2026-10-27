import { parseHttpData } from '.';

it('parses JSON and preserves already parsed values', () => {
  expect(parseHttpData('{"id":1}', 200)).toEqual({ id: 1 });
  const data = { id: 1 };
  expect(parseHttpData(data, 200)).toBe(data);
});
it('rejects malformed or empty JSON successes and accepts no-content responses', () => {
  expect(() => parseHttpData('<html>invalid</html>', 200)).toThrow(SyntaxError);
  expect(() => parseHttpData('', 200)).toThrow(SyntaxError);
  expect(parseHttpData('', 204)).toBe('');
});
it('retains non-JSON HTTP errors for domain status mapping', () => {
  expect(parseHttpData('<html>Unavailable</html>', 503)).toBe(
    '<html>Unavailable</html>',
  );
  expect(parseHttpData('{"message":"Denied"}', 401)).toEqual({
    message: 'Denied',
  });
});
