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
import GroupTitle from '@/components/ui/GroupTitle';
import Header from '@/components/shared/Header';
import colors from '@/constants/colors';
import { getContrastTextColor } from '@/utils/colorContrast';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Mon profil" homeButton homeTarget="/(child)/dashboard" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        <Card padding={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {avatarId ? (
              <Avatar avatarId={avatarId} size={64} />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: accent + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 32 }}>🧒</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                {user?.displayName ?? 'Mon profil'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                Ton espace Pims Pocket
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.canvasMuted }}>
            <Ionicons name="sparkles-outline" size={18} color={colors.textSecondary} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary }}>
              Des missions, des rêves et plein de progrès !
            </Text>
          </View>
        </Card>

        <GroupTitle label="Mon activité" />
        <Card>
          <TouchableOpacity
            onPress={() => router.push('/(child)/history')}
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
                backgroundColor: colors.canvas,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="time-outline" size={19} color={colors.textPrimary} />
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

          <View style={{ height: 1, backgroundColor: colors.canvasMuted, marginLeft: 50 }} />

          <TouchableOpacity
            onPress={() => router.push('/(child)/badges')}
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
                backgroundColor: colors.canvas,
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

        <GroupTitle label="Personnalisation" />
        <Card padding={20}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.textPrimary,
              marginBottom: 4,
            }}
          >
            Ma couleur
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
            Choisis la couleur de tes boutons et de tes onglets.
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
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
                  accessibilityRole="radio"
                  accessibilityLabel={theme.label}
                  accessibilityState={{ selected: isSelected }}
                  style={{
                    flexGrow: 1,
                    flexBasis: '28%',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                    borderRadius: 16,
                    backgroundColor: colors.canvas,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.textPrimary : colors.canvas,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      backgroundColor: theme.color,
                      borderWidth: 0,
                      borderColor: colors.textPrimary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={22} color={getContrastTextColor(theme.color)} />
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

        <GroupTitle label="Mon compte" />
        <Button
          title="Se déconnecter"
          onPress={handleSignOut}
          variant="ghost"
          style={{ backgroundColor: colors.surface }}
          textStyle={{ color: colors.error }}
          icon={<Ionicons name="log-out-outline" size={20} color={colors.error} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
