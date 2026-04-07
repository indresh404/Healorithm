import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { COLORS } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { PatientListItem } from '../../components/patient/PatientListItem';
import { useRouter } from 'expo-router';

export default function Patients() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const patients = useAppStore(state => state.patients);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'HIGH' | 'MEDIUM' | 'LOW' | 'Overdue'>('All');

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.village.toLowerCase().includes(search.toLowerCase());
    if (filter === 'All') return matchesSearch;
    if (filter === 'Overdue') return matchesSearch && p.overdue;
    return matchesSearch && p.riskLevel === filter;
  });

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
});
