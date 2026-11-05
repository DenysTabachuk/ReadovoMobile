import { palette } from './palette';

describe('base palette contract', () => {
  it('contains only opaque hex reference colors', () => {
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[\da-f]{6}$/i);
    }
  });

  it('names every family shade on the agreed hundred-step scale', () => {
    for (const name of Object.keys(palette)) {
      if (name === 'white' || name === 'black') continue;
      expect(name).toMatch(/^[a-z]+[1-9]00$/);
    }
  });
});
