import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateAgeYears, isAtLeast18 } from '../../lib/authForm';
import { borderRadius, fonts, spacing, useTheme } from '../../theme';

interface AgeConfirmModalProps {
  visible: boolean;
  dateOfBirth: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** BR-54: Explicit age confirmation step shown before submitting account registration. */
export const AgeConfirmModal: React.FC<AgeConfirmModalProps> = ({
  visible,
  dateOfBirth,
  loading = false,
  onCancel,
  onConfirm,
}) => {
  const { colors } = useTheme();
  const [checked, setChecked] = useState(false);

  const age = calculateAgeYears(dateOfBirth);
  const eligible = isAtLeast18(dateOfBirth);
  const canConfirm = eligible && checked && !loading;

  const handleClose = () => {
    setChecked(false);
    onCancel();
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    setChecked(false);
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.scrim }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: eligible ? colors.rubySoft : colors.dangerSoft }]}>
              <Ionicons
                name={eligible ? 'shield-checkmark-outline' : 'alert-circle-outline'}
                size={22}
                color={eligible ? colors.ruby : colors.danger}
              />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.title, { color: colors.text }]}>Xác nhận độ tuổi (18+)</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Quy định đăng ký thành viên AI Cinema</Text>
            </View>
          </View>

          <View style={[styles.dobBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight }]}>
            <Text style={[styles.dobLabel, { color: colors.textSecondary }]}>Ngày sinh đã nhập</Text>
            <Text style={[styles.dobValue, { color: colors.text }]}>
              {dateOfBirth || 'Chưa nhập'}
              {age !== null ? ` (${age} tuổi)` : ''}
            </Text>
          </View>

          {!eligible ? (
            <View style={[styles.warningBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
              <Text style={[styles.warningText, { color: colors.danger }]}>
                {age === null
                  ? 'Ngày sinh chưa đúng định dạng YYYY-MM-DD (ví dụ 1998-06-15). Vui lòng quay lại chỉnh sửa.'
                  : 'Bạn cần đủ 18 tuổi trở lên để đăng ký tài khoản xem phim trên AI Cinema.'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.checkBoxRow, { borderColor: checked ? colors.ruby : colors.border }]}
              onPress={() => setChecked((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.box,
                  {
                    borderColor: checked ? colors.ruby : colors.border,
                    backgroundColor: checked ? colors.ruby : 'transparent',
                  },
                ]}
              >
                {checked && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </View>
              <Text style={[styles.consentText, { color: colors.textSecondary }]}>
                Tôi xác nhận tôi đã đủ <Text style={{ color: colors.text, fontFamily: fonts.semibold }}>18 tuổi</Text>,
                ngày sinh <Text style={{ color: colors.text, fontFamily: fonts.semibold }}>{dateOfBirth}</Text> là chính
                xác và đồng ý điều khoản sử dụng của nền tảng.
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.text }]}>
                {eligible ? 'Quay lại' : 'Sửa ngày sinh'}
              </Text>
            </TouchableOpacity>

            {eligible && (
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.btnPrimary,
                  { backgroundColor: canConfirm ? colors.ruby : colors.border },
                ]}
                onPress={handleConfirm}
                disabled={!canConfirm}
              >
                <Text style={[styles.btnPrimaryText, { color: colors.white }]}>
                  {loading ? 'Đang tạo...' : 'Xác nhận & Tạo'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.bold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  dobBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dobLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  dobValue: {
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  warningBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  warningText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    lineHeight: 19,
  },
  checkBoxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  btnSecondary: {
    borderWidth: 1,
  },
  btnPrimary: {},
  btnSecondaryText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
});
