import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { showDialog } from '../../lib/dialog';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionStore, useUiStore } from '../../store';
import { fonts, useTheme } from '../../theme';
import { forgetRememberedEmail, readRememberedEmail, rememberEmail } from '../../lib/rememberedLogin';
import { MIN_PASSWORD, authFormError } from '../../lib/authForm';
import { Button } from '../common/Button';
import { GoogleSignInSection } from './GoogleSignInSection';
import { styles } from '../../styles/components/auth/AuthModal.styles';

export const AuthModal: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { login, register } = useSessionStore();
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, initialAuthEmail } = useUiStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [hasSavedEmail, setHasSavedEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = authModalMode === 'login';

  // Each opening starts without the previous attempt's error.
  const [wasOpen, setWasOpen] = useState(false);
  if (isAuthModalOpen !== wasOpen) {
    setWasOpen(isAuthModalOpen);
    if (isAuthModalOpen) setError(null);
  }

  // Each opening fills in the email this device remembered; the password is always typed again.
  useEffect(() => {
    if (!isAuthModalOpen) return;
    void readRememberedEmail().then((saved) => {
      setEmail(saved || initialAuthEmail || '');
      setPassword('');
      setRememberMe(true);
      setHasSavedEmail(Boolean(saved));
    });
  }, [isAuthModalOpen, initialAuthEmail]);

  const forgetSaved = async () => {
    await forgetRememberedEmail();
    setEmail('');
    setPassword('');
    setHasSavedEmail(false);
  };

  const switchMode = () => {
    setError(null);
    openAuthModal(isLogin ? 'register' : 'login');
  };

  const handleSubmit = async () => {
    const problem = authFormError(isLogin, { name, email, password, confirmPassword, dateOfBirth });
    setError(problem);
    if (problem) return;
    setLoading(true);

    if (isLogin) {
      const result = await login(email, password);
      if (result.success) {
        if (rememberMe) await rememberEmail(email);
        else await forgetSaved();
        if (result.redirectUrl) router.replace(result.redirectUrl as Href);
      } else {
        setError(result.error || 'Chưa đăng nhập được. Kiểm tra email, mật khẩu và kết nối mạng.');
      }
    } else {
      const result = await register(name, email, password, dateOfBirth);
      if (result.success) {
        showDialog('Đã tạo tài khoản', 'Bạn đã là thành viên và có thể bắt đầu xem phim.');
      } else {
        setError(result.error || 'Chưa tạo được tài khoản. Kiểm tra kết nối rồi thử lại.');
      }
    }
    setLoading(false);
  };

  const inputStyle = [styles.input, { backgroundColor: isDark ? colors.cardAlt : colors.card, color: colors.text }];
  const field = (label: string, input: React.ReactNode, hint?: string) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {input}
      {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );

  return (
    <Modal visible={isAuthModalOpen} transparent animationType="slide" onRequestClose={closeAuthModal}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</Text>
            <TouchableOpacity onPress={closeAuthModal} hitSlop={10} accessibilityLabel="Đóng">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            {hasSavedEmail && isLogin && (
              <View style={[styles.saved, { backgroundColor: colors.card }]}>
                <Text style={[styles.savedText, { color: colors.textSecondary }]}>Đã điền sẵn email lưu trên máy này.</Text>
                <TouchableOpacity onPress={forgetSaved} hitSlop={8}>
                  <Text style={[styles.savedAction, { color: colors.ruby }]}>Quên email này</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLogin &&
              field('Họ và tên', <TextInput value={name} onChangeText={setName} placeholder="Nguyễn Văn A" placeholderTextColor={colors.textMuted} style={inputStyle} />)}
            {!isLogin &&
              field(
                'Ngày sinh',
                <TextInput value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="2003-05-14" placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" style={inputStyle} />,
                'Viết theo dạng năm-tháng-ngày.',
              )}
            {field(
              'Email',
              <TextInput value={email} onChangeText={setEmail} placeholder="ten@email.com" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={inputStyle} />,
            )}
            {field(
              'Mật khẩu',
              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoComplete={isLogin ? 'password' : 'new-password'}
                  style={[inputStyle, styles.passwordInput]}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eye} hitSlop={8} accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>,
              isLogin ? undefined : `Ít nhất ${MIN_PASSWORD} ký tự, có cả chữ và số.`,
            )}
            {!isLogin &&
              field(
                'Nhập lại mật khẩu',
                <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} placeholderTextColor={colors.textMuted} style={inputStyle} />,
              )}

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.check} onPress={() => setRememberMe((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: rememberMe }}>
                <View style={[styles.box, rememberMe ? { backgroundColor: colors.ruby, borderColor: colors.ruby } : { borderColor: colors.textMuted }]}>
                  {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkLabel, { color: colors.textSecondary }]}>Nhớ email trên máy này</Text>
              </TouchableOpacity>
              {isLogin && (
                <TouchableOpacity
                  hitSlop={8}
                  onPress={() =>
                    showDialog('Quên mật khẩu', 'Tính năng đặt lại mật khẩu sẽ có trong bản cập nhật sau.')
                  }
                >
                  <Text style={[styles.link, { color: colors.textSecondary }]}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              )}
            </View>

            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

            <Button label={isLogin ? 'Đăng nhập' : 'Tạo tài khoản'} onPress={handleSubmit} loading={loading} />

            <GoogleSignInSection />

            <TouchableOpacity style={styles.switch} onPress={switchMode}>
              <Text style={[styles.switchText, { color: colors.textMuted }]}>
                {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <Text style={{ color: colors.ruby, fontFamily: fonts.semibold }}>{isLogin ? 'Tạo tài khoản' : 'Đăng nhập'}</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
