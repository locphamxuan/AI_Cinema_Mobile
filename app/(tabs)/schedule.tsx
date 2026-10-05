import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../src/components/common/Header';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';

const DAYS_OF_WEEK = [
  { day: 'T2', date: '21/09', label: 'Thứ Hai' },
  { day: 'T3', date: '22/09', label: 'Thứ Ba' },
  { day: 'T4', date: '23/09', label: 'Thứ Tư' },
  { day: 'T5', date: '24/09', label: 'Thứ Năm' },
  { day: 'T6', date: '25/09', label: 'Thứ Sáu' },
  { day: 'T7', date: '26/09', label: 'Thứ Bảy' },
  { day: 'CN', date: '27/09', label: 'Chủ Nhật' },
];

export default function ScheduleScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { movies } = useAppStore();
  const [selectedDay, setSelectedDay] = useState(2); // Default Wednesday

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title & Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.titleRow}>
            <Ionicons name="calendar" size={20} color="#10B981" />
            <Text style={[styles.title, { color: colors.text }]}>Lịch Chiếu Phim AI</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Lịch phát sóng các tập phim mới nhất trong tuần
          </Text>
        </View>

        {/* Days Horizontal Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScroll}
        >
          {DAYS_OF_WEEK.map((item, idx) => {
            const isSelected = idx === selectedDay;
            return (
              <TouchableOpacity
                key={item.day}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: isSelected
                      ? '#10B981'
                      : isDark
                      ? '#1E293B'
                      : '#F1F5F9',
                    borderColor: isSelected ? '#10B981' : colors.border,
                  },
                ]}
                onPress={() => setSelectedDay(idx)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {item.day}
                </Text>
                <Text style={[styles.dateText, { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Schedule List for Selected Day */}
        <View style={styles.scheduleList}>
          {movies.slice(0, 4).map((movie, index) => (
            <TouchableOpacity
              key={`${movie.id}-${index}`}
              style={[
                styles.scheduleItem,
                {
                  backgroundColor: isDark ? '#181B26' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/watch/[id]', params: { id: movie.id } })}
            >
              <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
              <View style={styles.info}>
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={12} color="#10B981" />
                  <Text style={styles.timeText}>20:00 · Tập {index + 5}</Text>
                </View>
                <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={1}>
                  {movie.title}
                </Text>
                <Text style={[styles.movieDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {movie.description}
                </Text>
                <View style={styles.reminderRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Độc quyền AI</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
  },
  daysScroll: {
    gap: 10,
    marginBottom: 20,
    paddingBottom: 4,
  },
  dayCard: {
    width: 60,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 2,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '900',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scheduleList: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  poster: {
    width: 75,
    height: 100,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  timeText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '700',
  },
  movieTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  movieDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '700',
  },
});
