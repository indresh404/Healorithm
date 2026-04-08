import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Custom button for the center Scan tab
  const CustomTabBarButton = ({ children, onPress }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(1.05, { damping: 10 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    return (
      <TouchableOpacity
        style={styles.fabContainer}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View style={[styles.fab, animatedStyle]}>
          <LinearGradient 
            colors={[COLORS.PRIMARY_GREEN, COLORS.GREEN_DARK]} 
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="qr-code" size={28} color={COLORS.WHITE} />
          </LinearGradient>
          <View style={styles.fabGlow} />
        </Animated.View>
        <Text style={styles.fabLabel}>Scan</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { 
            height: 75 + insets.bottom, 
            paddingBottom: insets.bottom + 8,
            paddingHorizontal: 16,
          }
        ],
        tabBarActiveTintColor: COLORS.PRIMARY_GREEN,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIcon}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
              {focused && <View style={styles.tabIndicator} />}
            </View>
          ),
        }}
      />

      {/* Patients Tab */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIcon}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
              {focused && <View style={styles.tabIndicator} />}
            </View>
          ),
        }}
      />

      {/* Scan Tab - Center with custom button */}
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />

      {/* Alerts Tab */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIcon}>
              <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
              {focused && <View style={styles.tabIndicator} />}
            </View>
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIcon}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
              {focused && <View style={styles.tabIndicator} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.02)',
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    paddingTop: 12,
  },
  tabBarItem: {
    paddingTop: 8,
    flex: 1,
  },
  tabBarLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    marginTop: 4,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  tabIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.PRIMARY_GREEN,
    marginTop: 6,
    shadowColor: COLORS.PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  fabContainer: {
    top: -28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 12,
    shadowColor: COLORS.PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    backgroundColor: COLORS.WHITE,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fabGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: COLORS.PRIMARY_GREEN,
    opacity: 0.1,
    zIndex: -1,
    transform: [{ scale: 1.2 }],
  },
  fabLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: COLORS.PRIMARY_GREEN,
    marginTop: 6,
    letterSpacing: 0.5,
  },
});