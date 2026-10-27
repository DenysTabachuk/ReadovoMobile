import { getSessionOwner } from '.';

it('reads the subject, including base64url payloads', () => {
  // Buffer.from converts the JSON text to bytes; toString('base64url') encodes
  // those bytes as a JWT payload for getSessionOwner to decode in this test.
  const payload = Buffer.from(
    JSON.stringify({ sub: 'reader-a', extra: '~~~' }),
  ).toString('base64url');
  expect(getSessionOwner(`header.${payload}.signature`)).toBe('reader-a');
});

it.each([
  null,
  '',
  'broken',
  'h.bnVsbA.s',
  'h.e30.s',
  'h.eyJzdWIiOjF9.s',
  'h.eyJzdWIiOiIgIn0.s',
])('rejects an unprovable owner: %s', (token) => {
  expect(() => getSessionOwner(token)).toThrow('owner');
});
