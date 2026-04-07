import { View, StyleSheet, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { COLORS } from '../../constants/colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: any;
  riskColor?: string;
  onPress?: () => void;
}

export function Card({ children, style, riskColor, onPress, ...props }: CardProps) {
  const inner = (
    <View style={[styles.card, riskColor && { borderLeftColor: riskColor, borderLeftWidth: 4 }, style]} {...props}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
});
