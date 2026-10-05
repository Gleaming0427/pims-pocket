import React from 'react';
import { Text } from 'react-native';
import Card from '@/components/ui/Card';
import colors from '@/constants/colors';

interface EmptyTabCardProps {
  emoji?: string;
  illustration?: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Contenu d'un onglet vide : une invitation plutôt qu'une liste vide.
 */
export default function EmptyTabCard({ emoji, illustration, title, description }: EmptyTabCardProps) {
  return (
    <Card padding={20} style={{ alignItems: 'center', marginBottom: 12 }}>
      {illustration ?? (emoji ? <Text style={{ fontSize: 32 }}>{emoji}</Text> : null)}
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
