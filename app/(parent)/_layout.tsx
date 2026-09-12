import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useMissions } from '@/hooks/useMissions';
import Badge from '@/components/ui/Badge';
import { View } from 'react-native';

export default function ParentLayout() {
  const { getPendingValidations } = useMissions();
  const pendingCount = getPendingValidations().length;
  const insets = useSafeAreaInsets();

  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="validations"
        options={{
          title: 'Validations',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="checkmark-circle" size={size} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
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
      <Tabs.Screen name="remove-money" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
    </Tabs>
  );
}
