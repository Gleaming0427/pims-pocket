import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useMissions } from '@/hooks/useMissions';
import { usePageTransitions } from '@/hooks/usePageTransitions';
import Badge from '@/components/ui/Badge';
import { View } from 'react-native';

export default function ParentLayout() {
  const { tabOptions } = usePageTransitions();
  const { getPendingValidations } = useMissions();
  const pendingCount = getPendingValidations().length;
  const insets = useSafeAreaInsets();

  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        ...tabOptions,
        tabBarActiveTintColor: colors.primary,
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
          title: 'Accueil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="validations"
        options={{
          title: 'Validations',
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={size} color={color} />
              {pendingCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -8 }}>
                  <Badge count={pendingCount} />
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="send-money" options={{ href: null }} />
      <Tabs.Screen name="recurring" options={{ href: null }} />
      <Tabs.Screen name="child/[id]" options={{ href: null }} />
      <Tabs.Screen name="child/add" options={{ href: null }} />
      <Tabs.Screen name="child/edit" options={{ href: null }} />
      <Tabs.Screen name="missions/index" options={{ href: null }} />
      <Tabs.Screen name="missions/create" options={{ href: null }} />
      <Tabs.Screen name="notification-settings" options={{ href: null }} />
      <Tabs.Screen name="security" options={{ href: null }} />
      <Tabs.Screen name="family-parents" options={{ href: null }} />
      <Tabs.Screen name="remove-money" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
    </Tabs>
  );
}
