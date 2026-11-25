/** Event names, notices and error texts of the BE WatchRoomGateway (room-events.ts), shared by the socket hook. */
export const ROOM_EVENT = {
  JOIN: 'ROOM_JOIN',
  PLAYBACK: 'ROOM_PLAYBACK',
  LEAVE: 'ROOM_LEAVE',
  VOTE_HOST: 'ROOM_VOTE_HOST',
  INVITE: 'ROOM_INVITE',
  INVITE_SENT: 'ROOM_INVITE_SENT',
  INVITE_FAILED: 'ROOM_INVITE_FAILED',
  JOINED: 'ROOM_JOINED',
  PARTICIPANT_JOINED: 'ROOM_PARTICIPANT_JOINED',
  PARTICIPANT_LEFT: 'ROOM_PARTICIPANT_LEFT',
  SYNC_PLAYBACK: 'SYNC_PLAYBACK',
  HEARTBEAT_SYNC: 'HEARTBEAT_SYNC',
  HOST_DISCONNECTED: 'ROOM_HOST_DISCONNECTED',
  HOST_RECONNECTED: 'ROOM_HOST_RECONNECTED',
  HOST_CHANGED: 'ROOM_HOST_CHANGED',
  VOTE_OPEN: 'ROOM_VOTE_OPEN',
  EPISODE_ENDED: 'ROOM_EPISODE_ENDED',
  EPISODE_CHANGED: 'ROOM_EPISODE_CHANGED',
  TERMINATED: 'ROOM_TERMINATED',
  SESSION_REPLACED: 'ROOM_SESSION_REPLACED',
  // Shared screen (13/11/2026): chat, the Host's ad and quality, the catch-up snapshot.
  CHAT: 'ROOM_CHAT',
  AD_BREAK: 'ROOM_AD_BREAK',
  QUALITY: 'ROOM_QUALITY',
  SCREEN_STATE: 'ROOM_SCREEN_STATE',
  CHAT_MESSAGE: 'ROOM_CHAT_MESSAGE',
  CHAT_REJECTED: 'ROOM_CHAT_REJECTED',
  AD_STATE: 'ROOM_AD_STATE',
  QUALITY_CHANGED: 'ROOM_QUALITY_CHANGED',
  SCREEN: 'ROOM_SCREEN',
  ERROR: 'ROOM_ERROR',
  HOST_INACTIVE: 'ROOM_HOST_INACTIVE',
  LAST_ONE_LEFT: 'ROOM_LAST_ONE_LEFT',
} as const;

export const CHAT_KEEP = 50;
export const CHAT_REJECTED_NOTICE: Record<string, string> = {
  RATE_LIMITED: 'Bạn gửi nhanh quá, đợi vài giây nhé.',
  TOO_LONG: 'Tin nhắn dài quá (tối đa 300 ký tự).',
};

export const NOTICES: Record<string, string> = {
  [ROOM_EVENT.HOST_DISCONNECTED]: 'Chủ phòng tạm mất kết nối, phòng vẫn giữ trong 45 giây.',
  [ROOM_EVENT.HOST_RECONNECTED]: 'Chủ phòng đã quay lại.',
  [ROOM_EVENT.HOST_CHANGED]: 'Phòng đã có chủ phòng mới.',
  [ROOM_EVENT.VOTE_OPEN]: 'Chủ phòng tạm dừng quá lâu: bạn có thể bỏ phiếu chọn chủ phòng mới.',
  [ROOM_EVENT.EPISODE_ENDED]: 'Tập phim đã hết, chờ chủ phòng chuyển tập tiếp theo.',
  [ROOM_EVENT.EPISODE_CHANGED]: 'Chủ phòng đã chuyển sang tập tiếp theo.',
  [ROOM_EVENT.HOST_INACTIVE]: 'Phòng đã tạm dừng khá lâu. Bấm phát để xem tiếp, nếu không cả phòng có thể bỏ phiếu đổi chủ phòng.',
};

/** ROOM_ERROR codes (`details.reason`, else `reason`) the viewer can act on. */
const ROOM_ERROR_NOTICE: Record<string, string> = {
  ROOM_FULL: 'Phòng đã đủ 8 người.',
  AGE_RESTRICTED: 'Tập này dành cho người từ 18 tuổi trở lên.',
  ENTITLEMENT_REQUIRED: 'Bạn chưa có quyền xem tập này. Mở khóa tập hoặc đăng ký gói Tháng.',
  DEVICE_LIMIT_EXCEEDED: 'Tài khoản đang phát trên đủ số thiết bị của gói. Dừng xem ở một thiết bị rồi thử lại.',
  NOT_HOST: 'Chỉ chủ phòng mới điều khiển được phòng.',
  NOT_IN_ROOM: 'Bạn không còn ở trong phòng này. Mở lại phòng để vào tiếp.',
  UNAUTHENTICATED: 'Hết hạn đăng nhập, đang kết nối lại phòng.',
  ROOM_NOT_FOUND: 'Phòng không còn tồn tại.',
  ROOM_CLOSED: 'Phòng đã đóng.',
  INVALID_PAYLOAD: 'Thao tác chưa gửi được tới phòng. Thử lại sau giây lát.',
};

/** The BE sends `{ reason, details }`: `reason` is its own (English) message or a code; never shown raw. */
export function roomErrorCode(error: { reason?: string; details?: unknown } | null | undefined): string | undefined {
  const details = error?.details;
  const detailReason =
    details && typeof details === 'object' && !Array.isArray(details) ? (details as { reason?: unknown }).reason : undefined;
  return typeof detailReason === 'string' ? detailReason : error?.reason;
}

export function roomErrorNotice(error: { reason?: string; details?: unknown } | null | undefined): string {
  return ROOM_ERROR_NOTICE[roomErrorCode(error) ?? ''] ?? 'Không thể đồng bộ phòng xem nhóm. Thử lại sau giây lát.';
}

/**
 * Shapes what the member types into the XXX-XXX room code. The BE codes use base32 without the look-alikes
 * 0/O and 1/I (room-codes.ts), so those letters are dropped here: they could never match a room.
 */
export function formatRoomCodeInput(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}
