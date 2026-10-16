import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { fonts, useTheme } from '../../theme';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { MIN_PASSWORD, authFormError } from '../../lib/authForm';
import { Button } from '../common/Button';
import { styles } from '../../styles/components/auth/AuthModal.styles';

export const AuthModal: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, login, register, initialAuthEmail } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = authModalMode === 'login';

  // Fill in what this device remembered when the dialog opens.
  useEffect(() => {
    if (!isAuthModalOpen) return;
    setError(null);
    const loadSaved = async () => {
      try {
        const [savedEmail, savedPassword, savedRemember] = await Promise.all([
          storage.getString(STORAGE_KEYS.REMEMBERED_EMAIL),
          storage.getString(STORAGE_KEYS.REMEMBERED_PASSWORD),
          storage.getString(STORAGE_KEYS.REMEMBER_ME),
        ]);
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(savedRemember !== 'false');
          setHasSavedCredentials(true);
          return;
        }
      } catch (e) {
        console.error('Error loading saved credentials:', e);
      }
      setEmail(initialAuthEmail || '');
      if (!initialAuthEmail) setPassword('');
      setRememberMe(true);
      setHasSavedCredentials(false);
    };
    void loadSaved();
  }, [isAuthModalOpen, initialAuthEmail]);

  const forgetSaved = async () => {
    try {
      await Promise.all([
        storage.remove(STORAGE_KEYS.REMEMBERED_EMAIL),
        storage.remove(STORAGE_KEYS.REMEMBERED_PASSWORD),
        storage.remove(STORAGE_KEYS.REMEMBER_ME),
      ]);
      setEmail('');
      setPassword('');
      setHasSavedCredentials(false);
    } catch (e) {
      console.error('Failed to clear credentials:', e);
    }
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
        try {
          if (rememberMe) {
            await Promise.all([
              storage.set(STORAGE_KEYS.REMEMBERED_EMAIL, email.trim()),
              storage.set(STORAGE_KEYS.REMEMBERED_PASSWORD, password),
              storage.set(STORAGE_KEYS.REMEMBER_ME, 'true'),
            ]);
          } else {
            await forgetSaved();
          }
        } catch (e) {
          console.error('Failed to update remembered credentials:', e);
        }
        if (result.redirectUrl) router.replace(result.redirectUrl as any);
      } else {
        setError(result.error || 'Chưa đăng nhập được. Kiểm tra email, mật khẩu và kết nối mạng.');
      }
    } else {
      const result = await register(name, email, password, dateOfBirth);
      if (result.success) {
        Alert.alert('Đã tạo tài khoản', 'Đăng nhập bằng email vừa đăng ký để bắt đầu xem.', [
          { text: 'Đăng nhập', onPress: () => openAuthModal('login', email.trim()) },
        ], { cancelable: false });
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
            {hasSavedCredentials && isLogin && (
              <View style={[styles.saved, { backgroundColor: colors.card }]}>
                <Text style={[styles.savedText, { color: colors.textSecondary }]}>Đã điền sẵn tài khoản lưu trên máy này.</Text>
                <TouchableOpacity onPress={forgetSaved} hitSlop={8}>
                  <Text style={[styles.savedAction, { color: colors.ruby }]}>Quên tài khoản này</Text>
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
                <Text style={[styles.checkLabel, { color: colors.textSecondary }]}>Nhớ đăng nhập trên máy này</Text>
              </TouchableOpacity>
              {isLogin && (
                <TouchableOpacity
                  hitSlop={8}
                  onPress={() =>
                    Alert.alert('Quên mật khẩu', 'App chưa đặt lại mật khẩu được. Nhắn cho Hỗ trợ trong mục Hồ sơ để lấy lại tài khoản.')
                  }
                >
                  <Text style={[styles.link, { color: colors.textSecondary }]}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              )}
            </View>

            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

            <Button label={isLogin ? 'Đăng nhập' : 'Tạo tài khoản'} onPress={handleSubmit} loading={loading} />

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
