import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { isGoogleSignInAvailable, needsGoogleBirthday, pickGoogleIdToken } from '../../lib/googleSignIn';
import { Button } from '../common/Button';
import { styles } from '../../styles/components/auth/AuthModal.styles';

/**
 * "Continue with Google" under the sign-in sheet. An email that already has an account is linked at
 * once (Google verified it). A first sign-in may need a birthday to open a member account (18+,
 * BR-54); the same Google token is sent again with it.
 */
export const GoogleSignInSection: React.FC = () => {
  const { colors, isDark } = useTheme();
  const loginWithGoogle = useAppStore((state) => state.loginWithGoogle);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isGoogleSignInAvailable()) return null;

  const send = async (token: string, extra?: { dateOfBirth: string }) => {
    setLoading(true);
    setError(null);
    const res = await loginWithGoogle(token, extra);
    setLoading(false);
    if (res.success) return;
    if (needsGoogleBirthday(res.reason) && !extra) {
      setIdToken(token);
      return;
    }
    setError(res.error || 'Chưa đăng nhập được bằng Google. Thử lại sau ít phút.');
  };

  const start = async () => {
    setError(null);
    try {
      const token = await pickGoogleIdToken();
      if (token) await send(token);
    } catch {
      setError('Chưa mở được đăng nhập Google. Kiểm tra mạng và Google Play Services rồi thử lại.');
    }
  };

  const confirm = () => {
    if (!idToken) return;
    const dateOfBirth = birthday.trim();
    if (!dateOfBirth) {
      setError('Nhập ngày sinh của bạn.');
      return;
    }
    void send(idToken, { dateOfBirth });
  };

  const cancel = () => {
    setIdToken(null);
    setBirthday('');
    setError(null);
  };

  const inputStyle = [styles.input, { backgroundColor: isDark ? colors.cardAlt : colors.card, color: colors.text }];

  if (idToken) {
    return (
      <View style={styles.form}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Lần đầu đăng nhập bằng Google: nhập ngày sinh để tạo tài khoản (từ 18 tuổi).
        </Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Ngày sinh</Text>
          <TextInput
            value={birthday}
            onChangeText={setBirthday}
            placeholder="2003-05-14"
            placeholderTextColor={colors.textMuted}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            accessibilityLabel="Ngày sinh"
            style={inputStyle}
          />
          <Text style={[styles.hint, { color: colors.textMuted }]}>Viết theo dạng năm-tháng-ngày.</Text>
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
