import { useState } from 'react';
import { Pressable, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { FormTextInput } from '@/components/formTextInput';
import { useThemeColor } from '@/hooks/use-theme-color';

type PasswordTextInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
};

export function PasswordTextInput(props: PasswordTextInputProps) {
  const { t } = useTranslation();
  const inputIconColor = useThemeColor({}, 'text');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <FormTextInput
      autoCapitalize="none"
      autoComplete="password"
      rightAccessory={
        <Pressable
          accessibilityLabel={t('auth.togglePasswordVisibility')}
          hitSlop={12}
          onPress={() => setIsPasswordVisible((current) => !current)}>
          <Ionicons
            color={inputIconColor}
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
          />
        </Pressable>
      }
      secureTextEntry={!isPasswordVisible}
      {...props}
    />
  );
}
