import { useState, type ReactNode } from 'react';
import {
  TextInput,
  type StyleProp,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

type FormTextInputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  rightAccessory?: ReactNode;
};

export function FormTextInput({
  containerStyle,
  label,
  onBlur,
  onFocus,
  placeholderTextColor,
  rightAccessory,
  selectionColor,
  style,
  ...props
}: FormTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const placeholderColor = useThemeColor({ light: '#7c7c7c', dark: '#a8a8a8' }, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="bodyStrong" style={styles.label}>
        {label}
      </ThemedText>

      <View style={styles.inputWrap}>
        <TextInput
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={placeholderTextColor ?? placeholderColor}
          selectionColor={selectionColor ?? tintColor}
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            rightAccessory ? styles.inputWithRightAccessory : null,
            style,
            { color: textColor },
          ]}
          {...props}
        />

        {rightAccessory ? (
          <View style={styles.rightAccessory}>
            {rightAccessory}
          </View>
        ) : null}
      </View>
    </View>
  );
}
