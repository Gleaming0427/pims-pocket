import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';
import { CHILD_THEMES } from '@/constants/childThemes';
import { updateChildThemeColor } from '@/lib/firestore';

export default function ChildProfileScreen() {
  const accent = useChildThemeStore((s) => s.accent);
  const setAccent = useChildThemeStore((s) => s.setAccent);
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
      <Header title="Mon profil" homeButton homeTarget="/(child)/dashboard" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Héro profil turquoise — miroir du profil adulte */}
        <View
          style={{
            backgroundColor: accent,
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
              backgroundColor: 'rgba(255,255,255,0.12)',
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
              backgroundColor: colors.starGold + '25',
            }}
          />

          {avatarId ? (
            <View
              style={{
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.25)',
                borderRadius: 999,
              }}
            >
              <Avatar avatarId={avatarId} size={80} />
            </View>
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.22)',
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 44 }}>🧒</Text>
            </View>
          )}
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: '#FFF',
              marginTop: 12,
            }}
          >
            {user?.displayName ?? 'Mon profil'}
          </Text>
        </View>

        {/* Liste : même pattern que les réglages adulte */}
        <Card>
          <TouchableOpacity
            onPress={() => router.push('/(child)/history')}
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
              <Ionicons name="time-outline" size={19} color={accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                Mon historique
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Toutes tes opérations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <TouchableOpacity
            onPress={() => router.push('/(child)/badges')}
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
                backgroundColor: colors.starGold + '25',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="ribbon-outline" size={19} color={colors.textPrimary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                Mes badges
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Ta collection de trophées
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </Card>

        {/* Gemme de couleur */}
        <Card style={{ marginTop: 16 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.textPrimary,
              marginBottom: 14,
            }}
          >
            💎 Mes couleurs
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {CHILD_THEMES.map((theme) => {
              const isSelected = theme.color === accent;
              return (
                <TouchableOpacity
                  key={theme.id}
                  onPress={() => {
                    setAccent(theme.color);
                    if (user?.familyId && user?.childDocId) {
                      updateChildThemeColor(
                        user.familyId,
                        user.childDocId,
                        theme.color
                      ).catch(() => {});
                    }
                  }}
                  activeOpacity={0.7}
                  style={{ alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      backgroundColor: theme.color,
                      borderWidth: isSelected ? 3 : 0,
                      borderColor: colors.textPrimary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={22} color="#FFF" />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? colors.textPrimary : colors.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    {theme.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
