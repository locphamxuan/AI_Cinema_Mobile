import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateAgeYears, formatDobDisplay, isAtLeast18 } from '../../lib/authForm';
import { useTheme } from '../../theme';
import { Button } from '../common/Button';
import { styles } from '../../styles/components/auth/AgeConfirmModal.styles';

interface AgeConfirmModalProps {
  visible: boolean;
  dateOfBirth: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const TERMS_ITEMS = [
  {
    title: '1. Độ tuổi thành viên',
    body: 'Nền tảng AI Cinema chỉ cung cấp dịch vụ cho người dùng từ đủ 18 tuổi trở lên. Thông tin ngày sinh phải trung thực và chính xác.',
  },
  {
    title: '2. Nội dung có dùng AI',
    body: 'Phim ngắn, hình ảnh và phụ đề có ứng dụng AI được kiểm duyệt và gắn nhãn minh bạch theo Điều 44 trước khi phát hành.',
  },
  {
    title: '3. Ví Coin, gói Tháng và thanh toán',
    body: 'Coin nạp qua VNPay và gói thành viên được dùng để mở khóa tập phim trên hệ sinh thái AI Cinema, không quy đổi thành tiền mặt.',
  },
  {
    title: '4. Bảo mật tài khoản và thiết bị',
    body: 'Bạn chịu trách nhiệm bảo vệ mật khẩu và tuân thủ giới hạn thiết bị xem đồng thời theo gói hiện hành.',
  },
];

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
                  ? 'Ngày sinh chưa hợp lệ (nhập dạng DD/MM/YYYY, ví dụ 14/05/2003). Vui lòng quay lại chỉnh sửa.'
                  : 'Bạn cần đủ 18 tuổi trở lên để đăng ký tài khoản xem phim trên AI Cinema.'}
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.termsWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight }]}>
                <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator>
                  {TERMS_ITEMS.map((item) => (
                    <View key={item.title} style={styles.termBlock}>
                      <Text style={[styles.termTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.termBody, { color: colors.textSecondary }]}>{item.body}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.checkBoxRow, { borderColor: checked ? colors.ruby : colors.border }]}
                onPress={() => setChecked((prev) => !prev)}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
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
                  Tôi đã đọc toàn bộ <Text style={[styles.strong, { color: colors.text }]}>Điều khoản sử dụng</Text>{' '}
                  và xác nhận tôi đã đủ <Text style={[styles.strong, { color: colors.text }]}>18 tuổi trở lên</Text>.
                </Text>
              </TouchableOpacity>
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
