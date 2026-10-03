import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';

interface ExploreModalProps {
  visible: boolean;
  onClose: () => void;
}

const EXPLORE_CATEGORIES = [
  { id: 'chu-de', name: 'Chủ đề', icon: 'grid', color: '#EF4444', route: '/(tabs)/explore' },
  { id: 'phim-bo', name: 'Phim Bộ', icon: 'tv', color: '#3B82F6', route: '/(tabs)/explore' },
  { id: 'phim-le', name: 'Phim Lẻ', icon: 'film', color: '#10B981', route: '/(tabs)/explore' },
  { id: 'phim-han', name: 'Phim Hàn', icon: 'globe', color: '#8B5CF6', route: '/(tabs)/explore' },
  { id: 'phim-trung', name: 'Phim Trung', icon: 'globe', color: '#EC4899', route: '/(tabs)/explore' },
  { id: 'hoat-hinh', name: 'Hoạt Hình', icon: 'play-circle', color: '#F59E0B', route: '/(tabs)/explore' },
  { id: 'dien-vien', name: 'Diễn viên', icon: 'star', color: '#6366F1', route: '/(tabs)/explore' },
  { id: 'lich-su', name: 'Lịch sử', icon: 'time', color: '#14B8A6', route: '/(tabs)/explore' },
  { id: 'thu-vien', name: 'Thư viện', icon: 'book', color: '#D946EF', route: '/(tabs)/explore' },
  { id: 'xem-chung', name: 'Xem chung', icon: 'people', color: '#F97316', route: '/(tabs)/explore' },
];

export const ExploreModal: React.FC<ExploreModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handleCategoryPress = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#121622' : '#1E293B',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Khám Phá</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Grid Categories */}
          <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
            {EXPLORE_CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.75)',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)',
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(item.route)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}25` }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.categoryName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.footerText}>Kéo xuống để đóng</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 16,
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
  },
});
