import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { createGoal } from '@/lib/firestore';
import { validateName, validateAmount, parseAmountToCents } from '@/utils/validators';
import { Timestamp } from 'firebase/firestore';
import colors from '@/constants/colors';

export default function CreateGoalScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleSubmit = async () => {
    const titleError = validateName(title);
    const amountError = validateAmount(targetAmount);
    setErrors({ title: titleError, targetAmount: amountError });
    if (titleError || amountError) return;
    if (!user) return;

    setIsLoading(true);
    try {
      await createGoal({
        familyId: user.familyId ?? user.id,
        childId: user.id,
        parentId: user.parentId ?? '',
        title: title.trim(),
        description: description.trim() || undefined,
        targetAmount: parseAmountToCents(targetAmount),
        currentAmount: 0,
        status: 'active',
        createdAt: Timestamp.now(),
      });
      Alert.alert('Objectif créé !', `"${title}" a été ajouté à tes objectifs.`, [
        { text: 'Super !', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert('Erreur', message || "Impossible de créer l'objectif.");
      console.error('[CreateGoal]', e);
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header title="Nouvel objectif" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            marginBottom: 24,
            lineHeight: 22,
          }}
        >
          Pour quoi veux-tu économiser ? Fixe-toi un objectif et vois ta tirelire se
          remplir !
        </Text>

        <Input
          label="Nom de l'objectif"
          placeholder='Ex: "Nintendo Switch"'
          icon="flag-outline"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          error={errors.title}
        />

        <Input
          label="Description (optionnel)"
          placeholder="Décris ton objectif..."
          icon="document-text-outline"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={200}
        />

        <Input
          label="Montant à atteindre (€)"
          placeholder="50,00"
          icon="cash-outline"
          value={targetAmount}
          onChangeText={setTargetAmount}
          keyboardType="decimal-pad"
          error={errors.targetAmount}
        />

        <Button
          title="Créer mon objectif"
          onPress={handleSubmit}
          loading={isLoading}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
