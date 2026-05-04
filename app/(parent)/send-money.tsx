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

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('bonus');
  const [description, setDescription] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!selectedChildId) {
      Alert.alert('Erreur', 'Sélectionnez un enfant');
      return;
    }
    const amountError = validateAmount(amount);
    setError(amountError);
    if (amountError) return;
    if (!user) return;

    try {
      const cents = parseAmountToCents(amount);
      const motif = motifs.find((m) => m.type === type);
      await sendMoney(
        user.id,
        selectedChildId,
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
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
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
                  selectedChildId === child.id ? colors.primary + '15' : colors.surface,
                borderWidth: 2,
                borderColor:
                  selectedChildId === child.id ? colors.primary : colors.border,
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
          {motifs.map((m) => (
            <TouchableOpacity
              key={m.type}
              onPress={() => setType(m.type)}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                alignItems: 'center',
                backgroundColor:
                  type === m.type ? colors.primary + '15' : colors.surface,
                borderWidth: 2,
                borderColor: type === m.type ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: type === m.type ? colors.primary : colors.textSecondary,
                  marginTop: 4,
                }}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Description (optionnel)"
          placeholder="Un petit mot..."
          icon="chatbubble-outline"
          value={description}
          onChangeText={setDescription}
        />

        <Button
          title="Envoyer"
          onPress={handleSend}
          loading={isLoading}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
