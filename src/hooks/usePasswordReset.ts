import { useEffect, useState } from 'react';
import { resetFormError } from '../lib/authForm';
import { showDialog } from '../lib/dialog';
import {
  CODE_SENT_MESSAGE,
  RESEND_COOLDOWN_SECONDS,
  forgotFailureMessage,
  looksLikeEmail,
} from '../lib/passwordReset';
import { authService } from '../services';
import { useSessionStore } from '../store';

export type ResetStep = 'email' | 'reset';

/**
 * Forgot-password flow: e-mail a 6-digit code, then set a new password with it. The backend answers
 * the same whether or not the account exists, so the notice stays neutral. A good code signs the
 * member in (the session store closes the auth sheet).
 */
export function usePasswordReset(initialEmail: string) {
  const resetPassword = useSessionStore((s) => s.resetPassword);
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // "Send again" opens when the backend would send another code (one a minute).
  const counting = secondsLeft > 0;
  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [counting]);

  const sendCode = async () => {
    if (loading || secondsLeft > 0) return;
    if (!looksLikeEmail(email)) {
      setError('Nhập email đã dùng để đăng ký.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await authService.forgotPassword(email);
    setLoading(false);
    if (!res.success) {
      setError(forgotFailureMessage(res));
      return;
    }
    setNotice(CODE_SENT_MESSAGE);
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    setStep('reset');
  };

  const submitReset = async () => {
    if (loading) return;
    const problem = resetFormError({ otp, password, confirmPassword });
    setError(problem);
    if (problem) return;
    setLoading(true);
    const result = await resetPassword(email, otp, password);
    setLoading(false);
    if (result.success) showDialog('Đã đổi mật khẩu', 'Bạn đã đăng nhập bằng mật khẩu mới.');
    else setError(result.error ?? null);
  };

  const changeEmail = () => {
    setStep('email');
    setError(null);
    setNotice(null);
    setOtp('');
  };

  return {
    step,
    email,
    setEmail,
    otp,
    setOtp: (value: string) => setOtp(value.replace(/\D/g, '').slice(0, 6)),
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    notice,
    error,
    loading,
    secondsLeft,
    sendCode,
    submitReset,
    changeEmail,
  };
}
