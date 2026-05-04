import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import colors from '@/constants/colors';

export default function ChildProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Tu veux vraiment te déconnecter ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header title="Mon profil" showBack />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card variant="child" style={{ alignItems: 'center', paddingVertical: 32, marginBottom: 20 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.piggyPink + '30',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 56 }}>🧒</Text>
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: colors.textPrimary,
              marginTop: 16,
            }}
          >
            {user?.displayName ?? 'Mon profil'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            {user?.email}
          </Text>
        </Card>

        <Card variant="child">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Ionicons name="time-outline" size={22} color={colors.primary} />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 15,
                fontWeight: '500',
                color: colors.textPrimary,
              }}
            >
              Mon historique
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Ionicons name="ribbon-outline" size={22} color={colors.starGold} />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 15,
                fontWeight: '500',
                color: colors.textPrimary,
              }}
            >
              Mes badges
            </Text>
          </View>
        </Card>

        <Button
          title="Se déconnecter"
          onPress={handleSignOut}
          variant="danger"
          style={{ marginTop: 32 }}
          icon={<Ionicons name="log-out-outline" size={20} color="#FFF" />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
