import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Header from '@/components/shared/Header';
import MoneyAnimation from '@/components/child/MoneyAnimation';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import { useTransactionStore } from '@/stores/transactionStore';
import { validateAmount, parseAmountToCents } from '@/utils/validators';
import { TransactionType } from '@/types';
import colors from '@/constants/colors';

type Mode = 'give' | 'take';

const giveMotifs: { type: TransactionType; label: string; emoji: string }[] = [
  { type: 'bonus', label: 'Bonus', emoji: '⭐' },
  { type: 'gift', label: 'Cadeau', emoji: '🎁' },
  { type: 'allowance', label: 'Argent de poche', emoji: '💰' },
];

const takeMotifs: { label: string; emoji: string }[] = [
  { label: 'Bêtise', emoji: '😤' },
  { label: 'Devoirs non faits', emoji: '📚' },
  { label: 'Autre', emoji: '⚠️' },
];

export default function SendMoneyScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { children } = useChildren();
  const { sendMoney, removeMoney, isLoading } = useTransactionStore();

  const [mode, setMode] = useState<Mode>('give');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('bonus');
  const [takeMotifLabel, setTakeMotifLabel] = useState<string>(takeMotifs[0].label);
  const [description, setDescription] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTake = mode === 'take';
  const accent = isTake ? colors.error : colors.primary;

  const handleSend = async () => {
    if (!selectedChildId) {
      Alert.alert('Erreur', 'Sélectionnez un enfant');
      return;
    }
    const amountError = validateAmount(amount);
    setError(amountError);
    if (amountError) return;
    if (!user) return;

    const selectedChild = children.find((c) => c.id === selectedChildId);
    if (!selectedChild?.linkedUserId) {
      Alert.alert(
        'Compte enfant non activé',
        `${selectedChild?.firstName ?? 'Cet enfant'} doit d'abord activer son compte.`
      );
      return;
    }

    const cents = parseAmountToCents(amount);

    if (isTake) {
      const finalDescription = description.trim() || takeMotifLabel;
      Alert.alert(
        'Confirmer le retrait',
        `Retirer ${amount} € à ${selectedChild.firstName} ?\nMotif : ${finalDescription}`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Retirer',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeMoney(
                  user.id,
                  selectedChild.id,
                  selectedChild.linkedUserId!,
                  cents,
                  finalDescription
                );
                Alert.alert('Retrait effectué', `${amount} € retirés de la tirelire de ${selectedChild.firstName}.`, [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              } catch {
                Alert.alert('Erreur', 'Impossible de retirer l\'argent.');
              }
            },
          },
        ]
      );
      return;
    }

    try {
      const motif = giveMotifs.find((m) => m.type === type);
      await sendMoney(
        user.id,
        selectedChild.id,
        selectedChild.linkedUserId,
        cents,
        type,
        description.trim() || motif?.label || 'Versement'
      );
      setShowAnimation(true);
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer l'argent.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title={isTake ? 'Retirer de l\'argent' : 'Envoyer de l\'argent'} showBack />
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
        contentContainerStyle={{ padding: 24, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Toggle mode Donner / Retirer */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 4,
            marginBottom: 20,
          }}
        >
          {([
            { key: 'give', label: 'Donner', emoji: '💸' },
            { key: 'take', label: 'Retirer', emoji: '⛔' },
          ] as const).map((m) => {
            const active = mode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMode(m.key)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: active
                    ? (m.key === 'take' ? colors.error : colors.primary)
                    : 'transparent',
                }}
              >
                <Text style={{ fontSize: 16 }}>{m.emoji}</Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: active ? '#FFF' : colors.textSecondary,
                  }}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 10,
          }}
        >
          Choisir un enfant
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => setSelectedChildId(child.id)}
              style={{
                alignItems: 'center',
                padding: 12,
                borderRadius: 16,
                backgroundColor:
                  selectedChildId === child.id ? accent + '15' : colors.surface,
                borderWidth: 2,
                borderColor:
                  selectedChildId === child.id ? accent : colors.border,
              }}
            >
              <Avatar avatarId={child.avatarId} size={48} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginTop: 6,
                }}
              >
                {child.firstName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Montant (€)"
          placeholder="5,00"
          icon="cash-outline"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          error={error}
        />

        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 10,
          }}
        >
          Motif
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {isTake
            ? takeMotifs.map((m) => (
                <TouchableOpacity
                  key={m.label}
                  onPress={() => setTakeMotifLabel(m.label)}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor:
                      takeMotifLabel === m.label ? accent + '15' : colors.surface,
                    borderWidth: 2,
                    borderColor:
                      takeMotifLabel === m.label ? accent : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: takeMotifLabel === m.label ? accent : colors.textSecondary,
                      marginTop: 4,
                      textAlign: 'center',
                    }}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))
            : giveMotifs.map((m) => (
                <TouchableOpacity
                  key={m.type}
                  onPress={() => setType(m.type)}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor:
                      type === m.type ? accent + '15' : colors.surface,
                    borderWidth: 2,
                    borderColor: type === m.type ? accent : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: type === m.type ? accent : colors.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
        </View>

        <Input
          label={isTake ? 'Précision (optionnel)' : 'Description (optionnel)'}
          placeholder={isTake ? 'Pourquoi ce retrait...' : 'Un petit mot...'}
          icon="chatbubble-outline"
          value={description}
          onChangeText={setDescription}
        />

        <Button
          title={isTake ? 'Retirer' : 'Envoyer'}
          onPress={handleSend}
          loading={isLoading}
          style={{ marginTop: 8, backgroundColor: accent }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
