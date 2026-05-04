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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card style={{ marginBottom: 20, backgroundColor: colors.info + '15' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="information-circle" size={22} color={colors.info} />
            <Text
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: 20,
              }}
            >
              Les versements sont envoyés automatiquement chaque semaine.
              Appuyez sur un enfant pour modifier son montant ou son jour de versement.
            </Text>
          </View>
        </Card>

        {children.length === 0 && (
          <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
            <Ionicons name="people-outline" size={40} color={colors.textLight} />
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 10 }}>
              Aucun enfant ajouté
            </Text>
          </Card>
        )}

        {children.map((child) => {
          const isEditing = editingId === child.id;

          return (
            <Card key={child.id} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => isEditing ? cancelEdit() : startEdit(child)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Avatar avatarId={child.avatarId} size={48} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}
                  >
                    {child.firstName}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                    Chaque {getDayName(child.allowanceDay).toLowerCase()}
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}
                >
                  {formatCurrencyShort(child.weeklyAllowance)}
                </Text>
                <Ionicons
                  name={isEditing ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textLight}
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>

              {isEditing && (
                <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                    Montant hebdomadaire
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.background,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      marginBottom: 16,
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

                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                    Jour de versement
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {DAYS.map((d) => (
                      <TouchableOpacity
                        key={d.value}
                        onPress={() => setEditDay(d.value)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                          borderRadius: 10,
                          backgroundColor: editDay === d.value ? colors.primary : colors.background,
                          borderWidth: 1,
                          borderColor: editDay === d.value ? colors.primary : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: editDay === d.value ? '#FFF' : colors.textSecondary,
                          }}
                        >
                          {d.label.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
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
