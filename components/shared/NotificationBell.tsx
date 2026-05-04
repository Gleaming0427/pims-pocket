import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '@/components/ui/Badge';
import colors from '@/constants/colors';

interface NotificationBellProps {
  count: number;
  onPress: () => void;
}

export default function NotificationBell({ count, onPress }: NotificationBellProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel={`Notifications${count > 0 ? `, ${count} non lues` : ''}`}
      style={{ position: 'relative' }}
    >
      <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
      {count > 0 && (
        <View style={{ position: 'absolute', top: -4, right: -4 }}>
          <Badge count={count} />
        </View>
      )}
    </TouchableOpacity>
  );
}
