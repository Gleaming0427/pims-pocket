import React, { useEffect, useRef } from 'react';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@/hooks/useAuth';
import { usePageTransitions } from '@/hooks/usePageTransitions';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { initSentry } from '@/lib/sentry';
import colors from '@/constants/colors';
import '../global.css';

initSentry();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading } = useAuth();
  const { stackOptions } = usePageTransitions();
  const segments = useSegments();
  const splashHidden = useRef(false);
  const hasDestination = segments.length > 0 && segments[0] !== 'index';

  useEffect(() => {
    if (isLoading || !hasDestination || splashHidden.current) return;
    const frame = requestAnimationFrame(() => {
      SplashScreen.hideAsync().then(() => {
        splashHidden.current = true;
      }).catch(() => {});
    });
    return () => cancelAnimationFrame(frame);
  }, [isLoading, hasDestination]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
        <StatusBar style="dark" />
        <Stack screenOptions={stackOptions}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(legal)" />
          <Stack.Screen name="(parent)" />
          <Stack.Screen name="(child)" />
          <Stack.Screen name="notifications" />
        </Stack>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
