import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import Constants from 'expo-constants';
import { useSwipeToHome } from '@/hooks/useSwipeToHome';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import colors from '@/constants/colors';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  subtitle?: string;
  // Seule exception : destructive = true pour la déconnexion (rouge)
  destructive?: boolean;
  showChevron?: boolean;
}

function SettingItem({
  icon,
  label,
  onPress,
  subtitle,
  destructive = false,
  showChevron = true,
}: SettingItemProps) {
  const accent = destructive ? colors.error : colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: accent + '15',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={19} color={accent} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: destructive ? colors.error : colors.textPrimary,
          }}
        >
          {label}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );
}

function SettingDivider() {
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

export default function SettingsScreen() {
  const router = useRouter();
  const swipeToHome = useSwipeToHome();
  const { user, family, signOut, updateFamilySettings } = useAuthStore();
  const { children } = useChildren();
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
      <Header title="Réglages" homeButton />
      <ScrollView
        {...swipeToHome}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Carte profil héro */}
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 24,
            padding: 24,
            marginBottom: 16,
            overflow: 'hidden',
            alignItems: 'center',
          }}
        >
          {/* Cercles décoratifs */}
          <View
            style={{
              position: 'absolute',
              top: -45,
              right: -35,
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: colors.primaryLight + '30',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -55,
              left: -25,
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: colors.starGold + '1A',
            }}
          />

          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(255,255,255,0.22)',
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person" size={32} color="#FFF" />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: '#FFF',
              marginTop: 12,
            }}
          >
            {user?.displayName}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.75)',
              marginTop: 3,
            }}
          >
            {children.length > 0
              ? `${children.length} enfant${children.length > 1 ? 's' : ''} dans la famille`
              : 'Bienvenue dans ta famille'}
          </Text>
        </View>

        {/* Une seule liste de réglages, un seul pattern */}
        <Card>
          {/* Auto-validation */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="flash" size={19} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                Auto-valider les missions
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {autoValidate
                  ? 'Activée — les missions se valident toutes seules'
                  : 'Désactivée — c’est toi qui valides les missions'}
              </Text>
            </View>
            <Switch
              value={autoValidate}
              onValueChange={async (v) => {
                Haptics.selectionAsync().catch(() => {});
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
            <>
              <SettingDivider />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: colors.primary + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="timer-outline" size={19} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                    Délai d'auto-validation
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    En heures — 0 = désactivé
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
            </>
          )}

        </Card>

        {/* Général */}
        <Card style={{ marginTop: 16 }}>
          <SettingItem
            icon="repeat"
            label="Versements récurrents"
            onPress={() => router.push('/(parent)/recurring')}
          />
          <SettingDivider />
          <SettingItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/(parent)/notification-settings')}
          />
          <SettingDivider />
          <SettingItem
            icon="shield-checkmark-outline"
            label="Sécurité"
            onPress={() => router.push('/(parent)/security')}
          />
        </Card>

        {/* À propos */}
        <Card style={{ marginTop: 16 }}>
          <SettingItem
            icon="document-text-outline"
            label="Politique de confidentialité"
            onPress={() => router.push('/(legal)/privacy')}
          />
          <SettingDivider />
          <SettingItem
            icon="reader-outline"
            label="Conditions d'utilisation"
            onPress={() => router.push('/(parent)/terms')}
          />
          <SettingDivider />
          <SettingItem
            icon="help-circle-outline"
            label="Aide et support"
            onPress={() => Linking.openURL('mailto:privacy@pimspocket.app')}
          />
        </Card>

        {/* Compte */}
        <Card style={{ marginTop: 16 }}>
          <SettingItem
            icon="log-out-outline"
            label="Se déconnecter"
            onPress={handleSignOut}
            destructive
            showChevron={false}
          />
        </Card>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textSecondary,
              }}
            >
              Pims Pocket · v{Constants.expoConfig?.version ?? '1.2.1'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
