import React, { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateAgeYears, formatDobDisplay, isAtLeast18 } from '../../lib/authForm';
import { useTheme } from '../../theme';
import { Button } from '../common/Button';
import { TermsConsent } from './TermsConsent';
import { styles } from '../../styles/components/auth/AgeConfirmModal.styles';

interface AgeConfirmModalProps {
  visible: boolean;
  dateOfBirth: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** BR-54: Explicit terms & 18+ age confirmation step shown before submitting account registration. */
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
              <Text style={[styles.title, { color: colors.text }]}>Điều khoản và xác nhận đủ 18 tuổi</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Bước cuối trước khi tạo tài khoản</Text>
            </View>
          </View>

          <View style={[styles.dobBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight }]}>
            <Text style={[styles.dobLabel, { color: colors.textSecondary }]}>Ngày sinh đã nhập</Text>
            <Text style={[styles.dobValue, { color: colors.text }]}>
              {formatDobDisplay(dateOfBirth)}
              {age !== null ? ` (${age} tuổi)` : ''}
            </Text>
          </View>

          {!eligible ? (
            <View style={[styles.warningBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
              <Text style={[styles.warningText, { color: colors.danger }]}>
                {age === null
                  ? 'Ngày sinh chưa hợp lệ (nhập theo dạng ngày/tháng/năm, ví dụ 14/05/2003). Vui lòng quay lại chỉnh sửa.'
                  : 'Bạn cần đủ 18 tuổi trở lên để đăng ký tài khoản xem phim trên AI Cinema.'}
              </Text>
            </View>
          ) : (
            <>
              <TermsConsent checked={checked} onToggle={() => setChecked((prev) => !prev)} />
            </>
          )}

          <View style={styles.actions}>
            <Button
              label={eligible ? 'Quay lại' : 'Sửa ngày sinh'}
              variant="secondary"
              onPress={handleClose}
              disabled={loading}
              style={styles.btn}
            />
            {eligible && (
              <Button label="Tạo tài khoản" onPress={handleConfirm} loading={loading} disabled={!canConfirm} style={styles.btn} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
