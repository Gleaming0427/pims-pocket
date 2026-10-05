import React, { useState, useMemo } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import StepHeader from '@/components/ui/StepHeader';
import DashedButton from '@/components/ui/DashedButton';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import { useMissionStore } from '@/stores/missionStore';
import { Mission } from '@/types';
import { validateName, validateAmount, parseAmountToCents } from '@/utils/validators';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

const suggestedMissions = [
  { title: 'Ranger sa chambre', icon: 'home', reward: '2' },
  { title: 'Mettre la table', icon: 'restaurant', reward: '1' },
  { title: 'Faire ses devoirs', icon: 'book', reward: '2' },
  { title: 'Promener le chien', icon: 'paw', reward: '3' },
  { title: "Passer l'aspirateur", icon: 'sparkles', reward: '3' },
  { title: 'Aider en cuisine', icon: 'pizza', reward: '2' },
];

const icons = [
  'flash', 'star', 'home', 'book', 'restaurant', 'paw',
  'sparkles', 'pizza', 'bicycle', 'football', 'musical-notes', 'leaf',
];

const quickRewards = [1, 2, 3, 5];

type Frequency = NonNullable<Mission['recurringFrequency']>;

const frequencyLabel: Record<Frequency, string> = {
  daily: 'Chaque jour',
  weekly: 'Chaque semaine',
  biweekly: 'Une semaine sur deux',
  monthly: 'Chaque mois',
};

