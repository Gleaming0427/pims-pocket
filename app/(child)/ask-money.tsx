import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { createMoneyRequest, onMoneyRequestsSnapshot } from '@/lib/firestore';
import { validateAmount, parseAmountToCents } from '@/utils/validators';
import { Timestamp } from 'firebase/firestore';
import { MoneyRequest } from '@/types';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

// Limite de sécurité : maximum de demandes en attente par enfant
const MAX_PENDING_REQUESTS = 10;

export default function AskMoneyScreen() {
    const accent = useChildThemeStore((s) => s.accent);
const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<MoneyRequest[]>([]);

  // Ses propres demandes en attente (filtre par UID : requis par les règles)
  useEffect(() => {
    if (!user) return;
    const unsub = onMoneyRequestsSnapshot(user.id, user.familyId, 'child', setRequests);
    return () => unsub();
  }, [user?.id, user?.familyId]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const limitReached = pendingCount >= MAX_PENDING_REQUESTS;

  const handleSubmit = async () => {
    if (limitReached) {
      Alert.alert(
        'Limite atteinte',
        `Tu as déjà ${MAX_PENDING_REQUESTS} demandes en attente. Attends que tes parents y répondent !`
      );
      return;
    }
    const amountError = validateAmount(amount);
    setError(amountError);
    if (amountError) return;
    if (!reason.trim()) {
      Alert.alert('Erreur', 'Dis à tes parents pourquoi tu as besoin de cet argent !');
      return;
    }
    if (!user?.familyId) {
      Alert.alert('Erreur', 'Ton compte n\'est pas encore complètement configuré. Réessaie dans quelques instants.');
      return;
    }

    setIsLoading(true);
    try {
      await createMoneyRequest({
        familyId: user.familyId,
        childId: user.id,
        childDocId: user.childDocId,
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impossible d'envoyer la demande.";
      Alert.alert('Erreur', msg);
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header title="Demander de l'argent" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {limitReached && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.error + '12',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.error + '30',
              padding: 14,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.error + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="alert-circle" size={20} color={colors.error} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.error }}>
                Limite atteinte
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                Tu as déjà {MAX_PENDING_REQUESTS} demandes en attente. Attends la réponse de tes parents !
              </Text>
            </View>
          </View>
        )}

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
          maxLength={500}
        />

        <Button
          title="Envoyer la demande"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={limitReached}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
