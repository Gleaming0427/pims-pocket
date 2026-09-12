import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { onGoalsSnapshot, deleteGoal, saveToGoal, updateGoal } from '@/lib/firestore';
import { Goal } from '@/types';
import GoalCard from '@/components/child/GoalCard';
import Header from '@/components/shared/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { formatCurrencyShort } from '@/utils/formatters';
import { validateAmount, parseAmountToCents } from '@/utils/validators';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

const quickAmounts = [1, 2, 5, 10, 20];

export default function GoalsScreen() {
    const accent = useChildThemeStore((s) => s.accent);
const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [saveAmount, setSaveAmount] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Édition d'objectif (titre / description / prix)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const familyId = user.familyId ?? user.id;
    const unsub = onGoalsSnapshot(familyId, user.id, (data) => {
      setGoals(data);
      setIsLoading(false);
    });
    return unsub;
  }, [user?.id, user?.familyId]);

  const handleDelete = useCallback((goal: Goal) => {
    Alert.alert(
      'Supprimer ?',
      `Supprimer l'objectif "${goal.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id, user?.childDocId);
            } catch {
              Alert.alert('Erreur', "Impossible de supprimer l'objectif.");
            }
          },
        },
      ]
    );
  }, [user?.childDocId]);

  const handleSave = async () => {
    if (!selectedGoal || !user?.familyId || !user?.childDocId) return;
    const amountError = validateAmount(saveAmount);
    setSaveError(amountError);
    if (amountError) return;

    const cents = parseAmountToCents(saveAmount);
    setIsSaving(true);
    try {
      await saveToGoal(selectedGoal.id, user.familyId, user.childDocId, cents);
      setSelectedGoal(null);
      setSaveAmount('');
      setSaveError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impossible d'ajouter à l'objectif.";
      if (msg.includes('Solde insuffisant')) {
        Alert.alert('Pas assez d\'argent', 'Ton solde est insuffisant pour épargner ce montant.');
      } else {
        Alert.alert('Erreur', msg);
      }
    }
    setIsSaving(false);
  };

  const openGoal = (goal: Goal) => {
    if (goal.status === 'completed') return;
    setSelectedGoal(goal);
    setSaveAmount('');
    setSaveError(null);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditDescription(goal.description ?? '');
    setEditTarget(String(Number(goal.targetAmount) / 100));
  };

  const saveEdit = async () => {
    if (!editingGoal) return;
    if (!editTitle.trim()) {
      Alert.alert('Erreur', "Donne un nom à ton objectif !");
      return;
    }
    const amount = parseFloat(editTarget.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Montant invalide.');
      return;
    }
    setIsUpdating(true);
    try {
      await updateGoal(editingGoal.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        targetAmount: Math.round(amount * 100),
      });
      setEditingGoal(null);
    } catch {
      Alert.alert('Erreur', "Impossible de modifier l'objectif.");
    }
    setIsUpdating(false);
  };

  // Montant valide pour activer le bouton
  const parsedSaveCents = useMemo(() => {
    if (!saveAmount.trim()) return 0;
    const cents = parseAmountToCents(saveAmount);
    return isNaN(cents) || cents <= 0 ? 0 : cents;
  }, [saveAmount]);

  if (isLoading) return <LoadingScreen />;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const remainingCents = selectedGoal
    ? Math.max(0, Number(selectedGoal.targetAmount) - Number(selectedGoal.currentAmount))
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header
        title="Mes objectifs"
        homeButton
        homeTarget="/(child)/dashboard"
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(child)/goals/create')}>
            <Ionicons name="add-circle" size={28} color={accent} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {goals.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title="Aucun objectif"
            description="Fixe-toi un objectif d'épargne pour économiser pour quelque chose qui te fait envie !"
            actionLabel="Créer un objectif"
            onAction={() => router.push('/(child)/goals/create')}
          />
        ) : (
          <>
            {activeGoals.length > 0 && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
                    🎯 En cours
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.starGold + '25',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
                      {activeGoals.length}
                    </Text>
                  </View>
                </View>
                {activeGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} onPress={() => openGoal(g)} onEdit={() => openEdit(g)} />
                ))}
              </>
            )}

            {completedGoals.length > 0 && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 24,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
                    🎉 Réalisés
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.success + '15',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
                      {completedGoals.length}
                    </Text>
                  </View>
                </View>
                {completedGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal modifier l'objectif */}
      <Modal visible={!!editingGoal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: accent + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pencil" size={20} color={accent} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                  Modifier
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingGoal(null)}>
                <Ionicons name="close-circle" size={28} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <Input
              label="Nom de l'objectif"
              placeholder='Ex: "Nintendo Switch"'
              icon="flag-outline"
              value={editTitle}
              onChangeText={setEditTitle}
              maxLength={100}
            />

            <Input
              label="Description (optionnel)"
              placeholder="Décris ton objectif..."
              icon="document-text-outline"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              maxLength={200}
            />

            <Input
              label="Montant à atteindre (€)"
              placeholder="50,00"
              icon="cash-outline"
              value={editTarget}
              onChangeText={setEditTarget}
              keyboardType="decimal-pad"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: -6, marginBottom: 20 }}>
              {[10, 20, 50, 100].map((a) => {
                const isAmount = editTarget === String(a);
                return (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setEditTarget(String(a))}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: isAmount ? accent + '15' : colors.childBg,
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

            <Button
              title="Enregistrer"
              onPress={saveEdit}
              loading={isUpdating}
              style={{ backgroundColor: accent }}
            />

            <TouchableOpacity
              onPress={() => {
                const goal = editingGoal;
                setEditingGoal(null);
                if (goal) handleDelete(goal);
              }}
              activeOpacity={0.7}
              style={{
                alignItems: 'center',
                paddingVertical: 14,
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.error }}>
                Supprimer l'objectif
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedGoal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.starGold + '25',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>🎯</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                  Épargner
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedGoal(null)}>
                <Ionicons name="close-circle" size={28} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                  {selectedGoal.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {formatCurrencyShort(selectedGoal.currentAmount)} / {formatCurrencyShort(selectedGoal.targetAmount)}
                  {remainingCents > 0
                    ? ` — encore ${formatCurrencyShort(remainingCents)} pour y arriver !`
                    : ''}
                </Text>

                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 18, marginBottom: 8 }}>
                  Ajouter un montant
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {quickAmounts.map((a) => (
                    <TouchableOpacity
                      key={a}
                      onPress={() => { setSaveAmount(String(a)); setSaveError(null); }}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: saveAmount === String(a) ? accent + '15' : colors.childBg,
                        borderWidth: 1.5,
                        borderColor: saveAmount === String(a) ? accent : colors.border,
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: saveAmount === String(a) ? accent : colors.textSecondary,
                      }}>
                        {a} €
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Ou montant libre (€)"
                  placeholder="3,50"
                  icon="cash-outline"
                  value={saveAmount}
                  onChangeText={(t) => { setSaveAmount(t); setSaveError(null); }}
                  keyboardType="decimal-pad"
                  error={saveError}
                />

                <Button
                  title={
                    parsedSaveCents > 0
                      ? `Épargner ${formatCurrencyShort(parsedSaveCents)}`
                      : 'Épargner'
                  }
                  onPress={handleSave}
                  loading={isSaving}
                  disabled={parsedSaveCents === 0}
                  style={{ marginTop: 8, backgroundColor: accent }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
