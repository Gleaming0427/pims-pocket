import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Child, Goal } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';
import { getContrastTextColor } from '@/utils/colorContrast';

interface GoalProgressCardProps {
  goal: Goal;
  // Côté parent : l'enfant à qui appartient l'objectif (avatar + prénom)
  child?: Child;
  // Couleur de la barre pour un objectif en cours
  accentColor?: string;
  onPress?: () => void;
  // Espace enfant : bouton « Épargner » dans la carte (couleur de la gemme)
  onSave?: () => void;
  saveColor?: string;
  // Bouton « ⋯ » pour modifier l'objectif
  onEdit?: () => void;
}

/**
 * Objectif d'épargne : montant épargné, progression et reste à épargner.
 * Utilisé sur les accueils parent (avec `child`) et enfant.
 */
const GoalProgressCard = React.memo(function GoalProgressCard({
  goal,
  child,
  accentColor = colors.secondary,
  onPress,
  onSave,
  saveColor = colors.secondary,
  onEdit,
}: GoalProgressCardProps) {
  const current = Number(goal.currentAmount) || 0;
  const target = Number(goal.targetAmount) || 0;
  const progress = target > 0 ? Math.min(1, current / target) : 0;
  const remaining = Math.max(0, target - current);
  const isCompleted = goal.status === 'completed' || (target > 0 && current >= target);
  const barColor = isCompleted ? colors.success : accentColor;

  return (
    <Card padding={16} style={{ marginBottom: 10 }} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {child ? (
          <Avatar avatarId={child.avatarId} size={40} />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.starGold + '30',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>🎯</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}
          >
            {goal.title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {child ? `Objectif de ${child.firstName}` : "Objectif d'épargne"}
          </Text>
        </View>
        {(isCompleted || !onEdit) && (
          <View
            style={{
              backgroundColor: barColor + '20',
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginLeft: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textPrimary,
              }}
            >
              {isCompleted ? '🎉 Atteint' : '🎯 En cours'}
            </Text>
          </View>
        )}
        {onEdit && !isCompleted && (
          <TouchableOpacity
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={`Modifier ${goal.title}`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginLeft: 8, padding: 2 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 14 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>
          {formatCurrencyShort(current)}
        </Text>
        <Text style={{ marginLeft: 'auto', fontSize: 12, color: colors.textSecondary }}>
          objectif :{' '}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
            {formatCurrencyShort(target)}
          </Text>
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color={barColor}
        backgroundColor={colors.canvasMuted}
        height={8}
        style={{ marginTop: 10 }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
          {Math.round(progress * 100)} % épargné
        </Text>
        {!isCompleted && (
          <Text style={{ marginLeft: 'auto', fontSize: 12, color: colors.textSecondary }}>
            Reste :{' '}
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
              {formatCurrencyShort(remaining)}
            </Text>
          </Text>
        )}
      </View>

      {onSave && !isCompleted && (
        <Button
          accentColor={saveColor}
          title="Épargner"
          size="sm"
          icon={<Ionicons name="add-circle" size={18} color={getContrastTextColor(saveColor)} />}
          onPress={onSave}
          style={{ marginTop: 12, minHeight: 44 }}
        />
      )}
    </Card>
  );
});
export default GoalProgressCard;
