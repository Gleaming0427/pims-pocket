import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoogleButton from '@/components/ui/GoogleButton';
import Divider from '@/components/ui/Divider';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { validateEmail, validatePassword, validateName } from '@/utils/validators';
import colors from '@/constants/colors';
import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const { promptAsync, isReady: googleReady, isLoading: googleLoading } = useGoogleAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
          placeholder="6 caractères minimum"
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

        <Button
          title="Créer mon compte"
          onPress={handleRegister}
          loading={isLoading}
          style={{ marginTop: 8 }}
        />

        <Divider />

        <GoogleButton
          onPress={() => promptAsync()}
          loading={googleLoading}
          disabled={!googleReady}
          title="S'inscrire avec Google"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
