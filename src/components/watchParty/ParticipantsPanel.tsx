import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store';
import { useTheme } from '../../theme';
import type { RoomSync } from '../../types/watchRoom';
import { styles } from '../../styles/screens/watchParty.styles';

interface ParticipantsPanelProps {
  /** The members currently watching together. */
  participants: { userId: string; fullName: string }[];
  /** The room's sync state so we can mark the current host. */
  sync: RoomSync | null;
}

/** Host-side panel: who is watching this room together right now. */
export function ParticipantsPanel({ participants, sync }: ParticipantsPanelProps) {
  const me = useSessionStore((s) => s.user?.id);
  const { colors } = useTheme();
  const hostId = sync?.hostUserId ?? null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Đang xem cùng ({participants.length})</Text>
      <View style={styles.participantList}>
        {participants.length === 0 ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>Chỉ còn bạn trong phòng.</Text>
        ) : (
          participants.map((p) => (
            <View key={p.userId} style={styles.participantRow}>
              <View style={[styles.avatar, { backgroundColor: colors.ruby }]}>
                <Text style={styles.avatarText}>{p.fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={[styles.participantName, { color: colors.text }]} numberOfLines={1}>
                  {p.fullName}
                </Text>
                <View style={styles.participantRoleRow}>
                  {p.userId === me && (
                    <Text style={[styles.participantRole, { color: colors.textMuted }]}>Bạn</Text>
                  )}
                  {p.userId === hostId && p.userId !== me && (
                    <Text style={[styles.participantRole, { color: colors.coin }]}>Chủ phòng</Text>
                  )}
                  {p.userId !== me && p.userId !== hostId && (
                    <Text style={[styles.participantRole, { color: colors.textMuted }]}>Tham gia</Text>
                  )}
                </View>
              </View>
              {p.userId === hostId && <Ionicons name="star" size={16} color={colors.coin} />}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
