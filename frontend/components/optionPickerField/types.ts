import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type StatusIcon = {
  accessibilityLabel: string;
  name: ComponentProps<typeof Ionicons>['name'];
};

export type PickerOptionValue<T extends string> = {
  badgeLabel?: string;
  badgeLabels?: string[];
  description?: string;
  disabled?: boolean;
  displayLabel?: string;
  label: string;
  statusIcons?: StatusIcon[];
  value: T;
};
