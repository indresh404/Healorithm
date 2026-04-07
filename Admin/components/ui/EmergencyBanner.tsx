import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';

interface EmergencyBannerProps {
  count: number;
  onPress: () => void;
}

export function EmergencyBanner({ count, onPress }: EmergencyBannerProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: `rgba(255, 59, 48, ${opacity.value})`,
      borderWidth: 2,
    };
  });

  if (count === 0) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <Text style={styles.text}>🚨 {count} patients need immediate attention</Text>
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>View</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF3B3010',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  text: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.DANGER_RED,
    fontSize: 13,
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.DANGER_RED,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
});
