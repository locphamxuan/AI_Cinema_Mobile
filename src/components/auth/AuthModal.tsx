import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView } from 'react-native';
import { showDialog } from '../../lib/dialog';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionStore, useUiStore } from '../../store';
import { fonts, useTheme } from '../../theme';
import { forgetRememberedEmail, readRememberedEmail, rememberEmail } from '../../lib/rememberedLogin';
import { PASSWORD_HINT, authFormError, normalizeDateOfBirth } from '../../lib/authForm';
import { Button } from '../common/Button';
import { AgeConfirmModal } from './AgeConfirmModal';
import { ForgotPasswordView } from './ForgotPasswordView';
import { GoogleSignInSection } from './GoogleSignInSection';
import { styles } from '../../styles/components/auth/AuthModal.styles';
import { EDGE_TO_EDGE, KEYBOARD_BEHAVIOR } from '../../lib/keyboard';

const digitsOnly = (value: string, maxLen: number) => value.replace(/\D/g, '').slice(0, maxLen);

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
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [hasSavedEmail, setHasSavedEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ageModalOpen, setAgeModalOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const monthRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const yearRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const isLogin = authModalMode === 'login';
  const dateOfBirthInput =
    dobDay || dobMonth || dobYear
      ? `${dobDay.padStart(2, '0')}/${dobMonth.padStart(2, '0')}/${dobYear}`
      : '';

  // Each opening starts without the previous attempt's error.
  const [wasOpen, setWasOpen] = useState(false);
  if (isAuthModalOpen !== wasOpen) {
    setWasOpen(isAuthModalOpen);
    if (isAuthModalOpen) {
      setError(null);
      setAgeModalOpen(false);
      setForgotOpen(false);
    }
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
    setAgeModalOpen(false);
    setForgotOpen(false);
    openAuthModal(isLogin ? 'register' : 'login');
  };

  // A ref, not state: a second tap in the same frame must not send a second sign-in or sign-up.
  const busy = useRef(false);
  const run = async <T,>(task: () => Promise<T>, onDone: (result: T) => Promise<void> | void) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      await onDone(await task());
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  const handleConfirmAgeAndRegister = async () => {
    const normalizedDob = normalizeDateOfBirth(dateOfBirthInput);
    setAgeModalOpen(false);
    if (!normalizedDob) return setError('Ngày sinh chưa hợp lệ (nhập theo dạng ngày/tháng/năm, ví dụ 14/05/2003).');
    await run(() => register(name, email, password, normalizedDob), (result) => {
      if (result.success) showDialog('Đã tạo tài khoản', 'Bạn đã là thành viên và có thể bắt đầu xem phim.');
      else setError(result.error || 'Chưa tạo được tài khoản. Kiểm tra kết nối rồi thử lại.');
    });
  };

  const handleSubmit = async () => {
    const rawDob = dobDay.trim() && dobMonth.trim() && dobYear.trim() ? dateOfBirthInput : '';
    const problem = authFormError(isLogin, { name, email, password, confirmPassword, dateOfBirth: rawDob });
    setError(problem);
    if (problem) return;
    if (!isLogin) return setAgeModalOpen(true);
    await run(() => login(email, password), async (result) => {
      if (!result.success) return setError(result.error || 'Chưa đăng nhập được. Kiểm tra email, mật khẩu và kết nối mạng.');
      if (rememberMe) await rememberEmail(email);
      else await forgetSaved();
      if (result.redirectUrl) router.replace(result.redirectUrl as Href);
    });
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
    <Modal visible={isAuthModalOpen} transparent animationType="slide" onRequestClose={closeAuthModal} {...EDGE_TO_EDGE}>
      {/* The sheet rises with the keyboard on Android too: edge to edge, the window itself no longer shrinks. */}
      <KeyboardAvoidingView behavior={KEYBOARD_BEHAVIOR} style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{forgotOpen ? 'Quên mật khẩu' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</Text>
            <TouchableOpacity onPress={closeAuthModal} hitSlop={10} accessibilityLabel="Đóng">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.form}
            showsVerticalScrollIndicator={false}
          >
            {forgotOpen ? (
              <ForgotPasswordView initialEmail={email} onBack={() => setForgotOpen(false)} />
            ) : (<>
            {hasSavedEmail && isLogin && (
              <View style={[styles.saved, { backgroundColor: colors.card }]}>
                <Text style={[styles.savedText, { color: colors.textSecondary }]}>Đã điền sẵn email lưu trên máy này.</Text>
                <TouchableOpacity onPress={forgetSaved} hitSlop={8}>
                  <Text style={[styles.savedAction, { color: colors.ruby }]}>Quên email này</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLogin &&
              field(
                'Họ và tên',
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nguyễn Văn A"
                  maxLength={255}
                  placeholderTextColor={colors.textMuted}
                  autoComplete="name"
                  style={inputStyle}
                />,
              )}

            {!isLogin &&
              field(
                'Ngày sinh',
                <View style={styles.dobRow}>
                  <TextInput
                    value={dobDay}
                    onChangeText={(v) => {
                      const next = digitsOnly(v, 2);
                      setDobDay(next);
                      if (next.length === 2) monthRef.current?.focus();
                    }}
                    placeholder="Ngày (14)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    autoComplete="off"
                    importantForAutofill="no"
                    accessibilityLabel="Ngày sinh"
                    style={[inputStyle, styles.dobPart]}
                  />
                  <Text style={[styles.dobSlash, { color: colors.textMuted }]}>/</Text>
                  <TextInput
                    ref={monthRef}
                    value={dobMonth}
                    onChangeText={(v) => {
                      const next = digitsOnly(v, 2);
                      setDobMonth(next);
                      if (next.length === 2) yearRef.current?.focus();
                    }}
                    placeholder="Tháng (05)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    autoComplete="off"
                    importantForAutofill="no"
                    accessibilityLabel="Tháng sinh"
                    style={[inputStyle, styles.dobPart]}
                  />
                  <Text style={[styles.dobSlash, { color: colors.textMuted }]}>/</Text>
                  <TextInput
                    ref={yearRef}
                    value={dobYear}
                    onChangeText={(v) => setDobYear(digitsOnly(v, 4))}
                    placeholder="Năm (2003)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    autoComplete="off"
                    importantForAutofill="no"
                    accessibilityLabel="Năm sinh"
                    style={[inputStyle, styles.dobYear]}
                  />
                </View>,
                'Ví dụ: 14 / 05 / 2003.',
              )}

            {field(
              'Email',
              <TextInput value={email} onChangeText={setEmail} placeholder="ten@email.com" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" maxLength={255} style={inputStyle} />,
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
              isLogin ? undefined : PASSWORD_HINT,
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
                <TouchableOpacity hitSlop={8} accessibilityRole="button" onPress={() => { setError(null); setForgotOpen(true); }}>
                  <Text style={[styles.link, { color: colors.textSecondary }]}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              )}
            </View>

            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

            <Button label={isLogin ? 'Đăng nhập' : 'Tiếp tục'} onPress={handleSubmit} loading={loading} />

            <GoogleSignInSection />

            <TouchableOpacity style={styles.switch} onPress={switchMode}>
              <Text style={[styles.switchText, { color: colors.textMuted }]}>
                {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <Text style={{ color: colors.ruby, fontFamily: fonts.semibold }}>{isLogin ? 'Tạo tài khoản' : 'Đăng nhập'}</Text>
              </Text>
            </TouchableOpacity>
            </>)}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <AgeConfirmModal
        visible={ageModalOpen && !isLogin}
        dateOfBirth={dateOfBirthInput}
        loading={loading}
        onCancel={() => setAgeModalOpen(false)}
        onConfirm={handleConfirmAgeAndRegister}
      />
    </Modal>
  );
};
