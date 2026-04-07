import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { useEffect } from 'react';
import { COLORS } from '../../constants/colors';

const { width, height } = Dimensions.get('window');
const CUTOUT_SIZE = 260;

export function QROverlay({ isScanning = true }: { isScanning?: boolean }) {
  const lineY = useSharedValue(0);
  const successScale = useSharedValue(0);

  useEffect(() => {
    if (isScanning) {
      lineY.value = withRepeat(
        withTiming(CUTOUT_SIZE - 4, { duration: 2000, easing: Easing.linear }),
        -1,
        true
      );
    } else {
      successScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 100 })
      );
    }
  }, [isScanning]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lineY.value }],
    opacity: isScanning ? 1 : 0,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Dark overlay around cutout */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayMiddleRow}>
        <View style={styles.overlaySide} />
        
        {/* Cutout area */}
        <View style={styles.cutout}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          <Animated.View style={[styles.scanLine, animatedLineStyle]} />
        </View>

        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom} />
    </View>
  );
}

const overlayColor = 'rgba(0,0,0,0.6)';

const styles = StyleSheet.create({
  overlayTop: {
    flex: 1,
    backgroundColor: overlayColor,
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: CUTOUT_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: overlayColor,
  },
  cutout: {
    width: CUTOUT_SIZE,
    height: CUTOUT_SIZE,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: overlayColor,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.PRIMARY_GREEN,
  },
  topLeft: {
    top: 0, left: 0,
    borderTopWidth: 3, borderLeftWidth: 3,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: 3, borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: 3, borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: 3, borderRightWidth: 3,
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.PRIMARY_GREEN,
    shadowColor: COLORS.PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
});
