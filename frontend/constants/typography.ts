import type { TextStyle } from 'react-native';

const body = {
  fontSize: 16,
  lineHeight: 24,
} satisfies TextStyle;

const bodyStrong = {
  ...body,
  fontWeight: '600',
} satisfies TextStyle;

const screenTitle = {
  fontSize: 32,
  fontWeight: '700',
  lineHeight: 36,
} satisfies TextStyle;

const sectionTitle = {
  fontSize: 20,
  fontWeight: '700',
  lineHeight: 28,
} satisfies TextStyle;

export const Typography = {
  heroTitle: {
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 48,
  },
  screenTitle,
  sectionTitle,
  body,
  description: {
    fontSize: 18,
    lineHeight: 26,
  },
  paragraph: {
    fontSize: 18,
    lineHeight: 28,
  },
  bodyStrong,
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  link: {
    color: '#0a7ea4',
    fontSize: 16,
    lineHeight: 30,
  },
  default: body,
  defaultSemiBold: bodyStrong,
  title: screenTitle,
  subtitle: sectionTitle,
} satisfies Record<string, TextStyle>;

export type TypographyType = keyof typeof Typography;
