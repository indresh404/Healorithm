import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { VitalInput } from '../../components/patient/VitalsForm';
import { THRESHOLDS } from '../../constants/thresholds';

export default function RecordVitals() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { patients, updatePatientVitals } = useAppStore();
  const patient = patients.find(p => p.id === id);

  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temp, setTemp] = useState('');
  const [hr, setHr] = useState('');
  
  const [isEmergency, setIsEmergency] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Real-time detection
    let emergency = false;
    let msg = '';

    if (bpSys && Number(bpSys) > THRESHOLDS.BP_SYSTOLIC_MAX) {
      emergency = true;
      msg = '⚠️ Critical BP — Consider immediate referral';
    }
    if (bpDia && Number(bpDia) > THRESHOLDS.BP_DIASTOLIC_MAX) {
      emergency = true;
      msg = '⚠️ Critical BP — Consider immediate referral';
    }
    if (spo2 && Number(spo2) < THRESHOLDS.SPO2_MIN) {
      emergency = true;
      msg = '⚠️ Low SpO2 — Oxygen level critical';
    }
    if (temp && Number(temp) > THRESHOLDS.TEMP_MAX) {
      emergency = true;
      msg = '⚠️ High Fever — Immediate cooling required';
    }
    if (hr && (Number(hr) > THRESHOLDS.HR_MAX || Number(hr) < THRESHOLDS.HR_MIN)) {
      emergency = true;
      msg = '⚠️ Abnormal Heart Rate';
    }

    setIsEmergency(emergency);
    setErrorMessage(msg);
  }, [bpSys, bpDia, spo2, temp, hr]);

  const handleSave = () => {
    if (!bpSys || !bpDia || !spo2 || !temp || !hr) {
      Alert.alert("Missing Data", "Please fill in all vital fields.");
      return;
    }

    updatePatientVitals(id as string, {
      date: new Date().toISOString(),
      bp: `${bpSys}/${bpDia}`,
      spo2: Number(spo2),
      temp: Number(temp),
      hr: Number(hr),
    });

    Alert.alert(
      isEmergency ? "🚨 EMERGENCY FLAGGED" : "Success",
      isEmergency ? "Vitals saved and emergency alert sent to medical team." : "Vitals recorded successfully.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  if (!patient) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.PRIMARY_GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Vitals</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.patientInfo}>
          <Text style={styles.name}>{patient.name}</Text>
          <Text style={styles.subtitle}>{patient.village} · Last visited {new Date(patient.lastVisited).toLocaleDateString()}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.bpRow}>
            <View style={{ flex: 1 }}>
              <VitalInput 
                icon="heart" 
                label="BP Systolic" 
                unit="mmHg" 
                value={bpSys} 
                onChangeText={setBpSys} 
                hasError={!!bpSys && Number(bpSys) > THRESHOLDS.BP_SYSTOLIC_MAX}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <VitalInput 
                icon="heart" 
                label="BP Diastolic" 
                unit="mmHg" 
                value={bpDia} 
                onChangeText={setBpDia} 
                hasError={!!bpDia && Number(bpDia) > THRESHOLDS.BP_DIASTOLIC_MAX}
              />
            </View>
          </View>

          <VitalInput 
            icon="thermometer" 
            label="Body Temperature" 
            unit="°C" 
            value={temp} 
            onChangeText={setTemp} 
            hasError={!!temp && Number(temp) > THRESHOLDS.TEMP_MAX}
          />

          <VitalInput 
            icon="pulse" 
            label="Heart Rate" 
            unit="bpm" 
            value={hr} 
            onChangeText={setHr} 
            hasError={!!hr && (Number(hr) > THRESHOLDS.HR_MAX || Number(hr) < THRESHOLDS.HR_MIN)}
          />

          <VitalInput 
            icon="water" 
            label="Oxygen Saturation (SpO2)" 
            unit="%" 
            value={spo2} 
            onChangeText={setSpo2} 
            hasError={!!spo2 && Number(spo2) < THRESHOLDS.SPO2_MIN}
          />
        </View>

        {isEmergency && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={24} color={COLORS.WHITE} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.saveBtn, isEmergency && { backgroundColor: COLORS.DANGER_RED }]} 
          onPress={handleSave}
        >
          <Text style={styles.saveText}>{isEmergency ? "SAVE + FLAG EMERGENCY" : "SAVE VITALS"}</Text>
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
  form: {},
  bpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorBanner: {
    backgroundColor: COLORS.DANGER_RED,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 10,
    elevation: 4,
    shadowColor: COLORS.DANGER_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.WHITE,
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

