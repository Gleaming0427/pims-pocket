import React from 'react';
import { View, Text } from 'react-native';
import colors from '@/constants/colors';

/**
 * En-tête d'étape d'un formulaire : numéro dans une pastille, titre et
 * aide à droite.
 */
export default function StepHeader({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>{step}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
        {title}
      </Text>
      {hint && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{hint}</Text>}
    </View>
  );
}
