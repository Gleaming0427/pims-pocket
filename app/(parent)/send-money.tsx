import React, { useState, useMemo } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import MoneyAnimation from '@/components/child/MoneyAnimation';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import { useTransactionStore } from '@/stores/transactionStore';
import { validateAmount, parseAmountToCents } from '@/utils/validators';
import { formatCurrencyShort } from '@/utils/formatters';
import { TransactionType, Child } from '@/types';
import colors from '@/constants/colors';

const motifs: { type: TransactionType; label: string; emoji: string }[] = [
  { type: 'bonus', label: 'Bonus', emoji: '⭐' },
  { type: 'gift', label: 'Cadeau', emoji: '🎁' },
  { type: 'allowance', label: 'Argent de poche', emoji: '💰' },
];

export default function SendMoneyScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { children } = useChildren();
  const { sendMoney, isLoading } = useTransactionStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('bonus');
  const [description, setDescription] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activatedChildren = useMemo(
    () => children.filter((c) => c.linkedUserId),
    [children]
  );

  // Total en direct : enfants sélectionnés × montant saisi
  const parsedCents = useMemo(() => {
    if (!amount.trim()) return 0;
    const cents = parseAmountToCents(amount);
    return isNaN(cents) || cents <= 0 ? 0 : cents;
  }, [amount]);
  const totalCents = selectedIds.length > 0 ? parsedCents * selectedIds.length : 0;

  const toggleChild = (childId: string) => {
    setSelectedIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un enfant');
      return;
    }
    const amountError = validateAmount(amount);
    setError(amountError);
    if (amountError) return;
    if (!user) return;

    const selectedChildren = children.filter((c) => selectedIds.includes(c.id));
    const inactiveChild = selectedChildren.find((c) => !c.linkedUserId);
    if (inactiveChild) {
      Alert.alert(
        'Compte enfant non activé',
        `${inactiveChild.firstName ?? 'Un enfant'} doit d'abord activer son compte.`
      );
      return;
    }

    const cents = parseAmountToCents(amount);
    const motif = motifs.find((m) => m.type === type);
    const finalDescription = description.trim() || motif?.label || 'Versement';

    let failures = 0;
    for (const child of selectedChildren) {
      try {
        await sendMoney(
          user.familyId!,
          child.id,
          child.linkedUserId!,
          cents,
          type,
          finalDescription
        );
      } catch {
        failures++;
      }
    }

    if (failures === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAnimation(true);
    } else if (failures < selectedChildren.length) {
      Alert.alert(
        'Partiellement envoyé',
        `L'argent a été envoyé à ${selectedChildren.length - failures} enfant(s), ${failures} échec(s).`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Erreur', "Impossible d'envoyer l'argent.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Envoyer de l'argent" showBack />
      <MoneyAnimation
        visible={showAnimation}
        onFinish={() => {
          setShowAnimation(false);
          Alert.alert('Envoyé !', "L'argent a bien été crédité.", [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Étape 1 — Qui reçoit */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
              👧 Qui reçoit ?
            </Text>
            {selectedIds.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.primary + '12',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                  {selectedIds.length}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            Choisis un ou plusieurs enfants
          </Text>
        </View>
        {children.length === 0 ? (
          <View style={{ marginBottom: 24 }}>
            <EmptyState
              emoji="👶"
              title="Aucun enfant"
              description="Ajoute un enfant avant d'envoyer de l'argent."
              actionLabel="Ajouter un enfant"
              onAction={() => router.push('/(parent)/child/add')}
            />
          </View>
        ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {children.map((child) => {
            const isSelected = selectedIds.includes(child.id);
            const isActivated = !!child.linkedUserId;
            return (
              <TouchableOpacity
                key={child.id}
                onPress={() => toggleChild(child.id)}
                activeOpacity={0.7}
                style={{
                  alignItems: 'center',
                  padding: 12,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: isActivated ? 1 : 0.55,
                }}
              >
                <View style={{ position: 'relative' }}>
                  <Avatar avatarId={child.avatarId} size={48} />
                  {isSelected && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colors.primary,
                        borderWidth: 2,
                        borderColor: colors.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={13} color="#FFF" />
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: isSelected ? colors.primary : colors.textPrimary,
                    marginTop: 6,
                  }}
                >
                  {child.firstName}
                </Text>
                {!isActivated && (
                  <View
                    style={{
                      backgroundColor: colors.accentOrange + '15',
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accentOrange }}>
                      Non activé
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        )}

        {/* Étape 2 — Combien */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          💶 Combien ?
        </Text>
        <Input
          label="Montant par enfant (€)"
          placeholder="5,00"
          icon="cash-outline"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          error={error}
        />

        {/* Montants rapides */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: -6, marginBottom: 20 }}>
          {[2, 5, 10, 20].map((a) => {
            const isAmount = amount === String(a);
            return (
              <TouchableOpacity
                key={a}
                onPress={() => {
                  setAmount(String(a));
                  setError(null);
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: isAmount ? colors.primary + '15' : colors.surface,
                  borderWidth: 1.5,
                  borderColor: isAmount ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: isAmount ? colors.primary : colors.textSecondary,
                  }}
                >
                  {a} €
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Récapitulatif en direct */}
        <View
          style={{
            backgroundColor: colors.primary + '08',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.primary + '15',
            padding: 14,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
              {selectedIds.length > 0
                ? `${selectedIds.length} enfant${selectedIds.length > 1 ? 's' : ''} × ${amount.trim() || '0'} €`
                : 'Sélectionne un enfant et un montant'}
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: totalCents > 0 ? colors.success : colors.textLight,
              }}
            >
              {formatCurrencyShort(totalCents)}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 4 }}>
            Total qui sera crédité sur les tirelires
          </Text>
        </View>

        {/* Étape 3 — Motif */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          🎯 Pourquoi ?
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {motifs.map((m) => {
            const isSelectedType = type === m.type;
            return (
              <TouchableOpacity
                key={m.type}
                onPress={() => setType(m.type)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 16,
                  alignItems: 'center',
                  backgroundColor: isSelectedType ? colors.primary + '15' : colors.surface,
                  borderWidth: 2,
                  borderColor: isSelectedType ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: isSelectedType ? colors.primary : colors.textSecondary,
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Description (optionnel)"
          placeholder="Un petit mot..."
          icon="chatbubble-outline"
          value={description}
          onChangeText={setDescription}
          maxLength={200}
        />

        <Button
          title={totalCents > 0 ? `Envoyer ${formatCurrencyShort(totalCents)}` : 'Envoyer'}
          icon={<Ionicons name="paper-plane" size={18} color="#FFF" />}
          onPress={handleSend}
          loading={isLoading}
          disabled={totalCents === 0}
          style={{ marginTop: 8, backgroundColor: colors.primary }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
