import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Header from '@/components/shared/Header';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import { AllowanceFrequency, Child } from '@/types';
import {
  formatCurrencyShort,
  allowanceScheduleLabel,
  allowancePeriodLabel,
} from '@/utils/formatters';
import colors from '@/constants/colors';

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
];

const FREQUENCIES: { value: AllowanceFrequency; label: string }[] = [
  { value: 'weekly', label: 'Chaque semaine' },
  { value: 'biweekly', label: 'Une semaine sur deux' },
  { value: 'monthly', label: 'Chaque mois' },
];

// Jours du mois proposés : 1 à 28, pour exister tous les mois
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

const quickAmounts = [2, 5, 10, 20];

// Clé de date locale 'YYYY-MM-DD'
function dateKey(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((parseKey(toKey).getTime() - parseKey(fromKey).getTime()) / 86400000);
}

// Les deux prochaines dates (après aujourd'hui) tombant sur ce jour de semaine
function nextTwoOccurrences(weekday: number): [string, string] {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() !== weekday);
  const first = dateKey(d);
  d.setDate(d.getDate() + 7);
  return [first, dateKey(d)];
}

function formatLongDate(key: string): string {
  return parseKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Premier versement par défaut en « une semaine sur deux » : on garde le
// rythme déjà en place s'il existe pour ce jour, sinon la prochaine date
function defaultAnchor(child: Child, weekday: number): string {
  const [first, second] = nextTwoOccurrences(weekday);
  const anchor = child.allowanceAnchorDate;
  if (anchor && child.allowanceDay === weekday) {
    return ((daysBetween(anchor, first) % 14) + 14) % 14 === 0 ? first : second;
  }
  return first;
}

export default function RecurringScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { children, updateChild } = useChildren();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editFrequency, setEditFrequency] = useState<AllowanceFrequency>('weekly');
  const [editDay, setEditDay] = useState(1);
  const [editAnchor, setEditAnchor] = useState('');
  const [editDayOfMonth, setEditDayOfMonth] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (child: Child) => {
    setEditingId(child.id);
    setEditAmount(String(child.weeklyAllowance / 100));
    setEditFrequency(child.allowanceFrequency ?? 'weekly');
    setEditDay(child.allowanceDay);
    setEditAnchor(defaultAnchor(child, child.allowanceDay));
    setEditDayOfMonth(child.allowanceDayOfMonth ?? 1);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
  };

  const changeDay = (child: Child, weekday: number) => {
    setEditDay(weekday);
    setEditAnchor(defaultAnchor(child, weekday));
  };

  const saveEdit = async (childId: string) => {
    if (isSaving) return;
    if (!user?.familyId) return;
    const amount = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Erreur', 'Montant invalide.');
      return;
    }

    const data: Partial<Child> = {
      weeklyAllowance: Math.round(amount * 100),
      allowanceFrequency: editFrequency,
    };
    if (editFrequency === 'monthly') {
      data.allowanceDayOfMonth = editDayOfMonth;
    } else {
      data.allowanceDay = editDay;
      if (editFrequency === 'biweekly') data.allowanceAnchorDate = editAnchor;
    }

    setIsSaving(true);
    try {
      await updateChild(user.familyId, childId, data);
      setEditingId(null);
      Alert.alert('Modifié', 'Le versement récurrent a été mis à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le versement.');
    } finally {
      setIsSaving(false);
    }
  };

  const sectionTitle = (label: string) => (
    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 }}>
      {label}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Versements récurrents" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Explication */}
        <Card padding={14} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                Argent de poche automatique
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 }}>
                Chaque semaine, une semaine sur deux ou chaque mois. Appuie sur un enfant pour
                modifier.
              </Text>
            </View>
          </View>
        </Card>

        {children.length === 0 && (
          <EmptyTabCard
            emoji="👶"
            title="Aucun enfant"
            description="Ajoute un enfant pour configurer son argent de poche."
          />
        )}

        {children.map((child) => {
          const isEditing = editingId === child.id;
          const [firstDate, secondDate] = nextTwoOccurrences(editDay);
          const previewSchedule = allowanceScheduleLabel({
            allowanceDay: editDay,
            allowanceFrequency: editFrequency,
            allowanceDayOfMonth: editDayOfMonth,
          });

          return (
            <Card key={child.id} padding={14} style={{ marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => (isEditing ? cancelEdit() : startEdit(child))}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Avatar avatarId={child.avatarId} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                    {child.firstName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {child.weeklyAllowance > 0
                      ? allowanceScheduleLabel(child).replace(/^./, (c) => c.toUpperCase())
                      : 'Pas de versement automatique'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
                    {formatCurrencyShort(child.weeklyAllowance)}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
                    {allowancePeriodLabel(child.allowanceFrequency)}
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
                    marginTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.canvasMuted,
                    paddingTop: 16,
                  }}
                >
                  {/* Rythme */}
                  {sectionTitle('Rythme')}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {FREQUENCIES.map((f) => (
                      <Chip
                        key={f.value}
                        label={f.label}
                        selected={editFrequency === f.value}
                        surface="card"
                        onPress={() => setEditFrequency(f.value)}
                      />
                    ))}
                  </View>

                  {/* Montant */}
                  {sectionTitle('Montant')}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.canvas,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      marginBottom: 10,
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
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                    {quickAmounts.map((a) => (
                      <Chip
                        key={a}
                        label={`${a} €`}
                        selected={editAmount === String(a)}
                        surface="card"
                        onPress={() => setEditAmount(String(a))}
                        style={{ flex: 1 }}
                      />
                    ))}
                  </View>

                  {/* Jour : de la semaine, ou du mois */}
                  {editFrequency === 'monthly' ? (
                    <>
                      {sectionTitle('Jour du mois')}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                        {MONTH_DAYS.map((day) => {
                          const selected = editDayOfMonth === day;
                          return (
                            <TouchableOpacity
                              key={day}
                              onPress={() => setEditDayOfMonth(day)}
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                              accessibilityLabel={`Le ${day}`}
                              style={{
                                width: '12.5%',
                                flexGrow: 1,
                                aspectRatio: 1,
                                maxWidth: 44,
                                borderRadius: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: selected ? colors.textPrimary : colors.canvas,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '700',
                                  color: selected ? '#FFF' : colors.textPrimary,
                                }}
                              >
                                {day}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <>
                      {sectionTitle('Jour de versement')}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                        {DAYS.map((d) => (
                          <Chip
                            key={d.value}
                            label={d.label}
                            selected={editDay === d.value}
                            surface="card"
                            onPress={() => changeDay(child, d.value)}
                          />
                        ))}
                      </View>
                    </>
                  )}

                  {/* Une semaine sur deux : quelle semaine commence */}
                  {editFrequency === 'biweekly' && (
                    <>
                      {sectionTitle('Premier versement')}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        {[firstDate, secondDate].map((key) => (
                          <Chip
                            key={key}
                            label={formatLongDate(key)}
                            selected={editAnchor === key}
                            surface="card"
                            onPress={() => setEditAnchor(key)}
                          />
                        ))}
                      </View>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 20 }}>
                        Choisis la semaine où {child.firstName} est chez toi : le versement reviendra
                        ensuite toutes les deux semaines.
                      </Text>
                    </>
                  )}

                  {/* Aperçu en direct */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: colors.canvas,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                      {editAmount.trim() || '0'} € {previewSchedule}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button
                      title="Annuler"
                      onPress={cancelEdit}
                      variant="light"
                      size="sm"
                      fullWidth={false}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Enregistrer"
                      onPress={() => saveEdit(child.id)}
                      variant="dark"
                      size="sm"
                      fullWidth={false}
                      loading={isSaving}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}
            </Card>
          );
        })}

        {children.length === 0 && (
          <Button
            title="Ajouter un enfant"
            variant="dark"
            icon={<Ionicons name="add" size={18} color="#FFF" />}
            onPress={() => router.push('/(parent)/child/add')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
