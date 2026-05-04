import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: _w, height: _h } = Dimensions.get('window');
const SCREEN_WIDTH = Math.max(1, _w);
const SCREEN_HEIGHT = Math.max(1, _h);

interface CoinProps {
  index: number;
  onFinish?: () => void;
}

function Coin({ index, onFinish }: CoinProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const delay = index * 100;

    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT * 0.6, {
        duration: 1500 + Math.random() * 500,
        easing: Easing.in(Easing.quad),
      })
    );

    translateX.value = withDelay(
      delay,
      withTiming(translateX.value + (Math.random() - 0.5) * 100, { duration: 1500 })
    );

    rotate.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1500 })
    );

    opacity.value = withDelay(
      delay + 1200,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && index === 0 && onFinish) {
          runOnJS(onFinish)();
        }
      })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: SCREEN_WIDTH / 2,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 32 }}>🪙</Text>
    </Animated.View>
  );
}

interface MoneyAnimationProps {
  visible: boolean;
  onFinish?: () => void;
  coinCount?: number;
}

export default function MoneyAnimation({
  visible,
  onFinish,
  coinCount = 12,
}: MoneyAnimationProps) {
  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: coinCount }).map((_, i) => (
        <Coin key={i} index={i} onFinish={i === 0 ? onFinish : undefined} />
      ))}
    </View>
  );
}
