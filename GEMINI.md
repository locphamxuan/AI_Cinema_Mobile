# Quy Tắc Hoạt Động Của Antigravity (Workspace Rules — AI_Cinema_Mobile)

> File quy tắc này chỉ dùng ở môi trường local và được đưa vào `.gitignore`. Agent **BẮT BUỘC** tuân thủ nghiêm ngặt toàn bộ các quy tắc dưới đây trong mọi lượt tương tác và thực thi nhiệm vụ (tương thích đa máy `C:\` hoặc `D:\`).

---

## 1. Ngôn Ngữ Phản Hồi (Bắt Buộc Tiếng Việt)

- **Luôn trả lời người dùng bằng Tiếng Việt** trong mọi câu trả lời, giải thích kỹ thuật, kế hoạch thực hiện (plan), báo cáo kết quả và câu hỏi làm rõ.
- Giữ nguyên các thuật ngữ lập trình chuyên ngành, tên biến, tên hàm, tên class, đường dẫn file và câu lệnh terminal để đảm bảo tính chính xác kỹ thuật.

---

## 2. Quy Tắc Git & Commit (Bắt Buộc Mọi Thay Đổi Code / Tính Năng Mới)

- **Luôn tạo nhánh riêng trước khi sửa code (`git checkout -b <tên-nhánh>`):**
  - Trước khi sửa hoặc thêm code/tính năng mới, luôn tạo và chuyển sang nhánh riêng (`git checkout -b <feat|fix|refactor|chore>/<tên-nhánh>`) — **tuyệt đối KHÔNG** commit thẳng lên `main` hoặc `dev`.
- **Luôn chia commit theo ngữ cảnh (Atomic Commits by Context):**
  - Không gộp chung nhiều thay đổi thuộc các ngữ cảnh/tính năng khác nhau vào một commit duy nhất.
  - Phải phân tách các file thay đổi và stage (`git add <files>`) theo từng nhóm ngữ cảnh độc lập, có ý nghĩa rõ ràng (feature, fix, refactor, test, config... tách commit khác nhau).
  - Commit message viết tiếng Anh ngắn gọn, rõ ràng — **tuyệt đối KHÔNG** chứa `Co-authored-by:`, logo hay bất kỳ dòng attribution nào của AI.
- **Không commit các file local & dọn dẹp file tạm:**
  - Tuyệt đối không ép buộc stage (`git add -f`) các file đã nằm trong `.gitignore` như `GEMINI.md`, `CLAUDE.md`, `PROJECT_CONTEXT.md`, `PROJECT_OVERVIEW.md`, `PROGRESS.md`, `TESTING.md`, `.agents/`, `.agent/`, `.claude/`, `.codegraph/`, `.env`.
  - Sau khi hoàn tất, dọn sạch các file/thư mục/code tạm trước khi coi task là xong.

---

## 3. Quy Tắc Chạy Testing Sau Mỗi Lần Sửa Đổi, Cập Nhật

- **Bắt buộc chạy kiểm thử (Testing) sau mỗi lần sửa đổi hoặc cập nhật code:**
  - Ngay sau khi chỉnh sửa, thêm mới hoặc xóa bất kỳ đoạn code nào trong `AI_Cinema_Mobile`, phải chạy:
    - `npm test` (Jest)
    - `npm run typecheck` (`tsc --noEmit`) và `npm run lint`
  - Viết bổ sung hoặc cập nhật unit test khi thêm tính năng mới hoặc thay đổi hành vi nghiệp vụ (tham chiếu chiến lược tại [`./TESTING.md`](./TESTING.md)).
  - **Không hoàn tất nhiệm vụ và không tạo commit** nếu test hoặc typecheck/lint đang bị lỗi (FAIL). Phải sửa triệt để cho đến khi toàn bộ test đều PASS.

---

## 4. Quy Tắc Duy Trì & Đồng Bộ File Ngữ Cảnh Dự Án (`PROJECT_OVERVIEW.md` & `PROJECT_CONTEXT.md`)

- **Đọc trước khi làm:** Luôn đọc [`./PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md), [`./TESTING.md`](./TESTING.md), [`../PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) và [`../docs/PROJECT_OVERVIEW.md`](../docs/PROJECT_OVERVIEW.md) trước mỗi việc.
- **Luôn cập nhật ngay sau mỗi lần sửa đổi:**
  - Ngay sau khi hoàn thành một việc trên `AI_Cinema_Mobile`, **bắt buộc cập nhật [`./PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md)** (mục "Nhật ký" + các mục bị ảnh hưởng) và **[`../PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)**.
  - Không viết cứng đường dẫn ổ đĩa (`C:\` hay `D:\`) vào file `.md`. Sau khi cập nhật, chạy `powershell -ExecutionPolicy Bypass -File ../sync-context.ps1` (nếu có) để đồng bộ lên Cloud.

---

## 5. Quy Ước Nghiệp Vụ Bắt Buộc Của `AI_Cinema_Mobile`

- **Mọi màn hình phát video phải hiển thị overlay nhãn AI** (`aiLabel`) — không tự ý ẩn/bỏ qua kể cả khi thử nghiệm UI, đây là yêu cầu pháp lý (Điều 44 Luật 134/2025/QH15 & Điều 18 NĐ 142/2026/NĐ-CP, BR-10).
- Luồng mở khóa tập phim phải hiển thị rõ **Coin chính / Coin thưởng dùng bao nhiêu** trước khi xác nhận thanh toán, đúng thứ tự Main-trước-Bonus-bù-thiếu (BR-01).
- Màn hủy gói phải hiển thị rõ đang ở **bên nào của mốc 24h** (BR-05) trước khi cho bấm hủy, tránh Member hiểu nhầm là hủy ngay lập tức.
- Kiểm tra quyền xem (entitlement) luôn qua endpoint của BE (`GET /episodes/:id/access`), không tự suy luận quyền xem ở client dựa trên cache cũ.
