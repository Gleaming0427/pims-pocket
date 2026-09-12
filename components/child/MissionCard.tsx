import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Mission } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

interface ChildMissionCardProps {
  mission: Mission;
  onComplete?: () => void;
  loading?: boolean;
  // Rendre toute la carte cliquable (ex. : aller vers la page Missions)
  onPress?: () => void;
}

const ChildMissionCard = React.memo(function ChildMissionCard({
  mission,
  onComplete,
  loading = false,
  onPress,
}: ChildMissionCardProps) {
  const accent = useChildThemeStore((s) => s.accent);
  const canComplete =
    mission.status === 'available' || mission.status === 'in_progress';
  const isPending = mission.status === 'pending_validation';
  const isDone = mission.status === 'completed';

  return (
    <Card
      variant="child"
      onPress={onPress}
      style={{
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: colors.accentOrange + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={(mission.icon as keyof typeof Ionicons.glyphMap) || 'flash'}
            size={24}
            color={colors.accentOrange}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}
          >
            {mission.title}
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: colors.starGold,
              marginTop: 4,
            }}
          >
            +{formatCurrencyShort(mission.reward)}
          </Text>
        </View>
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textLight}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>

      {mission.description ? (
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 10,
            lineHeight: 20,
          }}
        >
          {mission.description}
        </Text>
      ) : null}

      {canComplete && onComplete && (
        <Button
          title="J'ai terminé !"
          onPress={onComplete}
          variant="primary"
          size="md"
          loading={loading}
          icon={<Ionicons name="checkmark-circle" size={20} color="#FFF" />}
          style={{ marginTop: 14, borderRadius: 14, backgroundColor: accent }}
        />
      )}

      {isPending && (
        <View
          style={{
            marginTop: 14,
            backgroundColor: colors.warning + '20',
            padding: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="hourglass" size={18} color={colors.accentOrange} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              color: colors.accentOrange,
              fontWeight: '600',
            }}
          >
            En attente de validation...
          </Text>
        </View>
      )}

      {isDone && (
        <View
          style={{
            marginTop: 14,
            backgroundColor: colors.success + '20',
            padding: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              color: colors.success,
              fontWeight: '600',
            }}
          >
            Mission accomplie !
          </Text>
        </View>
      )}
    </Card>
  );
});
export default ChildMissionCard;
