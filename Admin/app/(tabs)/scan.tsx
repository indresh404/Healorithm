import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, Camera } from 'expo-camera';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { QROverlay } from '../../components/scanner/QROverlay';
import { useAppStore } from '../../store/useAppStore';

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const patients = useAppStore(state => state.patients);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // For demo, we navigate to the first patient if the scan is successful
    const demoPatient = patients[0];
    
    Alert.alert(
      "Scan Successful",
      `✅ ${demoPatient.name} — Loading profile...`,
      [{ text: "OK", onPress: () => router.push(`/patient/${demoPatient.id}`) }]
    );
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
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        enableTorch={torch}
        style={StyleSheet.absoluteFillObject}
      />
      
      <QROverlay isScanning={!scanned} />

      <View style={[styles.topBar, { top: insets.top + 20 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Scan Patient QR</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setTorch(!torch)}>
          <Ionicons name={torch ? "flash" : "flash-off"} size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomSheet, { bottom: insets.bottom + 100 }]}>
        <View style={styles.pulseContainer}>
          <View style={styles.pulseDot} />
          <Text style={styles.bottomText}>Looking for QR code...</Text>
        </View>
        <TouchableOpacity 
          style={styles.manualBtn} 
          onPress={() => handleBarCodeScanned({ data: 'patient001' })}
        >
          <Text style={styles.manualText}>Test Scan (Demo)</Text>
        </TouchableOpacity>
        <Text style={styles.subText}>Or enter Patient ID manually</Text>
      </View>
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
