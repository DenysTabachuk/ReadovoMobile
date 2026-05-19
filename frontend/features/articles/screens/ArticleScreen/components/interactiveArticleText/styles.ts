import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/theme';
import { Typography } from '@/constants/typography';

type ThemeName = keyof typeof Colors;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  collapsibleArrowExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  collapsibleHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: {
    includeFontPadding: false,
    flex: 1,
  },
  headingLevel1: {
    marginTop: Spacing.sm,
  },
  headingLevel2: {
    marginTop: Spacing.xs,
  },
  headingLevel3: {
    marginTop: Spacing.xs,
  },
  imageBlock: {
    gap: Spacing.sm,
  },
  imageCaption: {
    opacity: 0.75,
  },
  inlineBold: {
    fontWeight: '700',
  },
  inlineImage: {
    borderRadius: 12,
    height: 220,
    width: '100%',
  },
  inlineItalic: {
    fontStyle: 'italic',
  },
  list: {
    gap: Spacing.sm,
  },
  listBullet: {
    includeFontPadding: false,
    lineHeight: Typography.paragraph.lineHeight,
    width: 20,
  },
  listItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  listItemText: {
    flex: 1,
    includeFontPadding: false,
    lineHeight: Typography.paragraph.lineHeight,
  },
  subheading: {
    marginTop: Spacing.xs,
  },
  paragraph: {
    includeFontPadding: false,
    lineHeight: Typography.paragraph.lineHeight,
  },
  speakingSentence: {
    backgroundColor: 'rgba(242, 201, 76, 0.22)',
    borderRadius: 6,
  },
  table: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableCell: {
    borderRightWidth: 1,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  tableCellText: {
    includeFontPadding: false,
    lineHeight: Typography.body.lineHeight,
  },
  tableHeaderCell: {},
  tableHeaderText: {
    fontWeight: '700',
  },
  tableRow: {
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  tableViewport: {
    marginHorizontal: -Spacing.xs,
  },
  tableViewportContent: {
    paddingHorizontal: Spacing.xs,
  },
  tableWideCell: {
    flexGrow: 0,
    flexShrink: 0,
    width: 140,
  },
  wordPickBlock: {
    backgroundColor: 'rgba(111, 63, 240, 0.06)',
    borderLeftColor: 'rgba(111, 63, 240, 0.5)',
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingLeft: Spacing.sm,
  },
  wordPickHint: {
    alignSelf: 'flex-end',
    marginBottom: -Spacing.xs,
    opacity: 0.85,
  },
});

export function getThemeStyles(themeName: ThemeName) {
  const palette = Colors[themeName];

  return {
    inlineImage: {
      backgroundColor: palette.background,
    },
    table: {
      borderColor: palette.icon,
    },
    tableCell: {
      borderColor: palette.icon,
    },
    tableHeaderCell: {
      backgroundColor:
        themeName === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(17, 24, 28, 0.06)',
    },
    tableRow: {
      borderBottomColor: palette.icon,
    },
  } as const;
}
