import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import GoalProgressCard from '@/components/shared/GoalProgressCard';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import StepHeader from '@/components/ui/StepHeader';
import { useAuthStore } from '@/stores/authStore';
import { createGoal, onGoalsSnapshot } from '@/lib/firestore';
import { validateName, validateAmount, parseAmountToCents } from '@/utils/validators';
import { formatCurrencyShort } from '@/utils/formatters';
import { Timestamp } from 'firebase/firestore';
import { Goal } from '@/types';
import colors from '@/constants/colors';
import { getContrastTextColor } from '@/utils/colorContrast';
import { useChildThemeStore } from '@/stores/childThemeStore';

const quickTargets = [10, 20, 50, 100];

// Idées pour démarrer vite
const goalIdeas = ['🎮 Jeu vidéo', '🚲 Vélo', '📚 Livre', '🧱 Lego', '🎬 Sortie ciné', '🧸 Peluche'];

// Limite de sécurité : maximum d'objectifs actifs par enfant
const MAX_ACTIVE_GOALS = 10;

export default function CreateGoalScreen() {
  const accent = useChildThemeStore((s) => s.accent);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState('');
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
    if (isLoading) return;
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
      await createGoal({
        familyId: user.familyId ?? user.id,
        childId: user.id,
        childDocId: user.childDocId,
        parentId: user.parentId ?? '',
        title: title.trim(),
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

  // Aperçu : la carte telle qu'elle apparaîtra dans « Mes objectifs »
  const previewGoal: Goal = {
    id: 'preview',
    familyId: user?.familyId,
    childId: user?.id ?? '',
    title: title.trim() || 'Mon futur objectif',
    targetAmount: parsedCents,
    currentAmount: 0,
    status: 'active',
    createdAt: Timestamp.now(),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Nouvel objectif" showBack />
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
                  Tu as déjà {MAX_ACTIVE_GOALS} objectifs actifs. Termine ou supprime-en un avant d'en
                  créer un nouveau !
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Étape 1 — Le rêve */}
        <Card style={{ marginBottom: 12 }}>
          <StepHeader step={1} title="Quel est ton rêve ?" />
          <Input
            accentColor={accent}
            label="Nom de l'objectif"
            placeholder='Ex: "Nintendo Switch"'
            icon="flag-outline"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              setErrors((e) => ({ ...e, title: null }));
            }}
            maxLength={100}
            error={errors.title}
          />
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: -4, marginBottom: 8 }}>
            Besoin d'une idée ?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {goalIdeas.map((idea) => {
              const label = idea.replace(/^\S+\s/, '');
              return (
                <Chip
                  accentColor={accent}
                  key={idea}
                  label={idea}
                  selected={title === label}
                  surface="card"
                  onPress={() => {
                    setTitle(label);
                    setErrors((e) => ({ ...e, title: null }));
                  }}
                />
              );
            })}
          </View>
        </Card>

        {/* Étape 2 — Le prix */}
        <Card style={{ marginBottom: 20 }}>
          <StepHeader step={2} title="Combien ça coûte ?" />
          <Input
            accentColor={accent}
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
          <View style={{ flexDirection: 'row', gap: 8, marginTop: -4 }}>
            {quickTargets.map((a) => (
              <Chip
                accentColor={accent}
                key={a}
                label={`${a} €`}
                selected={targetAmount === String(a)}
                surface="card"
                onPress={() => {
                  setTargetAmount(String(a));
                  setErrors((e) => ({ ...e, targetAmount: null }));
                }}
                style={{ flex: 1 }}
              />
            ))}
          </View>
        </Card>

        {/* Aperçu de la carte d'objectif */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
          Aperçu
        </Text>
        <GoalProgressCard goal={previewGoal} accentColor={colors.starGold} />

        <Button
          accentColor={accent}
          title="Créer mon objectif"
          icon={<Ionicons name="flag" size={18} color={getContrastTextColor(accent)} />}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!isValid || limitReached}
          style={{ marginTop: 6 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
