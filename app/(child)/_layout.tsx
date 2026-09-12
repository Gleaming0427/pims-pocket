import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMissions } from '@/hooks/useMissions';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { useChildThemeStore } from '@/stores/childThemeStore';
import { isThemeColor } from '@/constants/childThemes';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import colors from '@/constants/colors';

export default function ChildLayout() {
  const insets = useSafeAreaInsets();
  const { missions } = useMissions();
  const user = useAuthStore((s) => s.user);
  const accent = useChildThemeStore((s) => s.accent);
  const setAccent = useChildThemeStore((s) => s.setAccent);

  // Charge la gemme choisie par l'enfant (champ themeColor sur son document)
  useEffect(() => {
    if (!user?.familyId || !user?.childDocId) return;
    const ref = doc(db, 'families', user.familyId, 'children', user.childDocId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const color = snap.data()?.themeColor;
        if (isThemeColor(color)) setAccent(color);
      },
      () => {}
    );
    return () => unsub();
  }, [user?.familyId, user?.childDocId]);
  // Missions à faire : pastille sur l'onglet Missions
  const availableCount = missions.filter(
    (m) => m.status === 'available' || m.status === 'in_progress'
  ).length;

  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Ma Tirelire',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Missions',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="flash" size={size} color={color} />
              {availableCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -8 }}>
                  <Badge count={availableCount} />
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{
          title: 'Objectifs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          title: 'Badges',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="goals/create" options={{ href: null }} />
      <Tabs.Screen name="ask-money" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}
