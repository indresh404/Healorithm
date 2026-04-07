import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { COLORS } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';
import { useRouter } from 'expo-router';

export default function Alerts() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { alerts, resolveAlert } = useAppStore();
  const [showResolved, setShowResolved] = useState(false);

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  const AlertCard = ({ alert }: any) => (
    <Card riskColor={COLORS.DANGER_RED} style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <Text style={styles.patientName}>{alert.patientName}</Text>
        <Text style={styles.alertTime}>{alert.time}</Text>
      </View>
      
      <Text style={styles.alertType}>{alert.type}</Text>
      <Text style={styles.alertValue}>{alert.value}</Text>
      <Text style={styles.patientVillage}>{alert.village}</Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.viewBtn} 
          onPress={() => router.push(`/patient/${alert.patientId}`)}
        >
          <Text style={styles.viewText}>View Patient</Text>
        </TouchableOpacity>
        {!alert.resolved && (
          <TouchableOpacity 
            style={styles.resolveBtn} 
            onPress={() => resolveAlert(alert.id)}
          >
            <Text style={styles.resolveText}>Mark Resolved</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Alerts</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeAlerts.length} Active</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}>
        {activeAlerts.length > 0 ? (
          activeAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>✅</Text>
            <Text style={styles.emptyText}>No active alerts today</Text>
          </View>
        )}

        {resolvedAlerts.length > 0 && (
          <View style={styles.resolvedSection}>
            <TouchableOpacity 
              style={styles.resolvedHeader} 
              onPress={() => setShowResolved(!showResolved)}
            >
              <Text style={styles.resolvedTitle}>Resolved Today ({resolvedAlerts.length})</Text>
              <Ionicons name={showResolved ? "chevron-up" : "chevron-down"} size={20} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
            
            {showResolved && resolvedAlerts.map(alert => (
              <View key={alert.id} style={styles.resolvedCard}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.PRIMARY_GREEN} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.resolvedPatient}>{alert.patientName}</Text>
                  <Text style={styles.resolvedTime}>{alert.type} · Resolved</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.OFF_WHITE,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: COLORS.DANGER_RED,
  },
  badge: {
    backgroundColor: COLORS.DANGER_RED,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: COLORS.DANGER_RED,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: COLORS.WHITE,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  alertCard: {
    marginBottom: 16,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.DANGER_RED,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  alertTime: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  alertType: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.DANGER_RED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    marginVertical: 4,
  },
  patientVillage: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_GREEN,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.PRIMARY_GREEN,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  viewText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.WHITE,
  },
  resolveBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_GREEN,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  resolveText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.PRIMARY_GREEN,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  resolvedSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  resolvedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  resolvedTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
  },
  resolvedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resolvedPatient: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  resolvedTime: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
});
