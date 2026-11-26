/** Fills the sign-in sheet the way a person types. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { useUiStore } from '../../../store';

export async function openSheet(mode: 'login' | 'register') {
  await act(() => useUiStore.getState().openAuthModal(mode));
}

export async function fillRegister(form: {
  name: string;
  day: string;
  month: string;
  year: string;
  email: string;
  password: string;
  confirm?: string;
}) {
  await fireEvent.changeText(screen.getByLabelText('Họ và tên'), form.name);
  await fireEvent.changeText(screen.getByLabelText('Ngày sinh'), form.day);
  await fireEvent.changeText(screen.getByLabelText('Tháng sinh'), form.month);
  await fireEvent.changeText(screen.getByLabelText('Năm sinh'), form.year);
  await fireEvent.changeText(screen.getByLabelText('Email'), form.email);
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu'), form.password);
  await fireEvent.changeText(screen.getByLabelText('Nhập lại mật khẩu'), form.confirm ?? form.password);
}

export async function fillLogin(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu'), password);
}
