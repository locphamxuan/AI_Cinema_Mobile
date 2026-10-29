import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { GOOGLE_STEP, isGoogleSignInAvailable, isGoogleStep, pickGoogleIdToken, type GoogleStep } from '../../lib/googleSignIn';
import { Button } from '../common/Button';
import { styles } from '../../styles/components/auth/AuthModal.styles';

/**
 * "Continue with Google" under the sign-in sheet. A first sign-in may need one more answer: a
 * birthday to open a member account (18+, BR-54), or the password of the account that already
 * owns the email. The same Google token is sent again with that answer.
 */
export const GoogleSignInSection: React.FC = () => {
  const { colors, isDark } = useTheme();
  const loginWithGoogle = useAppStore((state) => state.loginWithGoogle);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [step, setStep] = useState<GoogleStep | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async (token: string, extra?: { dateOfBirth?: string; password?: string }) => {
    setLoading(true);
    setError(null);
    const res = await loginWithGoogle(token, extra);
    setLoading(false);
    if (res.success) return;
    if (isGoogleStep(res.reason) && !extra) {
      setIdToken(token);
      setStep(res.reason);
      return;
    }
    setError(res.error || 'Chưa đăng nhập được bằng Google. Thử lại sau ít phút.');
  };

  const start = async () => {
    setError(null);
    if (!isGoogleSignInAvailable()) {
      setError('Đăng nhập Google yêu cầu bản development build hoặc Expo build (npx expo run:android).');
      return;
    }
    try {
      const token = await pickGoogleIdToken();
      if (token) await send(token);
    } catch {
      setError('Chưa mở được đăng nhập Google. Kiểm tra mạng và Google Play Services rồi thử lại.');
    }
  };

  const confirm = () => {
    if (!idToken || !step) return;
    const value = answer.trim();
    if (!value) {
      setError(step === GOOGLE_STEP.BIRTHDAY ? 'Nhập ngày sinh của bạn.' : 'Nhập mật khẩu của tài khoản.');
      return;
    }
    void send(idToken, step === GOOGLE_STEP.BIRTHDAY ? { dateOfBirth: value } : { password: answer });
  };

  const cancel = () => {
    setIdToken(null);
    setStep(null);
    setAnswer('');
    setError(null);
  };

  const inputStyle = [styles.input, { backgroundColor: isDark ? colors.cardAlt : colors.card, color: colors.text }];

  if (step) {
    const birthday = step === GOOGLE_STEP.BIRTHDAY;
    return (
      <View style={styles.form}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {birthday
            ? 'Lần đầu đăng nhập bằng Google: nhập ngày sinh để tạo tài khoản (từ 18 tuổi).'
            : 'Email này đã có tài khoản AI Cinema. Nhập mật khẩu của tài khoản đó để liên kết với Google.'}
        </Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{birthday ? 'Ngày sinh' : 'Mật khẩu tài khoản'}</Text>
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder={birthday ? '2003-05-14' : undefined}
            placeholderTextColor={colors.textMuted}
            keyboardType={birthday ? 'numbers-and-punctuation' : 'default'}
            secureTextEntry={!birthday}
            autoCapitalize="none"
            accessibilityLabel={birthday ? 'Ngày sinh' : 'Mật khẩu tài khoản'}
            style={inputStyle}
          />
          {birthday ? <Text style={[styles.hint, { color: colors.textMuted }]}>Viết theo dạng năm-tháng-ngày.</Text> : null}
        </View>
        {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
        <Button label="Tiếp tục" onPress={confirm} loading={loading} />
        <Button label="Hủy" variant="quiet" onPress={cancel} />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={[styles.hint, { color: colors.textMuted, textAlign: 'center' }]}>hoặc</Text>
      <Button label="Tiếp tục với Google" icon="logo-google" variant="secondary" onPress={start} loading={loading} />
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
};
