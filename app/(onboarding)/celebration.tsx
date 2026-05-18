import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import colors from '@/constants/colors';

export default function CelebrationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 80, marginBottom: 16 }}>🎉</Text>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '800',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        Félicitations !
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 8,
        }}
      >
        Votre premier enfant a été créé.
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 32,
        }}
      >
        Emma a déjà sa tirelire et peut commencer à gagner des missions&nbsp;!
      </Text>
      <Button
        title="Découvrir le tableau de bord"
        onPress={() => router.replace('/(parent)/dashboard')}
      />
    </SafeAreaView>
  );
}
