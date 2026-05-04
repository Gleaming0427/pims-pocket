import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { useChildStore } from '@/stores/childStore';
import { validateName, validateAmount, parseAmountToCents } from '@/utils/validators';
import { getDayName } from '@/utils/formatters';
import avatars from '@/constants/avatars';
import colors from '@/constants/colors';

export default function AddChildScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { addChild, isLoading } = useChildStore();

  const [firstName, setFirstName] = useState('');
  const [avatarId, setAvatarId] = useState('lion');
  const [birthYear, setBirthYear] = useState('');
  const [allowance, setAllowance] = useState('');
  const [allowanceDay, setAllowanceDay] = useState(6); // samedi
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleSubmit = async () => {
    const nameError = validateName(firstName);
    const allowanceError = validateAmount(allowance);

    setErrors({ firstName: nameError, allowance: allowanceError });
    if (nameError || allowanceError) return;
    if (!user) return;

    try {
      const birthDate = new Date(parseInt(birthYear) || 2015, 0, 1);
      await addChild(user.id, {
        firstName: firstName.trim(),
        avatarId,
        birthDate,
        weeklyAllowance: parseAmountToCents(allowance),
        allowanceDay,
      });
      Alert.alert('Enfant ajouté !', `${firstName} a bien été ajouté.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impossible d'ajouter l'enfant.";
      Alert.alert('Erreur', msg);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Ajouter un enfant" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Prénom"
          placeholder="Le prénom de votre enfant"
          icon="person-outline"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          error={errors.firstName}
        />

        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 10,
          }}
        >
          Choisir un avatar
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {avatars.map((a) => (
            <Avatar
              key={a.id}
              avatarId={a.id}
              size={52}
              selected={avatarId === a.id}
              onPress={() => setAvatarId(a.id)}
            />
          ))}
        </View>

        <Input
          label="Année de naissance"
          placeholder="2015"
          icon="calendar-outline"
          value={birthYear}
          onChangeText={setBirthYear}
          keyboardType="number-pad"
          maxLength={4}
        />

        <Input
          label="Argent de poche hebdomadaire (€)"
          placeholder="5,00"
          icon="cash-outline"
          value={allowance}
          onChangeText={setAllowance}
          keyboardType="decimal-pad"
          error={errors.allowance}
        />

        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 10,
          }}
        >
          Jour de versement
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <TouchableOpacity
                key={day}
                onPress={() => setAllowanceDay(day)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor:
                    allowanceDay === day ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor:
                    allowanceDay === day ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: allowanceDay === day ? '#FFF' : colors.textSecondary,
                  }}
                >
                  {getDayName(day).slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Button
          title="Ajouter l'enfant"
          onPress={handleSubmit}
          loading={isLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
