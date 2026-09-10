import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { ThemeToggle } from './ThemeToggle';
import { WalletHeaderBadge } from './WalletHeaderBadge';

interface HeaderProps {
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProfilePress }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, user, openAuthModal, toggleChat } = useAppStore();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Brand Logo */}
        <View style={styles.brand}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>AI</Text>
          </View>
          <Text style={[styles.brandText, { color: colors.text }]}>CINEMA</Text>
        </View>

        {/* Action Controls */}
        <View style={styles.actions}>
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <WalletHeaderBadge />
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={toggleChat}
                accessibilityLabel="Hỗ trợ trực tuyến"
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={onProfilePress}
              >
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.ruby }]}>
                    <Text style={styles.avatarInitial}>{user?.name?.charAt(0) || 'U'}</Text>
                  </View>
                )}
                {user?.isVIP && <View style={styles.vipDot} />}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.ruby }]}
              onPress={() => openAuthModal('login')}
            >
              <Text style={styles.loginBtnText}>Đăng nhập</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    letterSpacing: 0.5,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 20,
  },
  avatarBtn: {
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  vipDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  loginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
