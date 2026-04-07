import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface StatBoxProps {
  value: string | number;
  label: string;
  color?: string;
}

export function StatBox({ value, label, color = COLORS.PRIMARY_GREEN }: StatBoxProps) {
  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: COLORS.GREEN_GLOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    margin: 6,
  },
  value: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
});
