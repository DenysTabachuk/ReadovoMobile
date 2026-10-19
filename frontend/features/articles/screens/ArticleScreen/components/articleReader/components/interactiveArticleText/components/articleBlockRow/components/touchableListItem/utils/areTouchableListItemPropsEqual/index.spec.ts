import { areTouchableListItemPropsEqual } from './index';

const props: Parameters<typeof areTouchableListItemPropsEqual>[0] = {
  item: [],
  itemIndex: 0,
  ordered: false,
  prefix: 'block-1',
  onWordPress: () => {},
};
describe('areTouchableListItemPropsEqual', () => {
  it('reuses identical props and ignores tokens in other blocks', () => {
    expect(areTouchableListItemPropsEqual(props, { ...props })).toBe(true);
    expect(
      areTouchableListItemPropsEqual(props, {
        ...props,
        speakingTokenKey: 'block-2-w0',
        selectedTokenKeys: ['block-2-w0'],
      }),
    ).toBe(true);
  });
  it('invalidates changed content references, callbacks, and prefixes', () => {
    expect(areTouchableListItemPropsEqual(props, { ...props, item: [] })).toBe(
      false,
    );
    expect(
      areTouchableListItemPropsEqual(props, {
        ...props,
        onWordPress: () => {},
      }),
    ).toBe(false);
    expect(
      areTouchableListItemPropsEqual(props, { ...props, prefix: 'block-2' }),
    ).toBe(false);
    expect(
      areTouchableListItemPropsEqual(props, { ...props, itemIndex: 1 }),
    ).toBe(false);
    expect(
      areTouchableListItemPropsEqual(props, { ...props, ordered: true }),
    ).toBe(false);
  });
  it('invalidates selection and speech changes inside this block', () => {
    expect(
      areTouchableListItemPropsEqual(props, {
        ...props,
        selectedTokenKeys: ['block-1-w0'],
      }),
    ).toBe(false);
    expect(
      areTouchableListItemPropsEqual(
        { ...props, speakingTokenKey: 'block-1-w0' },
        props,
      ),
    ).toBe(false);
  });
});
