import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { formatCurrencyShort } from '@/utils/formatters';
import { useResponsive } from '@/hooks/useResponsive';
import colors from '@/constants/colors';

interface PiggyBankProps {
  balance: number;
  maxBalance?: number;
}

const PiggyBank = React.memo(function PiggyBank({ balance, maxBalance = 10000 }: PiggyBankProps) {
  const { isTablet } = useResponsive();
  const SIZE = isTablet ? 240 : 160;
  const RADIUS = SIZE / 2;
  const PRICE_FONT = isTablet ? 52 : 36;
  const LABEL_FONT = isTablet ? 18 : 15;

  const fillLevel = useSharedValue(0);
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);

  const safeMax = maxBalance > 0 ? maxBalance : 1;
  const fillPercent = Math.min(1, Math.max(0, (Number.isFinite(balance) ? balance : 0) / safeMax));

  useEffect(() => {
    fillLevel.value = withTiming(fillPercent, { duration: 1200, easing: Easing.out(Easing.cubic) });
    scale.value = withSequence(
      withSpring(1.05, { damping: 3 }),
      withSpring(1, { damping: 8 })
    );
    bounce.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1500 }),
        withTiming(4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [balance, fillPercent, safeMax]);

  const piggyStyle = useAnimatedStyle(() => {
    'worklet';
    const s = scale.value;
    const t = bounce.value;
    const safeScale = typeof s === 'number' && Number.isFinite(s) ? s : 1;
    const safeY = typeof t === 'number' && Number.isFinite(t) ? t : 0;
    return {
      transform: [{ scale: safeScale }, { translateY: safeY }],
    };
  });

  const fillStyle = useAnimatedStyle(() => {
    'worklet';
    const v = fillLevel.value;
    const pct = typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
    return { height: `${pct * 100}%` };
  });

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <Animated.View style={piggyStyle}>
        <View
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: RADIUS,
            backgroundColor: colors.piggyPink + '20',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.piggyPink + '40',
                borderRadius: RADIUS,
              },
              fillStyle,
            ]}
          />
          <Image
            source={require('@/assets/icon.png')}
            style={{ width: SIZE, height: SIZE, borderRadius: RADIUS }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      <Text
        style={{
          fontSize: PRICE_FONT,
          fontWeight: '900',
          color: colors.primary,
          marginTop: 16,
        }}
      >
        {formatCurrencyShort(balance)}
      </Text>
      <Text
        style={{
          fontSize: LABEL_FONT,
          color: colors.textSecondary,
          marginTop: 4,
        }}
      >
        Mon solde
      </Text>
    </View>
  );
});
export default PiggyBank;
