import React from 'react';
import { Stack } from 'expo-router';
import { usePageTransitions } from '@/hooks/usePageTransitions';

export default function AuthLayout() {
  const { stackOptions } = usePageTransitions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
