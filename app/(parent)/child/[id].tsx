import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Share, Modal, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildStore } from '@/stores/childStore';
import { useTransactions } from '@/hooks/useTransactions';
import { useMissions } from '@/hooks/useMissions';
import { createChildAuthAccount, resetChildPin } from '@/lib/auth';
import { deleteChildAccount, onFamilyGoalsSnapshot } from '@/lib/firestore';
import { Goal } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DashedButton from '@/components/ui/DashedButton';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Header from '@/components/shared/Header';
import TransactionItem from '@/components/parent/TransactionItem';
import MissionCard from '@/components/parent/MissionCard';
import LoadingScreen from '@/components/shared/LoadingScreen';
import MoneySplitCard from '@/components/shared/MoneySplitCard';
import GoalProgressCard from '@/components/shared/GoalProgressCard';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import { formatCurrencyShort, getAge, allowanceScheduleLabel } from '@/utils/formatters';
import { validatePinCode } from '@/utils/validators';
import colors from '@/constants/colors';

type ChildTab = 'missions' | 'goals' | 'history';

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { children } = useChildStore();
  // IMPORTANT : les requêtes des hooks filtrent par UID (childId), pas par
  // l'ID du document. On charge donc les listes familiales (requête valide)
  // puis on filtre localement sur cet enfant ci-dessous.
  const { transactions } = useTransactions();
  const { missions } = useMissions();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  // Réinitialisation du PIN (compte déjà activé)
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [resetPinValue, setResetPinValue] = useState('');
  const [resetPinConfirm, setResetPinConfirm] = useState('');
  const [resetPinError, setResetPinError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const [tab, setTab] = useState<ChildTab>('missions');
  const [goals, setGoals] = useState<Goal[]>([]);

  // Objectifs de la famille, filtrés plus bas sur cet enfant
  useEffect(() => {
    if (!user?.familyId) return;
    const unsub = onFamilyGoalsSnapshot(user.familyId, setGoals);
    return () => unsub();
  }, [user?.familyId]);

  const child = children.find((c) => c.id === id);

  if (!child) return <LoadingScreen />;

  const isAccountActivated = !!child.linkedUserId;

  // Le store des missions est partagé avec le dashboard (qui charge toute la
  // famille) : on filtre LOCALEMENT sur cet enfant pour ne montrer que lui.
  const childMissions = missions.filter((m) => m.childDocId === id);
  const activeMissions = childMissions.filter(
    (m) => m.status !== 'completed' && m.status !== 'expired'
  );

  const childTransactions = transactions.filter(
    (t) => t.childDocId === id || t.childId === id
  );
  const recentTransactions = childTransactions.slice(0, 5);

  // Objectifs en cours (les plus avancés en tête), puis les 3 derniers atteints
  const goalProgress = (g: Goal) => (g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0);
  const childGoals = goals.filter(
    (g) => g.childDocId === id || (!!child.linkedUserId && g.childId === child.linkedUserId)
  );
  const activeGoals = childGoals
    .filter((g) => g.status === 'active')
    .sort((a, b) => goalProgress(b) - goalProgress(a));
  const visibleGoals = [
    ...activeGoals,
    ...childGoals
      .filter((g) => g.status === 'completed')
      .sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0))
      .slice(0, 3),
  ];

  const handleActivateAccount = async () => {
    if (activating) return;
    const err = validatePinCode(pinValue);
    if (err) { setPinError(err); return; }
    if (pinValue !== pinConfirm) { setPinError('Les codes PIN ne correspondent pas'); return; }
    if (!child.inviteCode || !id) return;

    setActivating(true);
    setPinError(null);
    try {
      await createChildAuthAccount(user?.familyId ?? '', id, child.inviteCode, pinValue);
      setShowPinModal(false);
      setPinValue('');
      setPinConfirm('');
      Alert.alert(
        'Compte activé !',
        `${child.firstName} peut maintenant se connecter avec le code ${child.inviteCode} et son PIN.`
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'activation";
      setPinError(msg);
    } finally {
      setActivating(false);
    }
  };

  const handleResetPin = async () => {
    if (resetting) return;
    const err = validatePinCode(resetPinValue);
    if (err) { setResetPinError(err); return; }
    if (resetPinValue !== resetPinConfirm) {
      setResetPinError('Les codes PIN ne correspondent pas');
      return;
    }
    if (!user?.familyId || !id) return;

    setResetting(true);
    setResetPinError(null);
    try {
      await resetChildPin(user.familyId, id, resetPinValue);
      setShowResetPinModal(false);
      setResetPinValue('');
      setResetPinConfirm('');
      Alert.alert(
        'PIN réinitialisé !',
        `${child.firstName} doit maintenant utiliser son nouveau PIN pour se connecter.`
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la réinitialisation';
      setResetPinError(msg);
    }
    setResetting(false);
  };

  const handleDeleteChild = () => {
    Alert.alert(
      'Supprimer enfant',
      `Veux-tu vraiment supprimer ${child.firstName} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChildAccount(user?.familyId ?? '', id);
              Alert.alert('Compte supprimé', 'Le compte enfant et toutes ses données ont été supprimés.');
              router.back();
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Erreur';
              Alert.alert('Erreur', msg);
            }
          },
        },
      ]
    );
  };

  const shareInviteCode = async () => {
    if (!child.inviteCode) return;
    try {
      await Share.share({
        message: `Rejoins Pims Pocket avec ton code d'invitation : ${child.inviteCode}`,
      });
    } catch {
      // silent
    }
  };

  // Code d'invitation + activation / réinitialisation du PIN
  const accountCard = child.inviteCode ? (
    <Card style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="key" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
            Compte enfant
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {isAccountActivated
              ? `${child.firstName} se connecte avec ce code et son PIN`
              : 'Choisis un PIN pour que ' + child.firstName + ' puisse se connecter'}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: (isAccountActivated ? colors.success : colors.accentOrange) + '20',
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
            {isAccountActivated ? '✓ Activé' : 'À activer'}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.canvas,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Code d'invitation</Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: colors.textPrimary,
              letterSpacing: 4,
              marginTop: 2,
            }}
          >
            {child.inviteCode}
          </Text>
        </View>
        <Button
          title="Partager"
          onPress={shareInviteCode}
          variant="light"
          size="sm"
          fullWidth={false}
          icon={<Ionicons name="share-outline" size={16} color={colors.textPrimary} />}
        />
      </View>

      {isAccountActivated ? (
        <Button
          title="Réinitialiser le PIN"
          onPress={() => setShowResetPinModal(true)}
          variant="light"
          icon={<Ionicons name="keypad-outline" size={18} color={colors.textPrimary} />}
          style={{ marginTop: 12 }}
        />
      ) : (
        <Button
          title="Activer le compte enfant"
          onPress={() => setShowPinModal(true)}
          variant="dark"
          icon={<Ionicons name="key-outline" size={18} color="#FFF" />}
          style={{ marginTop: 12 }}
        />
      )}
    </Card>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title={child.firstName}
        showBack
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity onPress={() => router.push(`/(parent)/child/edit?childId=${id}`)}>
              <Ionicons name="pencil" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteChild}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Vue d'ensemble : solde, épargne et total gagné */}
        <MoneySplitCard
          title={`${child.firstName}, ${getAge(child.birthDate)} ans`}
          subtitle={
            child.weeklyAllowance > 0
              ? `${formatCurrencyShort(child.weeklyAllowance)} ${allowanceScheduleLabel(child)}`
              : "Pas d'argent de poche automatique"
          }
          headerRight={<Avatar avatarId={child.avatarId} size={40} />}
          available={Number(child.balance) || 0}
          saved={Number(child.totalSaved) || 0}
          total={Number(child.totalEarned) || 0}
          totalLabel="Gagné au total"
          availableColor={colors.primary}
          savedColor={colors.secondary}
        />

        {/* Actions principales */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Button
            title="Envoyer"
            variant="dark"
            fullWidth={false}
            style={{ flex: 1 }}
            icon={<Ionicons name="paper-plane" size={18} color="#FFF" />}
            onPress={() => router.push(`/(parent)/send-money?childId=${id}`)}
          />
          <Button
            title="Retirer"
            variant="light"
            fullWidth={false}
            style={{ flex: 1 }}
            icon={<Ionicons name="remove-circle-outline" size={18} color={colors.error} />}
            onPress={() => router.push(`/(parent)/remove-money?childId=${id}`)}
          />
        </View>

        {/* Compte à activer : mis en avant tant que l'enfant ne peut pas se connecter */}
        {!isAccountActivated && accountCard}

        <Modal visible={showPinModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Text style={{ fontSize: 22 }}>🔑</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                  Définir le code PIN
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
                Choisis un code PIN à 4 chiffres que {child.firstName} utilisera pour se connecter.
              </Text>
              <Input
                label="Code PIN"
                placeholder="1234"
                icon="keypad-outline"
                value={pinValue}
                onChangeText={(t) => { setPinValue(t); setPinError(null); }}
                keyboardType="number-pad"
                maxLength={4}
                isPassword
              />
              <Input
                label="Confirmer le PIN"
                placeholder="1234"
                icon="keypad-outline"
                value={pinConfirm}
                onChangeText={(t) => { setPinConfirm(t); setPinError(null); }}
                keyboardType="number-pad"
                maxLength={4}
                isPassword
                error={pinError}
              />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => { setShowPinModal(false); setPinValue(''); setPinConfirm(''); setPinError(null); }}
                  activeOpacity={0.7}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '600', color: colors.textSecondary }}>Annuler</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Button title="Activer" onPress={handleActivateAccount} loading={activating} />
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal réinitialisation du PIN */}
        <Modal visible={showResetPinModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Text style={{ fontSize: 22 }}>🔑</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                  Réinitialiser le PIN
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
                Choisis un nouveau code PIN à 4 chiffres que {child.firstName} utilisera pour se connecter.
              </Text>
              <Input
                label="Nouveau code PIN"
                placeholder="1234"
                icon="keypad-outline"
                value={resetPinValue}
                onChangeText={(t) => { setResetPinValue(t); setResetPinError(null); }}
                keyboardType="number-pad"
                maxLength={4}
                isPassword
              />
              <Input
                label="Confirmer le PIN"
                placeholder="1234"
                icon="keypad-outline"
                value={resetPinConfirm}
                onChangeText={(t) => { setResetPinConfirm(t); setResetPinError(null); }}
                keyboardType="number-pad"
                maxLength={4}
                isPassword
                error={resetPinError}
              />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => { setShowResetPinModal(false); setResetPinValue(''); setResetPinConfirm(''); setResetPinError(null); }}
                  activeOpacity={0.7}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '600', color: colors.textSecondary }}>Annuler</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Button title="Réinitialiser" onPress={handleResetPin} loading={resetting} />
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Missions / objectifs / historique */}
        <SegmentedControl
          value={tab}
          onChange={setTab}
          style={{ marginTop: 8, marginBottom: 14 }}
          options={[
            { value: 'missions', label: 'Missions', count: activeMissions.length },
            { value: 'goals', label: 'Objectifs', count: activeGoals.length },
            { value: 'history', label: 'Historique' },
          ]}
        />

        {tab === 'missions' && (
          <>
            {activeMissions.length === 0 ? (
              <EmptyTabCard
                emoji="🚀"
                title="Aucune mission en cours"
                description={`Propose une mission à ${child.firstName} pour l'aider à gagner son argent de poche.`}
              />
            ) : (
              <>
                {activeMissions.slice(0, 3).map((m) => (
                  <MissionCard key={m.id} mission={m} />
                ))}
                <TouchableOpacity
                  onPress={() => router.push(`/(parent)/missions?childId=${id}`)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                    Tout voir ({activeMissions.length})
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}
            <DashedButton
              label="Nouvelle mission"
              onPress={() => router.push(`/(parent)/missions/create?childId=${id}`)}
            />
          </>
        )}

        {tab === 'goals' &&
          (visibleGoals.length === 0 ? (
            <EmptyTabCard
              emoji="🎯"
              title="Aucun objectif"
              description={`${child.firstName} peut créer ses objectifs d'épargne depuis son espace.`}
            />
          ) : (
            visibleGoals.map((goal) => <GoalProgressCard key={goal.id} goal={goal} />)
          ))}

        {tab === 'history' &&
          (recentTransactions.length === 0 ? (
            <EmptyTabCard
              emoji="🕐"
              title="Aucune transaction"
              description="Les mouvements d'argent apparaîtront ici."
            />
          ) : (
            <>
              <Card padding={14}>
                {recentTransactions.map((t, i) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    showDivider={i < recentTransactions.length - 1}
                  />
                ))}
              </Card>
              <TouchableOpacity
                onPress={() => router.push('/(parent)/history')}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                  Tout l'historique
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </>
          ))}

        {/* Compte activé : gestion de la connexion, en bas de page */}
        {isAccountActivated && accountCard && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 24,
                marginBottom: 12,
              }}
            >
              Connexion
            </Text>
            {accountCard}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
