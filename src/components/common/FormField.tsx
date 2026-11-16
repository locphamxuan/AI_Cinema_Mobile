import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/common/FormField.styles';

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Shown in red under the field and outlines it; replaces the hint while it lasts. */
  error?: string;
  hint?: string;
  /** A password field with an eye button to show what was typed. */
  secret?: boolean;
}

/** A labelled text field with its own validation message, used by every form outside the sign-in sheet. */
export const FormField: React.FC<FormFieldProps> = ({ label, error, hint, secret, ...input }) => {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const note = error || hint;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secret && !visible}
          autoCapitalize={secret ? 'none' : input.autoCapitalize}
          accessibilityLabel={label}
          accessibilityHint={error}
          {...input}
          style={[
            styles.input,
            secret && styles.withEye,
            {
              backgroundColor: isDark ? colors.cardAlt : colors.card,
              color: colors.text,
              borderColor: error ? colors.danger : 'transparent',
            },
          ]}
        />
        {secret ? (
          <TouchableOpacity
            style={styles.eye}
            onPress={() => setVisible((v) => !v)}
            accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {note ? (
        <Text style={[error ? styles.error : styles.hint, { color: error ? colors.danger : colors.textMuted }]}>{note}</Text>
      ) : null}
    </View>
  );
};
