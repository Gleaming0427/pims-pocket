import React from 'react';
import { Stack } from 'expo-router';
import { usePageTransitions } from '@/hooks/usePageTransitions';

export default function OnboardingLayout() {
  const { stackOptions } = usePageTransitions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="tutorial" />
      <Stack.Screen name="celebration" />
    </Stack>
  );
}
