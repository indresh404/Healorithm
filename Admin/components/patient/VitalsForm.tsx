import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface VitalInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  unit: string;
  value: string;
  onChangeText: (val: string) => void;
  keyboardType?: any;
  placeholder?: string;
  hasError?: boolean;
}

export function VitalInput({ icon, label, unit, value, onChangeText, keyboardType = 'numeric', placeholder = '0', hasError }: VitalInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={icon} size={18} color={hasError ? COLORS.DANGER_RED : COLORS.PRIMARY_GREEN} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={[styles.inputContainer, isFocused && styles.focused, hasError && styles.errorBorder]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BORDER,
    paddingBottom: 4,
  },
  focused: {
    borderBottomColor: COLORS.PRIMARY_GREEN,
  },
  errorBorder: {
    borderBottomColor: COLORS.DANGER_RED,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
  },
  unit: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 8,
  },
});
