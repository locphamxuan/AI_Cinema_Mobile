import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';

export const CheckInModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    isCheckInModalOpen,
    setCheckInModalOpen,
    checkInStreak,
    claimDailyCheckIn,
    wallet,
  } = useAppStore();

  const handleClaim = () => {
    const success = claimDailyCheckIn();
    if (success) {
      Alert.alert('Thành công 🎉', 'Bạn đã nhận thưởng điểm danh hôm nay!');
    }
  };

  return (
    <Modal
      visible={isCheckInModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setCheckInModalOpen(false)}
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
            <View style={styles.titleRow}>
              <View style={styles.fireBadge}>
                <Ionicons name="flame" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Điểm Danh 7 Ngày Liên Tiếp
              </Text>
            </View>
            <TouchableOpacity onPress={() => setCheckInModalOpen(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Current streak badge */}
          <View style={styles.streakBanner}>
            <Text style={styles.streakText}>
              🔥 Chuỗi điểm danh hiện tại: {checkInStreak.currentStreak} ngày
            </Text>
            <Text style={[styles.streakSub, { color: colors.textSecondary }]}>
              Duy trì chuỗi điểm danh để nhận x2 Coin thưởng vào Chủ Nhật!
            </Text>
          </View>

          {/* 7 Days Row */}
          <View style={styles.daysRow}>
            {checkInStreak.days.map((day) => {
              return (
                <View
                  key={day.dayIndex}
                  style={[
                    styles.dayCard,
                    {
                      backgroundColor: day.claimed
                        ? 'rgba(16, 185, 129, 0.12)'
                        : day.isToday
                        ? isDark
                          ? '#1E293B'
                          : '#EFF6FF'
                        : isDark
                        ? '#131B2E'
                        : '#F8FAFC',
                      borderColor: day.claimed
                        ? '#10B981'
                        : day.isToday
                        ? colors.ruby
                        : colors.border,
                      borderWidth: day.isToday ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                    {day.dayLabel}
                  </Text>
                  <FontAwesome5
                    name="coins"
                    size={14}
                    color={day.claimed ? '#10B981' : '#F59E0B'}
                  />
                  <Text style={[styles.rewardText, { color: colors.text }]}>
                    +{day.reward}
                  </Text>
                  {day.claimed ? (
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  ) : day.isToday ? (
                    <Text style={styles.todayTag}>Hôm nay</Text>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* User Balance summary */}
          <View
            style={[
              styles.balanceBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
              Số dư Coin Thưởng hiện có:
            </Text>
            <View style={styles.balanceRow}>
              <Ionicons name="gift" size={14} color="#8B5CF6" />
              <Text style={[styles.balanceValue, { color: colors.text }]}>
                {wallet.bonusCoin} Coin
              </Text>
            </View>
          </View>

          {/* Claim Button */}
          <TouchableOpacity
            style={[
              styles.claimBtn,
              {
                backgroundColor: checkInStreak.todayClaimed ? '#10B981' : colors.ruby,
              },
            ]}
            onPress={handleClaim}
            disabled={checkInStreak.todayClaimed}
          >
            <Ionicons
              name={checkInStreak.todayClaimed ? 'checkmark' : 'gift-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.claimBtnText}>
              {checkInStreak.todayClaimed ? 'Đã Nhận Thưởng Hôm Nay' : 'Điểm Danh Nhận Thưởng Ngay'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fireBadge: {
    backgroundColor: '#F59E0B',
    padding: 4,
    borderRadius: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  streakBanner: {
    gap: 4,
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  streakSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginVertical: 4,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '800',
  },
  todayTag: {
    fontSize: 8,
    fontWeight: '800',
    color: '#E50914',
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  balanceLabel: {
    fontSize: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
