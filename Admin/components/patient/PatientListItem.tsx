import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Patient } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface Props {
  patient: Patient;
  onPress: () => void;
  onCall?: () => void;
}

export function PatientListItem({ patient, onPress, onCall }: Props) {
  const scale = useSharedValue(1);

  const getRiskColor = () => {
    if (patient.riskLevel === 'HIGH') return COLORS.DANGER_RED;
    if (patient.riskLevel === 'MEDIUM') return COLORS.WARNING_YELLOW;
    return COLORS.SUCCESS_GREEN;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Card riskColor={getRiskColor()} style={{ marginBottom: 12, padding: 12 }}>
          <View style={styles.row}>
            {/* Left: Avatar */}
            <View style={[styles.avatar, { backgroundColor: getRiskColor() + '20' }]}>
              <Text style={[styles.avatarText, { color: getRiskColor() }]}>{getInitials(patient.name)}</Text>
            </View>

            {/* Center: Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{patient.name}</Text>
              <Text style={styles.subtitle}>{patient.village} · {patient.age} yrs</Text>
              <View style={styles.conditionsRow}>
                {patient.conditions.map(c => (
                  <View key={c} style={styles.conditionPill}>
                    <Text style={styles.conditionText}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right: Status */}
            <View style={styles.rightContainer}>
              <Badge label={patient.riskLevel + ' RISK'} type={patient.riskLevel} />
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={12} color={patient.overdue ? COLORS.WARNING_YELLOW : COLORS.TEXT_SECONDARY} />
                <Text style={[styles.timeText, patient.overdue && { color: COLORS.WARNING_YELLOW }]}>
                  {new Date(patient.lastVisited).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation?.();
                onCall?.();
              }}
              disabled={!patient.phone || !onCall}
              style={[styles.callBtn, (!patient.phone || !onCall) && styles.callBtnDisabled]}
            >
              <Ionicons name="call" size={16} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={COLORS.BORDER} style={{ marginLeft: 8 }} />
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  conditionPill: {
    backgroundColor: COLORS.OFF_WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  conditionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: COLORS.TEXT_SECONDARY,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 48,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  callBtn: {
    marginLeft: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.PRIMARY_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnDisabled: {
    backgroundColor: COLORS.BORDER,
  },
});
