import React from 'react';
import { Stack } from 'expo-router';
import { usePageTransitions } from '@/hooks/usePageTransitions';

export default function LegalLayout() {
  const { stackOptions } = usePageTransitions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}
