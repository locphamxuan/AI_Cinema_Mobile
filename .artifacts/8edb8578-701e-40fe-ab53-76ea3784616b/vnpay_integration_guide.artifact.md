# Hướng Dẫn Tích Hợp Thanh Toán VNPay (Backend to Frontend)

Tài liệu này hướng dẫn chi tiết các bước triển khai cổng thanh toán **VNPay** từ **Backend (NestJS)** đến **Frontend (React Native / Expo)** cho ứng dụng **AI Cinema Mobile**.

---

## PHẦN 1: BACKEND (NestJS & PostgreSQL)

### 1. Cấu hình biến môi trường (`.env`)
Thêm các thông số sandbox của VNPay vào tệp `.env` của backend:
```env
VNP_TMN_CODE=YOUR_TMN_CODE
VNP_HASH_SECRET=YOUR_HASH_SECRET
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3001/api/payment/vnpay/return
```

### 2. Xây dựng VNPay Service / Controller
Tạo module thanh toán VNPay trên NestJS (`vnpay.service.ts`):

- **Tạo URL thanh toán (`createPaymentUrl`)**:
  1. Sắp xếp các tham số theo thứ tự bảng chữ cái (alphabet).
  2. Tạo chuỗi ký tự query và tính chữ ký bảo mật **HMAC-SHA512** sử dụng `VNP_HASH_SECRET`.
  3. Trả về URL chuyển hướng hoàn chỉnh cho Frontend.

- **Xử lý kết quả trả về (`vnpayReturn`)**:
  1. Xác thực lại `vnp_SecureHash` từ VNPay gửi về.
  2. Kiểm tra `vnp_ResponseCode === '00'` (Thanh toán thành công).
  3. **Cập nhật Database**:
     - Nếu là nạp Coin: Cộng tiền vào bảng `wallets` và ghi nhận lịch sử giao dịch `transactions`.
     - Nếu là mua Membership: Cập nhật trạng thái active cho bảng `subscriptions`.

---

## PHẦN 2: FRONTEND (React Native / Expo)

### 1. Cài đặt thư viện `expo-web-browser`
Để mở cổng thanh toán VNPay an toàn trên mobile, sử dụng `expo-web-browser`:
```bash
npx expo install expo-web-browser
```

### 2. Cập nhật phương thức thanh toán (`TopUpModal.tsx` & `vip.tsx`)
Thêm **VNPay** vào danh sách phương thức thanh toán. Khi người dùng chọn VNPay và xác nhận:

```ts
import * as WebBrowser from 'expo-web-browser';
import { apiClient } from '../../src/services/apiClient';

// Xử lý thanh toán VNPay
const handleVNPayPayment = async (amount: number, type: 'deposit' | 'subscription', planId?: string) => {
  try {
    // 1. Gọi API Backend để tạo VNPay URL
    const res = await apiClient.post('/payment/vnpay/create-url', {
      amount,
      type,
      planId,
    });

    if (res.success && res.data?.paymentUrl) {
      // 2. Mở trình duyệt VNPay secure gateway
      const result = await WebBrowser.openAuthSessionAsync(
        res.data.paymentUrl,
        'ai-cinemamobile://'
      );

      // 3. Xử lý sau khi hoàn tất thanh toán
      if (result.type === 'success') {
        Alert.alert('Thành công', 'Giao dịch VNPay đã hoàn tất!');
        // Refresh lại số dư ví hoặc gói VIP
      }
    } else {
      Alert.alert('Lỗi', res.message || 'Không thể tạo link thanh toán VNPay.');
    }
  } catch (error) {
    Alert.alert('Lỗi kết nối', 'Không thể kết nối đến cổng thanh toán VNPay.');
  }
};
```

---

## PHẦN 3: CẬP NHẬT GIAO DIỆN (`TopUpModal.tsx`)

Thêm VNPay vào mảng `PAYMENT_METHODS`:
```ts
const PAYMENT_METHODS = [
  { id: 'vnpay', name: 'VNPay', icon: 'card-outline' },
  { id: 'vietqr', name: 'VietQR', icon: 'qr-code-outline' },
  { id: 'momo', name: 'MoMo', icon: 'wallet-outline' },
  { id: 'zalopay', name: 'ZaloPay', icon: 'flash-outline' },
] as const;
```
