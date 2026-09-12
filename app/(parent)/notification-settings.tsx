import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import colors from '@/constants/colors';

interface NotifToggleProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  color: string;
  // Dernier élément de la liste : pas de trait en bas
  last?: boolean;
}

function NotifToggle({
  icon,
  label,
  description,
  value,
  onValueChange,
  color,
  last = false,
}: NotifToggleProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: color + '15',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary + '60' }}
        thumbColor={value ? colors.primary : '#ccc'}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const [missionAssigned, setMissionAssigned] = useState(true);
  const [missionCompleted, setMissionCompleted] = useState(true);
  const [moneyRequest, setMoneyRequest] = useState(true);
  const [goalReached, setGoalReached] = useState(true);
  const [allowanceReminder, setAllowanceReminder] = useState(true);
  const [badgeUnlocked, setBadgeUnlocked] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Notifications" showBack />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Card style={{ marginBottom: 20, backgroundColor: colors.info + '15' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="information-circle" size={22} color={colors.info} />
            <Text
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: 20,
              }}
            >
              Les notifications push nécessitent une build de développement ou de
              production avec les certificats APNs / FCM configurés dans Expo.
            </Text>
          </View>
        </Card>

        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          Missions
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <NotifToggle
            icon="flash"
            label="Mission assignée"
            description="Quand une mission est créée pour un enfant"
            value={missionAssigned}
            onValueChange={setMissionAssigned}
            color={colors.accentOrange}
          />
          <NotifToggle
            icon="checkmark-done"
            label="Mission terminée"
            description="Quand un enfant marque une mission comme terminée"
            value={missionCompleted}
            onValueChange={setMissionCompleted}
            color={colors.success}
            last
          />
        </Card>

        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          Argent
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <NotifToggle
            icon="cash"
            label="Demande d'argent"
            description="Quand un enfant fait une demande d'argent"
            value={moneyRequest}
            onValueChange={setMoneyRequest}
            color={colors.primary}
          />
          <NotifToggle
            icon="calendar"
            label="Rappel versement"
            description="Rappel quand l'argent de poche est versé"
            value={allowanceReminder}
            onValueChange={setAllowanceReminder}
            color={colors.info}
            last
          />
        </Card>

        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          Progres
        </Text>
        <Card>
          <NotifToggle
            icon="trophy"
            label="Objectif atteint"
            description="Quand un enfant atteint un objectif d'épargne"
            value={goalReached}
            onValueChange={setGoalReached}
            color={colors.warning}
          />
          <NotifToggle
            icon="ribbon"
            label="Badge débloqué"
            description="Quand un enfant débloque un nouveau badge"
            value={badgeUnlocked}
            onValueChange={setBadgeUnlocked}
            color={colors.secondary}
            last
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
