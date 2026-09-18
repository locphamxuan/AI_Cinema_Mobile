import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { useProductionStore } from '../../store/useProductionStore';
import { ThemeToggle } from './ThemeToggle';
import { WalletHeaderBadge } from './WalletHeaderBadge';

interface HeaderProps {
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProfilePress }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, user, openAuthModal, toggleChat, logout, isVIPMode, wallet } = useAppStore();
  const { activeRole, setActiveRole } = useProductionStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAvatarPress = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleNavigateProfile = () => {
    closeDropdown();
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push('/profile');
    }
  };

  const handleNavigateVIP = () => {
    closeDropdown();
    router.push('/vip');
  };

  const handleLogout = () => {
    closeDropdown();
    logout();
  };

  const isVIP = isVIPMode || user?.isVIP;

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
                style={[
                  styles.avatarBtn,
                  isVIP && styles.avatarBtnVIP,
                ]}
                onPress={handleAvatarPress}
                activeOpacity={0.8}
              >
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.ruby }]}>
                    <Text style={styles.avatarInitial}>{user?.name?.charAt(0) || 'U'}</Text>
                  </View>
                )}
                {isVIP && <View style={styles.vipDot} />}
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

      {/* User Dropdown Popover */}
      {isAuthenticated && (
        <Modal
          visible={isDropdownOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={closeDropdown}
        >
          <TouchableWithoutFeedback onPress={closeDropdown}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.dropdownMenu,
                    {
                      top: Math.max(insets.top, 12) + 48,
                      backgroundColor: isDark ? '#181B26' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                      shadowColor: isDark ? '#000000' : '#64748B',
                    },
                  ]}
                >
                  {/* User Header */}
                  <View style={[styles.dropdownHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={styles.userInfoRow}>
                      {user?.avatarUrl ? (
                        <Image source={{ uri: user.avatarUrl }} style={styles.dropdownAvatar} />
                      ) : (
                        <View style={[styles.dropdownAvatarFallback, { backgroundColor: colors.ruby }]}>
                          <Text style={styles.dropdownAvatarInitial}>{user?.name?.charAt(0) || 'U'}</Text>
                        </View>
                      )}
                      <View style={styles.userDetails}>
                        <Text style={[styles.dropdownUserName, { color: colors.text }]} numberOfLines={1}>
                          {user?.name || 'Người dùng'}
                        </Text>
                        <Text style={[styles.dropdownUserEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                          {user?.email || 'user@aicinema.vn'}
                        </Text>
                      </View>
                    </View>

                    {/* VIP / Free Tier Badge */}
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.planBadge,
                          isVIP
                            ? { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }
                            : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9', borderColor: 'transparent' },
                        ]}
                      >
                        <FontAwesome5
                          name={isVIP ? 'crown' : 'user'}
                          size={10}
                          color={isVIP ? '#F59E0B' : colors.textSecondary}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.planBadgeText,
                            { color: isVIP ? '#F59E0B' : colors.textSecondary },
                          ]}
                        >
                          {isVIP ? 'Hội viên VIP' : 'Tài khoản thường'}
                        </Text>
                      </View>

                      {/* Coin summary */}
                      <View style={styles.dropdownCoinBadge}>
                        <FontAwesome5 name="coins" size={10} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={[styles.dropdownCoinText, { color: colors.text }]}>
                          {wallet.mainCoin}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Menu Items */}
                  <View style={styles.menuItemsList}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleNavigateProfile}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.menuItemIconWrap, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                        <Ionicons name="person-circle-outline" size={18} color="#3B82F6" />
                      </View>
                      <View style={styles.menuItemTextWrap}>
                        <Text style={[styles.menuItemTitle, { color: colors.text }]}>Hồ sơ & Thiết bị</Text>
                        <Text style={[styles.menuItemSub, { color: colors.textSecondary }]}>Quản lý tài khoản & thiết bị</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleNavigateVIP}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.menuItemIconWrap, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB' }]}>
                        <FontAwesome5 name="crown" size={14} color="#F59E0B" />
                      </View>
                      <View style={styles.menuItemTextWrap}>
                        <Text style={[styles.menuItemTitle, { color: colors.text }]}>Gói dịch vụ VIP</Text>
                        <Text style={[styles.menuItemSub, { color: colors.textSecondary }]}>Hạn ngạch thiết bị, ưu đãi AI</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Logout Action */}
                  <View style={[styles.dropdownFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <TouchableOpacity
                      style={styles.logoutBtn}
                      onPress={handleLogout}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="log-out-outline" size={18} color="#E50914" style={{ marginRight: 8 }} />
                      <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
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
    borderRadius: 18,
  },
  avatarBtnVIP: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 1,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    top: -2,
    right: -2,
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
  // Modal & Dropdown Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 16,
    width: 290,
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 14,
    paddingBottom: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dropdownAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  dropdownAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  dropdownUserName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  dropdownUserEmail: {
    fontSize: 11,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dropdownCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dropdownCoinText: {
    fontSize: 11,
    fontWeight: '700',
  },
  menuItemsList: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 10,
  },
  menuItemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextWrap: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuItemSub: {
    fontSize: 10,
    marginTop: 1,
  },
  dropdownFooter: {
    paddingTop: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '700',
  },
});
