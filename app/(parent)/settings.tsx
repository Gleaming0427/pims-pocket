import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import colors from '@/constants/colors';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  showChevron?: boolean;
}

function SettingItem({
  icon,
  label,
  onPress,
  color = colors.textPrimary,
  showChevron = true,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
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
      <Text
        style={{
          flex: 1,
          marginLeft: 12,
          fontSize: 15,
          fontWeight: '500',
          color,
        }}
      >
        {label}
      </Text>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, family, signOut, updateFamilySettings } = useAuthStore();
  const [autoValidate, setAutoValidate] = useState(family?.autoValidateMissions ?? false);
  const [delayHours, setDelayHours] = useState(String(family?.validationDelayHours ?? 24));
  const [saving, setSaving] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Réglages" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.textPrimary,
              marginTop: 12,
            }}
          >
            {user?.displayName}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            {user?.email}
          </Text>
        </Card>

        {/* Section validation */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ paddingVertical: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>
              Validation des missions
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                  Auto-valider les missions
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Les missions sont validées automatiquement quand l'enfant les termine
                </Text>
              </View>
              <Switch
                value={autoValidate}
                onValueChange={async (v) => {
                  setAutoValidate(v);
                  setSaving(true);
                  try {
                    await updateFamilySettings({ autoValidateMissions: v });
                  } catch { /* ignore */ }
                  setSaving(false);
                }}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={autoValidate ? colors.primary : '#f4f3f4'}
              />
            </View>

            {!autoValidate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                    Délai d'auto-validation
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    En heures. 0 = désactivé. Passé ce délai, la mission est validée automatiquement.
                  </Text>
                </View>
                <TextInput
                  value={delayHours}
                  onChangeText={async (t) => {
                    setDelayHours(t);
                    const n = parseInt(t, 10);
                    if (!isNaN(n) && n >= 0 && n <= 720) {
                      setSaving(true);
                      try {
                        await updateFamilySettings({ validationDelayHours: n });
                      } catch { /* ignore */ }
                      setSaving(false);
                    }
                  }}
                  keyboardType="number-pad"
                  placeholder="24"
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.textPrimary,
                    textAlign: 'center',
                    minWidth: 56,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
            )}
          </View>
        </Card>

        <Card>
          <SettingItem
            icon="repeat"
            label="Versements récurrents"
            onPress={() => router.push('/(parent)/recurring')}
            color={colors.primary}
          />
          <SettingItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/(parent)/notification-settings')}
            color={colors.info}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            label="Sécurité"
            onPress={() => router.push('/(parent)/security')}
            color={colors.success}
          />
          <SettingItem
            icon="document-text-outline"
            label="Politique de confidentialité"
            onPress={() => router.push('/(legal)/privacy')}
            color={colors.info}
          />
          <SettingItem
            icon="help-circle-outline"
            label="Aide et support"
            onPress={() => Linking.openURL('mailto:privacy@pimspocket.app')}
            color={colors.secondary}
          />
          <SettingItem
            icon="log-out-outline"
            label="Se déconnecter"
            onPress={handleSignOut}
            color={colors.error}
            showChevron={false}
          />
        </Card>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: colors.textLight,
            marginTop: 24,
          }}
        >
          Pims Pocket v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
