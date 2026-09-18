import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../src/components/common/Header';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { subscriptionPlans } from '../../src/mocks/mockData';
import { SubscriptionPlan } from '../../src/types/subscription';

export default function VipScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    subscription,
    toggleAutoRenew,
    toggleVIPMode,
    isVIPMode,
    user,
    isAuthenticated,
    openAuthModal,
  } = useAppStore();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('premium');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const isUserVIP = isAuthenticated && (isVIPMode || user?.isVIP);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const priceFormatted = billingCycle === 'annual'
      ? Math.round(plan.price * 12 * 0.75).toLocaleString('vi-VN')
      : plan.price.toLocaleString('vi-VN');

    const cycleLabel = billingCycle === 'annual' ? '12 tháng (tiết kiệm 25%)' : '30 ngày';

    Alert.alert(
      'Xác Nhận Đăng Ký VIP',
      `Bạn muốn kích hoạt "${plan.name}" với giá ${priceFormatted} đ / ${cycleLabel} qua thẻ Visa ****4242?`,
      [
        { text: 'Để Sau', style: 'cancel' },
        {
          text: 'Kích Hoạt Ngay',
          onPress: () => {
            if (!isVIPMode) toggleVIPMode();
            Alert.alert('Chúc Mừng 🎉', `Gói ${plan.name} đã được kích hoạt thành công! Quyền quản lý thiết bị và kho phim 4K đã sẵn sàng.`);
          },
        },
      ]
    );
  };

  const getTierIcon = (planId: string) => {
    switch (planId) {
      case 'vip':
        return <FontAwesome5 name="gem" size={18} color="#F59E0B" />;
      case 'premium':
        return <FontAwesome5 name="crown" size={18} color="#EC4899" />;
      default:
        return <Ionicons name="film-outline" size={20} color="#3B82F6" />;
    }
  };

  const getDeviceQuota = (planId: string) => {
    switch (planId) {
      case 'vip':
        return '5 thiết bị (Tối đa)';
      case 'premium':
        return '3 thiết bị cùng lúc';
      default:
        return '1 thiết bị kết nối';
    }
  };

  const getQualityBadge = (planId: string) => {
    switch (planId) {
      case 'vip':
        return '4K HDR + Dolby Atmos';
      case 'premium':
        return '4K Ultra HD 2160p';
      default:
        return 'Full HD 1080p';
    }
  };

  const faqs = [
    {
      q: 'Quyền quản lý thiết bị (MainFlow4) hoạt động như thế nào?',
      a: 'Khi đăng ký gói thành viên VIP (hoặc VIP Pro), bạn được cấp hạn ngạch từ 3 đến 5 thiết bị. Bạn có thể xem danh sách, địa chỉ IP, vị trí và chủ động đăng xuất khỏi các thiết bị lạ bất kỳ lúc nào trong mục "Hồ sơ & Thiết bị".',
    },
    {
      q: 'Tôi có thể hủy gia hạn hoặc đổi gói cước bất cứ lúc nào không?',
      a: 'Hoàn toàn được! Bạn có thể bật/tắt tính năng "Tự động gia hạn" chỉ với 1 chạm ngay trên màn hình này. Khi hủy, bạn vẫn được dùng trọn vẹn quyền lợi đến hết chu kỳ đã thanh toán.',
    },
    {
      q: 'Chất lượng 4K HDR và âm thanh Dolby Atmos hỗ trợ thiết bị nào?',
      a: 'Hệ thống AI Cinema tự động tối ưu hóa băng thông truyền tải trên cả điện thoại Android, iOS, iPad, Smart TV và Web Browser, mang đến chất lượng hình ảnh sắc nét chuẩn điện ảnh.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Dynamic Member VIP Pass or Welcome Banner */}
        {isUserVIP ? (
          <View style={styles.vipPassCard}>
            <View style={styles.vipPassBackgroundGlow} />
            <View style={styles.vipPassTop}>
              <View style={styles.vipPassBrand}>
                <View style={styles.vipPassIconCircle}>
                  <FontAwesome5 name="crown" size={18} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.vipPassTitle}>AI CINEMA · BLACK VIP PASS</Text>
                  <Text style={styles.vipPassTier}>HỘI VIÊN CAO CẤP</Text>
                </View>
              </View>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>ĐANG HOẠT ĐỘNG</Text>
              </View>
            </View>

            {/* Member Details */}
            <View style={styles.vipPassMiddle}>
              <View>
                <Text style={styles.vipPassLabel}>CHỦ THẺ HỘI VIÊN</Text>
                <Text style={styles.vipPassName}>{user?.name || 'Phạm Xuân Lộc'}</Text>
              </View>
              <View style={styles.vipChipSimulator}>
                <View style={styles.vipChipLine} />
              </View>
            </View>

            {/* Quota & Device Meter */}
            <View style={styles.vipPassDeviceBox}>
              <View style={styles.vipDeviceHeader}>
                <View style={styles.vipDeviceLeft}>
                  <MaterialCommunityIcons name="devices" size={16} color="#F59E0B" />
                  <Text style={styles.vipDeviceText}>Hạn ngạch thiết bị: 3/5 thiết bị đang kết nối</Text>
                </View>
                <TouchableOpacity
                  style={styles.manageDeviceBtn}
                  onPress={() => router.push('/profile')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.manageDeviceBtnText}>Quản lý ›</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.quotaProgressBarBg}>
                <View style={[styles.quotaProgressBarFill, { width: '60%' }]} />
              </View>
            </View>

            {/* Expiry & Auto Renew */}
            <View style={styles.vipPassFooter}>
              <View style={styles.expiryInfo}>
                <Ionicons name="time-outline" size={14} color="#FBBF24" />
                <Text style={styles.expiryInfoText}>Hạn dùng: 07/10/2026 (Còn 20 ngày)</Text>
              </View>

              <View style={styles.autoRenewSwitchWrap}>
                <Text style={styles.autoRenewMiniText}>Tự gia hạn</Text>
                <Switch
                  value={subscription.autoRenew}
                  onValueChange={toggleAutoRenew}
                  trackColor={{ false: '#475569', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.heroPromoCard, { backgroundColor: isDark ? '#181A26' : '#FFFFFF', borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A' }]}>
            <View style={styles.heroPromoBadge}>
              <FontAwesome5 name="crown" size={12} color="#F59E0B" />
              <Text style={styles.heroPromoBadgeText}>MỞ KHÓA TRẢI NGHIỆM ĐIỆN ẢNH</Text>
            </View>

            <Text style={[styles.heroPromoTitle, { color: colors.text }]}>
              Thưởng Thức Phim AI 4K Không Giới Hạn
            </Text>
            <Text style={[styles.heroPromoSubtitle, { color: colors.textSecondary }]}>
              Mở khóa đặc quyền xem trước 24h, âm thanh Dolby Atmos đỉnh cao và quyền quản lý thiết bị không quảng cáo.
            </Text>

            {/* 4 Feature Pills */}
            <View style={styles.perksGrid}>
              <View style={[styles.perkPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }]}>
                <Ionicons name="sparkles" size={14} color="#F59E0B" />
                <Text style={[styles.perkText, { color: colors.text }]}>4K Ultra HD</Text>
              </View>
              <View style={[styles.perkPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }]}>
                <Ionicons name="ban-outline" size={14} color="#EF4444" />
                <Text style={[styles.perkText, { color: colors.text }]}>Không Quảng Cáo</Text>
              </View>
              <View style={[styles.perkPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }]}>
                <MaterialCommunityIcons name="devices" size={14} color="#3B82F6" />
                <Text style={[styles.perkText, { color: colors.text }]}>Đa Thiết Bị</Text>
              </View>
              <View style={[styles.perkPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }]}>
                <Ionicons name="cloud-download-outline" size={14} color="#10B981" />
                <Text style={[styles.perkText, { color: colors.text }]}>Tải Ngoại Tuyến</Text>
              </View>
            </View>
          </View>
        )}

        {/* Billing Cycle Switcher (Monthly vs Annual -25%) */}
        <View style={styles.cycleSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Chọn Chu Kỳ Thanh Toán
          </Text>

          <View style={[styles.cycleToggleContainer, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[
                styles.cycleBtn,
                billingCycle === 'monthly' && styles.cycleBtnActive,
              ]}
              onPress={() => setBillingCycle('monthly')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.cycleBtnText,
                  { color: billingCycle === 'monthly' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Theo Tháng
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cycleBtn,
                billingCycle === 'annual' && styles.cycleBtnActive,
              ]}
              onPress={() => setBillingCycle('annual')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.cycleBtnText,
                  { color: billingCycle === 'annual' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Gói 12 Tháng
              </Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>-25%</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing Plan Cards */}
        <View style={styles.plansList}>
          {subscriptionPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isVip = plan.id === 'vip';
            const isPopular = plan.popular;

            const finalPrice = billingCycle === 'annual'
              ? Math.round((plan.price * 12 * 0.75) / 12)
              : plan.price;

            const totalBilledText = billingCycle === 'annual'
              ? `Thanh toán ${Math.round(plan.price * 12 * 0.75).toLocaleString('vi-VN')} đ / năm`
              : 'Gia hạn linh hoạt hàng tháng';

            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.92}
                onPress={() => setSelectedPlanId(plan.id)}
                style={[
                  styles.planCardNew,
                  {
                    backgroundColor: isDark ? '#161924' : '#FFFFFF',
                    borderColor: isPopular
                      ? '#E50914'
                      : isVip
                      ? '#F59E0B'
                      : isDark
                      ? '#2E3547'
                      : '#E2E8F0',
                    borderWidth: isSelected || isPopular || isVip ? 2 : 1,
                  },
                ]}
              >
                {/* Top Ribbons */}
                {isPopular && (
                  <View style={styles.topRibbonPopular}>
                    <Ionicons name="flame" size={11} color="#FFFFFF" />
                    <Text style={styles.topRibbonText}>ĐƯỢC KHUYÊN DÙNG NHẤT</Text>
                  </View>
                )}

                {isVip && !isPopular && (
                  <View style={styles.topRibbonVip}>
                    <FontAwesome5 name="gem" size={10} color="#FFFFFF" />
                    <Text style={styles.topRibbonText}>ĐẶC QUYỀN CAO CẤP NHẤT</Text>
                  </View>
                )}

                {/* Plan Title & Tier Icon Header */}
                <View style={styles.planCardTopRow}>
                  <View style={styles.planCardNameGroup}>
                    <View style={[styles.tierIconWrap, { backgroundColor: isPopular ? 'rgba(229, 9, 20, 0.12)' : isVip ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.12)' }]}>
                      {getTierIcon(plan.id)}
                    </View>
                    <View>
                      <Text style={[styles.planCardTitle, { color: colors.text }]}>{plan.name}</Text>
                      <Text style={[styles.planCardQuality, { color: colors.textSecondary }]}>
                        {getQualityBadge(plan.id)}
                      </Text>
                    </View>
                  </View>

                  {/* Device Quota Pill */}
                  <View style={[styles.deviceQuotaBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
                    <MaterialCommunityIcons name="devices" size={13} color="#F59E0B" />
                    <Text style={[styles.deviceQuotaText, { color: colors.text }]}>
                      {getDeviceQuota(plan.id)}
                    </Text>
                  </View>
                </View>

                {/* Price Display */}
                <View style={styles.priceContainer}>
                  <View style={styles.priceRowMain}>
                    <Text style={[styles.priceNumber, { color: isPopular ? '#E50914' : isVip ? '#F59E0B' : colors.text }]}>
                      {finalPrice.toLocaleString('vi-VN')}
                    </Text>
                    <Text style={[styles.currencySign, { color: isPopular ? '#E50914' : isVip ? '#F59E0B' : colors.text }]}>
                      đ
                    </Text>
                    <Text style={[styles.perMonthText, { color: colors.textMuted }]}>/ tháng</Text>
                  </View>
                  <Text style={[styles.billedSubtext, { color: colors.textMuted }]}>
                    {totalBilledText}
                  </Text>
                </View>

                {/* Feature List */}
                <View style={[styles.featureDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                <View style={styles.featureListNew}>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItemNew}>
                      <View style={styles.checkIconWrap}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      </View>
                      <Text style={[styles.featureLabelNew, { color: colors.text }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Subscribe CTA Button */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[
                    styles.subscribeBtn,
                    {
                      backgroundColor: isPopular
                        ? '#E50914'
                        : isVip
                        ? '#D97706'
                        : isDark
                        ? '#2563EB'
                        : '#1D4ED8',
                    },
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                >
                  <Text style={styles.subscribeBtnText}>
                    {isUserVIP ? 'Chuyển Đổi Sang Gói Này' : 'Đăng Ký Gói Này Ngay'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Trust Badges */}
        <View style={[styles.trustSection, { backgroundColor: isDark ? '#141722' : '#F8FAFC', borderColor: colors.border }]}>
          <Text style={[styles.trustHeading, { color: colors.text }]}>CAM KẾT DỊCH VỤ TỪ AI CINEMA</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={[styles.trustItemTitle, { color: colors.text }]}>Hủy gói linh hoạt</Text>
              <Text style={[styles.trustItemSub, { color: colors.textSecondary }]}>Không ràng buộc hợp đồng</Text>
            </View>

            <View style={styles.trustItem}>
              <Ionicons name="flash" size={20} color="#F59E0B" />
              <Text style={[styles.trustItemTitle, { color: colors.text }]}>Kích hoạt tức thì</Text>
              <Text style={[styles.trustItemSub, { color: colors.textSecondary }]}>Mở khóa thiết bị ngay</Text>
            </View>

            <View style={styles.trustItem}>
              <Ionicons name="lock-closed" size={20} color="#3B82F6" />
              <Text style={[styles.trustItemTitle, { color: colors.text }]}>Bảo mật PCI-DSS</Text>
              <Text style={[styles.trustItemSub, { color: colors.textSecondary }]}>Mã hóa thẻ & MoMo</Text>
            </View>

            <View style={styles.trustItem}>
              <Ionicons name="chatbubbles" size={20} color="#8B5CF6" />
              <Text style={[styles.trustItemTitle, { color: colors.text }]}>Hỗ trợ 24/7</Text>
              <Text style={[styles.trustItemSub, { color: colors.textSecondary }]}>Giải đáp nhanh trong app</Text>
            </View>
          </View>
        </View>

        {/* Frequently Asked Questions */}
        <View style={styles.faqSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Câu Hỏi Thường Gặp
          </Text>

          <View style={styles.faqList}>
            {faqs.map((item, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  style={[
                    styles.faqCard,
                    {
                      backgroundColor: isDark ? '#181A26' : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                >
                  <View style={styles.faqHeaderRow}>
                    <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.q}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>
                  {isExpanded && (
                    <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                      {item.a}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 18,
    paddingBottom: 40,
  },

  // VIP Pass Digital Card (Black/Gold luxury styling)
  vipPassCard: {
    backgroundColor: '#0F121C',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D97706',
    padding: 18,
    gap: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  vipPassBackgroundGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  vipPassTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vipPassBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vipPassIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipPassTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  vipPassTier: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activePillText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vipPassMiddle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  vipPassLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 3,
  },
  vipPassName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  vipChipSimulator: {
    width: 36,
    height: 26,
    borderRadius: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipChipLine: {
    width: 24,
    height: 1,
    backgroundColor: '#F59E0B',
  },
  vipPassDeviceBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  vipDeviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vipDeviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  vipDeviceText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  manageDeviceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  manageDeviceBtnText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  quotaProgressBarBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  quotaProgressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  vipPassFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryInfoText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600',
  },
  autoRenewSwitchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoRenewMiniText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },

  // Hero Welcome Promo Card (When Free/Guest)
  heroPromoCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 12,
  },
  heroPromoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  heroPromoBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroPromoTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  heroPromoSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  perksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  perkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  perkText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Billing Switcher
  cycleSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cycleToggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  cycleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  cycleBtnActive: {
    backgroundColor: '#E50914',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cycleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // Plan Cards
  plansList: {
    gap: 16,
  },
  planCardNew: {
    borderRadius: 20,
    padding: 18,
    gap: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  topRibbonPopular: {
    position: 'absolute',
    top: -11,
    right: 18,
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  topRibbonVip: {
    position: 'absolute',
    top: -11,
    right: 18,
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  topRibbonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  planCardNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCardTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  planCardQuality: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  deviceQuotaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  deviceQuotaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priceContainer: {
    marginTop: 2,
  },
  priceRowMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  priceNumber: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  currencySign: {
    fontSize: 18,
    fontWeight: '800',
  },
  perMonthText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  billedSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  featureDivider: {
    height: 1,
    marginVertical: 2,
  },
  featureListNew: {
    gap: 9,
  },
  featureItemNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkIconWrap: {
    width: 18,
    alignItems: 'center',
  },
  featureLabelNew: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
    gap: 8,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Trust Badges Section
  trustSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  trustHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trustItem: {
    width: '50%',
    padding: 10,
    alignItems: 'center',
    textAlign: 'center',
    gap: 4,
  },
  trustItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  trustItemSub: {
    fontSize: 10,
    textAlign: 'center',
  },

  // FAQ Section
  faqSection: {
    gap: 12,
  },
  faqList: {
    gap: 8,
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 4,
  },
});

