import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { COLORS } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';

export default function Prescription() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { patients, addPatientPrescription } = useAppStore();
  const patient = patients.find(p => p.id === id);

  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');

  const handleSave = async () => {
    if (!medication || !dosage || !frequency) {
      Alert.alert("Error", "Please fill in medication name, dosage and frequency.");
      return;
    }
    try {
      await addPatientPrescription(id as string, {
        medication,
        dosage,
        timing: frequency,
        duration,
      });

      Alert.alert(
        "Success",
        "Prescription saved successfully.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Unable to save prescription."
      );
    }
  };

  if (!patient) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.PRIMARY_GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Prescription</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.patientInfo}>
          <Text style={styles.name}>{patient.name}</Text>
          <Text style={styles.subtitle}>{patient.village} · {patient.age} Yrs · {patient.gender}</Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.inputLabel}>Medication Name</Text>
          <View style={styles.inputWrapper}>
             <Ionicons name="medkit-outline" size={20} color={COLORS.PRIMARY_GREEN} />
             <TextInput 
               style={styles.input} 
               placeholder="e.g. Metformin" 
               value={medication}
               onChangeText={setMedication}
             />
          </View>

          <Text style={styles.inputLabel}>Dosage</Text>
          <View style={styles.inputWrapper}>
             <Ionicons name="flask-outline" size={20} color={COLORS.PRIMARY_GREEN} />
             <TextInput 
               style={styles.input} 
               placeholder="e.g. 500mg" 
               value={dosage}
               onChangeText={setDosage}
             />
          </View>

          <Text style={styles.inputLabel}>Frequency</Text>
          <View style={styles.inputWrapper}>
             <Ionicons name="repeat-outline" size={20} color={COLORS.PRIMARY_GREEN} />
             <TextInput 
               style={styles.input} 
               placeholder="e.g. Twice daily" 
               value={frequency}
               onChangeText={setFrequency}
             />
          </View>

          <Text style={styles.inputLabel}>Duration (Optional)</Text>
          <View style={styles.inputWrapper}>
             <Ionicons name="calendar-outline" size={20} color={COLORS.PRIMARY_GREEN} />
             <TextInput 
               style={styles.input} 
               placeholder="e.g. 30 days" 
               value={duration}
               onChangeText={setDuration}
             />
          </View>
        </Card>

        <Text style={styles.disclaimer}>
          ⚠️ Ensure the dosage and frequency are double-checked against the patient's medical records.
        </Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>ADD TO PRESCRIPTION</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  scrollContent: {
    padding: 24,
  },
  patientInfo: {
    marginBottom: 24,
  },
  name: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  formCard: {
    padding: 20,
  },
  inputLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  disclaimer: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 10,
    lineHeight: 16,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  saveBtn: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  saveText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.WHITE,
  },
});
