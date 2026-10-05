import React from 'react';
import { Text } from 'react-native';
import colors from '@/constants/colors';

/**
 * Titre de groupe au-dessus d'une carte de réglages.
 */
export default function GroupTitle({ label, first = false }: { label: string; first?: boolean }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: first ? 0 : 20,
        marginBottom: 8,
        marginLeft: 4,
      }}
    >
      {label}
    </Text>
  );
}
