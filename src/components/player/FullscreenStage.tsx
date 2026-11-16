import React from 'react';
import { Modal, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../../styles/components/player/EpisodePlayer.styles';

interface FullscreenStageProps {
  fullscreen: boolean;
  onExit: () => void;
  children: React.ReactNode;
}

/**
 * Native fullscreen for both players: the stage moves into a landscape Modal, padded by the safe area so the notch
 * and the home indicator never cover the controls or the AI label. On the web the browser enlarges the stage itself
 * (a Modal would recreate the <video> and lose its place).
 */
export function FullscreenStage({ fullscreen, onExit, children }: FullscreenStageProps) {
  const insets = useSafeAreaInsets();
  if (!fullscreen || Platform.OS === 'web') return <>{children}</>;
  return (
    <Modal visible animationType="fade" supportedOrientations={['landscape', 'portrait']} onRequestClose={onExit}>
      <View
        style={[
          styles.fullscreen,
          { paddingLeft: insets.left, paddingRight: insets.right, paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.fullscreenStage}>{children}</View>
      </View>
    </Modal>
  );
}
