import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import avatars from '@/constants/avatars';
import AvatarArtwork from '@/components/ui/AvatarArtwork';
import { getReadableAccent } from '@/utils/colorContrast';

interface AvatarProps {
  avatarId: string;
  size?: number;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
}

const Avatar = React.memo(function Avatar({
  avatarId,
  size = 48,
  onPress,
  selected = false,
  style,
}: AvatarProps) {
  const avatar = avatars.find((a) => a.id === avatarId) ?? avatars[0];
  const dim = typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : 48;

  const content = (
    <View
      accessible={!onPress}
      accessibilityRole="image"
      accessibilityLabel={`Avatar ${avatar.name}`}
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: avatar.color + '30',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: selected ? 3 : 0,
          borderColor: selected ? getReadableAccent(avatar.color) : avatar.color,
        },
        style,
      ]}
    >
      <AvatarArtwork avatarId={avatar.id} size={dim * 0.82} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Choisir l’avatar ${avatar.name}`}
        accessibilityState={{ selected }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
});
export default Avatar;
