import React, { useState, useMemo } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import { useTransactionStore } from '@/stores/transactionStore';
import { validateAmount, parseAmountToCents } from '@/utils/validators';
import colors from '@/constants/colors';

const motifs = [
  { label: 'Bêtise', emoji: '😤' },
  { label: 'Devoirs non faits', emoji: '📚' },
  { label: 'Autre', emoji: '⚠️' },
];

export default function RemoveMoneyScreen() {
  const router = useRouter();
  const { childId: preselectedChildId } = useLocalSearchParams<{ childId?: string }>();
  const user = useAuthStore((s) => s.user);
  const { children } = useChildren();
  const { removeMoney, isLoading } = useTransactionStore();

  const [selectedIds, setSelectedIds] = useState<string[]>(
    preselectedChildId ? [preselectedChildId] : []
  );
  const [amount, setAmount] = useState('');
  const [motifLabel, setMotifLabel] = useState(motifs[0].label);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activatedChildren = useMemo(
    () => children.filter((c) => c.linkedUserId),
    [children]
  );

  const toggleChild = (childId: string) => {
    setSelectedIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const handleRemove = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un enfant');
      return;
    }
    const amountError = validateAmount(amount);
    setError(amountError);
    if (amountError) return;
    if (!user) return;

    const selectedChildren = children.filter((c) => selectedIds.includes(c.id));
    const inactiveChild = selectedChildren.find((c) => !c.linkedUserId);
    if (inactiveChild) {
      Alert.alert(
        'Compte enfant non activé',
        `${inactiveChild.firstName ?? 'Un enfant'} doit d'abord activer son compte.`
      );
      return;
    }

    const cents = parseAmountToCents(amount);
    const finalDescription = description.trim() || motifLabel;
    const names = selectedChildren.map((c) => c.firstName).join(', ');

    Alert.alert(
      'Confirmer le retrait',
      `Retirer ${amount} € à ${names} ?\nMotif : ${finalDescription}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            let failures = 0;
            for (const child of selectedChildren) {
              try {
                await removeMoney(
                  user.familyId!,
                  child.id,
                  child.linkedUserId!,
                  cents,
                  finalDescription
                );
              } catch {
                failures++;
              }
            }

            if (failures === 0) {
              Alert.alert('Retrait effectué', `${amount} € retirés de la tirelire de ${names}.`, [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else if (failures < selectedChildren.length) {
              Alert.alert(
                'Partiellement effectué',
                `Retrait effectué pour ${selectedChildren.length - failures} enfant(s), ${failures} échec(s).`,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } else {
              Alert.alert('Erreur', "Impossible de retirer l'argent.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Retirer de l'argent" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
            Choisir un ou plusieurs enfants
          </Text>
          {selectedIds.length > 0 && (
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.error }}>
              {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {children.map((child) => {
            const isSelected = selectedIds.includes(child.id);
            const isActivated = !!child.linkedUserId;
            return (
              <TouchableOpacity
                key={child.id}
                onPress={() => toggleChild(child.id)}
                style={{
                  alignItems: 'center',
                  padding: 12,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  backgroundColor: isSelected ? colors.error + '15' : colors.surface,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.error : colors.border,
                  opacity: isActivated ? 1 : 0.6,
                }}
              >
                <View style={{ position: 'relative' }}>
                  <Avatar avatarId={child.avatarId} size={48} />
                  {isSelected && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: colors.error,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginTop: 6,
                  }}
                >
                  {child.firstName}
                </Text>
                {!isActivated && (
                  <Text style={{ fontSize: 10, color: colors.textLight, marginTop: 2 }}>
                    Non activé
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Montant (€) par enfant"
          placeholder="5,00"
          icon="cash-outline"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          error={error}
        />

        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 10,
          }}
        >
          Motif
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {motifs.map((m) => (
            <TouchableOpacity
              key={m.label}
              onPress={() => setMotifLabel(m.label)}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                alignItems: 'center',
                backgroundColor: motifLabel === m.label ? colors.error + '15' : colors.surface,
                borderWidth: 2,
                borderColor: motifLabel === m.label ? colors.error : colors.border,
              }}
            >
              <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: motifLabel === m.label ? colors.error : colors.textSecondary,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Précision (optionnel)"
          placeholder="Pourquoi ce retrait..."
          icon="chatbubble-outline"
          value={description}
          onChangeText={setDescription}
          maxLength={200}
        />

        <Button
          title={`Retirer${selectedIds.length > 1 ? ` de ${selectedIds.length} enfants` : ''}`}
          onPress={handleRemove}
          loading={isLoading}
          style={{ marginTop: 8, backgroundColor: colors.error }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
