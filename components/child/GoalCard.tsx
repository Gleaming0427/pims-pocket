import React from 'react';
import { View, Text } from 'react-native';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { Goal } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

export default function GoalCard({ goal, onPress }: GoalCardProps) {
  const current = Number(goal.currentAmount);
  const target = Number(goal.targetAmount);
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safeTarget = Number.isFinite(target) ? target : 0;
  const progress = safeTarget > 0 ? safeCurrent / safeTarget : 0;
  const isCompleted = goal.status === 'completed';

  return (
    <Card
      onPress={onPress}
      variant="child"
      style={{
        marginBottom: 12,
        borderWidth: isCompleted ? 2 : 0,
        borderColor: isCompleted ? colors.success : undefined,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 36 }}>{isCompleted ? '🎉' : '🎯'}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}
            numberOfLines={1}
          >
            {goal.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {formatCurrencyShort(goal.currentAmount)} / {formatCurrencyShort(goal.targetAmount)}
          </Text>
        </View>
        {isCompleted && (
          <View
            style={{
              backgroundColor: colors.success + '20',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
              Atteint !
            </Text>
          </View>
        )}
      </View>
      <ProgressBar
        progress={progress}
        color={isCompleted ? colors.success : colors.primary}
        showPercentage
        height={10}
      />
    </Card>
  );
}
