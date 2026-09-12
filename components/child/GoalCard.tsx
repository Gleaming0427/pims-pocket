import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { Goal } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
  onEdit?: () => void;
}

const GoalCard = React.memo(function GoalCard({ goal, onPress, onEdit }: GoalCardProps) {
    const accent = useChildThemeStore((s) => s.accent);
const current = Number(goal.currentAmount);
  const target = Number(goal.targetAmount);
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safeTarget = Number.isFinite(target) ? target : 0;
  const progress = safeTarget > 0 ? safeCurrent / safeTarget : 0;
  const isCompleted = goal.status === 'completed';

  return (
    <Card
      variant="child"
      style={{
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {/* Zone cliquable : ouvre l'épargne. Le crayon est DEHORS pour éviter
            les conflits de touch (imbrication de TouchableOpacity). */}
        <TouchableOpacity
          onPress={onPress}
          disabled={!onPress}
          activeOpacity={0.7}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: isCompleted
                ? colors.success + '15'
                : colors.starGold + '25',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>{isCompleted ? '🎉' : '🎯'}</Text>
          </View>
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
        </TouchableOpacity>

        {isCompleted ? (
          <View
            style={{
              backgroundColor: colors.success + '15',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
              Atteint !
            </Text>
          </View>
        ) : null}

        {!isCompleted && onEdit && (
          <TouchableOpacity
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="pencil" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <ProgressBar
        progress={progress}
        color={isCompleted ? colors.success : colors.starGold}
        showPercentage
        height={10}
      />
    </Card>
  );
});
export default GoalCard;
