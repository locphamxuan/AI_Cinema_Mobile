import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { genreCategories } from '../../mocks/mockData';

interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Tất cả': 'grid-outline',
  'Thịnh hành': 'trending-up-outline',
  'Khoa học Viễn tưởng': 'planet-outline',
  'Cyberpunk 2049': 'flash-outline',
  'Hành động Kịch tính': 'film-outline',
  'Trí tuệ Nhân tạo': 'hardware-chip-outline',
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
          const itemColor = isSelected ? '#FFFFFF' : colors.textSecondary;

          return (
            <TouchableOpacity
              key={category}
              activeOpacity={0.8}
              onPress={() => onSelectCategory(category)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected
                    ? colors.ruby
                    : isDark
                    ? '#1E293B'
                    : '#F1F5F9',
                  borderColor: isSelected
                    ? colors.ruby
                    : isDark
                    ? '#334155'
                    : '#E2E8F0',
                },
              ]}
            >
              {iconName && (
                <Ionicons
                  name={iconName}
                  size={14}
                  color={itemColor}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.pillText,
                  {
                    color: itemColor,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {category}
              </Text>
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
  icon: {
    marginRight: 0,
  },
  pillText: {
    fontSize: 12.5,
  },
});
