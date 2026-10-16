import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { PageTitle } from '../../src/components/common/PageTitle';
import { FilmRow } from '../../src/components/explore/FilmRow';
import { fonts, textStyle, useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { movieService } from '../../src/services';
import { groupReleases, recentDays, releaseTime, type Release } from '../../src/lib/releaseDays';

/** Films whose episodes are read for the week; the catalog is small, this keeps the calls bounded. */
const MAX_FILMS = 30;

/** What came out each day of the past week, from when each episode was published. */
export default function ScheduleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const movies = useAppStore((s) => s.movies);
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(0);
  const [today, setToday] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setToday(new Date());
      setFailed(false);
      const films = movies.slice(0, MAX_FILMS);
      void Promise.all(films.map((movie) => movieService.getEpisodes(movie.id).then((res) => ({ movie, res })))).then((all) => {
        if (!active) return;
        setFailed(films.length > 0 && all.every(({ res }) => !res.success));
        setReleases(all.flatMap(({ movie, res }) => res.data.map((episode) => ({ movie, episode }))));
      });
      return () => {
        active = false;
      };
    }, [movies]),
  );

  const days = useMemo(() => recentDays(today), [today]);
  const groups = useMemo(() => groupReleases(releases ?? [], today), [releases, today]);
  const day = days[selected];
  const list = groups.get(day.key) ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PageTitle title="Lịch chiếu" note="Các tập lên sóng trong 7 ngày qua." />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days} style={styles.daysScroll}>
        {days.map((d, i) => {
          const on = i === selected;
          const count = groups.get(d.key)?.length ?? 0;
          return (
            <TouchableOpacity
              key={d.key}
              onPress={() => setSelected(i)}
              style={[styles.day, { backgroundColor: on ? colors.ruby : colors.card }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${d.label} ${d.date}, ${count} tập`}
            >
              <Text style={[styles.dayLabel, { color: on ? '#FFFFFF' : colors.text }]}>{d.label}</Text>
              <Text style={[styles.dayDate, { color: on ? 'rgba(255,255,255,0.85)' : colors.textMuted }]}>{d.date}</Text>
              {count > 0 && !on ? <View style={[styles.dot, { backgroundColor: colors.ruby }]} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {releases === null ? (
          <ActivityIndicator color={colors.ruby} style={styles.loading} />
        ) : failed ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Không tải được danh sách tập. Mở lại tab này để thử lại.</Text>
        ) : list.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            {selected === 0 ? 'Hôm nay chưa có tập mới.' : `${day.label} ${day.date} không có tập mới.`}
          </Text>
        ) : (
          list.map(({ movie, episode }) => (
            <FilmRow
              key={episode.id}
              movie={movie}
              onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id } })}
              detail={
                <View style={styles.release}>
                  <Text style={[styles.episode, { color: colors.text }]}>Tập {episode.episodeNumber}</Text>
                  <Text style={[styles.time, { color: colors.textMuted }]}>
                    lên lúc {releaseTime(episode.publishedAt as string)}
                  </Text>
                </View>
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  daysScroll: { flexGrow: 0 },
  days: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  day: { width: 72, paddingVertical: 10, borderRadius: 12, alignItems: 'center', gap: 2 },
  dayLabel: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22 },
  dayDate: { ...textStyle.caption },
  dot: { position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: 3 },
  // Room for the floating tab bar.
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
  loading: { marginTop: 40 },
  release: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  episode: { ...textStyle.bodyStrong },
  time: { ...textStyle.label },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
});
