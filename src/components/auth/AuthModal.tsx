import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { storage, STORAGE_KEYS } from '../../lib/storage';

export const AuthModal: React.FC = () => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    login,
    register,
    initialAuthEmail,
  } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = authModalMode === 'login';

  // Load saved credentials from AsyncStorage when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
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

        if (initialAuthEmail) {
          setEmail(initialAuthEmail);
        } else {
          setEmail('');
          setPassword('');
        }
        setRememberMe(true);
        setHasSavedCredentials(false);
      };

      loadSaved();
    }
  }, [isAuthModalOpen, initialAuthEmail]);

  const handleClearSaved = async () => {
    try {
      await Promise.all([
        storage.remove(STORAGE_KEYS.REMEMBERED_EMAIL),
        storage.remove(STORAGE_KEYS.REMEMBERED_PASSWORD),
        storage.remove(STORAGE_KEYS.REMEMBER_ME),
      ]);
      setEmail('');
      setPassword('');
      setHasSavedCredentials(false);
      Alert.alert('Đã xóa', 'Thông tin đăng nhập đã được xóa khỏi bộ nhớ thiết bị.');
    } catch (e) {
      console.error('Failed to clear credentials:', e);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    // Short delay for smooth UI feedback
    await new Promise((r) => setTimeout(r, 350));

    if (isLogin) {
      if (!email.trim() || !password) {
        setError('Vui lòng nhập đầy đủ email và mật khẩu!');
        setLoading(false);
        return;
      }

      const result = await login(email, password);
      if (result.success) {
        // Persist or clear credentials
        try {
          if (rememberMe) {
            await Promise.all([
              storage.set(STORAGE_KEYS.REMEMBERED_EMAIL, email.trim()),
              storage.set(STORAGE_KEYS.REMEMBERED_PASSWORD, password),
              storage.set(STORAGE_KEYS.REMEMBER_ME, 'true'),
            ]);
          } else {
            await Promise.all([
              storage.remove(STORAGE_KEYS.REMEMBERED_EMAIL),
              storage.remove(STORAGE_KEYS.REMEMBERED_PASSWORD),
              storage.remove(STORAGE_KEYS.REMEMBER_ME),
            ]);
          }
        } catch (e) {
          console.error('Failed to update remembered credentials:', e);
        }

        // Navigate to role-specific screen
        if (result.redirectUrl) {
          router.replace(result.redirectUrl as any);
        }
      } else {
        setError(result.error || 'Đăng nhập không thành công');
      }
    } else {
      if (!name.trim() || !email.trim() || !password) {
        setError('Vui lòng điền đầy đủ họ tên, email và mật khẩu!');
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Mật khẩu đăng ký phải có ít nhất 8 ký tự!');
        setLoading(false);
        return;
      }

      const result = await register(name, email, password);
      if (result.success) {
        try {
          if (rememberMe) {
            await Promise.all([
              storage.set(STORAGE_KEYS.REMEMBERED_EMAIL, email.trim()),
              storage.set(STORAGE_KEYS.REMEMBERED_PASSWORD, password),
              storage.set(STORAGE_KEYS.REMEMBER_ME, 'true'),
            ]);
          } else {
            await Promise.all([
              storage.remove(STORAGE_KEYS.REMEMBERED_EMAIL),
              storage.remove(STORAGE_KEYS.REMEMBERED_PASSWORD),
              storage.remove(STORAGE_KEYS.REMEMBER_ME),
            ]);
          }
        } catch (e) {
          console.error('Failed to update remembered credentials:', e);
        }

        if (result.redirectUrl) {
          router.replace(result.redirectUrl as any);
        }
      } else {
        setError(result.error || 'Đăng ký không thành công');
      }
    }
    setLoading(false);
  };

  return (
    <Modal
      visible={isAuthModalOpen}
      transparent
      animationType="slide"
      onRequestClose={closeAuthModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>AI</Text>
              </View>
              <Text style={[styles.brandText, { color: colors.text }]}>CINEMA</Text>
            </View>
            <TouchableOpacity onPress={closeAuthModal} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                openAuthModal('login');
                setError(null);
              }}
              style={[
                styles.tab,
                {
                  borderBottomColor: isLogin ? colors.ruby : 'transparent',
                  borderBottomWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isLogin ? colors.ruby : colors.textMuted,
                    fontWeight: isLogin ? '700' : '500',
                  },
                ]}
              >
                Đăng nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                openAuthModal('register');
                setError(null);
              }}
              style={[
                styles.tab,
                {
                  borderBottomColor: !isLogin ? colors.ruby : 'transparent',
                  borderBottomWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: !isLogin ? colors.ruby : colors.textMuted,
                    fontWeight: !isLogin ? '700' : '500',
                  },
                ]}
              >
                Đăng ký thành viên
              </Text>
            </TouchableOpacity>
          </View>

          {/* Saved Credentials Notice Banner */}
          {hasSavedCredentials && isLogin && (
            <View
              style={[
                styles.savedBanner,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                },
              ]}
            >
              <View style={styles.savedBannerLeft}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={[styles.savedBannerText, { color: isDark ? '#34D399' : '#065F46' }]}>
                  Đã tự động điền mật khẩu đã lưu
                </Text>
              </View>
              <TouchableOpacity onPress={handleClearSaved} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearSavedBtnText}>Xóa lưu</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form Inputs */}
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Họ và tên</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mật khẩu</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword(prev => !prev)}
                  style={styles.eyeToggleBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={15}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.eyeToggleText, { color: colors.textSecondary }]}>
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mật khẩu của bạn"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                  style={styles.passwordEyeIcon}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {!isLogin && (
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 5, marginLeft: 2 }}>
                  * Mật khẩu tối thiểu 8 ký tự theo tiêu chuẩn bảo mật.
                </Text>
              )}
            </View>

            {/* Remember Me Checkbox & Forgot Password */}
            <View style={styles.rememberRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRememberMe(prev => !prev)}
                style={styles.checkboxTouch}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe
                      ? { backgroundColor: colors.ruby, borderColor: colors.ruby }
                      : { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.border },
                  ]}
                >
                  {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                  Lưu mật khẩu đăng nhập
                </Text>
              </TouchableOpacity>

              {isLogin && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Alert.alert(
                      'Khôi phục mật khẩu',
                      'Vui lòng sử dụng tài khoản Demo (userdemo@gmail.com / mật khẩu: 1) hoặc liên hệ đội ngũ AI Cinema qua Chat Hỗ trợ.'
                    );
                  }}
                >
                  <Text style={[styles.forgotText, { color: colors.textSecondary }]}>
                    Quên mật khẩu?
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bonus Reward Badge for Register */}
            {!isLogin && (
              <View style={styles.registerBonusBadge}>
                <Ionicons name="gift" size={16} color="#8B5CF6" />
                <Text style={styles.registerBonusText}>
                  Đăng ký ngay nhận ngay <Text style={{ fontWeight: '800', color: '#F59E0B' }}>+50 Coin Thưởng</Text> vào ví!
                </Text>
              </View>
            )}
          </View>

          {/* Error display */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.submitBtn, { backgroundColor: colors.ruby }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản & Nhận 50 Coin'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    gap: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoBadge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  closeBtn: {
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  savedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  savedBannerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  clearSavedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  form: {
    gap: 11,
  },
  inputGroup: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  eyeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  eyeToggleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordEyeIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 11,
    fontWeight: '500',
  },
  registerBonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  registerBonusText: {
    fontSize: 11,
    color: '#A78BFA',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
  },
  submitBtn: {
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

