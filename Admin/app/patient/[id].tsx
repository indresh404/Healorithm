import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../store/useAppStore';
import { COLORS } from '../../constants/colors';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { RiskIndicator } from '../../components/patient/RiskIndicator';

const { width } = Dimensions.get('window');

export default function PatientDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentPatient = useAppStore(state => state.currentPatient);
  const patients = useAppStore(state => state.patients);
  
  // First try to use currentPatient (from QR scan), then fallback to the patients list
  const patient = currentPatient || patients.find(p => p.id === id);

  if (!patient) return null;

  const getRiskColor = () => {
    if (patient.riskLevel === 'HIGH') return COLORS.DANGER_RED;
    if (patient.riskLevel === 'MEDIUM') return COLORS.WARNING_YELLOW;
    return COLORS.SUCCESS_GREEN;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient colors={[COLORS.PRIMARY_GREEN, COLORS.GREEN_DARK]} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{patient.name}</Text>
          <View style={styles.headerRight}>
            <Badge label={patient.riskLevel} type={patient.riskLevel} />
          </View>
        </LinearGradient>

        <View style={styles.profileSection}>
          <Card style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <View style={[styles.avatar, { backgroundColor: getRiskColor() + '15' }]}>
                <Text style={[styles.avatarText, { color: getRiskColor() }]}>{getInitials(patient.name)}</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientId}>ID: #P-2023-{Math.floor(Math.random()*9000)+1000}</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>{patient.age} Yrs · {patient.gender}</Text>
                  <View style={styles.villageBadge}>
                    <Text style={styles.villageText}>{patient.village}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.conditionsRow}>
              {patient.conditions.map(c => (
                <View key={c} style={styles.conditionPill}>
                  <Text style={styles.conditionText}>{c}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.assignedBox}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.PRIMARY_GREEN} />
              <Text style={styles.assignedText}>Assigned to Priya (Worker ID HW-2023-0102)</Text>
            </View>
          </Card>
        </View>

        {/* Risk Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Health Score</Text>
          <Card style={styles.riskCard}>
            <View style={styles.riskHeader}>
              <Text style={styles.riskValue}>{patient.riskScore}%</Text>
              <Text style={styles.riskLevelLabel}>{patient.riskLevel} RISK</Text>
            </View>
            <RiskIndicator score={patient.riskScore} />
            <Text style={styles.riskDesc}>
              {patient.riskLevel === 'HIGH' ? '🚨 Immediate intervention required based on recent vitals.' : '✅ Vitals are currently within stable range.'}
            </Text>
          </Card>
        </View>

        {/* Adherence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Adherence</Text>
          <Card style={styles.adherenceCard}>
            <View style={styles.adherenceRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <View key={i} style={styles.dayCol}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <View style={[
                   styles.dot, 
                   patient.adherenceLog[i] === 'yes' ? styles.dotYes : (patient.adherenceLog[i] === 'no' ? styles.dotNo : styles.dotNone)
                  ]} />
                </View>
              ))}
              <View style={styles.adherencePercentage}>
                <Text style={styles.percentText}>{patient.adherencePercentage}%</Text>
                <Text style={styles.percentLabel}>This week</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Vitals History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vitals History</Text>
          {patient.vitalsHistory.map((v, i) => (
            <Card key={v.id} style={styles.vitalHistoryItem}>
              <View style={styles.vitalHeader}>
                <Text style={styles.vitalDate}>
                  {new Date(v.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
                {v.isHighRisk && <Badge label="HIGH" type="HIGH" />}
              </View>
              <View style={styles.vitalsGrid}>
                <View style={styles.vitalStat}>
                  <Text style={styles.vitalLabel}>BP</Text>
                  <Text style={[styles.vitalValue, v.isHighRisk && { color: COLORS.DANGER_RED }]}>{v.bp}</Text>
                </View>
                <View style={styles.vitalStat}>
                  <Text style={styles.vitalLabel}>SpO2</Text>
                  <Text style={styles.vitalValue}>{v.spo2}%</Text>
                </View>
                <View style={styles.vitalStat}>
                  <Text style={styles.vitalLabel}>Temp</Text>
                  <Text style={styles.vitalValue}>{v.temp}°C</Text>
                </View>
                <View style={styles.vitalStat}>
                  <Text style={styles.vitalLabel}>HR</Text>
                  <Text style={styles.vitalValue}>{v.hr} bpm</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomActions}>
         <TouchableOpacity 
           style={[styles.actionBtn, styles.primaryBtn]} 
           onPress={() => router.push({ pathname: '/patient/vitals', params: { id: patient.id } })}
         >
           <Ionicons name="add-circle" size={20} color={COLORS.WHITE} />
           <Text style={styles.primaryBtnText}>Record Vitals</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.actionBtn, styles.secondaryBtn]}
           onPress={() => router.push({ pathname: '/patient/prescription', params: { id: patient.id } })}
         >
           <Text style={styles.secondaryBtnText}>Add Prescription</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.OFF_WHITE,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.WHITE,
  },
  headerRight: {},
  profileSection: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  profileCard: {
    padding: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
  },
  infoContent: {
    flex: 1,
  },
  patientName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  patientId: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  detailText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
  },
  villageBadge: {
    backgroundColor: COLORS.OFF_WHITE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  villageText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  conditionPill: {
    backgroundColor: COLORS.GREEN_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  conditionText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.PRIMARY_GREEN,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginBottom: 16,
  },
  assignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assignedText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  riskCard: {
    padding: 16,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  riskValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: COLORS.TEXT_PRIMARY,
  },
  riskLevelLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  riskDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 12,
  },
  adherenceCard: {
    padding: 16,
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotYes: { backgroundColor: COLORS.PRIMARY_GREEN },
  dotNo: { backgroundColor: COLORS.DANGER_RED },
  dotNone: { backgroundColor: COLORS.BORDER },
  adherencePercentage: {
    marginLeft: 10,
    alignItems: 'center',
  },
  percentText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.PRIMARY_GREEN,
  },
  percentLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  vitalHistoryItem: {
    marginBottom: 12,
    padding: 16,
  },
  vitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vitalDate: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  vitalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vitalStat: {
    alignItems: 'center',
  },
  vitalLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  vitalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.WHITE,
    padding: 20,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    elevation: 5,
    shadowColor: COLORS.PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_GREEN,
  },
  primaryBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.WHITE,
  },
  secondaryBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.PRIMARY_GREEN,
  },
});
