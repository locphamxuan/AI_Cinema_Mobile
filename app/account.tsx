import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { FormField } from '../src/components/common/FormField';
import { Button } from '../src/components/common/Button';
import { showDialog } from '../src/lib/dialog';
import { PASSWORD_HINT } from '../src/lib/authForm';
import {
  maskDateInput,
  passwordChangeErrors,
  profileChanges,
  profileFormErrors,
  profileFormFrom,
  type ProfileForm,
} from '../src/lib/accountForm';
import { useSessionStore, useUiStore } from '../src/store';
import { useTheme } from '../src/theme';
import { styles } from '../src/styles/screens/account.styles';

const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' };

/** FE-12: the member's own profile (name, phone, birthday) and password; email and role stay with the Admin. */
export default function AccountScreen() {
  const { colors } = useTheme();
  const { user, isAuthenticated, updateProfile, changePassword } = useSessionStore();
  const { openAuthModal } = useUiStore();
  const saved = { name: user?.name ?? '', phoneNumber: user?.phoneNumber ?? null, dateOfBirth: user?.dateOfBirth ?? null };

  const [form, setFormState] = useState(() => profileFormFrom(user));
  const [touched, setTouched] = useState(false);
  const setForm = (update: (f: ProfileForm) => ProfileForm) => {
    setTouched(true);
    setFormState(update);
  };
  // The profile can arrive after the screen opened (GET /auth/me on start-up): fill the form until the member types.
  const seed = `${user?.id}|${saved.name}|${saved.phoneNumber}|${saved.dateOfBirth}`;
  const [seededFrom, setSeededFrom] = useState(seed);
  if (seed !== seededFrom) {
    setSeededFrom(seed);
    if (!touched) setFormState(profileFormFrom(user));
  }
  const [profileTried, setProfileTried] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [passwordTried, setPasswordTried] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileErrors = profileTried ? profileFormErrors(form, undefined, saved.dateOfBirth) : {};
  const changes = profileChanges(form, saved);
  const changed = Object.keys(changes).length > 0;
  const passwordErrors = passwordTried ? passwordChangeErrors(passwords) : {};

  const saveProfile = async () => {
    setProfileTried(true);
    if (Object.keys(profileFormErrors(form, undefined, saved.dateOfBirth)).length) return;
    setSavingProfile(true);
    const res = await updateProfile(changes);
    setSavingProfile(false);
    if (!res.success) return showDialog('Chưa lưu được thông tin', res.error);
    setProfileTried(false);
    setTouched(false);
    showDialog('Đã lưu thông tin', 'Hồ sơ của bạn đã được cập nhật.');
  };

  const submitPassword = async () => {
    setSavingPassword(true);
    const res = await changePassword(passwords.current, passwords.next);
    setSavingPassword(false);
    if (!res.success) return showDialog('Chưa đổi được mật khẩu', res.error);
    setPasswords(EMPTY_PASSWORDS);
    setPasswordTried(false);
    showDialog('Đã đổi mật khẩu', 'Máy này vẫn đăng nhập. Các thiết bị khác cần đăng nhập lại bằng mật khẩu mới.');
  };

  const askPassword = () => {
    setPasswordTried(true);
    if (Object.keys(passwordChangeErrors(passwords)).length) return;
    showDialog('Đổi mật khẩu?', 'Các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.', [
      { text: 'Để sau', style: 'cancel' },
      { text: 'Đổi mật khẩu', onPress: () => void submitPassword() },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Tài khoản" />
        <View style={styles.body}>
          <Text style={[styles.cardNote, styles.guest, { color: colors.textMuted }]}>Đăng nhập để sửa hồ sơ và đổi mật khẩu.</Text>
          <Button label="Đăng nhập" onPress={() => openAuthModal('login')} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Tài khoản" />
        <View style={styles.body}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Thông tin cá nhân</Text>
            <View>
              <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>Email đăng nhập</Text>
              <Text style={[styles.email, { color: colors.text }]}>{user?.email}</Text>
            </View>
            <FormField
              label="Họ tên"
              value={form.name}
              onChangeText={(name) => setForm((f) => ({ ...f, name }))}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              error={profileErrors.name}
            />
            <FormField
              label="Số điện thoại"
              value={form.phone}
              onChangeText={(phone) => setForm((f) => ({ ...f, phone }))}
              placeholder="0912345678"
              keyboardType="phone-pad"
              autoComplete="tel"
              hint="Không bắt buộc. Xoá trống để bỏ số đã lưu."
              error={profileErrors.phone}
            />
            <FormField
              label="Ngày sinh"
              value={form.dateOfBirth}
              onChangeText={(v) => setForm((f) => ({ ...f, dateOfBirth: maskDateInput(v) }))}
              placeholder="Ngày/tháng/năm"
              keyboardType="number-pad"
              maxLength={10}
              hint={saved.dateOfBirth ? 'Tài khoản xem phim cần đủ 18 tuổi.' : 'Chưa có ngày sinh. Có thể để trống, nếu nhập thì cần đủ 18 tuổi.'}
              error={profileErrors.dateOfBirth}
            />
            <Button
              label="Lưu thay đổi"
              onPress={() => void saveProfile()}
              loading={savingProfile}
              disabled={!changed}
              style={styles.action}
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Đổi mật khẩu</Text>
            <Text style={[styles.cardNote, { color: colors.textMuted }]}>
              Tài khoản tạo bằng Google không có mật khẩu, hãy tiếp tục đăng nhập bằng Google.
            </Text>
            <FormField
              label="Mật khẩu hiện tại"
              secret
              value={passwords.current}
              onChangeText={(current) => setPasswords((p) => ({ ...p, current }))}
              autoComplete="current-password"
              error={passwordErrors.current}
            />
            <FormField
              label="Mật khẩu mới"
              secret
              value={passwords.next}
              onChangeText={(next) => setPasswords((p) => ({ ...p, next }))}
              autoComplete="new-password"
              hint={PASSWORD_HINT}
              error={passwordErrors.next}
            />
            <FormField
              label="Nhập lại mật khẩu mới"
              secret
              value={passwords.confirm}
              onChangeText={(confirm) => setPasswords((p) => ({ ...p, confirm }))}
              autoComplete="new-password"
              error={passwordErrors.confirm}
            />
            <Button
              label="Đổi mật khẩu"
              variant="secondary"
              onPress={askPassword}
              loading={savingPassword}
              disabled={!passwords.current && !passwords.next}
              style={styles.action}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
