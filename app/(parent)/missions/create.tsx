import React, { useState, useMemo } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import { useMissionStore } from '@/stores/missionStore';
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

export default function CreateMissionScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const family = useAuthStore((s) => s.family);
  const { children } = useChildren();
  const { createMission, isLoading } = useMissionStore();

  const [selectedIds, setSelectedIds] = useState<string[]>(
    children.length === 1 ? [children[0].id] : []
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [icon, setIcon] = useState('flash');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [autoValidate, setAutoValidate] = useState(family?.autoValidateMissions ?? false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Total en direct : enfants sélectionnés × récompense
  const parsedReward = useMemo(() => {
    if (!reward.trim()) return 0;
    const cents = parseAmountToCents(reward);
    return isNaN(cents) || cents <= 0 ? 0 : cents;
  }, [reward]);
  const totalCents = selectedIds.length > 0 ? parsedReward * selectedIds.length : 0;

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
          description: description.trim(),
          reward: parseAmountToCents(reward),
          icon,
          status: 'available',
          isRecurring,
          autoValidate,
          autoApproveAt:
            !autoValidate && (family?.validationDelayHours ?? 0) > 0
              ? (Date.now() + (family!.validationDelayHours! * 3600000)) as never
              : null as never,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Créer une mission" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Étape 1 — Pour qui */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
              👧 Pour qui ?
            </Text>
            {selectedIds.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.primary + '12',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                  {selectedIds.length}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            Choisis un ou plusieurs enfants
          </Text>
        </View>

        {children.length === 0 ? (
          <View style={{ marginBottom: 24 }}>
            <EmptyState
              emoji="👶"
              title="Aucun enfant"
              description="Ajoute un enfant avant de créer une mission."
              actionLabel="Ajouter un enfant"
              onAction={() => router.push('/(parent)/child/add')}
            />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {children.map((child) => {
              const isSelected = selectedIds.includes(child.id);
              const isActivated = !!child.linkedUserId;
              return (
                <TouchableOpacity
                  key={child.id}
                  onPress={() => toggleChild(child.id)}
                  activeOpacity={0.7}
                  style={{
                    alignItems: 'center',
                    padding: 12,
                    paddingHorizontal: 16,
                    borderRadius: 18,
                    backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    opacity: isActivated ? 1 : 0.55,
                  }}
                >
                  <View style={{ position: 'relative' }}>
                    <Avatar avatarId={child.avatarId} size={48} />
                    {isSelected && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: colors.primary,
                          borderWidth: 2,
                          borderColor: colors.background,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="checkmark" size={13} color="#FFF" />
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isSelected ? colors.primary : colors.textPrimary,
                      marginTop: 6,
                    }}
                  >
                    {child.firstName}
                  </Text>
                  {!isActivated && (
                    <View
                      style={{
                        backgroundColor: colors.accentOrange + '15',
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accentOrange }}>
                        Non activé
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Étape 2 — La mission */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
            📝 Quelle mission ?
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            Ou choisis une idée
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {suggestedMissions.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleSuggestion(s)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name={s.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={colors.accentOrange}
              />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
                {s.title}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
                +{s.reward} €
              </Text>
            </TouchableOpacity>
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

        <Input
          label="Description (optionnel)"
          placeholder="Décrivez ce que l'enfant doit faire..."
          icon="document-text-outline"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={200}
        />

        {/* Étape 3 — Récompense */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          💰 Quelle récompense ?
        </Text>
        <Input
          label="Récompense par enfant (€)"
          placeholder="2,00"
          icon="cash-outline"
          value={reward}
          onChangeText={setReward}
          keyboardType="decimal-pad"
          error={errors.reward}
        />

        {/* Récompenses rapides */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: -6, marginBottom: 20 }}>
          {quickRewards.map((a) => {
            const isAmount = reward === String(a);
            return (
              <TouchableOpacity
                key={a}
                onPress={() => {
                  setReward(String(a));
                  setErrors((e) => ({ ...e, reward: null }));
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: isAmount ? colors.primary + '15' : colors.surface,
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

        {/* Étape 4 — Icône */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          🎨 Choisis une icône
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {icons.map((ic) => (
            <TouchableOpacity
              key={ic}
              onPress={() => setIcon(ic)}
              activeOpacity={0.7}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: icon === ic ? colors.primary : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
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

        {/* Étape 5 — Options */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          🔁 Options
        </Text>
        <Card padding={14} style={{ marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => setIsRecurring(!isRecurring)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <Ionicons
              name={isRecurring ? 'checkbox' : 'square-outline'}
              size={24}
              color={colors.primary}
            />
            <Text style={{ marginLeft: 10, fontSize: 15, color: colors.textPrimary, fontWeight: '600' }}>
              Mission récurrente
            </Text>
          </TouchableOpacity>

          {isRecurring && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFrequency(f)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: frequency === f ? colors.primary + '15' : colors.background,
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: frequency === f ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: frequency === f ? colors.primary : colors.textSecondary,
                    }}
                  >
                    {{ daily: 'Quotidien', weekly: 'Hebdo', monthly: 'Mensuel' }[f]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 14,
            }}
          />

          <TouchableOpacity
            onPress={() => setAutoValidate(!autoValidate)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <Ionicons
              name={autoValidate ? 'checkbox' : 'square-outline'}
              size={24}
              color={colors.primary}
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.textPrimary, fontWeight: '600' }}>
                Auto-valider cette mission
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Validée automatiquement quand l'enfant la termine
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Récapitulatif en direct */}
        <View
          style={{
            backgroundColor: colors.primary + '08',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.primary + '15',
            padding: 14,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}
                numberOfLines={1}
              >
                {title.trim() ? `« ${title.trim()} »` : 'Nouvelle mission'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {selectedIds.length > 0
                  ? `${selectedIds.length} enfant${selectedIds.length > 1 ? 's' : ''} × ${reward.trim() || '0'} €`
                  : 'Choisis un enfant et une récompense'}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: totalCents > 0 ? colors.success : colors.textLight,
              }}
            >
              {formatCurrencyShort(totalCents)}
            </Text>
          </View>
        </View>

        <Button
          title={
            totalCents > 0
              ? `Créer la mission · ${formatCurrencyShort(totalCents)}`
              : 'Créer la mission'
          }
          icon={<Ionicons name="rocket" size={18} color="#FFF" />}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!isValid}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
