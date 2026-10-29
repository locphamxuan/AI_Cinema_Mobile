import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { PosterGrid } from '../src/components/home/PosterGrid';
import { Button } from '../src/components/common/Button';
import { savedMovieService } from '../src/services/savedMovieService';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme';
import type { Movie } from '../src/types/movie';
import { styles } from '../src/styles/screens/saved.styles';

/** "Danh sách của tôi": the movies the member saved to watch later, newest first. */
export default function SavedMoviesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated, openAuthModal } = useAppStore();
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await savedMovieService.list();
    if (res.success) setMovies(res.data);
    setLoading(false);
  }, []);

  // A movie unsaved on its own page drops out when the viewer comes back here.
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) void load();
    }, [isAuthenticated, load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ruby} />}
    >
      <ScreenHeader title="Phim đã lưu" />
      {!isAuthenticated ? (
        <>
          <Text style={[styles.empty, { color: colors.textMuted }]}>Đăng nhập để lưu phim và xem lại trên mọi thiết bị.</Text>
          <Button label="Đăng nhập" onPress={() => openAuthModal('login')} style={styles.action} />
        </>
      ) : loading ? (
        <ActivityIndicator color={colors.ruby} style={styles.loading} />
      ) : movies.length === 0 ? (
        <>
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Bạn chưa lưu phim nào. Bấm biểu tượng dấu trang ở trang phim để thêm vào đây.
          </Text>
          <Button label="Khám phá phim" variant="secondary" onPress={() => router.push('/(tabs)/explore')} style={styles.action} />
        </>
      ) : (
        <PosterGrid movies={movies} onMoviePress={(movie) => router.push({ pathname: '/movie/[id]', params: { id: movie.id } })} />
      )}
    </ScrollView>
  );
}
