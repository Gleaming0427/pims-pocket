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
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusConfig: Record<
  Mission['status'],
  { label: string; color: string; bg: string }
> = {
  available: { label: 'Disponible', color: colors.info, bg: colors.info + '20' },
  in_progress: { label: 'En cours', color: colors.accentOrange, bg: colors.accentOrange + '20' },
  pending_validation: { label: 'À valider', color: colors.warning, bg: colors.warning + '20' },
  completed: { label: 'Terminée', color: colors.success, bg: colors.success + '20' },
  expired: { label: 'Expirée', color: colors.textLight, bg: colors.textLight + '20' },
};

const MissionCard = React.memo(function MissionCard({
  mission,
  onPress,
  childName,
  onEdit,
  onDelete,
}: MissionCardProps) {
  const status = statusConfig[mission.status];

  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Zone cliquable : les boutons crayon/poubelle sont DEHORS */}
        <TouchableOpacity
          onPress={onPress}
          disabled={!onPress}
          activeOpacity={0.7}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.accentOrange + '15',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={(mission.icon as keyof typeof Ionicons.glyphMap) || 'flash'}
              size={22}
              color={colors.accentOrange}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}
              numberOfLines={1}
            >
              {mission.title}
            </Text>
            {childName && (
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {childName}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View
                style={{
                  backgroundColor: status.bg,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: status.color }}>
                  {status.label}
                </Text>
              </View>
              {mission.isRecurring && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginLeft: 8,
                  }}
                >
                  <Ionicons name="repeat" size={14} color={colors.textLight} />
                  <Text
                    style={{ fontSize: 12, color: colors.textLight, marginLeft: 4 }}
                  >
                    Récurrent
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '800',
              color: colors.success,
              marginLeft: 8,
            }}
          >
            {formatCurrencyShort(mission.reward)}
          </Text>
        </TouchableOpacity>

        <View style={{ marginLeft: 10, alignItems: 'center' }}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ paddingVertical: 2 }}
            >
              <Ionicons name="pencil" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ paddingVertical: 2, marginTop: 6 }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
});
export default MissionCard;
