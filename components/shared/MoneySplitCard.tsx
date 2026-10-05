import React from 'react';
import { View, Text } from 'react-native';
import Card from '@/components/ui/Card';
import { SplitBar, LegendRow } from '@/components/shared/SplitBar';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

interface MoneySplitCardProps {
  title: string;
  subtitle: string;
  // Slot à droite du titre (ex. : pile d'avatars)
  headerRight?: React.ReactNode;
  available: number;
  saved: number;
  // Total historique affiché en dernière ligne de légende
  total: number;
  totalLabel: string;
  availableColor: string;
  savedColor: string;
}

function percent(part: number, total: number): string {
  if (total <= 0) return '0 %';
  return `${Math.round((part / total) * 100)} %`;
}

/**
 * Carte « budget » : gros montant disponible, barre de répartition
 * disponible / épargné et sa légende.
 */
export default function MoneySplitCard({
  title,
  subtitle,
  headerRight,
  available,
  saved,
  total,
  totalLabel,
  availableColor,
  savedColor,
}: MoneySplitCardProps) {
  const held = available + saved;

  return (
    <Card padding={20} style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
        {headerRight}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 18 }}>
        <Text
          style={{
            fontSize: 34,
            fontWeight: '800',
            color: colors.textPrimary,
            letterSpacing: -1,
          }}
        >
          {formatCurrencyShort(available)}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 8 }}>
          disponibles
        </Text>
      </View>

      {/* Barre de répartition disponible / épargné */}
      <SplitBar
        segments={[
          { value: available, color: availableColor },
          { value: saved, color: savedColor },
        ]}
        style={{ marginTop: 14, marginBottom: 12 }}
      />

      <LegendRow
        color={availableColor}
        label="Disponible"
        share={percent(available, held)}
        amount={available}
      />
      <LegendRow color={savedColor} label="Épargné" share={percent(saved, held)} amount={saved} />
      <LegendRow color={colors.textLight} outlined label={totalLabel} amount={total} />
    </Card>
  );
}
