import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useProductionStore } from '../../store/useProductionStore';
import { useTheme } from '../../theme';

export const MakerCheckerHeader: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { activeRole, setActiveRole, getProject } = useProductionStore();
  const project = getProject();

  const isReviewer = activeRole === 'reviewer';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Role Switcher Tabs */}
      <View style={styles.roleTabs}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveRole('creator')}
          style={[
            styles.tabBtn,
            {
              backgroundColor: !isReviewer ? colors.ruby : isDark ? '#1E293B' : '#F1F5F9',
            },
          ]}
        >
          <MaterialIcons
            name="movie-creation"
            size={16}
            color={!isReviewer ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: !isReviewer ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Đạo diễn AI (Creator)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveRole('reviewer')}
          style={[
            styles.tabBtn,
            {
              backgroundColor: isReviewer ? '#8B5CF6' : isDark ? '#1E293B' : '#F1F5F9',
            },
          ]}
        >
          <MaterialIcons
            name="verified-user"
            size={16}
            color={isReviewer ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: isReviewer ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Thẩm định viên (Reviewer)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Project & Quota Overview */}
      {project && (
        <View style={styles.projectInfo}>
          <View style={styles.projectHeader}>
            <Text style={[styles.projectTitle, { color: colors.text }]} numberOfLines={1}>
              {project.title}
            </Text>
            <View style={styles.quotaPill}>
              <FontAwesome5 name="bolt" size={12} color="#F59E0B" />
              <Text style={styles.quotaText}>
                {project.consumedTokens} / {project.allocatedTokens} Tokens
              </Text>
            </View>
          </View>

          {/* Quota progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(
                    100,
                    project.allocatedTokens > 0
                      ? (project.consumedTokens / project.allocatedTokens) * 100
                      : 0
                  )}%`,
                  backgroundColor: isReviewer ? '#8B5CF6' : colors.ruby,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 10,
    gap: 12,
  },
  roleTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  projectInfo: {
    gap: 6,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  quotaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
