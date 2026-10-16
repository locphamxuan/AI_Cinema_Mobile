import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type GestureResponderEvent } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { barRatio } from '../../lib/seek';
import { clock } from '../../lib/vtt';
import { styles } from '../../styles/components/player/PlayerControls.styles';


export const SEEK_SECONDS = 10;

interface PlayerControlsProps {
  currentTime: number;
  duration: number;
  playing: boolean;
  fullscreen: boolean;
  rate: number;
  onTogglePlay: () => void;
  onSeekBy: (seconds: number) => void;
  onSeekTo: (seconds: number) => void;
  onSettings: () => void;
  onToggleFullscreen: () => void;
}

/** YouTube-like controls: back / forward 10 s around play, a seek bar, settings and fullscreen. */
export function PlayerControls(props: PlayerControlsProps) {
  const { currentTime, duration, playing, fullscreen, rate, onTogglePlay, onSeekBy, onSeekTo, onSettings, onToggleFullscreen } = props;
  const bar = React.useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const [barWidth, setBarWidth] = React.useState(0);
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const seekOnBar = (e: GestureResponderEvent) => {
    if (!(duration > 0)) return;
    const { locationX, pageX } = e.nativeEvent;
    const ratio = barRatio(locationX, barWidth);
    if (ratio !== null) return onSeekTo(ratio * duration);
    // react-native-web may leave locationX out of a press; measure the bar on the page instead.
    bar.current?.measureInWindow((x, _y, width) => {
      const measured = barRatio(pageX - x, width);
      if (measured !== null) onSeekTo(measured * duration);
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.center} pointerEvents="box-none">
        <TouchableOpacity style={styles.seekBtn} onPress={() => onSeekBy(-SEEK_SECONDS)} accessibilityLabel="Lùi 10 giây">
          <MaterialIcons name="replay-10" size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playBtn} onPress={onTogglePlay} accessibilityLabel={playing ? 'Tạm dừng' : 'Phát'}>
          <Ionicons name={playing ? 'pause' : 'play'} size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.seekBtn} onPress={() => onSeekBy(SEEK_SECONDS)} accessibilityLabel="Tua tới 10 giây">
          <MaterialIcons name="forward-10" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.time}>
          {clock(currentTime)} / {clock(duration)}
        </Text>
        <TouchableOpacity
          ref={bar}
          style={styles.barTouch}
          activeOpacity={1}
          onPress={seekOnBar}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          accessibilityLabel="Thanh tua"
        >
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSettings} style={styles.iconBtn} accessibilityLabel="Cài đặt">
          <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
          {rate !== 1 && <Text style={styles.rateTag}>{rate}x</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleFullscreen} style={styles.iconBtn} accessibilityLabel={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
          <Ionicons name={fullscreen ? 'contract' : 'expand'} size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}