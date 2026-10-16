import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import type { GenreShelf } from '../../lib/homeFeed';
import { styles } from '../../styles/components/explore/GenreTile.styles';

interface GenreTileProps {
  shelf: GenreShelf;
  width: number;
  onPress: () => void;
}

/** A genre shown through one of its own posters, its name set large over the bottom of it. */
export const GenreTile: React.FC<GenreTileProps> = ({ shelf, width, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.tile, { width, height: Math.round(width * 0.82), backgroundColor: colors.cardAlt }]}
      accessibilityLabel={`${shelf.name}, ${shelf.count} phim`}
    >
      {shelf.cover ? <Image source={{ uri: shelf.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      <LinearGradient colors={['transparent', 'rgba(20, 12, 17, 0.92)']} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={2}>
          {shelf.name}
        </Text>
        <Text style={styles.count}>{shelf.count} phim</Text>
      </View>
    </TouchableOpacity>
  );
};
