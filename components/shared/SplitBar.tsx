import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

export interface SplitSegment {
  value: number;
  color: string;
}

/**
 * Barre horizontale découpée en segments proportionnels, séparés par un
 * liseré blanc (style « budget » Grassfeld).
 */
export function SplitBar({ segments, style }: { segments: SplitSegment[]; style?: ViewStyle }) {
  const visible = segments.filter((s) => s.value > 0);
  const total = visible.reduce((sum, s) => sum + s.value, 0);

  return (
    <View
      style={{
        flexDirection: 'row',
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.canvasMuted,
        overflow: 'hidden',
        ...style,
      }}
    >
      {total > 0 &&
        visible.map((segment, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={{ width: 2, backgroundColor: colors.surface }} />}
            <View style={{ flex: segment.value / total, backgroundColor: segment.color }} />
          </React.Fragment>
        ))}
    </View>
  );
}

/**
 * Ligne de légende : pastille de couleur, libellé, valeur en gras (part ou
 * nombre) et montant aligné à droite.
 */
export function LegendRow({
  color,
  outlined = false,
  label,
  share,
  amount,
}: {
  color: string;
  outlined?: boolean;
  label: string;
  share?: string;
  amount?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          backgroundColor: outlined ? 'transparent' : color,
          borderWidth: outlined ? 1.5 : 0,
          borderColor: color,
          marginRight: 10,
        }}
      />
      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{label}</Text>
      {share && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginLeft: 6 }}>
          {share}
        </Text>
      )}
      {amount !== undefined && (
        <Text
          style={{
            marginLeft: 'auto',
            fontSize: 13,
            fontWeight: '700',
            color: colors.textPrimary,
          }}
        >
          {formatCurrencyShort(amount)}
        </Text>
      )}
    </View>
  );
}
