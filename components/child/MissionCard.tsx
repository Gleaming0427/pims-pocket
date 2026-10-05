import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Mission } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';
import { getContrastTextColor, getReadableAccent } from '@/utils/colorContrast';
import { useChildThemeStore } from '@/stores/childThemeStore';

interface ChildMissionCardProps {
  mission: Mission;
  onComplete?: () => void;
  loading?: boolean;
  // Rendre toute la carte cliquable (ex. : aller vers la page Missions)
  onPress?: () => void;
}

const frequencyLabel: Record<NonNullable<Mission['recurringFrequency']>, string> = {
  daily: 'Chaque jour',
  weekly: 'Chaque semaine',
  biweekly: 'Une semaine sur deux',
  monthly: 'Chaque mois',
};

const ChildMissionCard = React.memo(function ChildMissionCard({
  mission,
  onComplete,
  loading = false,
  onPress,
}: ChildMissionCardProps) {
  const accent = useChildThemeStore((s) => s.accent);
  const canComplete = mission.status === 'available' || mission.status === 'in_progress';
  const isPending = mission.status === 'pending_validation';
  const isDone = mission.status === 'completed';
  const iconColor = isDone ? colors.success : isPending ? colors.accentOrange : accent;

  const recurrence = mission.isRecurring
    ? (mission.recurringFrequency && frequencyLabel[mission.recurringFrequency]) || 'Récurrente'
    : null;

  return (
    <Card onPress={onPress} padding={14} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: iconColor + '18',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={(mission.icon as keyof typeof Ionicons.glyphMap) || 'flash'}
            size={24}
            color={getReadableAccent(iconColor)}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={2} style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
            {mission.title}
          </Text>
          {recurrence && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {recurrence}
            </Text>
          )}
        </View>
        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginLeft: 8 }}>
          +{formatCurrencyShort(mission.reward)}
        </Text>
        {onPress && (
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} style={{ marginLeft: 6 }} />
        )}
      </View>

      {mission.description ? (
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 10, lineHeight: 20 }}>
          {mission.description}
        </Text>
      ) : null}

      {canComplete && onComplete && (
        <Button
          accentColor={accent}
          title="J'ai terminé !"
          onPress={onComplete}
          loading={loading}
          icon={<Ionicons name="checkmark-circle" size={20} color={getContrastTextColor(accent)} />}
          style={{ marginTop: 14 }}
        />
      )}

      {(isPending || isDone) && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: colors.canvas,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name={isDone ? 'checkmark-circle' : 'hourglass-outline'}
            size={18}
            color={getReadableAccent(isDone ? colors.success : colors.accentOrange)}
          />
          <Text style={{ marginLeft: 8, fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
            {isDone ? 'Mission accomplie, récompense reçue' : 'En attente de validation par un parent'}
          </Text>
        </View>
      )}
    </Card>
  );
});
export default ChildMissionCard;
