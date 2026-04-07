import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface Props {
  score: number; // 0 to 100
}

export function RiskIndicator({ score }: Props) {
  let color = COLORS.SUCCESS_GREEN;
  if (score > 40) color = COLORS.WARNING_YELLOW;
  if (score > 70) color = COLORS.DANGER_RED;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${score}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: COLORS.BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
