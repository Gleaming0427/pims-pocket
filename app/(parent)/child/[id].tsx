import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Share, Modal, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildStore } from '@/stores/childStore';
import { useTransactions } from '@/hooks/useTransactions';
import { useMissions } from '@/hooks/useMissions';
import { createChildAuthAccount } from '@/lib/auth';
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
  const { children, deleteChild } = useChildStore();
  const { transactions } = useTransactions(id);
  const { missions } = useMissions(id);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const child = children.find((c) => c.id === id);

  if (!child) return <LoadingScreen />;

  const isAccountActivated = !!child.linkedUserId;

  const activeMissions = missions.filter(
    (m) => m.status !== 'completed' && m.status !== 'expired'
  );

  const recentTransactions = transactions.slice(0, 5);

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
              await deleteChild(user?.familyId ?? '', id);
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
        message: `Rejoins PocketKids avec ton code d'invitation : ${child.inviteCode}`,
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
          <TouchableOpacity onPress={handleDeleteChild}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Card style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 16 }}>
          <Avatar avatarId={child.avatarId} size={80} />
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: colors.textPrimary,
              marginTop: 12,
            }}
          >
            {child.firstName}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            {getAge(child.birthDate)} ans
          </Text>
          <Text
            style={{
              fontSize: 32,
              fontWeight: '900',
              color: colors.primary,
              marginTop: 16,
            }}
          >
            {formatCurrencyShort(child.balance)}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textLight }}>Solde actuel</Text>
        </Card>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="trending-up" size={22} color={colors.success} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.success,
                marginTop: 6,
              }}
            >
              {formatCurrencyShort(child.totalEarned)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
              Total gagné
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="wallet" size={22} color={colors.info} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.info,
                marginTop: 6,
              }}
            >
              {formatCurrencyShort(child.totalSaved)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
              Épargné
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="calendar" size={22} color={colors.primary} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.primary,
                marginTop: 6,
              }}
            >
              {formatCurrencyShort(child.weeklyAllowance)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
              {getDayName(child.allowanceDay).slice(0, 3)}
            </Text>
          </Card>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/(parent)/remove-money?childId=${id}`)}
          style={{
            backgroundColor: colors.error,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Ionicons name="remove-circle-outline" size={20} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
            Retirer de l'argent
          </Text>
        </TouchableOpacity>

        {child.inviteCode && (
          <Card style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Code d'invitation
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: colors.primary,
                    letterSpacing: 4,
                    marginTop: 4,
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
            {isAccountActivated && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 }}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={{ fontSize: 13, color: colors.success, fontWeight: '600' }}>
                  Compte enfant activé
                </Text>
              </View>
            )}
          </Card>
        )}

        <Modal visible={showPinModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
                Définir le code PIN
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
                Choisissez un code PIN à 4 chiffres que {child.firstName} utilisera pour se connecter.
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
              Missions en cours
            </Text>
            {activeMissions.slice(0, 3).map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
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
              Dernières transactions
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
