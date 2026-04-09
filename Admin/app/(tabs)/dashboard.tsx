import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { COLORS } from '../../constants/colors';
import { StatBox } from '../../components/ui/StatBox';
import { EmergencyBanner } from '../../components/ui/EmergencyBanner';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentWorker, patients, alerts, syncQueue, simulateSync, loadPatientsFromDb } = useAppStore();

  useFocusEffect(() => {
    loadPatientsFromDb().catch(() => {});
    return undefined;
  });

  const highRiskPatients = patients.filter(p => p.riskLevel === 'HIGH');
  const pendingSyncCount = syncQueue.length;

  const handleSync = async () => {
    await simulateSync();
  };

  return (
    <View style={styles.container}>
      {/* Top Sync StatusBar - Integrated better */}
      <View style={[styles.inlineSyncBar, { paddingTop: insets.top + 8, backgroundColor: pendingSyncCount > 0 ? COLORS.WARNING_YELLOW : COLORS.PRIMARY_GREEN }]}>
        <Ionicons name={pendingSyncCount > 0 ? "sync" : "checkmark-circle"} size={14} color={COLORS.WHITE} />
        <Text style={styles.syncStatusText}>
          {pendingSyncCount > 0 ? `${pendingSyncCount} pending...` : "Synced to cloud"}
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
      >
        {/* Header Section */}
        <LinearGradient 
          colors={[COLORS.PRIMARY_GREEN, COLORS.GREEN_DARK]} 
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good Morning, {currentWorker?.name?.split(' ')[0] || 'Worker'} 👋</Text>
              <Text style={styles.workerInfo}>ASHA HERO · {currentWorker?.zone || 'Sector 7'}</Text>
            </View>
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{currentWorker?.name?.[0] || 'W'}</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerActionsRow}>
            <View style={styles.headerBadge}>
              <Ionicons name="calendar" size={14} color={COLORS.WHITE} style={{ marginRight: 4 }} />
              <Text style={styles.headerBadgeText}>12 Visits Today</Text>
            </View>
            <View style={[styles.headerBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={styles.headerBadgeText}>Zone: {currentWorker?.zone || 'B'}</Text>
            </View>
          </View>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatPill}>
              <Text style={styles.quickStatLabel}>Total</Text>
              <Text style={styles.quickStatValue}>{patients.length}</Text>
            </View>
            <View style={styles.quickStatPill}>
              <Text style={styles.quickStatLabel}>High Risk</Text>
              <Text style={[styles.quickStatValue, { color: COLORS.DANGER_RED }]}>{highRiskPatients.length}</Text>
            </View>
            <View style={styles.quickStatPill}>
              <Text style={styles.quickStatLabel}>Pending</Text>
              <Text style={styles.quickStatValue}>{pendingSyncCount}</Text>
            </View>
          </View>
        </LinearGradient>

        <EmergencyBanner 
          count={highRiskPatients.length} 
          onPress={() => router.push('/(tabs)/alerts')} 
        />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatBox label="Today's Visits" value="8/12" color={COLORS.PRIMARY_GREEN} />
            <StatBox 
              label="Emergencies" 
              value={alerts.filter(a => !a.resolved).length} 
              color={alerts.length > 0 ? COLORS.DANGER_RED : COLORS.PRIMARY_GREEN} 
            />
          </View>
          <View style={styles.statsRow}>
            <TouchableOpacity onPress={handleSync} style={styles.statTouchable}>
              <StatBox 
                label="Pending Sync" 
                value={pendingSyncCount} 
                color={pendingSyncCount > 0 ? COLORS.WARNING_YELLOW : COLORS.PRIMARY_GREEN} 
              />
            </TouchableOpacity>
            <StatBox label="Adherence" value="92%" color={COLORS.SUCCESS_GREEN} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Patients</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/patients')} style={styles.viewAllBtn}>
            <Text style={styles.viewAll}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.PRIMARY_GREEN} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {patients.slice(0, 4).map((patient) => (
            <Card 
              key={patient.id} 
              style={styles.miniCard} 
              riskColor={patient.riskLevel === 'HIGH' ? COLORS.DANGER_RED : (patient.riskLevel === 'MEDIUM' ? COLORS.WARNING_YELLOW : COLORS.SUCCESS_GREEN)}
              onPress={() => router.push(`/patient/${patient.id}`)}
            >
              <Text style={styles.miniCardName} numberOfLines={1}>{patient.name}</Text>
              <Badge label={patient.riskLevel} type={patient.riskLevel} />
              <Text style={styles.miniCardTime}>
                {new Date(patient.lastVisited).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </Card>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
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
  inlineSyncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    gap: 6,
  },
  syncStatusText: {
    color: COLORS.WHITE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 10,
    shadowColor: COLORS.PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: COLORS.WHITE,
  },
  workerInfo: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: -2,
  },
  profileBtn: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 26,
    padding: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.PRIMARY_GREEN,
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  headerActionsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBadgeText: {
    color: COLORS.WHITE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  quickStatsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  quickStatPill: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStatLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  quickStatValue: {
    color: COLORS.TEXT_PRIMARY,
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    marginTop: 2,
  },
  statsGrid: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statTouchable: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAll: {
    color: COLORS.PRIMARY_GREEN,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  horizontalScroll: {
    paddingLeft: 24,
    paddingRight: 12,
    paddingBottom: 8,
  },
  miniCard: {
    width: 150,
    marginRight: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  miniCardName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  miniCardTime: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
  },
});
