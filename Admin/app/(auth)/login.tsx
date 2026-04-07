import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { COLORS } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const router = useRouter();
  const login = useAppStore(state => state.login);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  
  const [passwordStats, setPasswordStats] = useState(true);

  const shakeOffset = useSharedValue(0);

  const handleLogin = () => {
    if (username === 'worker1' && password === '1234') {
      setLoading(true);
      setErrorVisible(false);
      setTimeout(() => {
        setLoading(false);
        login({ id: 'w1', name: 'Priya', username: 'worker1', zone: 'Zone B', phone: '9876543210', since: '2023' });
        router.replace('/(tabs)/dashboard');
      }, 1500);
    } else {
      setErrorVisible(true);
      // Shake animation
      shakeOffset.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }]
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.PRIMARY_GREEN, COLORS.GREEN_DARK]} style={styles.gradientHeader}>
        <View style={styles.logoCircle}>
          <Text style={{ fontSize: 32 }}>🏥</Text>
        </View>
        <Text style={styles.appName}>HealthWorker</Text>
        <Text style={styles.tagline}>Rural Healthcare Companion</Text>
      </LinearGradient>

      <Animated.View style={[styles.card, shakeStyle]}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your worker account</Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color={COLORS.TEXT_SECONDARY} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.TEXT_SECONDARY} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={passwordStats}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setPasswordStats(!passwordStats)}>
            <Ionicons name={passwordStats ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {errorVisible && <Text style={styles.errorText}>Invalid credentials</Text>}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={styles.buttonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.demoText}>Demo credentials: worker1 / 1234</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.OFF_WHITE },
  gradientHeader: {
    height: height * 0.4,
    alignItems: 'center',
    paddingTop: height * 0.1,
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  appName: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.WHITE },
  tagline: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 32,
    marginHorizontal: 24,
    padding: 24,
    shadowColor: COLORS.CARD_SHADOW, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 20, elevation: 10,
    marginTop: -80,
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.TEXT_SECONDARY, marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.BORDER, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 14,
    marginBottom: 16,
  },
  input: { flex: 1, marginLeft: 10, fontFamily: 'Poppins_500Medium', color: COLORS.TEXT_PRIMARY },
  button: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontFamily: 'Poppins_700Bold', color: COLORS.WHITE, fontSize: 16 },
  demoText: { fontFamily: 'Poppins_300Light', fontSize: 12, color: COLORS.TEXT_SECONDARY, textAlign: 'center', marginTop: 16 },
  errorText: { color: COLORS.DANGER_RED, fontFamily: 'Poppins_500Medium', fontSize: 12, marginBottom: 12, textAlign: 'center' },
});
