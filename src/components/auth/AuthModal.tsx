import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';

export const AuthModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    login,
    register,
  } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = authModalMode === 'login';

  const fillDemo = () => {
    setEmail('userdemo@gmail.com');
    setPassword('1');
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (isLogin) {
        const result = login(email, password);
        if (!result.success) {
          setError(result.error || 'Đăng nhập không thành công');
        }
      } else {
        const result = register(name, email, password);
        if (!result.success) {
          setError(result.error || 'Đăng ký không thành công');
        }
      }
      setLoading(false);
    }, 400);
  };

  return (
    <Modal
      visible={isAuthModalOpen}
      transparent
      animationType="slide"
      onRequestClose={closeAuthModal}
    >
      <View style={styles.backdrop}>
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

          {/* Quick Demo Fill Button */}
          {isLogin && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.demoBtn, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}
              onPress={fillDemo}
            >
              <Ionicons name="flash" size={14} color="#F59E0B" />
              <Text style={styles.demoBtnText}>Điền tài khoản Demo (userdemo@gmail.com / 1)</Text>
            </TouchableOpacity>
          )}

          {/* Inputs */}
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mật khẩu</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mật khẩu của bạn"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
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
      </View>
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
    gap: 14,
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
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  demoBtnText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
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
