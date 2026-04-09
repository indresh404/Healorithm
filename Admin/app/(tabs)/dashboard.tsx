import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Polyline } from 'react-native-svg';
import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { COLORS } from '../../constants/colors';
import { StatBox } from '../../components/ui/StatBox';
import { EmergencyBanner } from '../../components/ui/EmergencyBanner';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RiskSlice {
  key: 'HIGH' | 'MEDIUM' | 'LOW';
  value: number;
  color: string;
}

function DonutChart({ data }: { data: RiskSlice[] }) {
  const radius = 42;
  const strokeWidth = 14;
  const size = 120;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  let offset = 0;

  return (
    <Svg width={size} height={size}>
      <G rotation={-90} origin={`${center}, ${center}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.BORDER}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {data.map((item) => {
          const sliceLength = total > 0 ? (item.value / total) * circumference : 0;
          const segment = (
            <Circle
              key={item.key}
              cx={center}
              cy={center}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${sliceLength} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += sliceLength;
          return segment;
        })}
      </G>
    </Svg>
  );
}

function BarTrend({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <View style={styles.barWrap}>
      {values.map((value, index) => (
        <View key={`${index}-${value}`} style={styles.barCol}>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { height: `${(value / max) * 100}%` }]} />
          </View>
          <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>
        </View>
      ))}
    </View>
  );
}

function TinyLine({ values }: { values: number[] }) {
  const width = 140;
  const height = 52;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke={COLORS.PRIMARY_GREEN} strokeWidth={3} />
    </Svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentWorker, patients, alerts, syncQueue, simulateSync } = useAppStore();

  const highRiskPatients = patients.filter((p) => p.riskLevel === 'HIGH');
  const mediumRiskPatients = patients.filter((p) => p.riskLevel === 'MEDIUM');
  const lowRiskPatients = patients.filter((p) => p.riskLevel === 'LOW');
  const overduePatients = patients.filter((p) => p.overdue);
  const pendingSyncCount = syncQueue.length;

  const analytics = useMemo(() => {
    const riskSlices: RiskSlice[] = [
      { key: 'HIGH', value: highRiskPatients.length, color: COLORS.DANGER_RED },
      { key: 'MEDIUM', value: mediumRiskPatients.length, color: COLORS.WARNING_YELLOW },
      { key: 'LOW', value: lowRiskPatients.length, color: COLORS.SUCCESS_GREEN },
    ];

    const adherenceSeries = [68, 74, 71, 79, 83, 87, 92];
    const weeklyVisits = [8, 10, 11, 9, 12, 7, 6];

    return { riskSlices, adherenceSeries, weeklyVisits };
  }, [highRiskPatients.length, lowRiskPatients.length, mediumRiskPatients.length]);

  const handleSync = async () => {
    await simulateSync();
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inlineSyncBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: pendingSyncCount > 0 ? COLORS.WARNING_YELLOW : COLORS.PRIMARY_GREEN,
          },
        ]}
      >
        <Ionicons name={pendingSyncCount > 0 ? 'sync' : 'checkmark-circle'} size={14} color={COLORS.WHITE} />
        <Text style={styles.syncStatusText}>{pendingSyncCount > 0 ? `${pendingSyncCount} pending...` : 'Synced to cloud'}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
      >
        <LinearGradient colors={[COLORS.PRIMARY_GREEN, COLORS.GREEN_DARK]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good Morning, {currentWorker?.name?.split(' ')[0] || 'Worker'}</Text>
              <Text style={styles.workerInfo}>ASHA HERO | {currentWorker?.zone || 'Sector 7'}</Text>
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
              <Text style={styles.headerBadgeText}>Overdue: {overduePatients.length}</Text>
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

        <EmergencyBanner count={highRiskPatients.length} onPress={() => router.push('/(tabs)/alerts')} />

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatBox label="Today's Visits" value="8/12" color={COLORS.PRIMARY_GREEN} />
            <StatBox
              label="Emergencies"
              value={alerts.filter((a) => !a.resolved).length}
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

        <View style={styles.analyticsGrid}>
          <Card style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Risk Distribution</Text>
            <View style={styles.riskChartRow}>
              <DonutChart data={analytics.riskSlices} />
              <View style={styles.riskLegend}>
                {analytics.riskSlices.map((item) => (
                  <View key={item.key} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>
                      {item.key}: {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          <Card style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Weekly Visits</Text>
            <BarTrend values={analytics.weeklyVisits} />
            <Text style={styles.analyticsFootnote}>Mix of real patient totals + static trend projection</Text>
          </Card>

          <Card style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Medication Adherence Trend</Text>
            <View style={styles.lineRow}>
              <TinyLine values={analytics.adherenceSeries} />
              <View>
                <Text style={styles.lineValue}>92%</Text>
                <Text style={styles.lineLabel}>this week</Text>
              </View>
            </View>
          </Card>
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
              riskColor={patient.riskLevel === 'HIGH' ? COLORS.DANGER_RED : patient.riskLevel === 'MEDIUM' ? COLORS.WARNING_YELLOW : COLORS.SUCCESS_GREEN}
              onPress={() => router.push(`/patient/${patient.id}`)}
            >
              <Text style={styles.miniCardName} numberOfLines={1}>
                {patient.name}
              </Text>
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
  scrollContent: {},
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
  analyticsGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  analyticsCard: {
    padding: 14,
  },
  analyticsTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  riskChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskLegend: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
  },
  barWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 118,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    height: 90,
    width: 14,
    borderRadius: 8,
    backgroundColor: COLORS.BORDER,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: 14,
    backgroundColor: COLORS.PRIMARY_GREEN,
    borderRadius: 8,
    minHeight: 6,
  },
  barLabel: {
    marginTop: 8,
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  analyticsFootnote: {
    marginTop: 8,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: COLORS.PRIMARY_GREEN,
  },
  lineLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 18,
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
