import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import colors from '@/constants/colors';

interface BadgeArtworkProps {
  badgeId: string;
  size?: number;
  locked?: boolean;
}

export default function BadgeArtwork({ badgeId, size = 64, locked = false }: BadgeArtworkProps) {
  const ink = locked ? colors.textSecondary : colors.textPrimary;
  const gold = locked ? colors.canvasMuted : colors.starGold;
  const teal = locked ? colors.canvasMuted : colors.secondary;
  const violet = locked ? colors.textLight : colors.primaryLight;
  const orange = locked ? colors.textLight : colors.accentOrange;
  let artwork: React.ReactNode;

  switch (badgeId) {
    case 'first_saver':
      artwork = (
        <>
          <Path d="M18 28 17 19 28 24C36 20 47 25 50 33L56 34V44L49 46 46 54H39L38 49H27L25 54H18L16 45C8 39 10 30 18 28Z" fill={teal} />
          <Path d="M12 34C5 35 5 27 9 28" fill="none" />
          <Path d="M27 28H37" />
          <Circle cx="44" cy="34" r="1.5" fill={ink} stroke="none" />
          <Circle cx="32" cy="13" r="8" fill={gold} />
          <Path d="M32 9V17" />
          <Path d="M19 35C19 32 21 30 23 30" stroke={colors.surface} fill="none" />
        </>
      );
      break;
    case 'streak_5':
      artwork = (
        <>
          <Path d="M34 6C38 21 49 22 50 37 52 49 43 57 32 57S12 49 14 37C15 28 23 23 23 16L30 25C34 19 35 13 34 6Z" fill={orange} />
          <Path d="M33 30C34 37 41 38 40 45 40 50 37 53 32 53S23 49 24 44C25 39 30 37 33 30Z" fill={gold} />
          <Path d="M20 34 18 40" stroke={colors.surface} />
          <Path d="M49 12V20M45 16H53" stroke={violet} />
        </>
      );
      break;
    case 'super_saver':
      artwork = (
        <>
          <Path d="M19 15H9V24C9 31 16 34 23 34M45 15H55V24C55 31 48 34 41 34" fill="none" stroke={orange} strokeWidth="4" />
          <Path d="M18 10H46V26C46 36 40 41 32 41S18 36 18 26Z" fill={gold} />
          <Path d="M28 41V49H36V41" fill={orange} />
          <Rect x="21" y="49" width="22" height="8" rx="3" fill={violet} />
          <Path d="m32 17 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9Z" fill={orange} strokeWidth="1.5" />
          <Path d="M23 15V24" stroke={colors.surface} />
        </>
      );
      break;
    case 'regular':
      artwork = (
        <>
          <Rect x="10" y="13" width="44" height="42" rx="8" fill={colors.surface} />
          <Path d="M10 25V21Q10 13 18 13H46Q54 13 54 21V25Z" fill={violet} />
          <Path d="M22 8V18M42 8V18" />
          <G stroke={ink} strokeWidth="2.5">
            <Path d="m18 33 3 3 5-6m11 3 3 3 5-6m-27 14 3 3 5-6" fill="none" />
          </G>
          <Circle cx="43" cy="46" r="11" fill={gold} />
          <Path d="m38 46 3 3 6-7" fill="none" />
        </>
      );
      break;
    case 'goal_reached':
      artwork = (
        <>
          <Circle cx="29" cy="35" r="22" fill={teal} />
          <Circle cx="29" cy="35" r="14" fill={colors.surface} />
          <Circle cx="29" cy="35" r="6" fill={gold} />
          <Path d="m29 35 19-19" fill="none" strokeWidth="3" />
          <Path d="M44 20V11L52 5V13H60L53 21Z" fill={violet} />
          <Path d="M13 31C14 27 16 24 19 22" stroke={colors.surface} fill="none" />
        </>
      );
      break;
    case 'collector':
      artwork = (
        <>
          <Path d="M15 17H49L58 30 32 57 6 30Z" fill={violet} />
          <Path d="m15 17 8 13 9-13 9 13 8-13M6 30H58M23 30 32 57 41 30" fill="none" />
          <Path d="m32 17 9 13H23Z" fill={colors.surface} stroke="none" />
          <Path d="M12 5V11M9 8H15M53 43V51M49 47H57" stroke={orange} />
        </>
      );
      break;
    default:
      artwork = (
        <>
          <Path d="m20 40-5 18 11-4 7 6 3-19M35 41l4 18 7-6 10 2-9-19" fill={violet} />
          <Circle cx="32" cy="28" r="22" fill={gold} />
          <Circle cx="32" cy="28" r="17" fill="none" stroke={orange} strokeWidth="1.5" />
          <Path d="m32 15 3.8 8 8.8 1.3-6.3 6.1 1.5 8.7-7.8-4.1-7.8 4.1 1.5-8.7-6.3-6.1 8.8-1.3Z" fill={orange} strokeWidth="1.5" />
          <Path d="M16 22C17 18 20 15 23 14" fill="none" stroke={colors.surface} />
        </>
      );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      <Ellipse cx="32" cy="59" rx="20" ry="3" fill={colors.textPrimary} opacity="0.08" />
      <G stroke={ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {artwork}
      </G>
    </Svg>
  );
}