export default function CreateMissionScreen() {
  const router = useRouter();
  const { childId: preselectedChildId } = useLocalSearchParams<{ childId?: string }>();
  const user = useAuthStore((s) => s.user);
  const { children } = useChildren();
  const { createMission, isLoading } = useMissionStore();

  const [selectedIds, setSelectedIds] = useState<string[]>(
    preselectedChildId
      ? [preselectedChildId]
      : children.length === 1 ? [children[0].id] : []
  );
  const [title, setTitle] = useState('');
  const [reward, setReward] = useState('');
  const [icon, setIcon] = useState('flash');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [autoValidate, setAutoValidate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Total en direct : enfants sélectionnés × récompense
  const parsedReward = useMemo(() => {
    if (!reward.trim()) return 0;
    const cents = parseAmountToCents(reward);
    return isNaN(cents) || cents <= 0 ? 0 : cents;
  }, [reward]);
  const totalCents = selectedIds.length > 0 ? parsedReward * selectedIds.length : 0;

  const selectedNames = children
    .filter((c) => selectedIds.includes(c.id))
    .map((c) => c.firstName)
    .join(', ');

  const isValid =
    selectedIds.length > 0 &&
    title.trim().length > 0 &&
    parsedReward > 0;

  const toggleChild = (childId: string) => {
    setSelectedIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const handleSuggestion = (s: (typeof suggestedMissions)[0]) => {
    setTitle(s.title);
    setIcon(s.icon);
    setReward(s.reward);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    if (selectedIds.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un enfant');
      return;
    }
    const titleError = validateName(title);
    const rewardError = validateAmount(reward);
    setErrors({ title: titleError, reward: rewardError });
    if (titleError || rewardError) return;
    if (!user) return;

    const selectedChildren = children.filter((c) => selectedIds.includes(c.id));
    const inactiveChild = selectedChildren.find((c) => !c.linkedUserId);
    if (inactiveChild) {
      Alert.alert(
        'Compte enfant non activé',
        `${inactiveChild.firstName ?? 'Cet enfant'} doit d'abord activer son compte (créer son code et PIN) pour recevoir des missions.`
      );
      return;
    }

    let failures = 0;
    for (const child of selectedChildren) {
      try {
        await createMission({
          familyId: user.familyId!,
          parentId: user.id,
          childId: child.linkedUserId!,
          childDocId: child.id,
          title: title.trim(),
          description: '',
          reward: parseAmountToCents(reward),
          icon,
          status: 'available',
          isRecurring,
          autoValidate,
          autoApproveAt: null as never,
          ...(isRecurring ? { recurringFrequency: frequency } : {}),
          createdAt: null as never,
        });
      } catch {
        failures++;
      }
    }

    if (failures === 0) {
      Alert.alert('Mission créée !', `"${title}" a été assignée à ${selectedChildren.length} enfant(s).`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else if (failures < selectedChildren.length) {
      Alert.alert(
        'Partiellement créé',
        `Mission créée pour ${selectedChildren.length - failures} enfant(s), ${failures} échec(s).`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Erreur', 'Impossible de créer la mission.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Créer une mission" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Étape 1 — Pour qui */}
        <Card style={{ marginBottom: 12 }}>
          <StepHeader
            step={1}
            title="Pour qui ?"
            hint={selectedIds.length > 0 ? `${selectedIds.length} choisi${selectedIds.length > 1 ? 's' : ''}` : 'Un ou plusieurs'}
          />
          {children.length === 0 ? (
            <>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                Ajoute un enfant avant de créer une mission.
              </Text>
              <DashedButton label="Ajouter un enfant" onPress={() => router.push('/(parent)/child/add')} />
            </>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {children.map((child) => {
                const isSelected = selectedIds.includes(child.id);
                const isActivated = !!child.linkedUserId;
                return (
                  <Chip
                    key={child.id}
                    label={child.firstName}
                    selected={isSelected}
                    surface="card"
                    onPress={() => toggleChild(child.id)}
                    left={<Avatar avatarId={child.avatarId} size={26} />}
                    right={
                      isSelected ? (
                        <Ionicons name="checkmark" size={15} color="#FFF" />
                      ) : !isActivated ? (
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accentOrange }}>
                          Non activé
                        </Text>
                      ) : undefined
                    }
                    style={{ opacity: isActivated ? 1 : 0.6 }}
                  />
                );
              })}
            </View>
          )}
        </Card>

        {/* Étape 2 — La mission */}
        <Card style={{ marginBottom: 12 }}>
          <StepHeader step={2} title="Quelle mission ?" hint="Ou choisis une idée" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16, marginHorizontal: -16 }}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          >
            {suggestedMissions.map((suggestion) => (
              <Chip
                key={suggestion.title}
                label={suggestion.title}
                selected={title === suggestion.title}
                surface="card"
                onPress={() => handleSuggestion(suggestion)}
                left={
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      backgroundColor: colors.accentOrange + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={suggestion.icon as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={colors.accentOrange}
                    />
                  </View>
                }
                right={
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: title === suggestion.title ? '#FFF' : colors.textSecondary,
                    }}
                  >
                    +{suggestion.reward} €
                  </Text>
                }
              />
            ))}
          </ScrollView>

          <Input
            label="Titre de la mission"
            placeholder="Ex: Ranger sa chambre"
            icon="flash-outline"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            error={errors.title}
          />
        </Card>

        {/* Étape 3 — Récompense */}
        <Card style={{ marginBottom: 12 }}>
          <StepHeader step={3} title="Quelle récompense ?" hint="Par enfant" />
          <Input
            label="Récompense (€)"
            placeholder="2,00"
            icon="cash-outline"
            value={reward}
            onChangeText={setReward}
            keyboardType="decimal-pad"
            error={errors.reward}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: -4 }}>
            {quickRewards.map((a) => (
              <Chip
                key={a}
                label={`${a} €`}
                selected={reward === String(a)}
                surface="card"
                onPress={() => {
                  setReward(String(a));
                  setErrors((e) => ({ ...e, reward: null }));
                }}
                style={{ flex: 1 }}
              />
            ))}
          </View>
        </Card>

        {/* Étape 4 — Icône */}
        <Card style={{ marginBottom: 12 }}>
          <StepHeader step={4} title="Choisis une icône" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {icons.map((ic) => {
              const selected = icon === ic;
              return (
                <TouchableOpacity
                  key={ic}
                  onPress={() => setIcon(ic)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: selected ? colors.textPrimary : colors.canvas,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={ic as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={selected ? '#FFF' : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Étape 5 — Options */}
        <Card style={{ marginBottom: 20 }}>
          <StepHeader step={5} title="Options" />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                Mission récurrente
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Elle revient automatiquement
              </Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ true: colors.primary, false: colors.canvasMuted }}
              ios_backgroundColor={colors.canvasMuted}
              thumbColor="#FFF"
            />
          </View>

          {isRecurring && (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {(Object.keys(frequencyLabel) as Frequency[]).map((f) => (
                  <Chip
                    key={f}
                    label={frequencyLabel[f]}
                    selected={frequency === f}
                    surface="card"
                    onPress={() => setFrequency(f)}
                  />
                ))}
              </View>
              {frequency === 'biweekly' && (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 10 }}>
                  Idéal en garde alternée : la mission revient toutes les deux semaines, à partir
                  de cette semaine.
                </Text>
              )}
            </>
          )}

          <View style={{ height: 1, backgroundColor: colors.canvasMuted, marginVertical: 14 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                Auto-valider
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Validée dès que l'enfant la termine
              </Text>
            </View>
            <Switch
              value={autoValidate}
              onValueChange={setAutoValidate}
              trackColor={{ true: colors.primary, false: colors.canvasMuted }}
              ios_backgroundColor={colors.canvasMuted}
              thumbColor="#FFF"
            />
          </View>
        </Card>

        {/* Récapitulatif : aperçu de la mission et total */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
          Aperçu
        </Text>
        <Card padding={14} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: colors.accentOrange + '18',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={colors.accentOrange}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: title.trim() ? colors.textPrimary : colors.textLight,
                }}
              >
                {title.trim() || 'Nouvelle mission'}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {[selectedNames || 'Aucun enfant choisi', isRecurring ? frequencyLabel[frequency] : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginLeft: 8 }}>
              +{formatCurrencyShort(parsedReward)}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: colors.canvasMuted, marginVertical: 12 }} />

          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {selectedIds.length > 1
                ? `Total pour ${selectedIds.length} enfants`
                : 'Total'}
            </Text>
            <Text
              style={{
                marginLeft: 'auto',
                fontSize: 20,
                fontWeight: '800',
                color: totalCents > 0 ? colors.textPrimary : colors.textLight,
                letterSpacing: -0.5,
              }}
            >
              {formatCurrencyShort(totalCents)}
            </Text>
          </View>
        </Card>

        <Button
          title="Créer la mission"
          variant="dark"
          icon={<Ionicons name="rocket" size={18} color="#FFF" />}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!isValid}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
