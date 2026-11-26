import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/auth/AgeConfirmModal.styles';

const TERMS_ITEMS = [
  {
    title: '1. Độ tuổi',
    body: 'AI Cinema chỉ dành cho người từ đủ 18 tuổi trở lên. Bạn cần khai đúng ngày sinh của mình.',
  },
  {
    title: '2. Nội dung có dùng AI',
    body: 'Phim, hình ảnh và phụ đề có dùng AI đều được kiểm duyệt và gắn nhãn AI rõ ràng trước khi phát hành, theo Điều 44.',
  },
  {
    title: '3. Ví Coin, gói Tháng và thanh toán',
    body: 'Coin nạp qua VNPay và gói Tháng chỉ dùng để mở khóa tập phim trên AI Cinema, không đổi lại thành tiền mặt.',
  },
  {
    title: '4. Bảo mật tài khoản và thiết bị',
    body: 'Bạn cần giữ kín mật khẩu và chỉ xem cùng lúc trên số thiết bị mà gói của bạn cho phép.',
  },
];

/** The terms of use and the "I accept" box, the same for email sign-up and a first Google sign-in. */
export const TermsConsent: React.FC<{ checked: boolean; onToggle: () => void }> = ({ checked, onToggle }) => {
  const { colors } = useTheme();
  return (
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
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View
          style={[
            styles.box,
            { borderColor: checked ? colors.ruby : colors.border, backgroundColor: checked ? colors.ruby : 'transparent' },
          ]}
        >
          {checked && <Ionicons name="checkmark" size={14} color={colors.white} />}
        </View>
        <Text style={[styles.consentText, { color: colors.textSecondary }]}>
          Tôi đã đọc toàn bộ <Text style={[styles.strong, { color: colors.text }]}>Điều khoản sử dụng</Text> và xác nhận tôi
          đã đủ <Text style={[styles.strong, { color: colors.text }]}>18 tuổi trở lên</Text>.
        </Text>
      </TouchableOpacity>
    </>
  );
};
