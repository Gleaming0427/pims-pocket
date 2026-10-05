import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import GroupTitle from '@/components/ui/GroupTitle';
import colors from '@/constants/colors';

interface NotifToggleProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

function NotifToggle({ icon, label, description, value, onValueChange }: NotifToggleProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={19} color={colors.textPrimary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.canvasMuted }}
        ios_backgroundColor={colors.canvasMuted}
        thumbColor="#FFF"
      />
    </View>
  );
}

// Séparateur aligné sur le texte (après l'icône)
function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.canvasMuted, marginLeft: 50 }} />;
}

export default function NotificationSettingsScreen() {
  const [missionAssigned, setMissionAssigned] = useState(true);
  const [missionCompleted, setMissionCompleted] = useState(true);
  const [moneyRequest, setMoneyRequest] = useState(true);
  const [goalReached, setGoalReached] = useState(true);
  const [allowanceReminder, setAllowanceReminder] = useState(true);
  const [badgeUnlocked, setBadgeUnlocked] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Notifications" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Explication */}
        <Card padding={14} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="notifications" size={20} color={colors.primary} />
            </View>
            <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
              Choisis les alertes que tu reçois sur ton téléphone quand il se passe quelque chose
              dans la famille.
            </Text>
          </View>
        </Card>

        <GroupTitle label="Missions" first />
        <Card padding={14}>
          <NotifToggle
            icon="flash-outline"
            label="Mission assignée"
            description="Quand une mission est créée pour un enfant"
            value={missionAssigned}
            onValueChange={setMissionAssigned}
          />
          <Divider />
          <NotifToggle
            icon="checkmark-done-outline"
            label="Mission terminée"
            description="Quand un enfant termine une mission"
            value={missionCompleted}
            onValueChange={setMissionCompleted}
          />
        </Card>

        <GroupTitle label="Argent" />
        <Card padding={14}>
          <NotifToggle
            icon="cash-outline"
            label="Demande d'argent"
            description="Quand un enfant demande de l'argent"
            value={moneyRequest}
            onValueChange={setMoneyRequest}
          />
          <Divider />
          <NotifToggle
            icon="calendar-outline"
            label="Versement d'argent de poche"
            description="Quand l'argent de poche automatique est versé"
            value={allowanceReminder}
            onValueChange={setAllowanceReminder}
          />
        </Card>

        <GroupTitle label="Progrès" />
        <Card padding={14}>
          <NotifToggle
            icon="trophy-outline"
            label="Objectif atteint"
            description="Quand un enfant atteint un objectif d'épargne"
            value={goalReached}
            onValueChange={setGoalReached}
          />
          <Divider />
          <NotifToggle
            icon="ribbon-outline"
            label="Badge débloqué"
            description="Quand un enfant gagne un nouveau badge"
            value={badgeUnlocked}
            onValueChange={setBadgeUnlocked}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
