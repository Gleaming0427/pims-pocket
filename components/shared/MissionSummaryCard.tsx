import React from 'react';
import { View, Text } from 'react-native';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { SplitBar, LegendRow } from '@/components/shared/SplitBar';
import { Child, Mission } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

interface MissionSummaryCardProps {
  todo: Mission[];
  pending: Mission[];
  done: Mission[];
  // Enfant filtré, s'il y en a un
  child?: Child;
  // Variantes pour l'espace enfant
  title?: string;
  todoColor?: string;
  pendingLabel?: string;
}

const sumRewards = (list: Mission[]) => list.reduce((sum, m) => sum + (Number(m.reward) || 0), 0);

/**
 * Synthèse des missions : montant encore à gagner, répartition par statut
 * (en nombre de missions) et récompenses de chaque groupe.
 */
export default function MissionSummaryCard({
  todo,
  pending,
  done,
  child,
  title,
  todoColor = colors.primary,
  pendingLabel = 'À valider',
}: MissionSummaryCardProps) {
  const total = todo.length + pending.length + done.length;
  const toEarn = sumRewards(todo) + sumRewards(pending);

  return (
    <Card padding={20} style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
            {title ?? (child ? `Missions de ${child.firstName}` : 'Missions de la famille')}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {total} mission{total > 1 ? 's' : ''} au total
          </Text>
        </View>
        {child && <Avatar avatarId={child.avatarId} size={40} />}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 18 }}>
        <Text style={{ fontSize: 34, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 }}>
          {formatCurrencyShort(toEarn)}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 8 }}>à gagner</Text>
      </View>

      <SplitBar
        segments={[
          { value: todo.length, color: todoColor },
          { value: pending.length, color: colors.accentOrange },
          { value: done.length, color: colors.success },
        ]}
        style={{ marginTop: 14, marginBottom: 12 }}
      />

      <LegendRow color={todoColor} label="À faire" share={`${todo.length}`} amount={sumRewards(todo)} />
      <LegendRow
        color={colors.accentOrange}
        label={pendingLabel}
        share={`${pending.length}`}
        amount={sumRewards(pending)}
      />
      <LegendRow color={colors.success} label="Terminées" share={`${done.length}`} amount={sumRewards(done)} />
    </Card>
  );
}
