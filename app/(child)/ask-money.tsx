import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { createMoneyRequest } from '@/lib/firestore';
import { validateAmount, parseAmountToCents } from '@/utils/validators';
import { firebase } from '@/lib/firebase';
const Timestamp = firebase.firestore.Timestamp;
import colors from '@/constants/colors';

export default function AskMoneyScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const amountError = validateAmount(amount);
    setError(amountError);
    if (amountError) return;
    if (!reason.trim()) {
      Alert.alert('Erreur', 'Dis à tes parents pourquoi tu as besoin de cet argent !');
      return;
    }
    if (!user || !user.parentId) return;

    setIsLoading(true);
    try {
      await createMoneyRequest({
        childId: user.id,
        parentId: user.parentId,
        amount: parseAmountToCents(amount),
        reason: reason.trim(),
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      Alert.alert(
        'Demande envoyée !',
        'Tes parents vont recevoir ta demande et pourront accepter ou refuser.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer la demande.");
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header title="Demander de l'argent" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 64 }}>🙏</Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 12,
              lineHeight: 22,
            }}
          >
            Demande à tes parents de te donner un peu d'argent. N'oublie pas
            d'expliquer pourquoi !
          </Text>
        </View>

        <Input
          label="Combien ? (€)"
          placeholder="5,00"
          icon="cash-outline"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          error={error}
        />

        <Input
          label="Pourquoi ?"
          placeholder="J'aimerais acheter..."
          icon="chatbubble-outline"
          value={reason}
          onChangeText={setReason}
          multiline
        />

        <Button
          title="Envoyer la demande"
          onPress={handleSubmit}
          loading={isLoading}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
