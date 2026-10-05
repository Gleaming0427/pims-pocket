import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import colors from '@/constants/colors';

const TRANSITION_DURATION = 200;

export function usePageTransitions() {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      preferenceChanged = true;
      setReduceMotion(enabled);
    });

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active && !preferenceChanged) setReduceMotion(enabled);
    }).catch(() => {});

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return useMemo(() => {
    const stackOptions: NativeStackNavigationOptions = {
      headerShown: false,
      animation: reduceMotion ? 'none' : 'fade',
      animationDuration: reduceMotion ? 0 : TRANSITION_DURATION,
      contentStyle: { backgroundColor: colors.canvas },
    };

    const tabOptions: BottomTabNavigationOptions = {
      headerShown: false,
      animation: reduceMotion ? 'none' : 'fade',
      transitionSpec: {
        animation: 'timing',
        config: {
          duration: reduceMotion ? 0 : TRANSITION_DURATION,
          easing: Easing.out(Easing.cubic),
        },
      },
      sceneStyle: { backgroundColor: colors.canvas },
    };

    return { stackOptions, tabOptions };
  }, [reduceMotion]);
}
