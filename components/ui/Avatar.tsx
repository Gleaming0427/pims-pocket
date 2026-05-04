import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import avatars from '@/constants/avatars';

interface AvatarProps {
  avatarId: string;
  size?: number;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
}

export default function Avatar({
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
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: avatar.color + '30',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: selected ? 3 : 0,
          borderColor: avatar.color,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: dim * 0.5 }}>{avatar.emoji}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
