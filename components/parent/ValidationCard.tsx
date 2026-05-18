import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
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
    <Card style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftColor: colors.warning }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.warning + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="hourglass" size={22} color={colors.accentOrange} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
            {mission.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {childName} · {formatCurrencyShort(mission.reward)}
          </Text>
        </View>
      </View>
      {mission.description ? (
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 14,
            lineHeight: 20,
          }}
        >
          {mission.description}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Refuser"
            onPress={onReject}
            variant="outline"
            size="sm"
            loading={loading}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Valider"
            onPress={onApprove}
            variant="primary"
            size="sm"
            loading={loading}
            icon={<Ionicons name="checkmark" size={18} color="#FFF" />}
          />
        </View>
      </View>
    </Card>
  );
});
export default ValidationCard;
