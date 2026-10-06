import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import colors from '@/constants/colors';

interface AvatarArtworkProps {
  avatarId: string;
  size?: number;
}

function FaceFeatures({ eyeY = 31, noseY = 40 }: { eyeY?: number; noseY?: number }) {
  return (
    <>
      <Circle cx="24" cy={eyeY} r="2.5" fill={colors.textPrimary} />
      <Circle cx="40" cy={eyeY} r="2.5" fill={colors.textPrimary} />
      <Circle cx="23.4" cy={eyeY - 0.7} r="0.8" fill={colors.surface} />
      <Circle cx="39.4" cy={eyeY - 0.7} r="0.8" fill={colors.surface} />
      <Ellipse cx="32" cy={noseY} rx="3.4" ry="2.3" fill={colors.textPrimary} />
      <Path
        d={`M32 ${noseY + 2}V${noseY + 4}M26 ${noseY + 4}Q29 ${noseY + 9} 32 ${noseY + 4}Q35 ${noseY + 9} 38 ${noseY + 4}`}
        fill="none"
        stroke={colors.textPrimary}
        strokeWidth="1.8"
      />
    </>
  );
}

export default function AvatarArtwork({ avatarId, size = 40 }: AvatarArtworkProps) {
  let artwork: React.ReactNode;

  switch (avatarId) {
    case 'cat':
      artwork = (
        <>
          <Path d="M11 28 9 9Q9 5 13 8L25 18H39L51 8Q55 5 55 9L53 28Z" fill={colors.primary} />
          <Path d="M14 13 16 26 25 21ZM50 13 48 26 39 21Z" fill={colors.avatarPink} />
          <Path d="M11 31C11 15 53 15 53 31V38C53 51 43 57 32 57S11 51 11 38Z" fill={colors.primaryLight} />
          <Path d="m27 19 2 6m8-6-2 6" stroke={colors.primary} strokeWidth="2.5" />
          <Ellipse cx="32" cy="43" rx="13" ry="10" fill={colors.surface} />
          <FaceFeatures />
          <Path d="m16 38-8-2m8 7H7m41-5 8-2m-8 7h9" stroke={colors.primaryDark} strokeWidth="1.8" fill="none" />
        </>
      );
      break;
    case 'dog':
      artwork = (
        <>
          <Path d="M18 15C8 11 4 27 6 39 7 47 17 47 20 38ZM46 15C56 11 60 27 58 39 57 47 47 47 44 38Z" fill={colors.primary} />
          <Path d="M14 29C14 7 50 7 50 29V39C50 52 43 58 32 58S14 52 14 39Z" fill={colors.info} />
          <Ellipse cx="39" cy="29" rx="8" ry="10" fill={colors.primaryLight} />
          <Ellipse cx="32" cy="44" rx="13" ry="10" fill={colors.surface} />
          <Path d="M28 47H36V51C36 57 28 57 28 51Z" fill={colors.avatarPink} />
          <FaceFeatures />
        </>
      );
      break;
    case 'unicorn':
      artwork = (
        <>
          <Path d="M17 27 12 12Q11 7 16 10L28 23M39 24 46 10Q49 6 51 12L50 31" fill={colors.primaryLight} />
          <Path d="M15 17 19 25 23 23M46 17 43 25 48 25" fill={colors.avatarPink} />
          <Path d="M43 20C58 26 60 48 49 58L36 49Z" fill={colors.primary} />
          <Path d="M17 34C17 17 46 16 47 33L49 44C50 54 42 59 32 59S14 54 15 44Z" fill={colors.surface} />
          <Path d="M27 22 31 5Q32 2 34 5L38 22Z" fill={colors.starGold} />
          <Path d="m29 15 7-2m-8 7 9-2" stroke={colors.accentOrange} strokeWidth="1.8" />
          <Path d="M16 34C12 21 25 17 32 22 41 15 50 21 49 31 43 30 40 28 37 26 30 35 25 34 24 27Z" fill={colors.avatarPink} />
          <Ellipse cx="32" cy="48" rx="14" ry="9" fill={colors.avatarPink} opacity="0.3" />
          <Circle cx="24" cy="37" r="2.5" fill={colors.textPrimary} />
          <Circle cx="40" cy="37" r="2.5" fill={colors.textPrimary} />
          <Circle cx="27" cy="47" r="1.5" fill={colors.primaryDark} />
          <Circle cx="37" cy="47" r="1.5" fill={colors.primaryDark} />
          <Path d="M28 52Q32 55 36 52" stroke={colors.primaryDark} strokeWidth="1.8" fill="none" />
        </>
      );
      break;
    case 'dragon':
      artwork = (
        <>
          <Path d="M19 22 10 7Q9 4 13 6L27 18M45 22 54 7Q55 4 51 6L37 18" fill={colors.starGold} />
          <Path d="m14 25-10-3 5 10-5 6 12 4m34-17 10-3-5 10 5 6-12 4" fill={colors.success} />
          <Rect x="13" y="16" width="38" height="39" rx="17" fill={colors.secondary} />
          <Path d="m26 19 6-12 6 12" fill={colors.success} />
          <Ellipse cx="32" cy="44" rx="20" ry="13" fill={colors.success} />
          <Circle cx="24" cy="31" r="2.5" fill={colors.textPrimary} />
          <Circle cx="40" cy="31" r="2.5" fill={colors.textPrimary} />
          <Circle cx="25" cy="41" r="2" fill={colors.textPrimary} />
          <Circle cx="39" cy="41" r="2" fill={colors.textPrimary} />
          <Path d="M22 48Q32 56 42 48" stroke={colors.textPrimary} strokeWidth="2" fill="none" />
          <Path d="m24 50 3 5 3-3m4 0 3 3 3-5" fill={colors.surface} />
        </>
      );
      break;
    case 'panda':
      artwork = (
        <>
          <Circle cx="15" cy="17" r="10" fill={colors.textPrimary} />
          <Circle cx="49" cy="17" r="10" fill={colors.textPrimary} />
          <Ellipse cx="32" cy="35" rx="25" ry="23" fill={colors.surface} />
          <Ellipse cx="23" cy="32" rx="8" ry="10" rotation="25" origin="23, 32" fill={colors.textSecondary} />
          <Ellipse cx="41" cy="32" rx="8" ry="10" rotation="-25" origin="41, 32" fill={colors.textSecondary} />
          <Ellipse cx="16" cy="43" rx="4" ry="2.5" fill={colors.avatarPink} opacity="0.35" />
          <Ellipse cx="48" cy="43" rx="4" ry="2.5" fill={colors.avatarPink} opacity="0.35" />
          <FaceFeatures eyeY={32} noseY={43} />
        </>
      );
      break;
    case 'fox':
      artwork = (
        <>
          <Path d="M11 30 9 7Q9 3 13 6L29 20H35L51 6Q55 3 55 7L53 30Z" fill={colors.accentOrange} />
          <Path d="m15 12 2 16 9-7m23-9-2 16-9-7" fill={colors.textPrimary} />
          <Path d="M8 30C14 15 50 15 56 30L52 43 36 57Q32 60 28 57L12 43Z" fill={colors.accentOrange} />
          <Path d="M8 30C20 31 27 36 32 45 37 36 44 31 56 30L51 43 36 57Q32 60 28 57L13 43Z" fill={colors.surface} />
          <FaceFeatures eyeY={32} noseY={46} />
        </>
      );
      break;
    case 'rabbit':
      artwork = (
        <>
          <Ellipse cx="21" cy="19" rx="8" ry="17" rotation="-10" origin="21, 19" fill={colors.surface} />
          <Ellipse cx="43" cy="19" rx="8" ry="17" rotation="10" origin="43, 19" fill={colors.surface} />
          <Ellipse cx="21" cy="17" rx="3.5" ry="11" rotation="-10" origin="21, 17" fill={colors.avatarPink} opacity="0.6" />
          <Ellipse cx="43" cy="17" rx="3.5" ry="11" rotation="10" origin="43, 17" fill={colors.avatarPink} opacity="0.6" />
          <Ellipse cx="32" cy="41" rx="22" ry="19" fill={colors.surface} />
          <Ellipse cx="18" cy="44" rx="4" ry="2.5" fill={colors.avatarPink} opacity="0.35" />
          <Ellipse cx="46" cy="44" rx="4" ry="2.5" fill={colors.avatarPink} opacity="0.35" />
          <FaceFeatures eyeY={37} noseY={46} />
        </>
      );
      break;
    case 'owl':
      artwork = (
        <>
          <Path d="M12 28 10 10Q10 6 14 9L25 17H39L50 9Q54 6 54 10L52 28V39C52 54 42 59 32 59S12 54 12 39Z" fill={colors.primary} />
          <Path d="M13 31C2 34 5 48 16 51M51 31C62 34 59 48 48 51" fill={colors.primaryLight} />
          <Ellipse cx="32" cy="44" rx="13" ry="12" fill={colors.primaryLight} />
          <Circle cx="23" cy="30" r="11" fill={colors.surface} />
          <Circle cx="41" cy="30" r="11" fill={colors.surface} />
          <Circle cx="24" cy="31" r="4.5" fill={colors.textPrimary} />
          <Circle cx="40" cy="31" r="4.5" fill={colors.textPrimary} />
          <Circle cx="23" cy="29.5" r="1.5" fill={colors.surface} />
          <Circle cx="39" cy="29.5" r="1.5" fill={colors.surface} />
          <Path d="m28 39 4-3 4 3-4 6Z" fill={colors.accentOrange} />
          <Path d="m25 49 2 2m5-2 2 2m5-2 2 2" stroke={colors.primary} strokeWidth="2" />
          <Path d="M21 58H28M36 58H43" stroke={colors.accentOrange} strokeWidth="4" />
        </>
      );
      break;
    case 'dolphin':
      artwork = (
        <>
          <Path d="M25 20C27 10 36 8 39 9L36 21" fill={colors.secondary} />
          <Path d="M16 28C22 12 43 13 51 27 55 35 51 44 49 47L57 47 60 55 50 52 43 58 44 46C35 47 28 40 23 36L10 37Q3 37 5 33Z" fill={colors.info} />
          <Path d="M13 33C24 32 26 35 32 40 38 45 43 45 47 43 41 51 29 44 23 38L10 38Q5 37 6 34Z" fill={colors.surface} />
          <Path d="M30 34C31 44 38 47 41 47L39 35" fill={colors.secondary} />
          <Circle cx="23" cy="27" r="2.8" fill={colors.textPrimary} />
          <Circle cx="22.3" cy="26.2" r="0.8" fill={colors.surface} />
          <Path d="M12 34Q19 36 23 33" stroke={colors.textPrimary} strokeWidth="1.8" fill="none" />
          <Circle cx="10" cy="18" r="3" fill={colors.secondary} opacity="0.45" />
          <Circle cx="16" cy="9" r="2" fill={colors.info} opacity="0.6" />
        </>
      );
      break;
    case 'butterfly':
      artwork = (
        <>
          <Path d="M30 30C21 6 4 6 5 24 5 38 19 42 30 35Z" fill={colors.primaryLight} />
          <Path d="M34 30C43 6 60 6 59 24 59 38 45 42 34 35Z" fill={colors.info} />
          <Path d="M30 34C9 31 7 49 15 55 25 61 32 48 32 40Z" fill={colors.avatarPink} />
          <Path d="M34 34C55 31 57 49 49 55 39 61 32 48 32 40Z" fill={colors.primary} />
          <Ellipse cx="17" cy="24" rx="5" ry="7" rotation="-30" origin="17, 24" fill={colors.surface} opacity="0.6" />
          <Ellipse cx="47" cy="24" rx="5" ry="7" rotation="30" origin="47, 24" fill={colors.surface} opacity="0.6" />
          <Circle cx="21" cy="46" r="4" fill={colors.starGold} />
          <Circle cx="43" cy="46" r="4" fill={colors.starGold} />
          <Path d="M30 22Q24 12 23 16M34 22Q40 12 41 16" stroke={colors.primaryDark} strokeWidth="2.5" fill="none" />
          <Rect x="28" y="24" width="8" height="28" rx="4" fill={colors.primaryDark} />
          <Circle cx="32" cy="25" r="6" fill={colors.primaryDark} />
        </>
      );
      break;
    case 'rocket':
      artwork = (
        <>
          <Path d="M25 46Q20 55 32 62 44 55 39 46Z" fill={colors.accentOrange} />
          <Path d="M28 47Q27 55 32 58 37 55 36 47Z" fill={colors.starGold} />
          <Path d="M20 30C9 35 8 42 10 50L24 43M44 30C55 35 56 42 54 50L40 43" fill={colors.primaryLight} />
          <Path d="M21 46C12 25 22 8 32 3 42 8 52 25 43 46Z" fill={colors.surface} />
          <Path d="M22 13Q25 7 32 3 39 7 42 13Z" fill={colors.error} />
          <Circle cx="32" cy="28" r="9" fill={colors.primary} />
          <Circle cx="32" cy="28" r="6" fill={colors.info} />
          <Path d="M29 26Q30 24 32 24" stroke={colors.surface} strokeWidth="2" fill="none" />
          <Rect x="21" y="43" width="22" height="6" rx="3" fill={colors.primary} />
          <Path d="M7 16V22M4 19H10M55 10V16M52 13H58" stroke={colors.starGold} strokeWidth="2" />
        </>
      );
      break;
    case 'lion':
    default:
      artwork = (
        <>
          <Path d="M32 4C38 1 44 7 47 10 56 10 60 16 58 23 65 31 60 39 56 42 57 52 48 57 42 55 36 63 28 63 22 55 14 57 6 51 8 42 1 36 2 28 6 23 4 14 11 9 18 10 22 4 27 2 32 4Z" fill={colors.accentOrange} />
          <Circle cx="17" cy="22" r="7" fill={colors.accent} />
          <Circle cx="47" cy="22" r="7" fill={colors.accent} />
          <Circle cx="17" cy="22" r="3" fill={colors.avatarPink} opacity="0.55" />
          <Circle cx="47" cy="22" r="3" fill={colors.avatarPink} opacity="0.55" />
          <Ellipse cx="32" cy="34" rx="19" ry="22" fill={colors.starGold} />
          <Ellipse cx="32" cy="43" rx="13" ry="10" fill={colors.surface} />
          <Path d="m26 14 6 5 6-5" fill={colors.accentOrange} />
          <FaceFeatures />
        </>
      );
      break;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false} pointerEvents="none">
      <G strokeLinecap="round" strokeLinejoin="round">
        {artwork}
      </G>
    </Svg>
  );
}
