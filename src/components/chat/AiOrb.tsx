import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AiOrbProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  xs: { outer: 22, inner: 18, eyeW: 2, eyeH: 4, gap: 4 },
  sm: { outer: 34, inner: 28, eyeW: 3, eyeH: 6, gap: 5 },
  md: { outer: 48, inner: 40, eyeW: 4, eyeH: 8, gap: 7 },
  lg: { outer: 88, inner: 70, eyeW: 6, eyeH: 12, gap: 12 },
} as const;

/** Glowing gradient AI Smart Assistant orb inspired by modern AI companion UI. */
export const AiOrb: React.FC<AiOrbProps> = ({ size = 'sm' }) => {
  const dim = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.halo,
        {
          width: dim.outer,
          height: dim.outer,
          borderRadius: dim.outer / 2,
        },
      ]}
    >
      <LinearGradient
        colors={['#8B5CF6', '#EC4899', '#F59E0B']}
        start={{ x: 0.15, y: 0.1 }}
        end={{ x: 0.9, y: 0.95 }}
        style={[
          styles.core,
          {
            width: dim.inner,
            height: dim.inner,
            borderRadius: dim.inner / 2,
          },
        ]}
      >
        <View style={[styles.eyesRow, { gap: dim.gap }]}>
          <View
            style={[
              styles.eye,
              { width: dim.eyeW, height: dim.eyeH, borderRadius: dim.eyeW },
            ]}
          />
          <View
            style={[
              styles.eye,
              { width: dim.eyeW, height: dim.eyeH, borderRadius: dim.eyeW },
            ]}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  halo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EC4899',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  eyesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eye: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
});
