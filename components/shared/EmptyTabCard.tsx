import React from 'react';
import { Text } from 'react-native';
import Card from '@/components/ui/Card';
import IllustrationIcon from '@/components/ui/IllustrationIcon';
import colors from '@/constants/colors';

interface EmptyTabCardProps {
  icon?: React.ComponentProps<typeof IllustrationIcon>['name'];
  iconColor?: string;
  illustration?: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Contenu d'un onglet vide : une invitation plutôt qu'une liste vide.
 */
export default function EmptyTabCard({
  icon = 'sparkles-outline',
  iconColor,
  illustration,
  title,
  description,
}: EmptyTabCardProps) {
  return (
    <Card padding={20} style={{ alignItems: 'center', marginBottom: 12 }}>
      {illustration ?? <IllustrationIcon name={icon} size={52} color={iconColor} />}
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 8 }}>
        {title}
      </Text>
      <Text
        style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}
      >
        {description}
      </Text>
    </Card>
  );
}
