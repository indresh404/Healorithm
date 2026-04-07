import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentWorker, logout, patients, alerts, syncQueue } = useAppStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}>
        <LinearGradient 
          colors={[COLORS.PRIMARY_GREEN, COLORS.GREEN_DARK]} 
          style={[styles.header, { paddingTop: insets.top + 40 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{currentWorker?.name?.[0] || 'W'}</Text>
          </View>
          <Text style={styles.workerName}>{currentWorker?.name || 'Worker Name'}</Text>
          <Text style={styles.workerId}>ID: HW-2023-0102 · {currentWorker?.zone || 'Zone B'}</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>🟢 Active Worker</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{patients.length}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>42</Text>
            <Text style={styles.statLabel}>Visits</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Settings</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="person-outline" size={20} color={COLORS.PRIMARY_GREEN} />
              <Text style={styles.menuText}>Personal Information</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.BORDER} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="sync-outline" size={20} color={COLORS.PRIMARY_GREEN} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuText}>Sync Status</Text>
                <Text style={styles.menuSubtext}>{syncQueue.length} items pending</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.BORDER} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.PRIMARY_GREEN} />
              <Text style={styles.menuText}>Security & PIN</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.BORDER} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={20} color={COLORS.PRIMARY_GREEN} />
              <Text style={styles.menuText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.BORDER} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.DANGER_RED} />
              <Text style={[styles.menuText, { color: COLORS.DANGER_RED }]}>Logout</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <Text style={styles.version}>App Version 1.0.4 (Stable)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.OFF_WHITE,
  },
  scrollContent: {
    // Dynamic padding added in component
  },
  header: {
    alignItems: 'center',
    paddingBottom: 50,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 8,
    shadowColor: COLORS.PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    color: COLORS.PRIMARY_GREEN,
  },
  workerName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: COLORS.WHITE,
  },
  workerId: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeText: {
    color: COLORS.WHITE,
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: -30,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  statVal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  menuText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 14,
  },
  menuSubtext: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 20,
  },
  version: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.6,
  },
});
