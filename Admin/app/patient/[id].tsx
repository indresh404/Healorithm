import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../store/useAppStore';
import { COLORS } from '../../constants/colors';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { RiskIndicator } from '../../components/patient/RiskIndicator';
import { useEffect, useState } from 'react';
import { getPatientLiveLocation, type PatientLiveLocation } from '@/services/supabase.service';

export default function PatientDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentPatient = useAppStore(state => state.currentPatient);
  const patients = useAppStore(state => state.patients);
  const [liveLocation, setLiveLocation] = useState<PatientLiveLocation | null>(null);
  
  // First try to use currentPatient (from QR scan), then fallback to the patients list
  const patient = currentPatient || patients.find(p => p.id === id);
  const patientId = typeof id === 'string' ? id : patient?.id;

  useEffect(() => {
    if (!patientId) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchLocation = async () => {
      try {
        const latest = await getPatientLiveLocation(patientId);
        setLiveLocation(latest);
      } catch {
        // Non-blocking: page should still render even if location fetch fails
      }
    };

    fetchLocation();
    timer = setInterval(fetchLocation, 20000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [patientId]);

  if (!patient) return null;

  const getRiskColor = () => {
    if (patient.riskLevel === 'HIGH') return COLORS.DANGER_RED;
    if (patient.riskLevel === 'MEDIUM') return COLORS.WARNING_YELLOW;
    return COLORS.SUCCESS_GREEN;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleCallPatient = async () => {
    if (!patient.phone) {
      Alert.alert('Phone unavailable', 'No phone number is available for this patient.');
      return;
    }

    const dialUrl = `tel:${patient.phone}`;
    const canDial = await Linking.canOpenURL(dialUrl);
    if (!canDial) {
      Alert.alert('Unable to call', 'Calling is not supported on this device.');
      return;
    }
    await Linking.openURL(dialUrl);
  };

  const handleTrackPatient = async () => {
    const latitude = liveLocation?.latitude ?? patient.latitude ?? null;
    const longitude = liveLocation?.longitude ?? patient.longitude ?? null;

    if (latitude === null || longitude === null) {
      Alert.alert('Location unavailable', 'Live patient location has not been shared yet.');
      return;
    }

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    const canOpen = await Linking.canOpenURL(mapsUrl);
    if (!canOpen) {
      Alert.alert('Unable to open map', 'Maps is not supported on this device.');
      return;
    }
    await Linking.openURL(mapsUrl);
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

        {/* AI Clinical Summary */}
        {patient.aiSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Clinical Summary</Text>
            <Card style={styles.aiSummaryCard}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={20} color={COLORS.PRIMARY_GREEN} />
                <Text style={styles.aiTitle}>Latest Assessment</Text>
              </View>
              <Text style={styles.aiText}>{patient.aiSummary}</Text>
              <Text style={styles.aiFooter}>Assessment generated from patient vitals and medical history</Text>
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Location</Text>
          <Card style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={COLORS.PRIMARY_GREEN} />
              <View style={styles.locationMeta}>
                <Text style={styles.locationText}>
                  {liveLocation?.latitude ?? patient.latitude ?? '--'}, {liveLocation?.longitude ?? patient.longitude ?? '--'}
                </Text>
                <Text style={styles.locationSubtext}>
                  Updated {liveLocation?.updated_at ? new Date(liveLocation.updated_at).toLocaleTimeString() : 'just now'}
                </Text>
              </View>
              <TouchableOpacity style={styles.trackBtn} onPress={handleTrackPatient}>
                <Text style={styles.trackBtnText}>Track</Text>
              </TouchableOpacity>
            </View>
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
                <View style={styles.vitalBadges}>
                  {v.isHighRisk && <Badge label="HIGH" type="HIGH" />}
                  {v.isCritical && <Badge label="CRITICAL" type="HIGH" />}
                </View>
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
              {v.notes && (
                <View style={styles.vitalNotes}>
                  <Text style={styles.vitalNotesLabel}>Notes:</Text>
                  <Text style={styles.vitalNotesText}>{v.notes}</Text>
                </View>
              )}
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
           onPress={handleCallPatient}
         >
           <Ionicons name="call" size={18} color={COLORS.PRIMARY_GREEN} />
           <Text style={styles.secondaryBtnText}>Call Patient</Text>
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
  aiSummaryCard: {
    padding: 16,
    backgroundColor: COLORS.GREEN_LIGHT,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY_GREEN,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.PRIMARY_GREEN,
  },
  aiText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 18,
    marginBottom: 8,
  },
  aiFooter: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  locationCard: {
    padding: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationMeta: {
    flex: 1,
  },
  locationText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  locationSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  trackBtn: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  trackBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.WHITE,
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
  vitalBadges: {
    flexDirection: 'row',
    gap: 8,
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
  vitalNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  vitalNotesLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  vitalNotesText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 16,
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
