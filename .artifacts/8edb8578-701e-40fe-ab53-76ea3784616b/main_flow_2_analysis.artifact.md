# Phân tích Main Flow 2: Episode Access & Monetization

Biểu đồ Main Flow 2 mô tả luồng kiểm tra quyền truy cập tập phim (Episode Access), xử lý phân quyền cho Khách (Guest) và Thành viên (Member), cùng với hai phương thức thanh toán/mở khóa: **Coin Unlock** và **Monthly Plan (Membership)**.

Dưới đây là bảng đánh giá chi tiết những phần **đã thực hiện** và những phần **chưa thực hiện** trong dự án hiện tại.

---

## 1. Các chức năng ĐÃ THỰC HIỆN thành công

| Bước trong Flowchart | Trạng thái | Mô tả chi tiết trên Project |
| :--- | :---: | :--- |
| **Browse Catalog / Watch Trailer** | [x] Hoàn thành | Trang chủ (`index.tsx`), màn hình Khám phá (`explore.tsx`) và Chi tiết phim (`watch/[id].tsx`) hiển thị danh mục, trailer và thông tin phim. |
| **Select Episode** | [x] Hoàn thành | Người dùng chọn tập phim từ danh sách các tập trên giao diện chi tiết phim. |
| **Free Starter Episode?** | [x] Hoàn thành | Hệ thống kiểm tra cờ `ep.isFree`. Nếu là tập miễn phí khởi đầu -> Cho phép xem ngay mà không cần đăng nhập/thanh toán. |
| **Logged In?** | [x] Hoàn thành | Kiểm tra trạng thái đăng nhập (`isAuthenticated`). Nếu chưa đăng nhập -> Hiển thị modal Đăng nhập/Đăng ký (`AuthModal.tsx`). |
| **Register / Login** | [x] Hoàn thành | Hoàn thiện API đăng ký, đăng nhập kết nối Backend NestJS và Neon PostgreSQL. |
| **Determine Episode Access** | [x] Hoàn thành | Kiểm tra quyền truy cập dựa trên trạng thái VIP (`isVIPMode`) hoặc tập đã mở khóa (`ep.isUnlocked`). |
| **Choose Access Method** | [x] Hoàn thành | Khi tập phim bị khóa, modal mở khóa (`UnlockEpisodeModal.tsx`) cung cấp 2 lựa chọn: Mở khóa bằng Coin hoặc Đăng ký gói VIP (Membership). |
| **Obtain Coin (Top Up & Check-in)** | [x] Hoàn thành | Tích hợp ví Coin, tính năng Điểm danh nhận thưởng (`CheckInModal.tsx`) và Nạp thêm Coin (`TopUpModal.tsx`). |
| **Subscribe to Monthly Plan** | [x] Hoàn thành | Trang gói dịch vụ VIP (`vip.tsx`) cho phép xem các gói (Standard, VIP, Premium), chọn chu kỳ và đăng ký. |

---

## 2. Các chức năng CHƯA THỰC HIỆN hoặc cần hoàn thiện thêm

| Bước trong Flowchart | Trạng thái | Yêu cầu cần triển khai |
| :--- | :---: | :--- |
| **Backend Entitlement Persistence (Unlock Episode with Coin)** | `[/]` Cục bộ | **Backend API**: Cần xây dựng endpoint `POST /api/wallet/unlock-episode` và bảng DB `user_episode_unlocks` để lưu trữ vĩnh viễn quyền sở hữu tập phim của user trong PostgreSQL. *(Hiện tại app đang dùng local simulation fallback).* |
| **Backend Subscription Persistence (Activate Monthly Plan)** | `[/]` Cục bộ | **Backend API**: Cần hoàn thiện bảng lưu trữ gói cước thành viên active (`subscriptions`) trên Backend để trừ tiền và cấp quyền VIP tự động gia hạn. |
| **Handoff to Main Flow 3 (Advanced Video Playback & Ads)** | `[ ]` Chưa có | **Main Flow 3 Integration**: Sau khi `Access Granted`, hiện tại app đang dùng video placeholder (`.mp4`) đơn giản. Cần tích hợp trình phát video nâng cao (`expo-av` hoặc `react-native-video`), hỗ trợ stream HLS (`.m3u8`), chính sách chèn quảng cáo (Ad policy) và đồng bộ tiến trình xem (`viewing progress`). |
| **Automatic Catalog Access Verification for Subscribers** | `[ ]` Cần tối ưu | Đảm bảo khi một user có active Monthly Plan, mọi tập phim (kể cả phim trả phí) trên toàn catalog tự động trả về `Access Granted` mà không cần kiểm tra từng coin giá lẻ. |
