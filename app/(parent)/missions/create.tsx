import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import { useMissionStore } from '@/stores/missionStore';
import { validateName, validateAmount, parseAmountToCents } from '@/utils/validators';
import colors from '@/constants/colors';

const suggestedMissions = [
  { title: 'Ranger sa chambre', icon: 'home', reward: '2' },
  { title: 'Mettre la table', icon: 'restaurant', reward: '1' },
  { title: 'Faire ses devoirs', icon: 'book', reward: '2' },
  { title: 'Promener le chien', icon: 'paw', reward: '3' },
  { title: 'Passer l\'aspirateur', icon: 'sparkles', reward: '3' },
  { title: 'Aider en cuisine', icon: 'pizza', reward: '2' },
];

const icons = [
  'flash', 'star', 'home', 'book', 'restaurant', 'paw',
  'sparkles', 'pizza', 'bicycle', 'football', 'musical-notes', 'leaf',
];

export default function CreateMissionScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { children } = useChildren();
  const { createMission, isLoading } = useMissionStore();

  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children.length === 1 ? children[0].id : null
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [icon, setIcon] = useState('flash');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleSuggestion = (s: (typeof suggestedMissions)[0]) => {
    setTitle(s.title);
    setIcon(s.icon);
    setReward(s.reward);
  };

  const handleSubmit = async () => {
    if (!selectedChildId) {
      Alert.alert('Erreur', 'Sélectionnez un enfant');
      return;
    }
    const titleError = validateName(title);
    const rewardError = validateAmount(reward);
    setErrors({ title: titleError, reward: rewardError });
    if (titleError || rewardError) return;
    if (!user) return;

    // Convention: childId stocké sur les missions/transactions = linkedUserId
    // (Auth UID de l'enfant). C'est ce que l'enfant utilisera pour requêter
    // ses missions, et ce que les Firestore Rules vérifient.
    const selectedChild = children.find((c) => c.id === selectedChildId);
    if (!selectedChild?.linkedUserId) {
      Alert.alert(
        'Compte enfant non activé',
        `${selectedChild?.firstName ?? 'Cet enfant'} doit d'abord activer son compte (créer son code et PIN) pour recevoir des missions.`
      );
      return;
    }

    try {
      await createMission({
        parentId: user.id,
        childId: selectedChild.linkedUserId,
        childDocId: selectedChild.id,
        title: title.trim(),
        description: description.trim(),
        reward: parseAmountToCents(reward),
        icon,
        status: 'available',
        isRecurring,
        ...(isRecurring ? { recurringFrequency: frequency } : {}),
        createdAt: null as never,
      });
      Alert.alert('Mission créée !', `"${title}" a été assignée.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la mission.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Créer une mission" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 24, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 10 }}
        >
          Assigner à
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => setSelectedChildId(child.id)}
              style={{
                alignItems: 'center',
                padding: 10,
                borderRadius: 14,
                backgroundColor: selectedChildId === child.id ? colors.primary + '15' : colors.surface,
                borderWidth: 2,
                borderColor: selectedChildId === child.id ? colors.primary : colors.border,
              }}
            >
              <Avatar avatarId={child.avatarId} size={40} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginTop: 4 }}>
                {child.firstName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 10 }}
        >
          Suggestions
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {suggestedMissions.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSuggestion(s)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 13, color: colors.textPrimary }}>{s.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Input
          label="Titre de la mission"
          placeholder="Ex: Ranger sa chambre"
          icon="flash-outline"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />

        <Input
          label="Description (optionnel)"
          placeholder="Décrivez ce que l'enfant doit faire..."
          icon="document-text-outline"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Input
          label="Récompense (€)"
          placeholder="2,00"
          icon="cash-outline"
          value={reward}
          onChangeText={setReward}
          keyboardType="decimal-pad"
          error={errors.reward}
        />

        <Text
          style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 10 }}
        >
          Icône
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {icons.map((ic) => (
            <TouchableOpacity
              key={ic}
              onPress={() => setIcon(ic)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: icon === ic ? colors.primary : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: icon === ic ? colors.primary : colors.border,
              }}
            >
              <Ionicons
                name={ic as keyof typeof Ionicons.glyphMap}
                size={22}
                color={icon === ic ? '#FFF' : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => setIsRecurring(!isRecurring)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            marginBottom: isRecurring ? 12 : 20,
          }}
        >
          <Ionicons
            name={isRecurring ? 'checkbox' : 'square-outline'}
            size={24}
            color={colors.primary}
          />
          <Text style={{ marginLeft: 10, fontSize: 15, color: colors.textPrimary, fontWeight: '500' }}>
            Mission récurrente
          </Text>
        </TouchableOpacity>

        {isRecurring && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {(['daily', 'weekly', 'monthly'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFrequency(f)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: frequency === f ? colors.primary : colors.surface,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: frequency === f ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: frequency === f ? '#FFF' : colors.textSecondary,
                  }}
                >
                  {{ daily: 'Quotidien', weekly: 'Hebdo', monthly: 'Mensuel' }[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Button title="Créer la mission" onPress={handleSubmit} loading={isLoading} />
      </ScrollView>
    </SafeAreaView>
  );
}
