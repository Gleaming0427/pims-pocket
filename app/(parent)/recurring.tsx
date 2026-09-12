import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrencyShort, getDayName } from '@/utils/formatters';
import colors from '@/constants/colors';

const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

const quickAmounts = [2, 5, 10, 20];

export default function RecurringScreen() {
  const user = useAuthStore((s) => s.user);
  const { children, updateChild } = useChildren();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDay, setEditDay] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (child: typeof children[0]) => {
    setEditingId(child.id);
    setEditAmount(String(child.weeklyAllowance / 100));
    setEditDay(child.allowanceDay);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
  };

  const saveEdit = async (childId: string) => {
    if (!user) return;
    const amount = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Erreur', 'Montant invalide.');
      return;
    }

    setIsSaving(true);
    try {
      await updateChild(user.id, childId, {
        weeklyAllowance: Math.round(amount * 100),
        allowanceDay: editDay,
      });
      setEditingId(null);
      Alert.alert('Modifié', 'Le versement récurrent a été mis à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le versement.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Versements récurrents" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Explication */}
        <View
          style={{
            backgroundColor: colors.primary + '08',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.primary + '15',
            padding: 14,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                Argent de poche automatique
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1, lineHeight: 17 }}>
                Versé chaque semaine le jour choisi. Appuie sur un enfant pour modifier.
              </Text>
            </View>
          </View>
        </View>

        {children.length === 0 && (
          <EmptyState
            emoji="👶"
            title="Aucun enfant"
            description="Ajoute un enfant pour configurer son argent de poche hebdomadaire."
            actionLabel="Ajouter un enfant"
            onAction={() => {}}
          />
        )}

        {children.map((child) => {
          const isEditing = editingId === child.id;

          return (
            <Card key={child.id} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => (isEditing ? cancelEdit() : startEdit(child))}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Avatar avatarId={child.avatarId} size={52} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text
                    style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}
                  >
                    {child.firstName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    Chaque {getDayName(child.allowanceDay).toLowerCase()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}
                  >
                    {formatCurrencyShort(child.weeklyAllowance)}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
                    par semaine
                  </Text>
                </View>
                <Ionicons
                  name={isEditing ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textLight}
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>

              {isEditing && (
                <View
                  style={{
                    marginTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 16,
                  }}
                >
                  {/* Aperçu en direct */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: colors.primary + '08',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="eye" size={16} color={colors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                      {editAmount.trim() || '0'} € chaque {getDayName(editDay).toLowerCase()}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: colors.textPrimary,
                      marginBottom: 10,
                    }}
                  >
                    💶 Montant hebdomadaire
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      marginBottom: 12,
                    }}
                  >
                    <TextInput
                      value={editAmount}
                      onChangeText={setEditAmount}
                      keyboardType="decimal-pad"
                      style={{
                        flex: 1,
                        fontSize: 18,
                        fontWeight: '700',
                        color: colors.textPrimary,
                        paddingVertical: 12,
                      }}
                    />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textSecondary }}>
                      €
                    </Text>
                  </View>

                  {/* Montants rapides */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                    {quickAmounts.map((a) => {
                      const isAmount = editAmount === String(a);
                      return (
                        <TouchableOpacity
                          key={a}
                          onPress={() => setEditAmount(String(a))}
                          activeOpacity={0.7}
                          style={{
                            flex: 1,
                            paddingVertical: 9,
                            borderRadius: 12,
                            alignItems: 'center',
                            backgroundColor: isAmount ? colors.primary + '15' : colors.background,
                            borderWidth: 1.5,
                            borderColor: isAmount ? colors.primary : colors.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '700',
                              color: isAmount ? colors.primary : colors.textSecondary,
                            }}
                          >
                            {a} €
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: colors.textPrimary,
                      marginBottom: 10,
                    }}
                  >
                    📅 Jour de versement
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {DAYS.map((d) => {
                      const isDay = editDay === d.value;
                      return (
                        <TouchableOpacity
                          key={d.value}
                          onPress={() => setEditDay(d.value)}
                          activeOpacity={0.7}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            borderRadius: 10,
                            backgroundColor: isDay ? colors.primary + '15' : colors.background,
                            borderWidth: 1.5,
                            borderColor: isDay ? colors.primary : colors.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '700',
                              color: isDay ? colors.primary : colors.textSecondary,
                            }}
                          >
                            {d.label.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button
                      title="Annuler"
                      onPress={cancelEdit}
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Enregistrer"
                      onPress={() => saveEdit(child.id)}
                      size="sm"
                      loading={isSaving}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
