import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { genreCategories } from '../../mocks/mockData';

interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Tất cả': 'sparkles',
  'Thịnh hành': 'flame',
  'Khoa học Viễn tưởng': 'planet-outline',
  'Cyberpunk 2049': 'hardware-chip-outline',
  'Hành động Kịch tính': 'flash-outline',
  'Trí tuệ Nhân tạo': 'code-slash-outline',
  'Tâm lý & Bí ẩn': 'eye-outline',
};

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {genreCategories.map((category) => {
          const isSelected = selectedCategory === category;
          const iconName = CATEGORY_ICONS[category];

          return (
            <TouchableOpacity
              key={category}
              activeOpacity={0.85}
              onPress={() => onSelectCategory(category)}
            >
              {isSelected ? (
                <LinearGradient
                  colors={['#E50914', '#B91C1C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.pill, styles.pillActive]}
                >
                  {iconName && (
                    <Ionicons name={iconName} size={13.5} color="#FFFFFF" />
                  )}
                  <Text style={[styles.pillText, { color: '#FFFFFF', fontWeight: '800' }]}>
                    {category}
                  </Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  {iconName && (
                    <Ionicons name={iconName} size={13.5} color={colors.textSecondary} />
                  )}
                  <Text style={[styles.pillText, { color: colors.textSecondary, fontWeight: '600' }]}>
                    {category}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  pillActive: {
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
    borderColor: '#E50914',
  },
  icon: {
    marginRight: 0,
  },
  pillText: {
    fontSize: 12,
  },
});
