# AI Cinema Mobile — Trạng thái code hiện tại

> File ngữ cảnh **local** (gitignored). Phản ánh đúng code đang có, không phải spec mong muốn.
> Spec nghiệp vụ: `../docs/PROJECT_OVERVIEW.md`; API thật: `../AI_Cinema_BE/PROJECT_OVERVIEW.md`.
> Đọc file này trước mỗi việc; cập nhật ngay khi xong một việc (mục "Nhật ký" + các mục bị ảnh hưởng).

**Cập nhật lần cuối:** 2026-10-16 — nhánh `feat/mobile-human-redesign` (chưa push, chưa merge `dev`).

## 1. Vai trò & Phạm vi đã làm

App chính cho **Guest & Member**:
- Duyệt danh mục phim, tìm kiếm, chi tiết phim/mùa/tập (`app/(tabs)/index.tsx`, `explore.tsx`, `schedule.tsx`, `movie/[id].tsx`).
- Phát video tập phim kèm kiểm tra quyền xem từ BE (`GET /episodes/:id/access`), mở khóa tập bằng Coin (`UnlockEpisodeModal`) và hiển thị thông tin tuân thủ/nhãn AI (`AIComplianceModal`, `watch/[id].tsx`).
- Ví Coin chính/thưởng, sao kê giao dịch (`StatementList`), nạp Coin qua cổng VNPay/MoMo kèm đối soát khi quay lại app (`TopUpModal`).
- Điểm danh hằng ngày theo bậc của BE (`CheckInModal`) và vòng quay may mắn nhận Coin thưởng / ngày gói (`RewardSpinModal`).
- Đăng ký / quản lý gói Tháng (`app/(tabs)/vip.tsx`), tự động làm mới danh sách gói khi focus màn hình.

## 2. Stack

Expo SDK 52 · React Native 0.76.9 · expo-router ~4 · TypeScript · Zustand 5 · Jest.

## 3. Cấu trúc chính

```
app/
  _layout.tsx     nạp font (useFonts) + giữ splash tới khi có font
  (tabs)/         index (home), explore (ô thể loại), schedule (tập 7 ngày qua), vip (Gói Tháng, ẩn khỏi thanh tab), profile
  search.tsx      tìm kiếm riêng (lịch sử + gợi ý)
  wallet.tsx      Ví Coin (Coin chính/thưởng, nạp, sao kê)
  settings.tsx    Cài đặt (giao diện, phiên bản, đăng xuất)
  notifications.tsx
  movie/[id].tsx  chi tiết phim: poster tràn viền, thanh "Xem tập N / Xem tiếp" cố định đáy
  watch/[id].tsx  player cố định trên cùng + kiểm tra quyền xem + nhãn AI (BR-10)
src/
  components/
    auth/         AuthModal
    chat/         ChatModal
    common/       Button, PageTitle, ScreenHeader, MenuRow
    explore/      GenreTile, FilmRow
    home/         HomeTopBar, HomeTabBar, PosterGrid, RankingList
    movie/        AudioModeTabs, EpisodeList, LikeButton
    player/       EpisodePlayer, PlayerControls, PlayerSettingsSheet, AIComplianceModal, UnlockEpisodeModal
    wallet/       CheckInModal, RewardSpinModal, StatementList, TopUpModal
  hooks/          useEpisodeGate, usePlayerClock, useSubtitleCues, useUnreadNotifications
  lib/            homeFeed, releaseDays, authForm, notificationTabs, apiAdapter, seek, vtt…
  theme/          colors (token), typography (`fonts`, `textStyle`), ThemeContext
  services/       apiClient, authService, movieService, episodeAccessService, walletService, rewardService, chatService…
  store/          useAppStore.ts
  __tests__/      mf2, services, player, homeFeed, releaseDays, authForm, seek, orientation
```

### 3.1 Quy ước giao diện (từ 2026-10-16)

