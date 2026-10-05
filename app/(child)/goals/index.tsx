import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { onGoalsSnapshot, deleteGoal, saveToGoal, updateGoal } from '@/lib/firestore';
import { Goal } from '@/types';
import GoalProgressCard from '@/components/shared/GoalProgressCard';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import { SplitBar, LegendRow } from '@/components/shared/SplitBar';
import Header from '@/components/shared/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import DashedButton from '@/components/ui/DashedButton';
import SegmentedControl from '@/components/ui/SegmentedControl';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { formatCurrencyShort } from '@/utils/formatters';
import { validateAmount, parseAmountToCents } from '@/utils/validators';
import colors from '@/constants/colors';
import { getContrastTextColor, getReadableAccent } from '@/utils/colorContrast';
import { useChildThemeStore } from '@/stores/childThemeStore';

const quickAmounts = [1, 2, 5, 10, 20];

type GoalTab = 'active' | 'completed';

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
  const [tab, setTab] = useState<GoalTab>('active');

  // Édition d'objectif (titre / prix)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState('');
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
    if (isSaving) return;
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
    setEditTarget(String(Number(goal.targetAmount) / 100));
  };

  const saveEdit = async () => {
    if (isUpdating) return;
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
  const savedInActive = activeGoals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
  const targetOfActive = activeGoals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);
  const remainingOfActive = Math.max(0, targetOfActive - savedInActive);

  const remainingCents = selectedGoal
    ? Math.max(0, Number(selectedGoal.targetAmount) - Number(selectedGoal.currentAmount))
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Mes objectifs"
        homeButton
        homeTarget="/(child)/dashboard"
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(child)/goals/create')}>
            <Ionicons name="add-circle" size={28} color={getReadableAccent(accent)} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {goals.length === 0 ? (
          <>
            <EmptyTabCard
              emoji="🎯"
              title="Aucun objectif"
              description="Fixe-toi un objectif d'épargne pour économiser pour quelque chose qui te fait envie !"
            />
            <Button
              accentColor={accent}
              title="Créer un objectif"
              icon={<Ionicons name="add" size={18} color={getContrastTextColor(accent)} />}
              onPress={() => router.push('/(child)/goals/create')}
            />
          </>
        ) : (
          <>
            {/* Synthèse de l'épargne */}
            <Card padding={20} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                Mon épargne
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {activeGoals.length} objectif{activeGoals.length > 1 ? 's' : ''} en cours
                {completedGoals.length > 0
                  ? ` · ${completedGoals.length} atteint${completedGoals.length > 1 ? 's' : ''}`
                  : ''}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 18 }}>
                <Text style={{ fontSize: 34, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 }}>
                  {formatCurrencyShort(savedInActive)}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 8 }}>
                  épargnés
                </Text>
              </View>
              <SplitBar
                segments={[
                  { value: savedInActive, color: colors.starGold },
                  { value: remainingOfActive, color: colors.canvasMuted },
                ]}
                style={{ marginTop: 14, marginBottom: 12 }}
              />
              <LegendRow
                color={colors.starGold}
                label="Épargné"
                share={targetOfActive > 0 ? `${Math.round((savedInActive / targetOfActive) * 100)} %` : undefined}
                amount={savedInActive}
              />
              <LegendRow color={colors.textLight} outlined label="Reste à épargner" amount={remainingOfActive} />
              {completedGoals.length > 0 && (
                <LegendRow
                  color={colors.success}
                  label="Objectifs atteints"
                  share={`${completedGoals.length}`}
                  amount={completedGoals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0)}
                />
              )}
            </Card>

            <SegmentedControl
              value={tab}
              onChange={setTab}
              style={{ marginBottom: 14 }}
              options={[
                { value: 'active', label: 'En cours', count: activeGoals.length },
                { value: 'completed', label: 'Atteints', count: completedGoals.length },
              ]}
            />

            {tab === 'active' && (
              <>
                {activeGoals.length === 0 ? (
                  <EmptyTabCard
                    emoji="🌱"
                    title="Pas d'objectif en cours"
                    description="Choisis ton prochain rêve et commence à épargner."
                  />
                ) : (
                  activeGoals.map((g) => (
                    <GoalProgressCard
                      key={g.id}
                      goal={g}
                      accentColor={colors.starGold}
                      onSave={() => openGoal(g)}
                      saveColor={accent}
                      onEdit={() => openEdit(g)}
                    />
                  ))
                )}
                <DashedButton label="Nouvel objectif" onPress={() => router.push('/(child)/goals/create')} />
              </>
            )}

            {tab === 'completed' &&
              (completedGoals.length === 0 ? (
                <EmptyTabCard
                  emoji="🏆"
                  title="Aucun objectif atteint"
                  description="Tes objectifs réalisés apparaîtront ici. Courage !"
                />
              ) : (
                completedGoals.map((g) => <GoalProgressCard key={g.id} goal={g} />)
              ))}
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
                  <Ionicons name="pencil" size={20} color={getReadableAccent(accent)} />
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
              accentColor={accent}
              label="Nom de l'objectif"
              placeholder='Ex: "Nintendo Switch"'
              icon="flag-outline"
              value={editTitle}
              onChangeText={setEditTitle}
              maxLength={100}
            />

            <Input
              accentColor={accent}
              label="Montant à atteindre (€)"
              placeholder="50,00"
              icon="cash-outline"
              value={editTarget}
              onChangeText={setEditTarget}
              keyboardType="decimal-pad"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: -6, marginBottom: 20 }}>
              {[10, 20, 50, 100].map((a) => (
                <Chip
                  accentColor={accent}
                  key={a}
                  label={`${a} €`}
                  selected={editTarget === String(a)}
                  surface="card"
                  onPress={() => setEditTarget(String(a))}
                  style={{ flex: 1 }}
                />
              ))}
            </View>

            <Button
              accentColor={accent}
              title="Enregistrer"
              onPress={saveEdit}
              loading={isUpdating}
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
                    <Chip
                      accentColor={accent}
                      key={a}
                      label={`${a} €`}
                      selected={saveAmount === String(a)}
                      surface="card"
                      onPress={() => { setSaveAmount(String(a)); setSaveError(null); }}
                      style={{ flex: 1, paddingLeft: 8, paddingRight: 8 }}
                    />
                  ))}
                </View>

                <Input
                  accentColor={accent}
                  label="Ou montant libre (€)"
                  placeholder="3,50"
                  icon="cash-outline"
                  value={saveAmount}
                  onChangeText={(t) => { setSaveAmount(t); setSaveError(null); }}
                  keyboardType="decimal-pad"
                  error={saveError}
                />

                {parsedSaveCents > 0 && (
                  <View
                    style={{
                      backgroundColor: colors.canvas,
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Après ce versement</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>
                      {formatCurrencyShort(Number(selectedGoal.currentAmount) + parsedSaveCents)} /{' '}
                      {formatCurrencyShort(selectedGoal.targetAmount)}
                      {Number(selectedGoal.currentAmount) + parsedSaveCents >= Number(selectedGoal.targetAmount)
                        ? '  🎉 Objectif atteint !'
                        : ''}
                    </Text>
                    <SplitBar
                      segments={[
                        {
                          value: Math.min(
                            Number(selectedGoal.targetAmount),
                            Number(selectedGoal.currentAmount) + parsedSaveCents
                          ),
                          color: colors.starGold,
                        },
                        {
                          value: Math.max(
                            0,
                            Number(selectedGoal.targetAmount) -
                              Number(selectedGoal.currentAmount) -
                              parsedSaveCents
                          ),
                          color: colors.canvasMuted,
                        },
                      ]}
                      style={{ marginTop: 8, height: 8, backgroundColor: colors.surface }}
                    />
                  </View>
                )}

                <Button
                  accentColor={accent}
                  title={
                    parsedSaveCents > 0
                      ? `Épargner ${formatCurrencyShort(parsedSaveCents)}`
                      : 'Épargner'
                  }
                  onPress={handleSave}
                  loading={isSaving}
                  disabled={parsedSaveCents === 0}
                  style={{ marginTop: 8 }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
