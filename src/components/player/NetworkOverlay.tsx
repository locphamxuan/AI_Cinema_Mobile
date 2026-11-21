import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/components/player/NetworkOverlay.styles';
import type { PlayerHealth } from '../../hooks/usePlayerHealth';

/** What a weak network does to the picture: loading, a lost stream with "Thử lại", or the fallback to auto. */
export function NetworkOverlay({ health }: { health: PlayerHealth }) {
  if (health.failed) {
    return (
      <View style={styles.center} testID="network-failed">
        <Text style={styles.text}>Mạng yếu hoặc mất kết nối, không tải được phim.</Text>
        <TouchableOpacity style={styles.button} onPress={health.retry} accessibilityRole="button">
          <Text style={styles.buttonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <>
      {health.buffering ? (
        <View style={styles.center} pointerEvents="none" testID="network-buffering">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : null}
      {health.downgraded ? (
        <View style={styles.notice} pointerEvents="none">
          <Text style={styles.noticeText}>Mạng yếu: đã chuyển chất lượng về Tự động.</Text>
        </View>
      ) : null}
    </>
  );
}
