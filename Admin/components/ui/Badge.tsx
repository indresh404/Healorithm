import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface BadgeProps {
  label: string;
  type: 'HIGH' | 'MEDIUM' | 'LOW' | 'DEFAULT';
}

export function Badge({ label, type }: BadgeProps) {
  let bgColor, textColor;
  switch (type) {
    case 'HIGH':
      bgColor = '#FF3B3015';
      textColor = COLORS.DANGER_RED;
      break;
    case 'MEDIUM':
      bgColor = '#FF950015';
      textColor = COLORS.WARNING_YELLOW;
      break;
    case 'LOW':
      bgColor = '#3DD93B15';
      textColor = COLORS.SUCCESS_GREEN;
      break;
    default:
      bgColor = COLORS.BORDER;
      textColor = COLORS.TEXT_SECONDARY;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
});
