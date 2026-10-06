import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import colors from '@/constants/colors';

export default function CoinArtwork({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessible={false}>
      <Circle cx="16" cy="16" r="15" fill={colors.accentOrange} />
      <Circle cx="16" cy="15" r="13" fill={colors.starGold} />
      <Circle cx="16" cy="15" r="10" fill="none" stroke={colors.accentOrange} strokeWidth="1.5" />
      <Path d="M21 10C15 6 10 10 10 15S15 24 21 20M8 13H18M8 17H18" fill="none" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
