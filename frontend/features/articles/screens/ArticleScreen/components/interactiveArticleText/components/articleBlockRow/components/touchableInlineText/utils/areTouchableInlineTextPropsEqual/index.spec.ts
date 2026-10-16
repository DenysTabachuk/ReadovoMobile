import { areTouchableInlineTextPropsEqual } from './index';

const props: Parameters<typeof areTouchableInlineTextPropsEqual>[0] = {
  nodes: [],
  style: {},
  prefix: 'block-1',
  onWordPress: () => {},
};
describe('areTouchableInlineTextPropsEqual', () => {
  it('reuses identical props and ignores tokens in other blocks', () => {
    expect(areTouchableInlineTextPropsEqual(props, { ...props })).toBe(true);
    expect(
      areTouchableInlineTextPropsEqual(props, {
        ...props,
        speakingTokenKey: 'block-2-w0',
        selectedTokenKeys: ['block-2-w0'],
      }),
    ).toBe(true);
  });
  it('invalidates changed content references, callbacks, and prefixes', () => {
    expect(
      areTouchableInlineTextPropsEqual(props, { ...props, nodes: [] }),
    ).toBe(false);
    expect(
      areTouchableInlineTextPropsEqual(props, {
        ...props,
        onWordPress: () => {},
      }),
    ).toBe(false);
    expect(
      areTouchableInlineTextPropsEqual(props, { ...props, prefix: 'block-2' }),
    ).toBe(false);
    expect(
      areTouchableInlineTextPropsEqual(props, { ...props, style: {} }),
    ).toBe(false);
  });
  it('invalidates selection and speech changes inside this block', () => {
    expect(
      areTouchableInlineTextPropsEqual(props, {
        ...props,
        selectedTokenKeys: ['block-1-w0'],
      }),
    ).toBe(false);
    expect(
      areTouchableInlineTextPropsEqual(
        { ...props, speakingTokenKey: 'block-1-w0' },
        props,
      ),
    ).toBe(false);
  });
});
