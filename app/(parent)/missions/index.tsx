import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMissions } from '@/hooks/useMissions';
import { useChildren } from '@/hooks/useChildren';
import { updateMission, deleteMission } from '@/lib/firestore';
import { Mission } from '@/types';
import MissionCard from '@/components/parent/MissionCard';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import colors from '@/constants/colors';

const quickRewards = [1, 2, 3, 5];

export default function MissionsScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const { missions, isLoading } = useMissions();
  const { children } = useChildren();

  // Édition
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editReward, setEditReward] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filtrer par enfant si on vient de la fiche enfant
  const scopedMissions = childId
    ? missions.filter((m) => m.childDocId === childId)
    : missions;

  const getChildName = (childIdUid: string) =>
    children.find((c) => c.linkedUserId === childIdUid)?.firstName ?? '';

  const activeMissions = scopedMissions.filter(
    (m) => m.status === 'available' || m.status === 'in_progress'
  );
  const pendingMissions = scopedMissions.filter(
    (m) => m.status === 'pending_validation'
  );
  const completedMissions = scopedMissions.filter((m) => m.status === 'completed');

  const openEdit = (mission: Mission) => {
    setEditingMission(mission);
    setEditTitle(mission.title);
    setEditDescription(mission.description ?? '');
    setEditReward(String(Number(mission.reward) / 100));
  };

  const saveEdit = async () => {
    if (!editingMission) return;
    if (!editTitle.trim()) {
      Alert.alert('Erreur', 'Donne un titre à la mission.');
      return;
    }
    const amount = parseFloat(editReward.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Récompense invalide.');
      return;
    }
    setIsUpdating(true);
    try {
      await updateMission(editingMission.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        reward: Math.round(amount * 100),
      });
      setEditingMission(null);
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier la mission.');
    }
    setIsUpdating(false);
  };

  const handleDelete = (mission: Mission) => {
    Alert.alert(
      'Supprimer la mission ?',
      `"${mission.title}" sera supprimée pour de bon.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMission(mission.id);
              setEditingMission(null);
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer la mission.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header
        title="Missions"
        showBack
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(parent)/missions/create')}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {scopedMissions.length === 0 ? (
          <EmptyState
            emoji="⚡"
            title="Aucune mission"
            description="Créez des missions pour motiver vos enfants et les récompenser !"
            actionLabel="Créer une mission"
            onAction={() => router.push('/(parent)/missions/create')}
          />
        ) : (
          <>
            {activeMissions.length > 0 && (
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
                    🎯 À faire
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary + '12',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                      {activeMissions.length}
                    </Text>
                  </View>
                </View>
                {activeMissions.map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    childName={getChildName(m.childId)}
                    onEdit={() => openEdit(m)}
                    onDelete={() => handleDelete(m)}
                  />
                ))}
              </>
            )}

            {pendingMissions.length > 0 && (
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
                    ⏳ À valider
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.accentOrange + '15',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accentOrange }}>
                      {pendingMissions.length}
                    </Text>
                  </View>
                </View>
                {pendingMissions.map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    childName={getChildName(m.childId)}
                    onEdit={() => openEdit(m)}
                    onDelete={() => handleDelete(m)}
                  />
                ))}
              </>
            )}

            {completedMissions.length > 0 && (
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
                    ✅ Terminées
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
                      {completedMissions.length}
                    </Text>
                  </View>
                </View>
                {completedMissions.slice(0, 10).map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    childName={getChildName(m.childId)}
                    onDelete={() => handleDelete(m)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal modifier la mission */}
      <Modal visible={!!editingMission} transparent animationType="slide">
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
                    backgroundColor: colors.primary + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pencil" size={20} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                  Modifier
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingMission(null)}>
                <Ionicons name="close-circle" size={28} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <Input
              label="Titre de la mission"
              placeholder="Ex: Ranger sa chambre"
              icon="flash-outline"
              value={editTitle}
              onChangeText={setEditTitle}
              maxLength={100}
            />

            <Input
              label="Description (optionnel)"
              placeholder="Décris la mission..."
              icon="document-text-outline"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              maxLength={200}
            />

            <Input
              label="Récompense (€)"
              placeholder="2,00"
              icon="cash-outline"
              value={editReward}
              onChangeText={setEditReward}
              keyboardType="decimal-pad"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: -6, marginBottom: 20 }}>
              {quickRewards.map((a) => {
                const isAmount = editReward === String(a);
                return (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setEditReward(String(a))}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
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

            <Button
              title="Enregistrer"
              onPress={saveEdit}
              loading={isUpdating}
            />

            <TouchableOpacity
              onPress={() => editingMission && handleDelete(editingMission)}
              activeOpacity={0.7}
              style={{
                alignItems: 'center',
                paddingVertical: 14,
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.error }}>
                Supprimer la mission
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
