import React from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import type { RewardPrize } from '../../types/episodeAccess';
import { styles } from '../../styles/components/wallet/LuckyWheel.styles';
import { segmentAngle, segmentColorIndexes, segmentLabel } from './luckyWheelMath';

const RIM = 14;
const BULBS = 16;
/** Turns the Animated degrees into a rotate transform; spins stay well under this range. */
const MAX_DEG = 7200;

interface Props {
  prizes: RewardPrize[];
  /** Clockwise rotation of the disc, in degrees. */
  rotation: Animated.Value;
  size: number;
  /** Text on the centre button: "Quay", or "Xem" while a spin waits for its result. */
  hubText: string;
  /** What the centre button does or why it is locked, read by screen readers. */
  hubLabel: string;
  hubHint?: string;
  disabled: boolean;
  busy: boolean;
  onSpin: () => void;
}

/**
 * BR-09: the lucky wheel. Coloured segments (one per prize, the label written along the radius),
 * a brass rim with bulbs, a pointer at the top and the round "Quay" button in the centre. Built
 * from Views only (border triangles clipped by the round disc), so no native SVG module is needed.
 */
export function LuckyWheel({ prizes, rotation, size, hubText, hubLabel, hubHint, disabled, busy, onSpin }: Props) {
  const { colors } = useTheme();
  const disc = size - RIM * 2;
  const r = disc / 2;
  const count = prizes.length;
  const seg = segmentAngle(count);
  const palette = [
    { bg: colors.ruby, fg: colors.white },
    { bg: colors.coin, fg: colors.vipText },
    { bg: colors.rubyDark, fg: colors.white },
    { bg: colors.neon, fg: colors.white },
  ];
  const colorOf = segmentColorIndexes(count, palette.length);
  // Label box: along the radius, from just inside the rim to before the hub.
  const labelLength = r * 0.58;
  const arcAtMiddle = (r * 0.62 * seg * Math.PI) / 180;
  const labelHeight = Math.max(12, Math.min(28, arcAtMiddle * 0.6));
  const fontSize = Math.max(9, Math.min(14, labelHeight * 0.62));
  const hub = Math.max(64, disc * 0.27);
  const rotate = rotation.interpolate({ inputRange: [-MAX_DEG, MAX_DEG], outputRange: [`-${MAX_DEG}deg`, `${MAX_DEG}deg`] });
  const summary = prizes.map((p) => segmentLabel(p)).join(', ');

  return (
    <View style={[styles.root, { width: size, height: size + 6 }]}>
      <View style={[styles.pointer, { left: size / 2 - 15 }]} pointerEvents="none">
        <View style={[styles.pointerOuter, { borderTopColor: colors.vipGradient[2] }]} />
        <View style={[styles.pointerInner, { borderTopColor: colors.white }]} />
      </View>

      <LinearGradient
        colors={colors.vipGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.rim, { width: size, height: size, borderRadius: size / 2 }]}
      >
        {Array.from({ length: BULBS }, (_, i) => {
          const a = (i * 2 * Math.PI) / BULBS;
          const c = size / 2;
          const d = size / 2 - RIM / 2;
          return (
            <View
              key={i}
              style={[
                styles.bulb,
                { left: c + d * Math.sin(a) - 4, top: c - d * Math.cos(a) - 4, backgroundColor: i % 2 ? colors.white : colors.vipText },
              ]}
            />
          );
        })}

        <Animated.View
          accessible
          accessibilityRole="image"
          accessibilityLabel={count ? `Vòng quay có ${count} giải: ${summary}` : 'Vòng quay chưa có giải'}
          style={[styles.disc, { width: disc, height: disc, borderRadius: r, backgroundColor: colors.card, transform: [{ rotate }] }]}
        >
          {prizes.map((prize, i) => {
            const color = palette[colorOf[i]];
            return (
              <View key={prize.id} style={[styles.fill, { width: disc, height: disc, transform: [{ rotate: `${i * seg}deg` }] }]}>
                <Segment count={count} r={r} seg={seg} color={color.bg} />
                <View
                  style={[
                    styles.label,
                    {
                      width: labelLength,
                      height: labelHeight,
                      left: r - labelLength / 2,
                      top: 10 + labelLength / 2 - labelHeight / 2,
                      transform: [{ rotate: '90deg' }],
                    },
                  ]}
                >
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.labelText, { color: color.fg, fontSize }]}>
                    {segmentLabel(prize)}
                  </Text>
                </View>
              </View>
            );
          })}
          {count > 1 &&
            prizes.map((prize, i) => (
              <View
                key={`line-${prize.id}`}
                style={[styles.fill, { width: disc, height: disc, transform: [{ rotate: `${(i + 0.5) * seg}deg` }] }]}
              >
                <View style={[styles.divider, { left: r - 0.75, top: 0, height: r, backgroundColor: colors.vipGradient[0] }]} />
              </View>
            ))}
        </Animated.View>

        <Pressable
          onPress={onSpin}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={hubLabel}
          accessibilityHint={hubHint}
          accessibilityState={{ disabled, busy }}
          style={[styles.hub, { width: hub, height: hub, borderRadius: hub / 2, borderWidth: 4, borderColor: colors.vipGradient[1], opacity: disabled && !busy ? 0.6 : 1 }]}
        >
          <LinearGradient colors={colors.accentGradient} style={[styles.hubFace, { borderRadius: hub / 2 }]}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.hubText, { color: colors.white }]}>{hubText}</Text>}
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

/** One segment centred on the top: the whole disc, a half, or a triangle the round disc clips. */
function Segment({ count, r, seg, color }: { count: number; r: number; seg: number; color: string }) {
  if (count === 1) return <View style={[styles.fill, { width: r * 2, height: r * 2, backgroundColor: color }]} />;
  if (count === 2) return <View style={[styles.fill, { width: r * 2, height: r, backgroundColor: color }]} />;
  const height = r + 2;
  // A hair wider than the segment so neighbours overlap instead of showing a seam.
  const half = height * Math.tan(((seg / 2 + 0.6) * Math.PI) / 180);
  return (
    <View
      style={[
        styles.wedge,
        { left: r - half, top: r - height, borderLeftWidth: half, borderRightWidth: half, borderTopWidth: height, borderTopColor: color },
      ]}
    />
  );
}
