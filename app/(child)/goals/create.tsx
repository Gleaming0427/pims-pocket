import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { createGoal, onGoalsSnapshot } from '@/lib/firestore';
import { validateName, validateAmount, parseAmountToCents } from '@/utils/validators';
import { formatCurrencyShort } from '@/utils/formatters';
import { Timestamp } from 'firebase/firestore';
import { Goal } from '@/types';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

const quickTargets = [10, 20, 50, 100];

// Limite de sécurité : maximum d'objectifs actifs par enfant
const MAX_ACTIVE_GOALS = 10;

export default function CreateGoalScreen() {
    const accent = useChildThemeStore((s) => s.accent);
const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [goals, setGoals] = useState<Goal[]>([]);

  // Ses objectifs actifs (filtre par UID : requis par les règles Firestore)
  useEffect(() => {
    if (!user) return;
    const unsub = onGoalsSnapshot(user.familyId ?? user.id, user.id, setGoals);
    return () => unsub();
  }, [user?.id, user?.familyId]);

  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;
  const limitReached = activeGoalsCount >= MAX_ACTIVE_GOALS;

  // Montant valide pour activer le bouton
  const parsedCents = useMemo(() => {
    if (!targetAmount.trim()) return 0;
    const cents = parseAmountToCents(targetAmount);
    return isNaN(cents) || cents <= 0 ? 0 : cents;
  }, [targetAmount]);

  const isValid = title.trim().length > 0 && parsedCents > 0;

  const handleSubmit = async () => {
    if (limitReached) {
      Alert.alert(
        'Limite atteinte',
        `Tu as déjà ${MAX_ACTIVE_GOALS} objectifs actifs. Termine ou supprime-en un avant d'en créer un nouveau !`
      );
      return;
    }
    const titleError = validateName(title);
    const amountError = validateAmount(targetAmount);
    setErrors({ title: titleError, targetAmount: amountError });
    if (titleError || amountError) return;
    if (!user) return;

    setIsLoading(true);
    try {
      // Firestore refuse les champs `undefined` : on omet la description
      // si elle est vide au lieu de passer `undefined`.
      const trimmedDescription = description.trim();
      await createGoal({
        familyId: user.familyId ?? user.id,
        childId: user.id,
        childDocId: user.childDocId,
        parentId: user.parentId ?? '',
        title: title.trim(),
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        targetAmount: parseAmountToCents(targetAmount),
        currentAmount: 0,
        status: 'active',
        createdAt: Timestamp.now(),
      });
      Alert.alert('Objectif créé !', `"${title}" a été ajouté à tes objectifs.`, [
        { text: 'Super !', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert('Erreur', message || "Impossible de créer l'objectif.");
      console.error('[CreateGoal]', e);
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header title="Nouvel objectif" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
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
                Tu as déjà {MAX_ACTIVE_GOALS} objectifs actifs. Termine ou supprime-en un avant d'en créer un nouveau !
              </Text>
            </View>
          </View>
        )}

        {/* Intro */}
        <View
          style={{
            backgroundColor: colors.starGold + '15',
            borderRadius: 16,
            padding: 14,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: colors.starGold + '30',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>🎯</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                Pour quoi veux-tu économiser ?
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1, lineHeight: 17 }}>
                Fixe-toi un objectif et vois ta tirelire se remplir !
              </Text>
            </View>
          </View>
        </View>

        {/* Étape 1 — Le rêve */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          🎯 Quel est ton rêve ?
        </Text>
        <Input
          label="Nom de l'objectif"
          placeholder='Ex: "Nintendo Switch"'
          icon="flag-outline"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          error={errors.title}
        />

        <Input
          label="Description (optionnel)"
          placeholder="Décris ton objectif..."
          icon="document-text-outline"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={200}
        />

        {/* Étape 2 — Le prix */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          💰 Combien ça coûte ?
        </Text>
        <Input
          label="Montant à atteindre (€)"
          placeholder="50,00"
          icon="cash-outline"
          value={targetAmount}
          onChangeText={(t) => {
            setTargetAmount(t);
            setErrors((e) => ({ ...e, targetAmount: null }));
          }}
          keyboardType="decimal-pad"
          error={errors.targetAmount}
        />

        {/* Cibles rapides */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: -6, marginBottom: 20 }}>
          {quickTargets.map((a) => {
            const isAmount = targetAmount === String(a);
            return (
              <TouchableOpacity
                key={a}
                onPress={() => {
                  setTargetAmount(String(a));
                  setErrors((e) => ({ ...e, targetAmount: null }));
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: isAmount ? accent + '15' : colors.childSurface,
                  borderWidth: 1.5,
                  borderColor: isAmount ? accent : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: isAmount ? accent : colors.textSecondary,
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
            backgroundColor: colors.starGold + '12',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.starGold + '30',
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
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}
                numberOfLines={1}
              >
                {title.trim() ? `« ${title.trim()} »` : 'Mon futur objectif'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {parsedCents > 0
                  ? `Objectif : ${formatCurrencyShort(parsedCents)}`
                  : 'Choisis un nom et un montant'}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: parsedCents > 0 ? colors.textPrimary : colors.textLight,
              }}
            >
              {formatCurrencyShort(parsedCents)}
            </Text>
          </View>
        </View>

        <Button
          title={
            parsedCents > 0
              ? `Créer mon objectif · ${formatCurrencyShort(parsedCents)}`
              : 'Créer mon objectif'
          }
          icon={<Ionicons name="flag" size={18} color="#FFF" />}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!isValid || limitReached}
          style={{ backgroundColor: accent }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
