import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { onGoalsSnapshot, deleteGoal, saveToGoal } from '@/lib/firestore';
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

const quickAmounts = [1, 2, 5, 10, 20];

export default function GoalsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [saveAmount, setSaveAmount] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
              await deleteGoal(goal.id);
            } catch {
              Alert.alert('Erreur', "Impossible de supprimer l'objectif.");
            }
          },
        },
      ]
    );
  }, []);

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

  if (isLoading) return <LoadingScreen />;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header
        title="Mes objectifs"
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(child)/goals/create')}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
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
            {activeGoals.map((g) => (
              <GoalCard key={g.id} goal={g} onPress={() => openGoal(g)} onDelete={() => handleDelete(g)} />
            ))}
            {completedGoals.map((g) => (
              <GoalCard key={g.id} goal={g} onDelete={() => handleDelete(g)} />
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={!!selectedGoal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>
                Épargner
              </Text>
              <TouchableOpacity onPress={() => setSelectedGoal(null)}>
                <Ionicons name="close-circle" size={28} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: 36 }}>🎯</Text>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                      {selectedGoal.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                      {formatCurrencyShort(selectedGoal.currentAmount)} / {formatCurrencyShort(selectedGoal.targetAmount)}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
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
                        backgroundColor: saveAmount === String(a) ? colors.primary : colors.background,
                        borderWidth: 1,
                        borderColor: saveAmount === String(a) ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: saveAmount === String(a) ? '#FFF' : colors.textSecondary,
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
                  title="Épargner"
                  onPress={handleSave}
                  loading={isSaving}
                  style={{ marginTop: 8, backgroundColor: colors.primary }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
