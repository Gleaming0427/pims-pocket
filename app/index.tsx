import React, { useEffect } from 'react';
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

  return <Redirect href="/(parent)/dashboard" />;
}
