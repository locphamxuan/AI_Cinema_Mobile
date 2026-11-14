import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePasswordReset } from '../../hooks/usePasswordReset';
import { PASSWORD_HINT } from '../../lib/authForm';
import { useTheme } from '../../theme';
import { Button } from '../common/Button';
import { styles } from '../../styles/components/auth/AuthModal.styles';
import { resetStyles } from '../../styles/components/auth/ForgotPasswordView.styles';

interface ForgotPasswordViewProps {
  /** The email typed in the sign-in form, filled in here. */
  initialEmail: string;
  onBack: () => void;
}

/** The "Quên mật khẩu" part of the auth sheet: e-mail a code, then choose a new password with it. */
export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ initialEmail, onBack }) => {
  const { colors, isDark } = useTheme();
  const flow = usePasswordReset(initialEmail);
  const [showPassword, setShowPassword] = useState(false);
  const inputStyle = [styles.input, { backgroundColor: isDark ? colors.cardAlt : colors.card, color: colors.text }];
  const waiting = flow.secondsLeft > 0;

  const field = (label: string, input: React.ReactNode, hint?: string) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {input}
      {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );

  const emailStep = (
    <>
      <Text style={[resetStyles.intro, { color: colors.textSecondary }]}>
        Nhập email tài khoản, chúng tôi sẽ gửi mã 6 số để bạn đặt mật khẩu mới.
      </Text>
      {field(
        'Email',
        <TextInput
          value={flow.email}
          onChangeText={flow.setEmail}
          placeholder="ten@email.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          accessibilityLabel="Email nhận mã"
          style={inputStyle}
        />,
      )}
      {flow.error && <Text style={[styles.error, { color: colors.danger }]}>{flow.error}</Text>}
      <Button
        label={waiting ? `Gửi mã (${flow.secondsLeft} giây)` : 'Gửi mã'}
        onPress={flow.sendCode}
        loading={flow.loading}
        disabled={waiting}
      />
    </>
  );

  const resetStep = (
    <>
      {flow.notice && (
        <View style={[styles.saved, { backgroundColor: colors.card }]}>
          <Text style={[styles.savedText, { color: colors.textSecondary }]}>{flow.notice}</Text>
          <TouchableOpacity onPress={flow.changeEmail} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.savedAction, { color: colors.ruby }]}>Đổi email ({flow.email.trim()})</Text>
          </TouchableOpacity>
        </View>
      )}
      {field(
        'Mã xác nhận',
        <TextInput
          value={flow.otp}
          onChangeText={flow.setOtp}
          placeholder="6 số trong email"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          accessibilityLabel="Mã xác nhận 6 số"
          style={[inputStyle, resetStyles.code]}
        />,
      )}
      {field(
        'Mật khẩu mới',
        <View style={styles.passwordWrap}>
          <TextInput
            value={flow.password}
            onChangeText={flow.setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            accessibilityLabel="Mật khẩu mới"
            style={[inputStyle, styles.passwordInput]}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eye}
            hitSlop={8}
            accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>,
        PASSWORD_HINT,
      )}
      {field(
        'Nhập lại mật khẩu mới',
        <TextInput
          value={flow.confirmPassword}
          onChangeText={flow.setConfirmPassword}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          accessibilityLabel="Nhập lại mật khẩu mới"
          style={inputStyle}
        />,
      )}
      {flow.error && <Text style={[styles.error, { color: colors.danger }]}>{flow.error}</Text>}
      <Button label="Đặt mật khẩu mới" onPress={flow.submitReset} loading={flow.loading} />
      <Button
        label={waiting ? `Gửi lại mã sau ${flow.secondsLeft} giây` : 'Gửi lại mã'}
        variant="secondary"
        onPress={flow.sendCode}
        disabled={waiting || flow.loading}
      />
    </>
  );

  return (
    <>
      {flow.step === 'email' ? emailStep : resetStep}
      <TouchableOpacity style={styles.switch} onPress={onBack} accessibilityRole="button">
        <Text style={[styles.switchText, { color: colors.ruby }]}>Quay lại đăng nhập</Text>
      </TouchableOpacity>
    </>
  );
};
