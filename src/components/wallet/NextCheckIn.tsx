import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { formatCountdown, msUntilVnMidnight } from '../../lib/date';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/wallet/CheckInModal.styles';

/** After today's check-in: how long until it opens again at 00:00 Vietnam time, ticking every second. */
export function NextCheckIn() {
  const { colors } = useTheme();
  const [left, setLeft] = useState(() => msUntilVnMidnight());
  useEffect(() => {
    const timer = setInterval(() => setLeft(msUntilVnMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Text style={[styles.countdown, { color: colors.textSecondary }]} accessibilityLiveRegion="polite">
      Điểm danh lại sau {formatCountdown(left)}
    </Text>
  );
}
