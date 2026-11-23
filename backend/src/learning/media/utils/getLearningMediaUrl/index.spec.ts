import { getLearningMediaUrl } from '.';

it('encodes the stored key into a protected, API-relative URL', () => {
  expect(getLearningMediaUrl('learning/topics/example/v2.png')).toBe(
    '/learning/media?key=learning%2Ftopics%2Fexample%2Fv2.png',
  );
});

it.each([null, 'learning/topics/example/v1.svg', 'learning/topics/../v1.png'])(
  'omits artwork URLs for unavailable or unsupported keys (%s)',
  (key) => {
    expect(getLearningMediaUrl(key)).toBeNull();
  },
);
