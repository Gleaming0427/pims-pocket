import React, { useId } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import colors from '@/constants/colors';

type ParentArtworkName = 'transfer' | 'mission' | 'validation' | 'family' | 'savings' | 'history';

interface ParentArtworkProps {
  name: ParentArtworkName;
  size?: number;
}

export default function ParentArtwork({ name, size = 56 }: ParentArtworkProps) {
  const artworkId = useId().replace(/:/g, '');
  const blueId = `${artworkId}-blue`;
  const violetId = `${artworkId}-violet`;
  const goldId = `${artworkId}-gold`;
  const mintId = `${artworkId}-mint`;
  const blue = `url(#${blueId})`;
  const violet = `url(#${violetId})`;
  const gold = `url(#${goldId})`;
  const mint = `url(#${mintId})`;
  let artwork: React.ReactNode;

  switch (name) {
    case 'transfer':
      artwork = (
        <>
          <Circle cx="26" cy="17" r="11" fill={gold} />
          <Path d="M26 12V22M22 15H29M22 19H29" stroke={colors.surface} strokeWidth="2" />
          <Rect x="7" y="23" width="48" height="33" rx="11" fill={blue} />
          <Path d="M16 28H40" stroke={colors.surface} strokeOpacity="0.55" strokeWidth="3" />
          <Rect x="35" y="34" width="24" height="16" rx="7" fill={mint} />
          <Path d="M41 42H52M48 38L52 42 48 46" stroke={colors.surface} strokeWidth="2.8" fill="none" />
        </>
      );
      break;
    case 'mission':
      artwork = (
        <>
          <Path d="M17 56V13" stroke={colors.primaryLight} strokeWidth="7" />
          <Path d="M20 11C32 6 41 20 55 13V37C41 44 32 30 20 35Z" fill={gold} />
          <Path d="M35 16 38 22 45 24 40 28 40 34 34 31 29 33 29 26 26 22 32 22Z" fill={colors.surface} />
          <Rect x="8" y="52" width="26" height="7" rx="3.5" fill={violet} />
          <Path d="M51 47V55M47 51H55" stroke={colors.secondary} strokeWidth="3" />
        </>
      );
      break;
    case 'validation':
      artwork = (
        <>
          <Rect x="11" y="10" width="42" height="49" rx="12" fill={mint} />
          <Rect x="23" y="5" width="18" height="11" rx="5.5" fill={colors.primaryLight} />
          <Path d="M23 32 30 39 43 25" stroke={colors.surface} strokeWidth="5" fill="none" />
          <Path d="M24 48H40" stroke={colors.surface} strokeOpacity="0.65" strokeWidth="3" />
          <Circle cx="53" cy="14" r="7" fill={gold} />
        </>
      );
      break;
    case 'family':
      artwork = (
        <>
          <Rect x="5" y="29" width="28" height="28" rx="12" fill={blue} />
          <Circle cx="19" cy="19" r="10" fill={blue} />
          <Rect x="31" y="29" width="28" height="28" rx="12" fill={violet} />
          <Circle cx="45" cy="19" r="10" fill={violet} />
          <Rect x="21" y="43" width="22" height="18" rx="9" fill={gold} />
          <Circle cx="32" cy="36" r="8" fill={gold} />
          <Path d="M29 51Q32 55 35 51" stroke={colors.surface} strokeWidth="2.5" fill="none" />
        </>
      );
      break;
    case 'savings':
      artwork = (
        <>
          <Rect x="7" y="43" width="32" height="15" rx="7" fill={gold} />
          <Rect x="7" y="32" width="32" height="15" rx="7" fill={gold} />
          <Path d="M13 37H32M13 48H32" stroke={colors.surface} strokeOpacity="0.55" strokeWidth="2.5" />
          <Circle cx="44" cy="46" r="14" fill={violet} />
          <Path d="M44 48V25" stroke={colors.success} strokeWidth="3" />
          <Path d="M44 30C30 31 29 21 29 17 40 16 45 22 44 30Z" fill={mint} />
          <Path d="M44 25C44 13 51 8 60 9 61 18 56 26 44 25Z" fill={mint} />
          <Path d="M12 13V21M8 17H16" stroke={colors.primaryLight} strokeWidth="3" />
        </>
      );
      break;
    case 'history':
      artwork = (
        <>
          <Rect x="10" y="6" width="37" height="49" rx="11" fill={blue} />
          <Path d="M20 19H36M20 28H36M20 37H28" stroke={colors.surface} strokeWidth="3.5" />
          <Circle cx="44" cy="44" r="16" fill={violet} />
          <Path d="M44 35V44L50 48" stroke={colors.surface} strokeWidth="3.5" fill="none" />
          <Circle cx="49" cy="12" r="5" fill={gold} />
        </>
      );
      break;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false} pointerEvents="none">
      <Defs>
        <LinearGradient id={blueId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={colors.info} />
          <Stop offset="1" stopColor={colors.primaryLight} />
        </LinearGradient>
        <LinearGradient id={violetId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={colors.primaryLight} />
          <Stop offset="1" stopColor={colors.primary} />
        </LinearGradient>
        <LinearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={colors.starGold} />
          <Stop offset="1" stopColor={colors.accentOrange} />
        </LinearGradient>
        <LinearGradient id={mintId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={colors.secondary} />
          <Stop offset="1" stopColor={colors.success} />
        </LinearGradient>
      </Defs>
      <G strokeLinecap="round" strokeLinejoin="round">
        {artwork}
      </G>
    </Svg>
  );
}
