import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildStore } from '@/stores/childStore';
import { updateChild } from '@/lib/firestore';
import { resetChildPin } from '@/lib/auth';
import { validateName, validatePinCode } from '@/utils/validators';
import { Timestamp } from 'firebase/firestore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Header from '@/components/shared/Header';
import LoadingScreen from '@/components/shared/LoadingScreen';
import avatars from '@/constants/avatars';
import colors from '@/constants/colors';

export default function EditChildScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const user = useAuthStore((s) => s.user);
  const { children } = useChildStore();

  const child = children.find((c) => c.id === childId);

  const [firstName, setFirstName] = useState(child?.firstName ?? '');
  const [birthYear, setBirthYear] = useState(() => {
    const d = child?.birthDate?.toDate ? child.birthDate.toDate() : null;
    return d ? String(d.getFullYear()) : '';
  });
  const [avatarId, setAvatarId] = useState(child?.avatarId ?? 'lion');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Réinitialisation du PIN
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  if (!child || !user?.familyId) return <LoadingScreen />;

  const isValid = firstName.trim().length > 0 && /^\d{4}$/.test(birthYear);

  const handleSave = async () => {
    const nameError = validateName(firstName);
    setError(nameError);
    if (nameError) return;
    if (!/^\d{4}$/.test(birthYear)) {
      setError('Année de naissance invalide (ex: 2015).');
      return;
    }
    const year = parseInt(birthYear, 10);
    if (year < 1900 || year > new Date().getFullYear()) {
      setError('Année de naissance invalide (ex: 2015).');
      return;
    }

    setIsSaving(true);
    try {
      await updateChild(user.familyId!, child.id, {
        firstName: firstName.trim(),
        birthDate: Timestamp.fromDate(new Date(year, 0, 1)),
        avatarId,
      });
      Alert.alert('Modifié', 'Les informations de l\'enfant ont été mises à jour.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erreur', "Impossible de modifier l'enfant.");
    }
    setIsSaving(false);
  };

  const handleResetPin = async () => {
    const err = validatePinCode(pinValue);
    if (err) { setPinError(err); return; }
    if (pinValue !== pinConfirm) {
      setPinError('Les codes PIN ne correspondent pas');
      return;
    }
    setResetting(true);
    setPinError(null);
    try {
      await resetChildPin(user.familyId!, child.id, pinValue);
      setPinValue('');
      setPinConfirm('');
      Alert.alert('PIN réinitialisé !', `${child.firstName} doit maintenant utiliser son nouveau PIN.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la réinitialisation';
      setPinError(msg);
    }
    setResetting(false);
  };

  const isActivated = !!child.linkedUserId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Modifier l'enfant" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Héro : aperçu */}
        <View
          style={{
            backgroundColor: colors.primary + '08',
            borderRadius: 16,
            padding: 14,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Avatar avatarId={avatarId} size={56} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
              {firstName.trim() || child.firstName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              Droit de rectification — mets à jour les informations de ton enfant.
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          👤 Prénom
        </Text>
        <Input
          label="Prénom"
          placeholder="Le prénom de votre enfant"
          icon="person-outline"
          value={firstName}
          onChangeText={(t) => {
            setFirstName(t);
            setError(null);
          }}
          autoCapitalize="words"
          error={error && error.includes('prénom') ? error : null}
        />

        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          🎨 Avatar
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 24,
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

        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          📅 Année de naissance
        </Text>
        <Input
          label="Année de naissance"
          placeholder="2015"
          icon="calendar-outline"
          value={birthYear}
          onChangeText={(t) => {
            setBirthYear(t);
            setError(null);
          }}
          keyboardType="number-pad"
          maxLength={4}
          error={error && error.includes('naissance') ? error : null}
        />

        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.textPrimary,
            marginTop: 8,
            marginBottom: 10,
          }}
        >
          🔑 Code PIN
        </Text>

        {isActivated ? (
          <>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12, lineHeight: 17 }}>
              Change le code PIN de connexion de {child.firstName} (sans supprimer le compte).
            </Text>
            <Input
              label="Nouveau code PIN"
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
            <Button
              title="Réinitialiser le PIN"
              onPress={handleResetPin}
              loading={resetting}
              variant="outline"
              disabled={pinValue.length < 4 || pinConfirm.length < 4}
              icon={<Ionicons name="key-outline" size={18} color={colors.primary} />}
              style={{ marginBottom: 20 }}
            />
          </>
        ) : (
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 20, lineHeight: 17 }}>
            Le compte n'est pas encore activé : le PIN sera défini lors de l'activation depuis la fiche de l'enfant.
          </Text>
        )}

        <Button
          title="Enregistrer"
          onPress={handleSave}
          loading={isSaving}
          disabled={!isValid}
          icon={<Ionicons name="checkmark" size={18} color="#FFF" />}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
