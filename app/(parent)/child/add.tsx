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
import { createChildAuthAccount } from '@/lib/auth';
import { useChildStore } from '@/stores/childStore';
import { useChildren } from '@/hooks/useChildren';
import { validateName, validateAmount, parseAmountToCents, validatePinCode } from '@/utils/validators';
import { getDayName } from '@/utils/formatters';
import avatars from '@/constants/avatars';
import colors from '@/constants/colors';

// Limite de sécurité : maximum d'enfants par famille
const MAX_CHILDREN = 10;

export default function AddChildScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { addChild, isLoading } = useChildStore();
  const { children } = useChildren();
  const limitReached = children.length >= MAX_CHILDREN;

  const [firstName, setFirstName] = useState('');
  const [avatarId, setAvatarId] = useState('lion');
  const [birthYear, setBirthYear] = useState('');
  const [allowance, setAllowance] = useState('');
  const [allowanceDay, setAllowanceDay] = useState(6);
  const [consentGiven, setConsentGiven] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  // PIN du compte enfant — défini dès la création (activation immédiate)
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (limitReached) {
      Alert.alert(
        'Limite atteinte',
        `Une famille ne peut pas avoir plus de ${MAX_CHILDREN} enfants.`
      );
      return;
    }
    const nameError = validateName(firstName);
    const allowanceError = validateAmount(allowance);
    const pinErr = validatePinCode(pinValue);
    if (pinValue !== pinConfirm) {
      setPinError('Les codes PIN ne correspondent pas');
    } else {
      setPinError(pinErr);
    }

    setErrors({ firstName: nameError, allowance: allowanceError });
    if (nameError || allowanceError) return;
    if (pinErr || pinValue !== pinConfirm) return;
    if (!user) return;
    if (!consentGiven) {
      Alert.alert('Consentement requis', 'Vous devez confirmer que vous êtes le parent ou tuteur légal de cet enfant.');
      return;
    }

    try {
      const birthDate = new Date(parseInt(birthYear) || 2015, 0, 1);
      const child = await addChild(user.familyId!, {
        firstName: firstName.trim(),
        avatarId,
        birthDate,
        weeklyAllowance: parseAmountToCents(allowance),
        allowanceDay,
      });

      // Activation immédiate : crée le compte Auth et le PIN
      await createChildAuthAccount(user.familyId!, child.id, child.inviteCode!, pinValue);

      Alert.alert(
        'Enfant ajouté et compte activé !',
        `${firstName} peut se connecter avec le code ${child.inviteCode} et son PIN.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impossible d'ajouter l'enfant.";
      Alert.alert('Erreur', msg);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Ajouter un enfant" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {limitReached && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.error + '12',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.error + '30',
              padding: 14,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.error + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="alert-circle" size={20} color={colors.error} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.error }}>
                Limite atteinte
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                Une famille ne peut pas avoir plus de {MAX_CHILDREN} enfants.
              </Text>
            </View>
          </View>
        )}
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

        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          🔑 Code PIN de connexion
        </Text>
        <Input
          label="Code PIN"
          placeholder="1234"
          icon="keypad-outline"
          value={pinValue}
          onChangeText={(t) => { setPinValue(t); setPinError(null); }}
          keyboardType="number-pad"
          maxLength={4}
          isPassword
        />
        <Input
          label="Confirmer le PIN"
          placeholder="1234"
          icon="keypad-outline"
          value={pinConfirm}
          onChangeText={(t) => { setPinConfirm(t); setPinError(null); }}
          keyboardType="number-pad"
          maxLength={4}
          isPassword
          error={pinError}
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

        <TouchableOpacity
          onPress={() => setConsentGiven(!consentGiven)}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 20,
          }}
        >
          <Ionicons
            name={consentGiven ? 'checkbox' : 'square-outline'}
            size={22}
            color={consentGiven ? colors.primary : colors.textLight}
            style={{ marginTop: 1 }}
          />
          <Text style={{ flex: 1, marginLeft: 10, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
            Je confirme être le parent ou le tuteur légal de cet enfant et j'autorise le traitement de ses données conformément à la politique de confidentialité.
          </Text>
        </TouchableOpacity>

        <Button
          title="Ajouter l'enfant"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={limitReached || pinValue.length < 4 || pinConfirm.length < 4}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
