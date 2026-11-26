import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useSessionStore } from '../../store';
import { useTheme } from '../../theme';
import { isGoogleSignInAvailable, pickGoogleIdToken } from '../../lib/googleSignIn';
import { Button } from '../common/Button';
import { GoogleTermsModal } from './GoogleTermsModal';
import { styles } from '../../styles/components/auth/AuthModal.styles';

/**
 * "Continue with Google" under the sign-in sheet, for members only. A member already linked to Google is signed in
 * at once. A new email first has to accept the terms of use, like email sign-up; only then is the account opened.
 */
export const GoogleSignInSection: React.FC = () => {
  const { colors } = useTheme();
  const loginWithGoogle = useSessionStore((state) => state.loginWithGoogle);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // The picked Google token waiting for the terms: it is sent again with the acceptance.
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  if (!isGoogleSignInAvailable()) return null;

  const signIn = async (token: string, acceptedTerms?: boolean) => {
    setLoading(true);
    try {
      const res = await loginWithGoogle(token, acceptedTerms);
      if (res.termsRequired) return setPendingToken(token);
      setPendingToken(null);
      if (!res.success) setError(res.error || 'Chưa đăng nhập được bằng Google. Thử lại sau ít phút.');
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    setError(null);
    try {
      const token = await pickGoogleIdToken();
      if (token) await signIn(token);
    } catch {
      setError('Chưa mở được đăng nhập Google. Kiểm tra mạng và ứng dụng Google trên máy rồi thử lại.');
    }
  };

  return (
    <View style={styles.form}>
      <Text style={[styles.hint, { color: colors.textMuted, textAlign: 'center' }]}>hoặc</Text>
      <Button label="Tiếp tục với Google" icon="logo-google" variant="secondary" onPress={start} loading={loading} />
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
      <GoogleTermsModal
        visible={pendingToken !== null}
        loading={loading}
        onCancel={() => setPendingToken(null)}
        onConfirm={() => pendingToken && void signIn(pendingToken, true)}
      />
    </View>
  );
};
