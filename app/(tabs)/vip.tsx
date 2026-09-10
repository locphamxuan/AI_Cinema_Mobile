import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Header } from '../../src/components/common/Header';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { subscriptionPlans } from '../../src/mocks/mockData';
import { SubscriptionPlan } from '../../src/types/subscription';

export default function VipScreen() {
  const { colors, isDark } = useTheme();
  const {
    subscription,
    toggleAutoRenew,
    cancelSubscription,
    toggleVIPMode,
    isVIPMode,
    user,
    isAuthenticated,
    openAuthModal,
  } = useAppStore();

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    Alert.alert(
      'Nâng Cấp Gói',
      `Bạn có muốn đăng ký "${plan.name}" với giá ${plan.price.toLocaleString('vi-VN')} đ / tháng không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác Nhận',
          onPress: () => {
            if (!isVIPMode) toggleVIPMode();
            Alert.alert('Thành công 🎉', `Bạn đã kích hoạt thành công ${plan.name}!`);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Active Subscription Banner */}
        <View
          style={[
            styles.activeCard,
            {
              backgroundColor: isVIPMode
                ? isDark
                  ? '#1E1B4B'
                  : '#EEF2FF'
                : isDark
                ? '#1E293B'
                : '#F8FAFC',
              borderColor: isVIPMode ? '#8B5CF6' : colors.border,
            },
          ]}
        >
          <View style={styles.activeCardHeader}>
            <View style={styles.activeCardTitleRow}>
              <FontAwesome5
                name={isVIPMode ? 'crown' : 'user'}
                size={18}
                color={isVIPMode ? '#F59E0B' : colors.textSecondary}
              />
              <Text style={[styles.activePlanName, { color: colors.text }]}>
                {isVIPMode ? 'Gói Thành Viên VIP Pro' : 'Tài Khoản Tiêu Chuẩn (Miễn phí)'}
              </Text>
            </View>

            {isVIPMode && (
              <View style={styles.activeStatusPill}>
                <Text style={styles.activeStatusText}>ĐANG HOẠT ĐỘNG</Text>
              </View>
            )}
          </View>

          {isVIPMode ? (
            <View style={styles.vipDetails}>
              <Text style={[styles.expiryText, { color: '#F59E0B' }]}>
                ⏳ Sắp hết hạn trong 20 giờ (Ngày hết hạn: 07/09/2026)
              </Text>
              <Text style={[styles.methodText, { color: colors.textSecondary }]}>
                Phương thức: {subscription.paymentMethod || 'Visa ****4242'}
              </Text>

              {/* Auto Renew Toggle */}
              <View style={styles.autoRenewRow}>
                <View>
                  <Text style={[styles.autoRenewLabel, { color: colors.text }]}>
                    Tự động gia hạn
                  </Text>
                  <Text style={[styles.autoRenewSub, { color: colors.textMuted }]}>
                    {subscription.autoRenew ? 'Sẽ tự động trừ phí khi hết hạn' : 'Đã tắt tự động gia hạn'}
                  </Text>
                </View>
                <Switch
                  value={subscription.autoRenew}
                  onValueChange={toggleAutoRenew}
                  trackColor={{ false: '#94A3B8', true: colors.ruby }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          ) : (
            <Text style={[styles.freeText, { color: colors.textSecondary }]}>
              Nâng cấp gói VIP để mở khóa xem trước phim AI mới 24h, chất lượng 4K HDR và không có quảng cáo.
            </Text>
          )}
        </View>

        {/* Section Heading */}
        <Text style={[styles.heading, { color: colors.text }]}>
          Lựa Chọn Gói Dịch Vụ Phù Hợp
        </Text>

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {subscriptionPlans.map((plan) => {
            const isVipPlan = plan.id === 'vip';
            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isVipPlan ? '#8B5CF6' : colors.border,
                    borderWidth: isVipPlan ? 2 : 1,
                  },
                ]}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>ĐƯỢC YÊU THÍCH NHẤT</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: colors.ruby }]}>
                      {plan.price.toLocaleString('vi-VN')} đ
                    </Text>
                    <Text style={[styles.planDuration, { color: colors.textMuted }]}>
                      / {plan.duration} ngày
                    </Text>
                  </View>
                </View>

                {/* Features */}
                <View style={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Upgrade Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.chooseBtn,
                    {
                      backgroundColor: isVipPlan ? '#8B5CF6' : colors.ruby,
                    },
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                >
                  <Text style={styles.chooseBtnText}>Chọn Gói Này</Text>
                </TouchableOpacity>
              </View>
            );
          })}
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
    gap: 14,
    paddingBottom: 24,
  },
  activeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activePlanName: {
    fontSize: 15,
    fontWeight: '800',
  },
  activeStatusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeStatusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  vipDetails: {
    gap: 6,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  methodText: {
    fontSize: 11,
  },
  autoRenewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  autoRenewLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  autoRenewSub: {
    fontSize: 11,
  },
  freeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  plansContainer: {
    gap: 14,
  },
  planCard: {
    borderRadius: 14,
    padding: 16,
    gap: 12,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  planHeader: {
    gap: 4,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '900',
  },
  planDuration: {
    fontSize: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    flex: 1,
  },
  chooseBtn: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  chooseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