- Màu lấy từ `colors` của theme, không viết mã màu cứng. Nền tối `#140C11` (đen ánh mận), nhấn hồng `ruby` `#FF3D7F` chỉ cho thứ đang chọn hoặc bấm được, tag cam `neon`, "Mới" xanh `verified`, Coin vàng `coin`.
- Chữ: chọn `fontFamily` qua `textStyle.*` / `fonts.*` (`src/theme/typography.ts`), **không** đặt `fontWeight` (font tùy chỉnh mang độ đậm trong file). Phudu (`fonts.display*`) chỉ dùng cho tiêu đề màn, tab trang chủ, tên phim, số hạng và số tiền lớn; còn lại là Be Vietnam Pro. Cỡ nhỏ nhất 11–12.
- Câu chữ: viết thường kiểu câu, không emoji, không viết hoa toàn bộ, không "!" cuối câu, không nối bằng " · ". Lỗi nói rõ chuyện gì xảy ra và cách xử lý. Không hiển thị số liệu BE không trả (điểm, % phù hợp, bình luận, lịch giờ chiếu).
- Nút: dùng `Button` (`primary` hồng cho việc chính của màn, `secondary` xám, `quiet`). Hộp thoại dạng tấm trượt đáy có thanh kéo.

## 4. Quy ước bắt buộc (Mobile)

- **Mọi màn hình phát video phải hiển thị overlay nhãn AI** (`aiLabel`) — không tự ý ẩn/bỏ qua kể cả khi thử nghiệm UI, đây là yêu cầu pháp lý (Điều 44 Luật 134/2025/QH15 & Điều 18 NĐ 142/2026/NĐ-CP, BR-10).
- Luồng mở khóa tập phim phải hiển thị rõ **Coin chính / Coin thưởng dùng bao nhiêu** trước khi xác nhận thanh toán, đúng thứ tự Main-trước-Bonus-bù-thiếu (BR-01).
- Màn hủy gói phải hiển thị rõ đang ở **bên nào của mốc 24h** (BR-05) trước khi cho bấm hủy, tránh Member hiểu nhầm là hủy ngay lập tức.
- Kiểm tra quyền xem (entitlement) luôn qua API của BE (`GET /episodes/:id/access`), không tự suy luận quyền xem ở client dựa trên cache cũ.

## 5. Test & kiểm tra

- `npm test` (Jest): 8 bộ test trong `src/__tests__/` — 70/70 PASS (2026-10-16).
- `npm run typecheck` (`tsc --noEmit`) & `npm run lint` — sạch.
- CI `.github/workflows/ci.yml`: kiểm tra chất lượng app tự động.

## 6. Nhật ký

