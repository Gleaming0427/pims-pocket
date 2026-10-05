import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import Constants from 'expo-constants';
import { useSwipeToHome } from '@/hooks/useSwipeToHome';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import GroupTitle from '@/components/ui/GroupTitle';
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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
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
          backgroundColor: destructive ? colors.error + '15' : colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={19} color={destructive ? colors.error : colors.textPrimary} />
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
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );
}

// Séparateur aligné sur le texte (après l'icône), comme une liste iOS
function SettingDivider() {
  return <View style={{ height: 1, backgroundColor: colors.canvasMuted, marginLeft: 50 }} />;
}

const MAX_AVATARS = 3;

export default function SettingsScreen() {
  const router = useRouter();
  const swipeToHome = useSwipeToHome();
  const { user, signOut } = useAuthStore();
  const { children } = useChildren();

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

  const initials = (user?.displayName ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const childrenWithAllowance = children.filter((c) => c.weeklyAllowance > 0).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Réglages" homeButton />
      <ScrollView
        {...swipeToHome}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Profil */}
        <Card padding={18}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {initials ? (
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>
                  {initials}
                </Text>
              ) : (
                <Ionicons name="person" size={26} color={colors.primary} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}
              >
                {user?.displayName}
              </Text>
              {!!user?.email && (
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}
                >
                  {user.email}
                </Text>
              )}
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 16,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: colors.canvasMuted,
            }}
          >
            <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary }}>
              {children.length > 0
                ? `${children.length} enfant${children.length > 1 ? 's' : ''} dans la famille`
                : 'Aucun enfant pour le moment'}
            </Text>
            {children.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.canvas,
                  borderRadius: 999,
                  paddingVertical: 3,
                  paddingLeft: 3,
                  paddingRight: children.length > MAX_AVATARS ? 8 : 3,
                }}
              >
                {children.slice(0, MAX_AVATARS).map((child, i) => (
                  <View
                    key={child.id}
                    style={{
                      marginLeft: i === 0 ? 0 : -8,
                      borderWidth: 2,
                      borderColor: colors.canvas,
                      borderRadius: 999,
                    }}
                  >
                    <Avatar avatarId={child.avatarId} size={26} />
                  </View>
                ))}
                {children.length > MAX_AVATARS && (
                  <Text
                    style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginLeft: 4 }}
                  >
                    +{children.length - MAX_AVATARS}
                  </Text>
                )}
              </View>
            )}
          </View>
        </Card>

        {/* Famille */}
        <GroupTitle label="Famille" />
        <Card padding={14}>
          <SettingItem
            icon="repeat"
            label="Versements récurrents"
            subtitle={
              childrenWithAllowance > 0
                ? `Argent de poche automatique pour ${childrenWithAllowance} enfant${childrenWithAllowance > 1 ? 's' : ''}`
                : 'Aucun versement automatique'
            }
            onPress={() => router.push('/(parent)/recurring')}
          />
          <SettingDivider />
          <SettingItem
            icon="people-outline"
            label="Parents de la famille"
            subtitle="Inviter l'autre parent ou rejoindre sa famille"
            onPress={() => router.push('/(parent)/family-parents')}
          />
        </Card>

        {/* Préférences */}
        <GroupTitle label="Préférences" />
        <Card padding={14}>
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
        <GroupTitle label="À propos" />
        <Card padding={14}>
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
            subtitle="privacy@pimspocket.app"
            onPress={() => Linking.openURL('mailto:privacy@pimspocket.app')}
          />
        </Card>

        {/* Compte */}
        <Card padding={14} style={{ marginTop: 20 }}>
          <SettingItem
            icon="log-out-outline"
            label="Se déconnecter"
            onPress={handleSignOut}
            destructive
            showChevron={false}
          />
        </Card>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: colors.textLight,
            marginTop: 20,
          }}
        >
          Pims Pocket · v{Constants.expoConfig?.version ?? '1.2.1'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
