import { parseAuthUserProfile } from '.';

it('accepts a required ID and nullable profile labels', () => {
  expect(
    parseAuthUserProfile({ id: 'reader-a', email: null, displayName: null }),
  ).toEqual({ id: 'reader-a', email: null, displayName: null });
});

it.each([
  null,
  {},
  { id: null },
  { id: '  ', email: null, displayName: null },
  { id: 'a', email: 12, displayName: null },
  { id: 'a', email: null },
  { id: 'a', email: null, displayName: false },
])('rejects invalid profile %j', (value) => {
  expect(parseAuthUserProfile(value)).toBeNull();
});
