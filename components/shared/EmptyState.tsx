import React from 'react';
import { View, Text } from 'react-native';
import colors from '@/constants/colors';
import Button from '@/components/ui/Button';
import IllustrationIcon from '@/components/ui/IllustrationIcon';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof IllustrationIcon>['name'];
  iconColor?: string;
  illustration?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'sparkles-outline',
  iconColor,
  illustration,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
      }}
    >
      <View style={{ marginBottom: 16 }}>
        {illustration ?? <IllustrationIcon name={icon} size={80} color={iconColor} />}
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 24,
        }}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          size="md"
          fullWidth={false}
          style={{ paddingHorizontal: 32 }}
        />
      )}
    </View>
  );
}
