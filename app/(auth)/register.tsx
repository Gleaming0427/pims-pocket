import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { validateEmail, validatePassword, validateName } from '@/utils/validators';
import colors from '@/constants/colors';
import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleRegister = async () => {
    const nameError = validateName(displayName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError =
      password !== confirmPassword ? 'Les mots de passe ne correspondent pas' : null;

    setErrors({
      displayName: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmError,
    });

    if (nameError || emailError || passwordError || confirmError) return;

    if (!acceptedPrivacy) {
      Alert.alert('Consentement requis', 'Vous devez accepter la politique de confidentialité.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Consentement requis', 'Vous devez accepter les conditions d\'utilisation.');
      return;
    }

    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/');
    } catch (e: unknown) {
      Alert.alert('Erreur', getFirebaseAuthUserMessage(e));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Inscription" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 24, maxWidth: 720, width: '100%', alignSelf: 'center' }}
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
          Créez votre compte parent pour gérer l'argent de poche de vos enfants.
        </Text>

        <Input
          label="Votre prénom"
          placeholder="Jean"
          icon="person-outline"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          maxLength={50}
          error={errors.displayName}
        />

        <Input
          label="Email"
          placeholder="votre@email.com"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Input
          label="Mot de passe"
          placeholder="8 caractères, 1 majuscule, 1 chiffre"
          icon="lock-closed-outline"
          isPassword
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <Input
          label="Confirmer le mot de passe"
          placeholder="Retapez votre mot de passe"
          icon="lock-closed-outline"
          isPassword
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
        />

        {/* Consentement */}
        <View style={{ marginTop: 20, gap: 14 }}>
          <TouchableOpacity
            onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
            style={{ flexDirection: 'row', alignItems: 'flex-start' }}
          >
            <Ionicons
              name={acceptedPrivacy ? 'checkbox' : 'square-outline'}
              size={22}
              color={acceptedPrivacy ? colors.primary : colors.textLight}
              style={{ marginTop: 1 }}
            />
            <Text style={{ flex: 1, marginLeft: 10, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
              J'accepte la{' '}
              <Text
                style={{ color: colors.primary, fontWeight: '600' }}
                onPress={() => router.push('/(parent)/privacy')}
              >
                politique de confidentialité
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            style={{ flexDirection: 'row', alignItems: 'flex-start' }}
          >
            <Ionicons
              name={acceptedTerms ? 'checkbox' : 'square-outline'}
              size={22}
              color={acceptedTerms ? colors.primary : colors.textLight}
              style={{ marginTop: 1 }}
            />
            <Text style={{ flex: 1, marginLeft: 10, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
              J'accepte les{' '}
              <Text
                style={{ color: colors.primary, fontWeight: '600' }}
                onPress={() => router.push('/(parent)/terms')}
              >
                conditions d'utilisation
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Créer mon compte"
          onPress={handleRegister}
          loading={isLoading}
          style={{ marginTop: 24 }}
        />

      </ScrollView>
    </SafeAreaView>
  );
}
