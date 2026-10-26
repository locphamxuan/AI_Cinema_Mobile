import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/common/PageTitle.styles';

interface PageTitleProps {
  title: string;
  /** One plain line under the title, only when the title alone is not clear. */
  note?: string;
  right?: React.ReactNode;
}

/** Top of a tab screen: the title in the display face, left-aligned under the status bar. */
export const PageTitle: React.FC<PageTitleProps> = ({ title, note, right }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 10) + 8 }]}>
      <View style={styles.row}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {title}
        </Text>
        {right}
      </View>
      {note ? <Text style={[styles.note, { color: colors.textMuted }]}>{note}</Text> : null}
    </View>
  );
};
