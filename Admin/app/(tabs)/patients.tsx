import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { PatientListItem } from '../../components/patient/PatientListItem';
import { useRouter } from 'expo-router';
import { PrioritizedPatient } from '../../services/adminApi';

export default function Patients() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const patients = useAppStore(state => state.patients);
  const prioritizedPatients = useAppStore(state => state.prioritizedPatients);
  const isPrioritizing = useAppStore(state => state.isPrioritizing);
  const priorityError = useAppStore(state => state.priorityError);
  const loadPrioritizedPatients = useAppStore(state => state.loadPrioritizedPatients);
  const loadPatientsFromDb = useAppStore(state => state.loadPatientsFromDb);
  const backendOnline = useAppStore(state => state.backendOnline);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'HIGH' | 'MEDIUM' | 'LOW' | 'Overdue'>('All');
  const [showAI, setShowAI] = useState(true);

  useEffect(() => {
    loadPrioritizedPatients();
  }, [backendOnline]);

  useEffect(() => {
    if (patients.length === 0) loadPatientsFromDb();
  }, []);

  const riskColor = (level: string) => {
    if (level === 'red') return '#FF4444';
    if (level === 'yellow') return '#F5A623';
    return '#2ECC71';
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.village.toLowerCase().includes(search.toLowerCase());
    if (filter === 'All') return matchesSearch;
    if (filter === 'Overdue') return matchesSearch && p.overdue;
    return matchesSearch && p.riskLevel === filter;
  });

  const handleCallPatient = async (phone?: string) => {
    if (!phone) {
      Alert.alert('Phone unavailable', 'This patient does not have a saved phone number.');
      return;
    }

    const dialUrl = `tel:${phone}`;
    const canDial = await Linking.canOpenURL(dialUrl);
    if (!canDial) {
      Alert.alert('Unable to call', 'Calling is not supported on this device.');
      return;
    }
    await Linking.openURL(dialUrl);
  };

  const FilterPill = ({ label, count, value }: any) => {
    const isActive = filter === value;
    return (
      <TouchableOpacity
        style={[styles.filterPill, isActive && styles.activePill]}
        onPress={() => setFilter(value)}
      >
        <Text style={[styles.filterLabel, isActive && styles.activeLabel]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const AIPriorityCard = ({ item }: { item: PrioritizedPatient }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/patient/${item.patient_id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.aiCard, item.emergency_flag && styles.aiCardEmergency]}>
        <View style={[styles.aiOrderBadge, { backgroundColor: riskColor(item.risk_level) }]}>
          <Text style={styles.aiOrderText}>#{item.visit_order}</Text>
        </View>
        <View style={styles.aiCardBody}>
          <View style={styles.aiCardRow}>
            <Text style={styles.aiCardName} numberOfLines={1}>{item.name}</Text>
            {item.emergency_flag && (
              <View style={styles.emergencyDot}>
                <Text style={styles.emergencyDotText}>🚨</Text>
              </View>
            )}
          </View>
          <Text style={styles.aiCardReason} numberOfLines={2}>{item.reason}</Text>
          <View style={styles.aiCardStats}>
            {item.days_overdue > 0 && item.days_overdue < 999 && (
              <Text style={styles.aiStat}>⏱ {item.days_overdue}d overdue</Text>
            )}
            {item.days_overdue >= 999 && (
              <Text style={styles.aiStat}>⏱ First visit</Text>
            )}
            <Text style={styles.aiStat}>💊 {item.adherence_rate.toFixed(0)}%</Text>
            <Text style={[styles.aiStat, { color: riskColor(item.risk_level), fontWeight: '700' }]}>
              Score {item.priority_score.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Patients</Text>
          <Text style={styles.subtitle}>ASHA Worker · Zone B</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="person-add" size={20} color={COLORS.PRIMARY_GREEN} />
        </TouchableOpacity>
      </View>

      {/* ── AI Priority Panel ── */}
      <View style={styles.aiSection}>
        <TouchableOpacity style={styles.aiHeader} onPress={() => setShowAI(v => !v)}>
          <View style={styles.aiTitleRow}>
            <Text style={styles.aiTitle}>🤖 AI Visit Priority</Text>
            {backendOnline
              ? <View style={styles.onlineDot} />
              : <View style={styles.offlineDot} />}
          </View>
          <Ionicons name={showAI ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>

        {showAI && (
          isPrioritizing ? (
            <View style={styles.aiLoading}>
              <ActivityIndicator color={COLORS.PRIMARY_GREEN} />
              <Text style={styles.aiLoadingText}>AI is ranking patients…</Text>
            </View>
          ) : priorityError ? (
            <View style={styles.aiError}>
              <Text style={styles.aiErrorText}>⚠️ Backend offline — showing mock data</Text>
              <TouchableOpacity onPress={loadPrioritizedPatients}>
                <Text style={styles.aiRetry}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : prioritizedPatients.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiScroll}>
              {prioritizedPatients.map(p => <AIPriorityCard key={p.patient_id} item={p} />)}
            </ScrollView>
          ) : (
            <View style={styles.aiError}>
              <Text style={styles.aiErrorText}>No assigned patients found in backend</Text>
            </View>
          )
        )}
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={COLORS.TEXT_SECONDARY} />
        <TextInput 
          style={styles.input} 
          placeholder="Search patient or village..." 
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterPill label="All" count={patients.length} value="All" />
          <FilterPill label="High Risk 🔴" count={patients.filter(p => p.riskLevel === 'HIGH').length} value="HIGH" />
          <FilterPill label="Medium Risk 🟡" count={patients.filter(p => p.riskLevel === 'MEDIUM').length} value="MEDIUM" />
          <FilterPill label="Low Risk 🟢" count={patients.filter(p => p.riskLevel === 'LOW').length} value="LOW" />
          <FilterPill label="Overdue 🕐" count={patients.filter(p => p.overdue).length} value="Overdue" />
        </ScrollView>
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PatientListItem 
            patient={item} 
            onPress={() => router.push(`/patient/${item.id}`)}
            onCall={() => handleCallPatient(item.phone)}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 110 }]}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📂</Text>
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: -2,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterScroll: {
    paddingLeft: 24,
    gap: 10,
    paddingRight: 24,
  },
  filterPill: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  activePill: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    borderColor: COLORS.PRIMARY_GREEN,
    shadowColor: COLORS.PRIMARY_GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  filterLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  activeLabel: {
    color: COLORS.WHITE,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  // ── AI Priority Panel ──
  aiSection: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 24,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71',
  },
  offlineDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4444',
  },
  aiScroll: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 10,
  },
  aiCard: {
    width: 220,
    backgroundColor: '#F7FAFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  aiCardEmergency: {
    borderColor: '#FF4444',
    backgroundColor: '#FFF5F5',
  },
  aiOrderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  aiOrderText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  },
  aiCardBody: {
    flex: 1,
  },
  aiCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiCardName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  emergencyDot: { },
  emergencyDotText: { fontSize: 13 },
  aiCardReason: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
    marginBottom: 6,
  },
  aiCardStats: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  aiStat: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  aiLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  aiLoadingText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  aiError: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiErrorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  aiRetry: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.PRIMARY_GREEN,
    marginLeft: 8,
  },
});
