import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import { Mission } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

interface MissionCardProps {
  mission: Mission;
  onPress?: () => void;
  childName?: string;
  // Ouvre l'édition (qui permet aussi de supprimer)
  onEdit?: () => void;
  // Suppression directe, pour les missions qu'on ne modifie plus (terminées)
  onDelete?: () => void;
}

export const missionStatusConfig: Record<Mission['status'], { label: string; color: string }> = {
  available: { label: 'Disponible', color: colors.info },
  in_progress: { label: 'En cours', color: colors.accentOrange },
  pending_validation: { label: 'À valider', color: colors.warning },
  completed: { label: 'Terminée', color: colors.success },
  expired: { label: 'Expirée', color: colors.textLight },
};

const frequencyLabel: Record<NonNullable<Mission['recurringFrequency']>, string> = {
  daily: 'Chaque jour',
  weekly: 'Chaque semaine',
  biweekly: 'Une semaine sur deux',
  monthly: 'Chaque mois',
};

const MissionCard = React.memo(function MissionCard({
  mission,
  onPress,
  childName,
  onEdit,
  onDelete,
}: MissionCardProps) {
  const status = missionStatusConfig[mission.status];
  const isDone = mission.status === 'completed' || mission.status === 'expired';

  const details = [
    childName || null,
    mission.isRecurring
      ? (mission.recurringFrequency && frequencyLabel[mission.recurringFrequency]) || 'Récurrente'
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card padding={14} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Zone cliquable : le bouton d'action est DEHORS */}
        <TouchableOpacity
          onPress={onPress}
          disabled={!onPress}
          activeOpacity={0.7}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: (isDone ? colors.success : colors.accentOrange) + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={(mission.icon as keyof typeof Ionicons.glyphMap) || 'flash'}
              size={22}
              color={isDone ? colors.success : colors.accentOrange}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}
              numberOfLines={1}
            >
              {mission.title}
            </Text>
            {details.length > 0 && (
              <Text
                numberOfLines={1}
                style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}
              >
                {details}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>
              +{formatCurrencyShort(mission.reward)}
            </Text>
            <View
              style={{
                backgroundColor: status.color + '25',
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginTop: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>
                {status.label}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {onEdit ? (
          <TouchableOpacity
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={`Modifier ${mission.title}`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginLeft: 10, padding: 2 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : onDelete ? (
          <TouchableOpacity
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={`Supprimer ${mission.title}`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginLeft: 10, padding: 2 }}
          >
            <Ionicons name="trash-outline" size={19} color={colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>
    </Card>
  );
});
export default MissionCard;
