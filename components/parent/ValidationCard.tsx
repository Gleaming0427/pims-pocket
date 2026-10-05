import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

interface ValidationCardProps {
  kind: 'mission' | 'request';
  title: string;
  childName: string;
  avatarId?: string;
  amount: number;
  // Détail sous le nom : date de la demande, récurrence…
  meta?: string;
  // Motif de la demande ou description de la mission
  note?: string;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}

/**
 * Élément à valider par le parent : mission terminée ou demande d'argent.
 */
const ValidationCard = React.memo(function ValidationCard({
  kind,
  title,
  childName,
  avatarId,
  amount,
  meta,
  note,
  onApprove,
  onReject,
  loading = false,
}: ValidationCardProps) {
  const isMission = kind === 'mission';
  const tint = isMission ? colors.accentOrange : colors.primary;

  return (
    <Card padding={14} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View>
          {avatarId ? (
            <Avatar avatarId={avatarId} size={44} />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.canvas,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
          )}
          {/* Pastille du type, sur l'avatar */}
          <View
            style={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: tint + '25',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={isMission ? 'flash' : 'cash'} size={11} color={tint} />
            </View>
          </View>
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
            {title}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {[childName, meta].filter(Boolean).join(' · ')}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
            +{formatCurrencyShort(amount)}
          </Text>
          <View
            style={{
              backgroundColor: tint + '20',
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>
              {isMission ? 'Mission' : 'Demande'}
            </Text>
          </View>
        </View>
      </View>

      {note ? (
        <View
          style={{
            backgroundColor: colors.canvas,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginTop: 12,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 19 }}>
            {isMission ? note : `« ${note} »`}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Button
          title="Refuser"
          variant="light"
          size="sm"
          fullWidth={false}
          disabled={loading}
          onPress={onReject}
          textStyle={{ color: colors.error }}
          icon={<Ionicons name="close" size={16} color={colors.error} />}
          style={{ flex: 1, minHeight: 44 }}
        />
        <Button
          title={isMission ? 'Valider' : 'Accepter'}
          variant="dark"
          size="sm"
          fullWidth={false}
          loading={loading}
          onPress={onApprove}
          icon={<Ionicons name="checkmark" size={16} color="#FFF" />}
          style={{ flex: 1, minHeight: 44 }}
        />
      </View>
    </Card>
  );
});
export default ValidationCard;
