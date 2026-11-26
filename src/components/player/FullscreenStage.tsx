import React from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '../../store/playerStore';
import { styles } from '../../styles/components/player/EpisodePlayer.styles';

interface FullscreenStageProps {
  fullscreen: boolean;
  onExit: () => void;
  children: React.ReactNode;
}

/**
 * The player's box for both players. Native fullscreen grows this same box over the whole screen instead of moving
 * the video into a Modal: moving a VideoView to another window while the phone rotates re-creates the native video
 * surface and could close the app, and a settings sheet opened above a Modal does not show on iOS. The box is padded
 * by the safe area so the notch and the home indicator never cover the controls or the AI label; Android back leaves
 * fullscreen first. On the web the browser enlarges the stage itself.
 */
export function FullscreenStage({ fullscreen, onExit, children }: FullscreenStageProps) {
  const insets = useSafeAreaInsets();
  const native = fullscreen && Platform.OS !== 'web';
  const setPlayerFullscreen = usePlayerStore((s) => s.setFullscreen);
  // The players pass a new `onExit` on every render (their clock ticks 4 times a second): read the latest one.
  const exit = React.useRef(onExit);
  React.useEffect(() => {
    exit.current = onExit;
  });

  React.useEffect(() => {
    if (!native) return;
    setPlayerFullscreen(true);
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      exit.current();
      return true;
    });
    return () => {
      back.remove();
      setPlayerFullscreen(false);
    };
  }, [native, setPlayerFullscreen]);

  // One tree shape in both modes: only the outer box's style changes, so React never remounts the VideoView.
  return (
    <View
      style={
        native
          ? [
              styles.fullscreen,
              { paddingLeft: insets.left, paddingRight: insets.right, paddingTop: insets.top, paddingBottom: insets.bottom },
            ]
          : styles.container
      }
      testID={native ? 'player-fullscreen' : 'player-inline'}
    >
      {native ? <StatusBar hidden /> : null}
      <View style={styles.fullscreenStage}>{children}</View>
    </View>
  );
}
