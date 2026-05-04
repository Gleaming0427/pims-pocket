import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
  const { user, signOut } = useAuthStore();

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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
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
            icon="help-circle-outline"
            label="Aide et support"
            onPress={() => {}}
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
          PocketKids v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
