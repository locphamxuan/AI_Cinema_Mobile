import { useState } from 'react';
import { Platform, useWindowDimensions, type GestureResponderEvent } from 'react-native';

/**
 * On the web the chat is a floating panel the viewer can drag by its header, kept inside the window
 * (`width` x `height` is the panel size). Native platforms get no handlers and no offset.
 */
export function useWebDrag(width: number, height: number) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState<{ pageX: number; pageY: number; startX: number; startY: number } | null>(null);
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const web = Platform.OS === 'web';

  const handlers = {
    onMoveShouldSetResponder: () => web,
    onResponderGrant: (e: GestureResponderEvent) =>
      setStart({ pageX: e.nativeEvent.pageX, pageY: e.nativeEvent.pageY, startX: offset.x, startY: offset.y }),
    onResponderMove: (e: GestureResponderEvent) => {
      if (!start) return;
      const maxLeft = Math.max(0, winWidth - width);
      const maxUp = Math.max(0, winHeight - height);
      setOffset({
        x: Math.min(20, Math.max(-maxLeft, start.startX + e.nativeEvent.pageX - start.pageX)),
        y: Math.min(20, Math.max(-maxUp, start.startY + e.nativeEvent.pageY - start.pageY)),
      });
    },
    onResponderRelease: () => setStart(null),
    onResponderTerminate: () => setStart(null),
  };

  return { handlers, style: web ? { transform: [{ translateX: offset.x }, { translateY: offset.y }] } : null };
}