- 2026-10-05 & 2026-10-06 — `fix/api-network-exception` (PR #5): dọn dead code, unused imports và xử lý lỗi mạng trong `apiClient`.
- 2026-10-09 & 2026-10-10 — `Phuoc` (PR #7): bổ sung `TopUpModal` và chức năng nạp Coin.
- 2026-10-11 — Hoàn thiện MF-2 trên Mobile: kết nối toàn bộ route BE cho ví Coin, quyền xem tập (`episodeAccessService`), gói Tháng, điểm danh và vòng quay thưởng (`rewardService`); đọc ví, gói và trạng thái điểm danh từ BE trong store; đối soát kết quả thanh toán khi quay lại app; thêm unit test `mf2.test.ts` và workflow CI (`ci(mobile): add app quality checks`).
- 2026-10-11 & 2026-10-12 — `fix/mobile-vip-refresh-plans` (PR #8): làm mới danh sách gói thành viên khi màn hình VIP được focus (`Refresh membership plans on screen focus`), xử lý ổn định điểm danh hằng ngày và hiển thị trạng thái đủ điều kiện quay thưởng trên mobile (`feat: show check-in spin eligibility on mobile`).
- 2026-10-13 — Đồng bộ file ngữ cảnh local `PROJECT_OVERVIEW.md`, `TESTING.md`, `PROJECT_CONTEXT.md` và bộ quy tắc Antigravity (`GEMINI.md`).
- 2026-10-14 — `chore/remove-legacy-studio-tab` (5 commit): gỡ tab/ màn `studio` (Studio AI), `useProductionStore`, `productionService`, `types/production`, `components/studio` và route `/production-*` — mã cũ của mô hình AI tự sản xuất, gọi API không còn tồn tại; bỏ thẻ quản lý thiết bị ở `profile` vì chạy bằng state cục bộ (MF-4 sẽ làm lại với API thật); `adaptApiMovieToMovie` không còn bịa 12 tập mẫu (video w3schools) khi API không trả tập. Contract catalog/MF-2 không đổi. Test 37/37, typecheck + lint sạch.
- 2026-10-15 — `feat/mobile-real-video-player`: màn `watch/[id]` dùng player thật (`expo-video`, component `EpisodePlayer`) thay khung ảnh + nút giả; link phát lấy từ `checkAccess().streamUrl` (`useEpisodeGate` gắn vào `hlsUrl`; sau khi mua gọi lại access); nhãn AI (BR-10) phủ trên cả poster và video; phụ đề nằm trong video (burn-in). Test 38/38, typecheck + lint sạch.
- 2026-10-15 — `feat/mobile-landscape-fullscreen`: quay ngang khi xem toàn màn hình. Thêm `expo-screen-orientation` (plugin trong `app.json`, `orientation` đổi `portrait` → `default`); `src/lib/orientation.ts` (`lockPortrait`/`lockLandscape`, bỏ qua trên web, nuốt lỗi khi thiết bị từ chối); `app/_layout.tsx` khóa dọc lúc khởi động nên các màn khác vẫn dọc; `EpisodePlayer` khóa ngang ở `onFullscreenEnter`, trả dọc ở `onFullscreenExit` và khi rời màn. Nhãn AI vẫn hiển thị (BR-10). Cần dev build/Expo Go thật để xem xoay; trên web trình duyệt tự xoay theo thiết bị. Test 41/41, typecheck + lint sạch.
- 2026-10-15 — `chore/quality-review` (từ `feat/mobile-landscape-fullscreen`): rà soát chất lượng. Gỡ `src/store/index.ts`, `src/types/index.ts` (barrel không ai import), `getTodayDateString` và bỏ `export` thừa; thôi theo dõi thư mục `.artifacts/` (ghi chú của agent, đã vào `.gitignore`). Thêm `test:cov` (Jest coverage), `sonar-project.properties` + job SonarCloud trong CI, `README.md` đầy đủ, `.env.example`, `eas.json` (development/preview/production). Bước `npm audit` của CI chuyển sang không chặn: 57 advisory đều nằm trong toolchain Expo SDK 52 (`@expo/cli` → `tar`, xmldom…), chỉ hết khi nâng SDK; `npm audit fix` làm hỏng cây phụ thuộc (mất `query-string`) nên đã hoàn tác. Test 41/41, typecheck + lint + `expo export --platform android` sạch.
- 2026-10-15 — `feat/mobile-player-subtitles-settings` (từ `chore/quality-review`, chưa push): trình phát tự vẽ điều khiển (phát/dừng, lùi/tới 10 giây, thanh tua, toàn màn hình bằng Modal + xoay ngang, nút **Cài đặt**: phụ đề/ngôn ngữ và tốc độ 0.5–2x), phụ đề WebVTT đọc qua `GET /subtitles/:id` và vẽ đè video; nhãn AI vẫn luôn hiển thị cả khi toàn màn hình (BR-10). Tab **Phụ đề** bật phụ đề (mặc định Tiếng Việt), **Thuyết minh** tắt phụ đề và phát âm thanh gốc của phim; lựa chọn ở trang chi tiết chuyển sang màn xem (`mode`). Bỏ "Máy chủ", nút chụp ảnh, công tắc "Skip giới thiệu" giả; "Hiện ảnh" hoạt động (danh sách tập kèm ảnh, thời lượng, giá); bỏ chữ cứng "Tập 11 phát sóng…", "(11 / n)". Tim thật + số tim, lượt xem (`/movies/:id/engagement`, đếm lượt khi bắt đầu phát). Chuông Header mở màn **Thông báo** (tab Ví & Coin / Gói thành viên / Phim & thưởng, số chưa đọc). Test 49/49, typecheck + lint sạch, `expo export -p web` OK.
- 2026-10-16 — `feat/mobile-home-tabs-search` (đợt 2, đã push): giao diện màu sắc + vị trí theo MultiShorts, chức năng giữ nguyên. **Theme** (`src/theme/colors.ts`): nhấn hồng `#FF3D7F` (token `ruby` giữ tên), nền `#0F0F0F` + `topTint` đỏ tía ở đầu trang, thẻ/menu xám trung tính (`card`, `cardAlt`, `chip`), chữ tag cam (`neon` `#FF7A45`), "Mới" xanh (`verified`), "Đang hot" (`hot`), thẻ VIP vàng (`vipGradient`, `vipText`), nút hồng (`accentGradient`). Màu cứng cũ (đỏ Netflix, slate, tím) đã thay toàn app; xanh lá chỉ còn ở chỗ mang nghĩa thành công/nhận Coin/tuân thủ. **Trang chủ**: bỏ `Header`, `HeroBanner`, `ContinueWatchingSection`; trên cùng `HomeTopBar` (ô tìm kiếm gợi ý tên phim + quà mở điểm danh, chấm đỏ khi BE báo chưa điểm danh/còn lượt quay) trên nền dải đỏ tía; Đề xuất = lưới 9 phim + "Xem thêm"/"Đổi mới"; Thể loại dạng chữ, mục chọn nền hồng nhạt. **Thanh tab**: viên thuốc nổi, mục đang chọn có nền tối riêng, icon viền, tab cuối đổi tên "Hồ sơ". **Hồ sơ** viết lại: avatar + tên (khách: "Đăng nhập / Đăng ký >"), thẻ vàng Gói Tháng (Đăng ký/Quản lý → `vip`), Lịch sử ngang (EP.x, mở lại đúng tập), menu Ví / Trung tâm phần thưởng / Thông báo / Chăm sóc khách hàng / Cài đặt (`MenuRow`, `MenuCard`). Màn mới **`app/wallet.tsx`** "Ví của tôi" (Coin chính + Coin thưởng, ghi rõ thứ tự trừ BR-01, Nạp Coin, Điểm danh, sao kê) và **`app/settings.tsx`** (Giao diện Tối/Sáng, Phiên bản, Đăng xuất), dùng `ScreenHeader`. Màn xem phim chỉ đổi màu (hồng), nhãn AI vẫn luôn hiện. Test 60/60, typecheck + lint sạch, `expo export -p web` OK.
- 2026-10-16 — `feat/mobile-home-tabs-search` (từ `fix/mobile-player-seek-nonfinite`, chưa push): theo giao diện tham khảo MultiShorts nhưng giữ nguyên logic MF-2 (xem `../MULTISHORTS_UI_PLAN.md`). Trang chủ có ô tìm kiếm + 4 tab con **Đề xuất / Xếp hạng / Phim mới / Thể loại** (`HomeTabBar`, `PosterGrid` 3 cột, `RankingList`; thể loại lấy từ danh mục, lọc phía client; hạng theo thứ tự BE vì chưa có API xếp hạng). Màn **Tìm kiếm** riêng `app/search.tsx` (gọi `movieService.listMovies({search})` trực tiếp, không ghi đè `movies` của store; lịch sử tìm lưu AsyncStorage tối đa 8; "Phim gợi ý" xoay vòng bằng `suggestionPage`). Logic thuần ở `src/lib/homeFeed.ts`. Thanh tab dưới thành dạng viên thuốc nổi, màu `ruby`. Đã xóa `CategoryPills`, `TopRankRow`, `MovieRow` (không còn ai import). Test 60/60, typecheck + lint sạch.
- 2026-10-16 — `fix/mobile-player-seek-nonfinite` (từ `feat/mobile-player-subtitles-settings`, chưa push): bản web (Expo, `localhost:8081`) crash "Failed to set the 'currentTime' … non-finite" khi bấm thanh tua vì react-native-web có thể không gửi `locationX` → `NaN`. Thêm `src/lib/seek.ts` (`seekTarget` bỏ qua giá trị không hữu hạn và kẹp trong [0, thời lượng]; `barRatio`), thanh tua đo vị trí bằng `measureInWindow` + `pageX` khi thiếu `locationX`, `usePlayerClock` chỉ trả số hữu hạn. Phụ đề She Raised a Monster trên R2 đã trùng 100% với `vi.srt`/`en.srt` trong `AI_Film_v2` (186 câu; lời thoại bắt đầu từ 2:10, trước đó chỉ là tiếng động). Test 52/52, typecheck + lint sạch.
- 2026-10-16 — `feat/mobile-human-redesign` (từ `feat/mobile-home-tabs-search`, chưa push, 11 commit): thiết kế lại để giao diện và câu chữ không còn "AI hóa", vẫn giữ chất MultiShorts; cách làm theo skill `frontend-design` (cài ở `../.claude/skills/`). **Theme**: nền đen ánh mận `#140C11` thay `#0F0F0F`, font Be Vietnam Pro + Phudu (`@expo-google-fonts`, import từng weight nên chỉ đóng gói 6 file), `textStyle`/`fonts` thay `fontWeight`. **Component chung** `Button`, `PageTitle`; hook `useUnreadNotifications` (số chưa đọc hiện ở menu Thông báo của Hồ sơ). **Trang chủ** tab con bằng Phudu, Xếp hạng có số hạng lớn (bỏ ruy băng màu). **Khám phá** viết lại: ô thể loại lấy poster thật (`genreShelves`), mở ra danh sách `FilmRow`; bỏ banner "Vũ trụ điện ảnh AI", thể loại cứng, sắp xếp emoji, điểm 4.8 giả. **Lịch chiếu** viết lại: tập lên sóng 7 ngày qua theo `publishedAt` (thêm vào `Episode` + adapter; `src/lib/releaseDays.ts`), bỏ lịch giả "20:00 · Tập n". **Chi tiết phim**: poster tràn viền, tiêu đề lớn căn trái, nút "Xem tập 1 / Xem tiếp tập n" cố định đáy, chia sẻ bằng `Share` thật; bỏ bình luận mẫu, nút Xem chung, thông báo "đã sao chép" giả, viên "Điểm kiểm duyệt". `AIComplianceModal` chỉ hiện điều có thật (nhãn AI, độ tuổi, căn cứ luật). **Xem phim**: player cố định trên cùng khung 16:9, bỏ công tắc "Chuyển tập" không nối logic; nhãn AI vẫn luôn hiện (BR-10). **Mở khóa tập** thành tấm trượt có bảng trừ Coin chính / Coin thưởng / còn lại (BR-01). **Gói Tháng** có nút quay lại (Tabs `backBehavior="history"`), vẫn hiện bên nào mốc tắt tự gia hạn trước công tắc (BR-05). **Đăng nhập** kiểm tra đúng luật mật khẩu BE (8–72 ký tự, có chữ và số; `src/lib/authForm.ts`), bỏ ngày sinh mặc định giả và độ trễ 350ms giả. Điểm danh, vòng quay, nạp Coin (thêm mức gợi ý), sao kê, chat viết lại câu chữ (bỏ "Trực tuyến 24/7", 🚨, câu tỉ lệ vòng quay cứng). Xóa `Header`, `ExploreModal`, `ThemeToggle`, `MovieCard`. Test 70/70, typecheck + lint sạch, `expo export -p web` OK.
- 2026-10-16 — `feat/mobile-human-redesign`: danh sách tập (chi tiết phim + màn xem) luôn hiện dạng dòng có ảnh, thời lượng, giá; bỏ công tắc "Hiện ảnh" và dạng ô số. Test 70/70, typecheck + lint sạch.
- 2026-10-16 - `chore/replace-em-dash-with-hyphen`: đổi toàn bộ dấu "—" thành "-" trong giao diện. Test 70/70, typecheck sạch.
- 2026-10-16 - `feat/one-episode-season-label` (chưa merge/push): `src/lib/episodeLabel.ts` - tập duy nhất của một mùa hiện "Phần N (trọn bộ)" ở danh sách tập, màn xem và modal mở khoá (vẫn hiện rõ Coin chính/thưởng BR-01). Quyền xem miễn phí vẫn do BE quyết (`isFreeStarter` theo số riêng của phim). Test 72/72, typecheck + lint sạch.
- 2026-10-16 - push: `chore/replace-em-dash-with-hyphen`, `feat/mobile-human-redesign`, `feat/one-episode-season-label`.
- 2026-10-16 - `refactor/mobile-styles-folder` (từ `feat/one-episode-season-label`, đã push): tách toàn bộ `StyleSheet.create` khỏi 35 component/màn hình sang thư mục riêng `src/styles/` (`src/styles/components/<nhóm>/<Tên>.styles.ts`, `src/styles/screens/<route>.styles.ts`; không đặt trong `app/` vì Expo Router coi mọi file ở đó là route). Khoảng cách lưới dùng chung ở `src/styles/layout.ts` (`GRID_SIDE`, `GRID_GAP`). Không đổi giao diện. Typecheck + lint sạch, test 72/72, `expo export -p web` OK. Còn lại: `src/store/useAppStore.ts` 468 dòng nên tách slice; độ phủ test ~24%.
