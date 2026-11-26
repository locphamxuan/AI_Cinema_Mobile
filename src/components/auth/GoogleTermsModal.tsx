import React, { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button } from '../common/Button';
import { TermsConsent } from './TermsConsent';
import { styles } from '../../styles/components/auth/AgeConfirmModal.styles';

interface GoogleTermsModalProps {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** A first Google sign-in opens the account only after the member accepts the terms, as on email sign-up. */
export const GoogleTermsModal: React.FC<GoogleTermsModalProps> = ({ visible, loading = false, onCancel, onConfirm }) => {
  const { colors } = useTheme();
  const [checked, setChecked] = useState(false);
  const close = () => {
    setChecked(false);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.backdrop, { backgroundColor: colors.scrim }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="google-terms">
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: colors.rubySoft }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.ruby} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.title, { color: colors.text }]}>Điều khoản sử dụng</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Bước cuối trước khi tạo tài khoản bằng Google</Text>
            </View>
          </View>
          <TermsConsent checked={checked} onToggle={() => setChecked((v) => !v)} />
          <View style={styles.actions}>
            <Button label="Quay lại" variant="secondary" onPress={close} disabled={loading} style={styles.btn} />
            <Button label="Tạo tài khoản" onPress={onConfirm} loading={loading} disabled={!checked || loading} style={styles.btn} />
          </View>
        </View>
      </View>
    </Modal>
  );
};
