import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PageTitle } from '../../src/components/common/PageTitle';
import { GenreTile } from '../../src/components/explore/GenreTile';
import { FilmRow } from '../../src/components/explore/FilmRow';
import { fonts, textStyle, useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { filterByGenre, genreShelves } from '../../src/lib/homeFeed';

const SIDE = 16;
const GAP = 10;

/** Browse by genre: a tile per genre made from its own posters, then the films of the one opened. */
export default function ExploreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { movies, loadInitialData } = useAppStore();
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (movies.length === 0) void loadInitialData();
  }, [movies.length, loadInitialData]);

  // Android back closes the open genre before leaving the tab.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(null);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const shelves = useMemo(() => genreShelves(movies), [movies]);
  const films = useMemo(() => (open ? filterByGenre(movies, open) : []), [movies, open]);
  const tileWidth = Math.floor((Math.min(width, 600) - SIDE * 2 - GAP) / 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PageTitle title="Khám phá" note={open ? undefined : 'Chọn một thể loại để xem các phim trong đó.'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {open ? (
          <>
            <TouchableOpacity style={styles.crumb} onPress={() => setOpen(null)} accessibilityLabel="Về danh sách thể loại">
              <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
              <Text style={[styles.crumbText, { color: colors.textSecondary }]}>Thể loại</Text>
            </TouchableOpacity>
            <View style={styles.genreHead}>
              <Text style={[styles.genreName, { color: colors.text }]}>{open}</Text>
              <Text style={[styles.genreCount, { color: colors.textMuted }]}>{films.length} phim</Text>
            </View>
            <View style={styles.list}>
              {films.map((movie) => (
                <FilmRow key={movie.id} movie={movie} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id } })} />
              ))}
            </View>
          </>
        ) : shelves.length > 0 ? (
          <View style={styles.tiles}>
            {shelves.map((shelf) => (
              <GenreTile key={shelf.name} shelf={shelf} width={tileWidth} onPress={() => setOpen(shelf.name)} />
            ))}
          </View>
        ) : (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Chưa có phim nào được gắn thể loại. Quay lại sau khi có phim mới.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Room for the floating tab bar.
  scroll: { paddingBottom: 120, maxWidth: 600, width: '100%', alignSelf: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: SIDE },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  crumbText: { ...textStyle.label },
  genreHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: SIDE, marginTop: 4, marginBottom: 16 },
  genreName: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34 },
  genreCount: { ...textStyle.label },
  list: { paddingHorizontal: SIDE, gap: 20 },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 48, paddingHorizontal: 32 },
});
