import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ArticleCategoryFilter } from '../../types';
type CategoryOption = {
  darkIconColor: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  labelKey: string;
  value: ArticleCategoryFilter;
};
export const ARTICLE_CATEGORY_OPTIONS: CategoryOption[] = [
  {
    darkIconColor: '#c4a7ff',
    icon: 'sparkles-outline',
    labelKey: 'articles.filters.category.all',
    value: 'all',
  },
  {
    darkIconColor: '#a5b4fc',
    icon: 'planet-outline',
    labelKey: 'articles.filters.category.space',
    value: 'space',
  },
  {
    darkIconColor: '#f0abfc',
    icon: 'football-outline',
    labelKey: 'articles.filters.category.sports',
    value: 'sports',
  },
  {
    darkIconColor: '#f9a8d4',
    icon: 'restaurant-outline',
    labelKey: 'articles.filters.category.food',
    value: 'food',
  },
  {
    darkIconColor: '#93c5fd',
    icon: 'map-outline',
    labelKey: 'articles.filters.category.geography',
    value: 'geography',
  },
  {
    darkIconColor: '#c4b5fd',
    icon: 'person-outline',
    labelKey: 'articles.filters.category.biography',
    value: 'biography',
  },
  {
    darkIconColor: '#f5d0fe',
    icon: 'time-outline',
    labelKey: 'articles.filters.category.history',
    value: 'history',
  },
  {
    darkIconColor: '#86efac',
    icon: 'flask-outline',
    labelKey: 'articles.filters.category.science',
    value: 'science',
  },
  {
    darkIconColor: '#67e8f9',
    icon: 'hardware-chip-outline',
    labelKey: 'articles.filters.category.technology',
    value: 'technology',
  },
  {
    darkIconColor: '#bef264',
    icon: 'leaf-outline',
    labelKey: 'articles.filters.category.nature',
    value: 'nature',
  },
  {
    darkIconColor: '#fbcfe8',
    icon: 'color-palette-outline',
    labelKey: 'articles.filters.category.culture',
    value: 'culture',
  },
];
