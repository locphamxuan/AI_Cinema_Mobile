import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { savedMovieService } from '../../services/savedMovieService';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/movie/SaveButton.styles';

/** Bookmark that keeps the movie in "Danh sách của tôi" on the BE; a Guest is asked to sign in first. */
export function SaveButton({ movieId }: { movieId: string }) {
  const { colors } = useTheme();
  const { isAuthenticated, openAuthModal } = useAppStore();
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setSaved(false);
    if (!isAuthenticated) return;
    let active = true;
    void savedMovieService.isSaved(movieId).then((res) => active && res.success && setSaved(res.data.saved));
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
    if (res.success) setSaved(res.data.saved);
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
