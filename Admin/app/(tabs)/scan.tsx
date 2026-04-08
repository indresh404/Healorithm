import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, Camera } from 'expo-camera';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { QROverlay } from '../../components/scanner/QROverlay';
import { useAppStore } from '../../store/useAppStore';
import { getPatientByQRCode, getPatientByQRCodeFallback, getPatientByUserIdFallback, type PatientFullData } from '../../services/supabase.service';

const extractQRCodeValue = (rawData: string) => {
  const trimmedData = rawData.trim();
  const directMatch = trimmedData.match(/\bQR_[A-Z0-9]+\b/i);
  if (directMatch) {
    return directMatch[0].toUpperCase();
  }

  return null;
};

const extractUserIdFromPayload = (rawData: string) => {
  const trimmedData = rawData.trim();

  const healorithmMatch = trimmedData.match(
    /^healorithm:\/\/user\/([0-9a-f-]{36})(?:\?.*)?$/i
  );
  if (healorithmMatch) {
    return healorithmMatch[1];
  }

  const uuidMatch = trimmedData.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i);
  if (uuidMatch) {
    return uuidMatch[0];
  }

  return null;
};

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setCurrentPatient = useAppStore(state => state.setCurrentPatient);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned || isLoading) return;
    setScanned(true);
    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const normalizedQrCode = extractQRCodeValue(data);
      const userId = extractUserIdFromPayload(data);

      // Try to fetch patient data using the QR code
      let patientData: PatientFullData;

      if (normalizedQrCode) {
        patientData = await getPatientByQRCode(normalizedQrCode);

        if (!patientData.success) {
          console.log('RPC unavailable or QR lookup missed, trying QR fallback...');
          patientData = await getPatientByQRCodeFallback(normalizedQrCode);
        }
      } else if (userId) {
        console.log('Legacy user profile QR detected, trying user id fallback...');
        patientData = await getPatientByUserIdFallback(userId);
      } else {
        patientData = {
          success: false,
          error: 'Unsupported QR format',
        };
      }

      if (!patientData.success || !patientData.user) {
        setIsLoading(false);
        setScanned(false);
        Alert.alert(
          "Patient Not Found",
          `The QR code doesn't match any registered patient.\n\nQR: ${data.substring(0, 40)}${data.length > 40 ? '...' : ''}`,
          [{ text: "Scan Again", onPress: () => {} }]
        );
        return;
      }

      // Store patient data in global store
      setCurrentPatient({
        id: patientData.user.id,
        name: patientData.user.name,
        age: patientData.user.age,
        gender: patientData.user.gender,
        phone: patientData.user.phone,
        latitude: patientData.user.latitude,
        longitude: patientData.user.longitude,
        qrCode: patientData.user.qr_code,
        vitals: patientData.vitals || [],
        medicalRecords: patientData.medical_records || [],
        aiConsultations: patientData.ai_consultations || [],
        prescriptions: patientData.prescriptions || [],
        riskLevel: patientData.ai_consultations?.[0]?.risk_level || 'UNKNOWN',
      });

      setIsLoading(false);

      // Show success and navigate
      Alert.alert(
        "Scan Successful ✅",
        `Patient: ${patientData.user.name}\nRisk Level: ${patientData.ai_consultations?.[0]?.risk_level || 'N/A'}`,
        [{ 
          text: "View Profile", 
          onPress: () => router.push(`/patient/${patientData.user!.id}`) 
        }]
      );
    } catch (error) {
      setIsLoading(false);
      setScanned(false);
      console.error('Scan error:', error);
      Alert.alert(
        "Scan Error",
        `Failed to fetch patient data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: "Retry", onPress: () => {} }]
      );
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned || isLoading ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        enableTorch={torch}
        style={StyleSheet.absoluteFillObject}
      />
      
      <QROverlay isScanning={!scanned && !isLoading} />

      <View style={[styles.topBar, { top: insets.top + 20 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Scan Patient QR</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setTorch(!torch)}>
          <Ionicons name={torch ? "flash" : "flash-off"} size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Fetching patient data...</Text>
        </View>
      )}

      {!isLoading && (
        <View style={[styles.bottomSheet, { bottom: insets.bottom + 100 }]}>
          <View style={styles.pulseContainer}>
            <View style={styles.pulseDot} />
            <Text style={styles.bottomText}>Looking for QR code...</Text>
          </View>
          <TouchableOpacity 
            style={styles.manualBtn} 
            onPress={() => handleBarCodeScanned({ data: 'QR_' + Math.random().toString(36).substring(7).toUpperCase() })}
          >
            <Text style={styles.manualText}>Test Scan (Mock)</Text>
          </TouchableOpacity>
          <Text style={styles.subText}>Or scan a valid patient QR code</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.WHITE,
  },
  bottomSheet: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.WHITE,
    fontFamily: 'Poppins_500Medium',
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY_GREEN,
  },
  bottomText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.WHITE,
  },
  manualBtn: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  manualText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.WHITE,
  },
  subText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
});
