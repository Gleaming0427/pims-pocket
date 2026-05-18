import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import LoadingScreen from '@/components/shared/LoadingScreen';

export default function Index() {
  const { isLoading, isAuthenticated, user } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (user.role === 'child') {
    return <Redirect href="/(child)/dashboard" />;
  }

  if (user.role === 'parent' && user.hasCompletedOnboarding === false) {
    return <Redirect href="/(onboarding)/tutorial" />;
  }

  return <Redirect href="/(parent)/dashboard" />;
}
