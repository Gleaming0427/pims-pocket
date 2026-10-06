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
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import MissionSummaryCard from '@/components/shared/MissionSummaryCard';
import LoadingScreen from '@/components/shared/LoadingScreen';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Chip from '@/components/ui/Chip';
import DashedButton from '@/components/ui/DashedButton';
import SegmentedControl from '@/components/ui/SegmentedControl';
import colors from '@/constants/colors';

const quickRewards = [1, 2, 3, 5];

type MissionTab = 'todo' | 'pending' | 'done';

export default function MissionsScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const { missions, isLoading } = useMissions();
  const { children } = useChildren();

  // Édition
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editReward, setEditReward] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filtre par enfant : présélectionné quand on vient de la fiche enfant
  const [selectedChildId, setSelectedChildId] = useState<string>(childId ?? 'all');
  // Onglet choisi ; par défaut « À valider » s'il y a quelque chose à valider
  const [tab, setTab] = useState<MissionTab | null>(null);

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const scopedMissions = selectedChild
    ? missions.filter(
        (m) =>
          m.childDocId === selectedChild.id ||
          (!!selectedChild.linkedUserId && m.childId === selectedChild.linkedUserId)
      )
    : missions;

  const getChildName = (mission: Mission) =>
    children.find(
      (c) => (!!c.linkedUserId && c.linkedUserId === mission.childId) || c.id === mission.childDocId
    )?.firstName ?? '';

  const activeMissions = scopedMissions.filter(
    (m) => m.status === 'available' || m.status === 'in_progress'
  );
  const pendingMissions = scopedMissions.filter(
    (m) => m.status === 'pending_validation'
  );
  const completedMissions = scopedMissions.filter((m) => m.status === 'completed');
  const currentTab: MissionTab = tab ?? (pendingMissions.length > 0 ? 'pending' : 'todo');

  const openEdit = (mission: Mission) => {
    setEditingMission(mission);
    setEditTitle(mission.title);
    setEditReward(String(Number(mission.reward) / 100));
  };

  const saveEdit = async () => {
    if (isUpdating) return;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Missions"
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() =>
              router.push(
                selectedChild
                  ? `/(parent)/missions/create?childId=${selectedChild.id}`
                  : '/(parent)/missions/create'
              )
            }
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        <MissionSummaryCard
          todo={activeMissions}
          pending={pendingMissions}
          done={completedMissions}
          child={selectedChild}
        />

        {/* Filtre par enfant */}
        {children.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            style={{ marginBottom: 14 }}
          >
            {[{ id: 'all', firstName: 'Tous', avatarId: null as string | null }, ...children].map((c) => (
              <Chip
                key={c.id}
                label={c.firstName}
                selected={selectedChildId === c.id}
                onPress={() => setSelectedChildId(c.id)}
                left={c.avatarId ? <Avatar avatarId={c.avatarId} size={22} /> : undefined}
              />
            ))}
          </ScrollView>
        )}

        <SegmentedControl
          value={currentTab}
          onChange={setTab}
          style={{ marginBottom: 14 }}
          options={[
            { value: 'todo', label: 'À faire', count: activeMissions.length },
            { value: 'pending', label: 'À valider', count: pendingMissions.length },
            { value: 'done', label: 'Terminées', count: completedMissions.length },
          ]}
        />

        {currentTab === 'todo' && (
          <>
            {activeMissions.length === 0 ? (
              <EmptyTabCard
                icon="flash-outline"
                title="Aucune mission à faire"
                description="Crée des missions pour motiver tes enfants et les récompenser."
              />
            ) : (
              activeMissions.map((m) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  childName={selectedChild ? undefined : getChildName(m)}
                  onEdit={() => openEdit(m)}
                />
              ))
            )}
            <DashedButton
              label="Nouvelle mission"
              onPress={() =>
                router.push(
                  selectedChild
                    ? `/(parent)/missions/create?childId=${selectedChild.id}`
                    : '/(parent)/missions/create'
                )
              }
            />
          </>
        )}

        {currentTab === 'pending' &&
          (pendingMissions.length === 0 ? (
            <EmptyTabCard
              icon="checkmark-circle-outline"
              title="Rien à valider"
              description="Les missions terminées par tes enfants apparaîtront ici."
            />
          ) : (
            <>
              {pendingMissions.map((m) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  childName={selectedChild ? undefined : getChildName(m)}
                  onEdit={() => openEdit(m)}
                />
              ))}
              <Button
                title="Valider maintenant"
                variant="dark"
                icon={<Ionicons name="checkmark-done" size={18} color="#FFF" />}
                onPress={() => router.push('/(parent)/validations')}
                style={{ marginTop: 6 }}
              />
            </>
          ))}

        {currentTab === 'done' &&
          (completedMissions.length === 0 ? (
            <EmptyTabCard
              icon="flag-outline"
              title="Aucune mission terminée"
              description="Les missions validées apparaîtront ici."
            />
          ) : (
            completedMissions.slice(0, 10).map((m) => (
              <MissionCard
                key={m.id}
                mission={m}
                childName={selectedChild ? undefined : getChildName(m)}
                onDelete={() => handleDelete(m)}
              />
            ))
          ))}
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
                      backgroundColor: isAmount ? colors.primary + '15' : colors.canvas,
                      borderWidth: 1.5,
                      borderColor: isAmount ? colors.primary : colors.canvasMuted,
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
              variant="dark"
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
