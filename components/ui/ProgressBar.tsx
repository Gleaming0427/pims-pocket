import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import colors from '@/constants/colors';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  showPercentage?: boolean;
  label?: string;
  style?: ViewStyle;
  animated?: boolean;
}

export default function ProgressBar({
  progress,
  color = colors.primary,
  backgroundColor = colors.border,
  height = 12,
  showPercentage = false,
  label,
  style,
  animated = true,
}: ProgressBarProps) {
  const n = Number(progress);
  const clampedProgress = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
  const barHeight =
    typeof height === 'number' && Number.isFinite(height) && height > 0 ? height : 12;
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      animatedWidth.value = withDelay(200, withTiming(clampedProgress, { duration: 800 }));
    } else {
      animatedWidth.value = clampedProgress;
    }
  }, [clampedProgress, animated]);

  const barStyle = useAnimatedStyle(() => {
    'worklet';
    const p = animatedWidth.value;
    const safe = typeof p === 'number' && Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
    return { width: `${safe * 100}%` };
  });

  return (
    <View style={style}>
      {(label || showPercentage) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          {label && (
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
              {Math.round(clampedProgress * 100)}%
            </Text>
          )}
        </View>
      )}
      <View
        style={{
          height: barHeight,
          backgroundColor,
          borderRadius: barHeight / 2,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              backgroundColor: color,
              borderRadius: barHeight / 2,
            },
            barStyle,
          ]}
        />
      </View>
    </View>
  );
}
