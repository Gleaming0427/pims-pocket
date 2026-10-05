import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import GroupTitle from '@/components/ui/GroupTitle';
import StepHeader from '@/components/ui/StepHeader';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { createMoneyRequest, onMoneyRequestsSnapshot } from '@/lib/firestore';
import { validateAmount, parseAmountToCents } from '@/utils/validators';
import { formatCurrencyShort, formatRelativeDate } from '@/utils/formatters';
import { getContrastTextColor, getReadableAccent } from '@/utils/colorContrast';
import { Timestamp } from 'firebase/firestore';
import { MoneyRequest } from '@/types';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

// Limite de sécurité : maximum de demandes en attente par enfant
const MAX_PENDING_REQUESTS = 10;

const quickAmounts = [1, 2, 5, 10, 20];

// Idées de motif : le libellé (sans l'emoji) remplit le champ « Pourquoi ? »
const reasonIdeas = ['🍬 Un goûter', '📚 Un livre', '🎬 Le cinéma', '🎁 Un cadeau', '🎮 Un jeu'];

const statusConfig: Record<
  MoneyRequest['status'],
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  pending: { label: 'En attente', icon: 'hourglass-outline', color: colors.accentOrange },
  approved: { label: 'Acceptée', icon: 'checkmark-circle', color: colors.success },
  rejected: { label: 'Refusée', icon: 'close-circle', color: colors.error },
};

export default function AskMoneyScreen() {
  const accent = useChildThemeStore((s) => s.accent);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<MoneyRequest[]>([]);

  // Ses propres demandes (filtre par UID : requis par les règles)
  useEffect(() => {
    if (!user) return;
    const unsub = onMoneyRequestsSnapshot(user.id, user.familyId, 'child', setRequests);
    return () => unsub();
  }, [user?.id, user?.familyId]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const limitReached = pendingCount >= MAX_PENDING_REQUESTS;

  // Montant valide pour l'aperçu
  const parsedCents = useMemo(() => {
    if (!amount.trim()) return 0;
    const cents = parseAmountToCents(amount);
    return isNaN(cents) || cents <= 0 ? 0 : cents;
  }, [amount]);

  // Les plus récentes d'abord
  const recentRequests = useMemo(
    () =>
      [...requests]
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        .slice(0, 5),
    [requests]
  );

  const handleSubmit = async () => {
    if (isLoading) return;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Demander de l'argent" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {limitReached && (
          <Card padding={14} style={{ marginBottom: 12, borderWidth: 1, borderColor: colors.error + '30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.error + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="alert-circle" size={20} color={colors.error} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                  Limite atteinte
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Tu as déjà {MAX_PENDING_REQUESTS} demandes en attente. Attends la réponse de tes
                  parents !
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Étape 1 — Le montant */}
        <Card style={{ marginBottom: 12 }}>
          <StepHeader step={1} title="Combien ?" />
          <Input
            accentColor={accent}
            label="Montant (€)"
            placeholder="5,00"
            icon="cash-outline"
            value={amount}
            onChangeText={(t) => {
              setAmount(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            error={error}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: -4 }}>
            {quickAmounts.map((a) => (
              <Chip
                key={a}
                label={`${a} €`}
                selected={amount === String(a)}
                surface="card"
                accentColor={accent}
                onPress={() => {
                  setAmount(String(a));
                  setError(null);
                }}
                style={{ flex: 1, paddingLeft: 6, paddingRight: 6 }}
              />
            ))}
          </View>
        </Card>

        {/* Étape 2 — Le motif */}
        <Card style={{ marginBottom: 20 }}>
          <StepHeader step={2} title="Pourquoi ?" hint="Explique à tes parents" />
          <Input
            accentColor={accent}
            label="Ton message"
            placeholder="J'aimerais acheter..."
            icon="chatbubble-outline"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={500}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -4 }}>
            {reasonIdeas.map((idea) => {
              const label = `Pour ${idea.replace(/^\S+\s/, '').toLowerCase()}`;
              return (
                <Chip
                  key={idea}
                  label={idea}
                  selected={reason === label}
                  surface="card"
                  accentColor={accent}
                  onPress={() => setReason(label)}
                />
              );
            })}
          </View>
        </Card>

        {/* Aperçu : ce que verra le parent */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
          Aperçu
        </Text>
        <Card padding={14} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: accent + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="hand-left" size={22} color={getReadableAccent(accent)} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                Demande d'argent
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Envoyée à tes parents
              </Text>
            </View>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '800',
                color: parsedCents > 0 ? colors.textPrimary : colors.textLight,
              }}
            >
              {formatCurrencyShort(parsedCents)}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.canvas,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginTop: 12,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                lineHeight: 19,
                color: reason.trim() ? colors.textPrimary : colors.textLight,
              }}
            >
              {reason.trim() ? `« ${reason.trim()} »` : 'Ton message apparaîtra ici'}
            </Text>
          </View>
        </Card>

        <Button
          accentColor={accent}
          title="Envoyer la demande"
          icon={<Ionicons name="paper-plane" size={18} color={getContrastTextColor(accent)} />}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={limitReached}
        />

        {/* Suivi des demandes déjà envoyées */}
        {recentRequests.length > 0 && (
          <>
            <GroupTitle label="Mes demandes" />
            <Card padding={14}>
              {recentRequests.map((r, i) => {
                const status = statusConfig[r.status] ?? statusConfig.pending;
                return (
                  <View key={r.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: status.color + '18',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={status.icon} size={20} color={getReadableAccent(status.color)} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}
                        >
                          {r.reason}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                          {r.createdAt ? formatRelativeDate(r.createdAt) : ''}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>
                          {formatCurrencyShort(r.amount)}
                        </Text>
                        <View
                          style={{
                            backgroundColor: status.color + '20',
                            borderRadius: 999,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            marginTop: 4,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>
                            {status.label}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {!!r.parentComment && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          backgroundColor: colors.canvas,
                          borderRadius: 12,
                          padding: 10,
                          marginLeft: 52,
                          marginBottom: 8,
                        }}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textSecondary} />
                        <Text style={{ flex: 1, marginLeft: 6, fontSize: 12, color: colors.textPrimary, lineHeight: 17 }}>
                          {r.parentComment}
                        </Text>
                      </View>
                    )}
                    {i < recentRequests.length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.canvasMuted, marginLeft: 52 }} />
                    )}
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
