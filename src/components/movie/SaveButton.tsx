import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { savedMovieService } from '../../services/savedMovieService';
import { useSessionStore, useUiStore } from '../../store';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/movie/SaveButton.styles';

/** Bookmark that keeps the movie in "Danh sách của tôi" on the BE; a Guest is asked to sign in first. */
export function SaveButton({ movieId }: { movieId: string }) {
  const { colors } = useTheme();
  const { isAuthenticated } = useSessionStore();
  const { openAuthModal } = useUiStore();
  // Tagged with its movie: a new movie reads as not saved until the BE answers for it.
  const [status, setStatus] = React.useState<{ movieId: string; saved: boolean } | null>(null);
  const saved = isAuthenticated && status?.movieId === movieId && status.saved;
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void savedMovieService.isSaved(movieId).then((res) => {
      if (active && res.success) setStatus({ movieId, saved: res.data.saved });
    });
    return () => {
      active = false;
    };
  }, [movieId, isAuthenticated]);

  const toggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setBusy(true);
    const res = saved ? await savedMovieService.unsave(movieId) : await savedMovieService.save(movieId);
    if (res.success) setStatus({ movieId, saved: res.data.saved });
    setBusy(false);
  };

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: colors.cardAlt }]}
      onPress={toggle}
      disabled={busy}
      accessibilityLabel={saved ? 'Bỏ lưu phim' : 'Lưu phim'}
      accessibilityState={{ selected: saved }}
    >
      <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? colors.ruby : colors.text} />
    </TouchableOpacity>
  );
}
