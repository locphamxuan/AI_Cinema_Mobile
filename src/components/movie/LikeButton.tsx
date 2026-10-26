import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { engagementService, type MovieEngagement } from '../../services/engagementService';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/movie/LikeButton.styles';

/** Formats 1234 as "1,2K" the way viewers read counts. */
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / (n < 1_000_000 ? 1000 : 1_000_000);
  return `${k.toFixed(k < 10 ? 1 : 0).replace('.', ',').replace(/,0$/, '')}${n < 1_000_000 ? 'K' : 'M'}`;
}

/** Hearts and plays of a movie from the BE; a Guest is asked to sign in before giving a heart. */
export function useMovieEngagement(movieId: string | undefined) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [data, setData] = React.useState<MovieEngagement | null>(null);

  React.useEffect(() => {
    if (!movieId) return;
    let active = true;
    void engagementService.summary(movieId).then((res) => active && res.success && setData(res.data));
    return () => {
      active = false;
    };
  }, [movieId, isAuthenticated]);

  return [data, setData] as const;
}

/** Heart with its count beside it. */
export function LikeButton({ movieId }: { movieId: string }) {
  const { colors } = useTheme();
  const { isAuthenticated, openAuthModal } = useAppStore();
  const [data, setData] = useMovieEngagement(movieId);
  const [busy, setBusy] = React.useState(false);
  const liked = Boolean(data?.likedByMe);

  const toggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setBusy(true);
    const res = liked ? await engagementService.unlike(movieId) : await engagementService.like(movieId);
    if (res.success) setData(res.data);
    setBusy(false);
  };

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: colors.cardAlt }]}
      onPress={toggle}
      disabled={busy}
      accessibilityLabel={liked ? 'Bỏ tim' : 'Thả tim'}
      accessibilityState={{ selected: liked }}
    >
      <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.hot : colors.text} />
      <Text style={[styles.count, { color: colors.textSecondary }]} testID="like-count">
        {compactCount(data?.likeCount ?? 0)}
      </Text>
    </TouchableOpacity>
  );
}
