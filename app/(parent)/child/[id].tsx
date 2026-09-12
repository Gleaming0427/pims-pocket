import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Share, Modal, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildStore } from '@/stores/childStore';
import { useTransactions } from '@/hooks/useTransactions';
import { useMissions } from '@/hooks/useMissions';
import { createChildAuthAccount, resetChildPin } from '@/lib/auth';
import { deleteChildAccount } from '@/lib/firestore';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Header from '@/components/shared/Header';
import TransactionItem from '@/components/parent/TransactionItem';
import MissionCard from '@/components/parent/MissionCard';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { formatCurrencyShort, getDayName, getAge } from '@/utils/formatters';
import { validatePinCode } from '@/utils/validators';
import colors from '@/constants/colors';

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

  const handleActivateAccount = async () => {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
        {/* Carte héro enfant */}
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 24,
            padding: 24,
            marginBottom: 16,
            overflow: 'hidden',
            alignItems: 'center',
          }}
        >
          {/* Cercles décoratifs */}
          <View
            style={{
              position: 'absolute',
              top: -45,
              right: -35,
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: colors.primaryLight + '30',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -55,
              left: -25,
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: colors.starGold + '1A',
            }}
          />

          <View
            style={{
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.25)',
              borderRadius: 999,
            }}
          >
            <Avatar avatarId={child.avatarId} size={64} />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: '#FFF',
              marginTop: 12,
            }}
          >
            {child.firstName}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.75)',
              marginTop: 3,
            }}
          >
            {getAge(child.birthDate)} ans
          </Text>
          <Text
            style={{
              fontSize: 34,
              fontWeight: '800',
              color: '#FFF',
              letterSpacing: -0.5,
              marginTop: 14,
            }}
          >
            {formatCurrencyShort(child.balance)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.7)',
              marginTop: 2,
            }}
          >
            Solde actuel
          </Text>
        </View>

        {/* Mini-stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <Card style={{ flex: 1, alignItems: 'center' }} padding={12}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: colors.success + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="trending-up" size={18} color={colors.success} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.success,
                marginTop: 8,
              }}
            >
              {formatCurrencyShort(child.totalEarned)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 1 }}>
              Total gagné
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }} padding={12}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: colors.info + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="wallet" size={18} color={colors.info} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.info,
                marginTop: 8,
              }}
            >
              {formatCurrencyShort(child.totalSaved)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 1 }}>
              Épargné
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }} padding={12}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="calendar" size={18} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.primary,
                marginTop: 8,
              }}
            >
              {formatCurrencyShort(child.weeklyAllowance)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 1 }}>
              {getDayName(child.allowanceDay).slice(0, 3)}
            </Text>
          </Card>
        </View>

        {/* Retirer de l'argent */}
        <TouchableOpacity
          onPress={() => router.push(`/(parent)/remove-money?childId=${id}`)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.error + '12',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.error + '30',
            padding: 14,
            marginBottom: 16,
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
            <Ionicons name="remove-circle-outline" size={20} color={colors.error} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.error }}>
              Retirer de l'argent
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
              Débiter la tirelire de {child.firstName}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.error} />
        </TouchableOpacity>

        {/* Compte enfant / code d'invitation */}
        {child.inviteCode && (
          <Card style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="key" size={18} color={colors.primary} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.textPrimary,
                }}
              >
                Compte enfant
              </Text>
              {isAccountActivated ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: colors.success + '15',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
                    Activé
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: colors.accentOrange + '15',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accentOrange }}>
                    À activer
                  </Text>
                </View>
              )}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.background,
                borderRadius: 14,
                padding: 14,
              }}
            >
              <View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Code d'invitation
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: colors.primary,
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
                variant="outline"
                size="sm"
                fullWidth={false}
                icon={<Ionicons name="share-outline" size={16} color={colors.primary} />}
              />
            </View>

            {!isAccountActivated && (
              <Button
                title="Activer le compte enfant"
                onPress={() => setShowPinModal(true)}
                variant="secondary"
                icon={<Ionicons name="key-outline" size={18} color="#FFF" />}
                style={{ marginTop: 12 }}
              />
            )}
          </Card>
        )}

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

        {activeMissions.length > 0 && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
                marginBottom: 12,
              }}
            >
              🚀 Missions en cours
            </Text>
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

        {recentTransactions.length > 0 && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 8,
                marginBottom: 12,
              }}
            >
              🕐 Dernières transactions
            </Text>
            <Card>
              {recentTransactions.map((t) => (
                <TransactionItem key={t.id} transaction={t} />
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
