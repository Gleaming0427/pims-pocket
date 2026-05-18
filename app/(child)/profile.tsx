import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { db, auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { deleteUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import colors from '@/constants/colors';

export default function ChildProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [avatarId, setAvatarId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.familyId || !user?.childDocId) return;
    const ref = doc(db, 'families', user.familyId, 'children', user.childDocId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setAvatarId(typeof data?.avatarId === 'string' ? data.avatarId : null);
      },
      () => {}
    );
    return unsub;
  }, [user?.familyId, user?.childDocId]);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données seront perdues. Demande à ton parent avant de continuer.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const callFn = httpsCallable(functions, 'deleteUserData');
              await callFn({});
              if (auth.currentUser) await deleteUser(auth.currentUser);
              await signOut();
              router.replace('/');
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Erreur';
              Alert.alert('Erreur', msg);
            }
          },
        },
      ]
    );
  };

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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Card variant="child" style={{ alignItems: 'center', paddingVertical: 32, marginBottom: 20 }}>
          {avatarId ? (
            <Avatar avatarId={avatarId} size={100} />
          ) : (
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
          )}
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
          <TouchableOpacity
            onPress={() => router.push('/(child)/history')}
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
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(child)/badges')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
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
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </Card>

        <Button
          title="Se déconnecter"
          onPress={handleSignOut}
          variant="danger"
          style={{ marginTop: 32 }}
          icon={<Ionicons name="log-out-outline" size={20} color="#FFF" />}
        />
        <Button
          title="Supprimer mon compte"
          onPress={handleDeleteAccount}
          variant="ghost"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
