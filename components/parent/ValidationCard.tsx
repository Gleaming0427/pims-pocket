import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import { Mission } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

interface ValidationCardProps {
  mission: Mission;
  childName: string;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}

const ValidationCard = React.memo(function ValidationCard({
  mission,
  childName,
  onApprove,
  onReject,
  loading = false,
}: ValidationCardProps) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            backgroundColor: colors.accentOrange + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="hourglass" size={22} color={colors.accentOrange} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
            {mission.title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {childName}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.accentOrange }}>
            {formatCurrencyShort(mission.reward)}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
            récompense
          </Text>
        </View>
      </View>

      {mission.description ? (
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              lineHeight: 19,
            }}
          >
            {mission.description}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={onReject}
          disabled={loading}
          activeOpacity={0.7}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: colors.error,
            opacity: loading ? 0.5 : 1,
          }}
        >
          <Ionicons name="close" size={16} color={colors.error} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.error }}>
            Refuser
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onApprove}
          disabled={loading}
          activeOpacity={0.7}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: colors.success,
            opacity: loading ? 0.5 : 1,
          }}
        >
          <Ionicons name="checkmark" size={16} color="#FFF" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>
            Valider
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
});
export default ValidationCard;
