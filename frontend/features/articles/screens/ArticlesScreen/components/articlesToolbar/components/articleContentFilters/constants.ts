import { palette } from '@/constants/palette';
import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ArticleCategoryFilter } from '../../types';
type CategoryOption = {
  iconColor: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  labelKey: string;
  value: ArticleCategoryFilter;
};
export const ARTICLE_CATEGORY_OPTIONS: CategoryOption[] = [
  {
    iconColor: palette.purple300,
    icon: 'sparkles-outline',
    labelKey: 'articles.filters.category.all',
    value: 'all',
  },
  {
    iconColor: palette.blue300,
    icon: 'planet-outline',
    labelKey: 'articles.filters.category.space',
    value: 'space',
  },
  {
    iconColor: palette.pink300,
    icon: 'football-outline',
    labelKey: 'articles.filters.category.sports',
    value: 'sports',
  },
  {
    iconColor: palette.pink300,
    icon: 'restaurant-outline',
    labelKey: 'articles.filters.category.food',
    value: 'food',
  },
  {
    iconColor: palette.blue300,
    icon: 'map-outline',
    labelKey: 'articles.filters.category.geography',
    value: 'geography',
  },
  {
    iconColor: palette.purple300,
    icon: 'person-outline',
    labelKey: 'articles.filters.category.biography',
    value: 'biography',
  },
  {
    iconColor: palette.pink300,
    icon: 'time-outline',
    labelKey: 'articles.filters.category.history',
    value: 'history',
  },
  {
    iconColor: palette.green300,
    icon: 'flask-outline',
    labelKey: 'articles.filters.category.science',
    value: 'science',
  },
  {
    iconColor: palette.cyan300,
    icon: 'hardware-chip-outline',
    labelKey: 'articles.filters.category.technology',
    value: 'technology',
  },
  {
    iconColor: palette.green300,
    icon: 'leaf-outline',
    labelKey: 'articles.filters.category.nature',
    value: 'nature',
  },
  {
    iconColor: palette.pink300,
    icon: 'color-palette-outline',
    labelKey: 'articles.filters.category.culture',
    value: 'culture',
  },
];
